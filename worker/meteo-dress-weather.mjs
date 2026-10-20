const METOFFICE_SECRET = "METOFFICE_API_KEY";
const METOFFICE_URL = "https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/three-hourly";
const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const TARGET_HOURS = [6, 9, 12, 15, 18, 21];
const LONDON_TIMEZONE = "Europe/London";

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
});

function londonParts(value) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23"
  }).formatToParts(value);
  const part = type => parts.find(item => item.type === type)?.value;
  return { key: `${part("year")}-${part("month")}-${part("day")}`, hour: Number(part("hour")) };
}

function addDays(key, amount) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const weatherCode = entry => number(entry.significantWeatherCode ?? entry.weatherCode, 7);
const temperature = entry => number(entry.screenTemperature ?? entry.temperature);
const feelsLike = entry => number(entry.feelsLikeTemperature ?? entry.feelsLike, temperature(entry));
const rainChance = entry => number(entry.probOfPrecipitation ?? entry.precipitationProbability);
const gustSpeed = entry => number(entry.windGustSpeed10m ?? entry.windGustSpeed);

function iconFor(code, rain) {
  if (code === 1) return "☀️";
  if ([0, 2].includes(code)) return "🌙";
  if ([3, 5, 6, 7, 8].includes(code)) return code === 3 ? "🌤" : "☁️";
  if (code >= 22 && code <= 27) return "🌨";
  if (code >= 28 || (code >= 19 && code <= 21)) return "⛈";
  return rain >= 45 ? "🌧" : "🌦";
}

function labelFor(code, rain, gust) {
  if (code >= 22 && code <= 27) return "Neve";
  if (code >= 28 || (code >= 19 && code <= 21)) return "Temporali";
  if (rain >= 65) return gust >= 35 ? "Pioggia e vento" : "Pioggia probabile";
  if (rain >= 35) return "Variabile con pioggia";
  if ([1, 3].includes(code)) return "Sereno o poco nuvoloso";
  if ([5, 6, 7, 8].includes(code)) return "Nuvoloso";
  return "Variabile";
}

export function normalizeMetOfficeForecast(payload, now = new Date()) {
  const series = payload?.features?.[0]?.properties?.timeSeries;
  if (!Array.isArray(series) || !series.length) throw new Error("invalid_metoffice_payload");
  const prepared = series.map(entry => {
    const time = new Date(entry.time);
    if (Number.isNaN(time.getTime())) return null;
    const local = londonParts(time);
    return { ...entry, dateKey: local.key, localHour: local.hour };
  }).filter(Boolean);
  const grouped = new Map();
  for (const entry of prepared) {
    if (!grouped.has(entry.dateKey)) grouped.set(entry.dateKey, []);
    grouped.get(entry.dateKey).push(entry);
  }
  const today = londonParts(now).key;
  const scenarios = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(today, offset);
    const entries = grouped.get(date) || [];
    if (!entries.length) continue;
    const slots = TARGET_HOURS.map(hour => entries.reduce((best, entry) =>
      !best || Math.abs(entry.localHour - hour) < Math.abs(best.localHour - hour) ? entry : best, null));
    const temperatures = entries.map(temperature);
    const feels = entries.map(feelsLike);
    const rain = Math.max(...entries.map(rainChance));
    const gust = Math.max(...entries.map(gustSpeed));
    const representative = entries.reduce((best, entry) =>
      rainChance(entry) > rainChance(best) ? entry : best, entries[0]);
    const code = weatherCode(representative);
    scenarios.push({
      date,
      label: labelFor(code, rain, gust),
      icon: iconFor(code, rain),
      min: Math.round(Math.min(...temperatures)),
      max: Math.round(Math.max(...temperatures)),
      feels: Math.round(Math.min(...feels)),
      rain: Math.round(rain),
      gust: Math.round(gust),
      hourly: slots.map((entry, index) => [
        TARGET_HOURS[index],
        Math.round(temperature(entry)),
        Math.round(rainChance(entry)),
        iconFor(weatherCode(entry), rainChance(entry))
      ])
    });
  }
  if (scenarios.length < 7) throw new Error("incomplete_metoffice_forecast");
  return {
    source: "Met Office Weather DataHub",
    updatedAt: new Date().toISOString(),
    location: payload.features[0].properties.location?.name || "London",
    scenarios: scenarios.slice(0, 7)
  };
}

export async function handleMeteoDressWeather(request, env, fetchImpl = fetch) {
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, { Allow: "GET" });
  if (!env[METOFFICE_SECRET]) {
    return json({ error: "weather_not_configured", message: `Add the ${METOFFICE_SECRET} Worker secret.` }, 503, { "Cache-Control": "no-store" });
  }
  const cache = caches.default;
  const cacheKey = new Request(new URL("/__cache/meteo-dress-weather-v1", request.url));
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  const url = new URL(METOFFICE_URL);
  url.searchParams.set("latitude", String(LONDON.latitude));
  url.searchParams.set("longitude", String(LONDON.longitude));
  url.searchParams.set("includeLocationName", "true");
  try {
    const upstream = await fetchImpl(url, {
      headers: { Accept: "application/geo+json, application/json", apikey: env[METOFFICE_SECRET] }
    });
    if (!upstream.ok) throw new Error(`metoffice_http_${upstream.status}`);
    const payload = normalizeMetOfficeForecast(await upstream.json());
    const response = json(payload, 200, {
      "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff"
    });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    console.error("Met Office forecast refresh failed", error?.message || "unknown_error");
    return json({ error: "weather_unavailable", message: "The Met Office forecast is temporarily unavailable." }, 502, { "Cache-Control": "no-store" });
  }
}
