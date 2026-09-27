const MAX_BODY_BYTES = 12_000;
const MIN_COMPLETION_MS = 2_000;
const MAX_COMPLETION_MS = 2 * 60 * 60 * 1_000;
const EMAILOCTOPUS_API_ORIGIN = "https://emailoctopus.com";
const SUBSCRIBE_SOURCES = new Set(["homepage", "newsletter-page", "events-page", "footer", "unknown"]);
const ALLOWED_ORIGINS = new Set([
  "https://www.londonadvanced.com",
  "https://londonadvanced.com",
  "https://london-advanced-site.ppastorin.workers.dev"
]);
const DECAP_CALLBACK_PATH = "/api/decap/callback";
const DECAP_STATE_COOKIE = "la_decap_oauth_state";
const PLACES_API_ORIGIN = "https://london-by-mood.ppastorin.workers.dev";

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function redirectResponse(request, pathname, status = 303, extraHeaders = {}) {
  return new Response(null, {
    status,
    headers: {
      Location: new URL(pathname, request.url).href,
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function wantsJson(request) {
  return request.headers.get("Accept")?.includes("application/json") ?? false;
}

function clean(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function reject(request, status, code) {
  return wantsJson(request)
    ? jsonResponse({ ok: false, code }, status)
    : redirectResponse(request, "/?contact=error#contact");
}

function rejectSubscription(request, status, code) {
  return wantsJson(request)
    ? jsonResponse({ ok: false, code }, status)
    : redirectResponse(request, "/newsletter/?subscribe=error#signup");
}

function acceptSubscription(request, status = "confirmation_requested") {
  const cookie = "la_subscribe_recent=1; Max-Age=60; Path=/; Secure; HttpOnly; SameSite=Lax";
  return wantsJson(request)
    ? jsonResponse({ ok: true, status }, 200, { "Set-Cookie": cookie })
    : redirectResponse(request, "/newsletter/thanks/", 303, { "Set-Cookie": cookie });
}

export async function handleContact(request, emailBinding, contactConfig = {}) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (!origin || (!ALLOWED_ORIGINS.has(origin) && origin !== requestUrl.origin)) {
    return reject(request, 403, "origin_not_allowed");
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_BYTES) return reject(request, 413, "request_too_large");
  if (request.headers.get("Cookie")?.includes("la_contact_recent=1")) {
    return reject(request, 429, "please_wait");
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return reject(request, 400, "invalid_form");
  }

  if (clean(form.get("_honey"), 200)) {
    return wantsJson(request)
      ? jsonResponse({ ok: true, status: "accepted" })
      : redirectResponse(request, "/thank-you/");
  }

  const name = clean(form.get("name"), 100);
  const email = clean(form.get("email"), 254);
  const message = clean(form.get("message"), 5_000);
  const startedAt = Number(form.get("started_at"));
  const completionTime = Date.now() - startedAt;

  if (name.length < 2 || !isValidEmail(email) || message.length < 10) {
    return reject(request, 400, "invalid_fields");
  }
  if (!Number.isFinite(startedAt) || completionTime < MIN_COMPLETION_MS || completionTime > MAX_COMPLETION_MS) {
    return reject(request, 400, "timing_check_failed");
  }

  const destination = clean(contactConfig.destination, 254);
  const sender = clean(contactConfig.sender, 254);
  if (!emailBinding || typeof emailBinding.send !== "function" || !isValidEmail(destination) || !isValidEmail(sender)) {
    console.error(JSON.stringify({ event: "contact_delivery_error", reason: "configuration_unavailable" }));
    return reject(request, 503, "delivery_unavailable");
  }

  try {
    const delivery = await emailBinding.send({
      to: destination,
      from: { email: sender, name: "London Advanced" },
      replyTo: { email, name },
      subject: "New message from London Advanced",
      text: [
        "New message from the London Advanced website",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        "Message:",
        message
      ].join("\n")
    });
    console.log(JSON.stringify({ event: "contact_delivery_accepted", messageId: delivery?.messageId ?? null }));
  } catch (error) {
    console.error(JSON.stringify({
      event: "contact_delivery_error",
      reason: "cloudflare_email_failed",
      code: error?.code ?? "unknown"
    }));
    return reject(request, 502, "delivery_failed");
  }
  const cookie = "la_contact_recent=1; Max-Age=60; Path=/; Secure; HttpOnly; SameSite=Lax";
  return wantsJson(request)
    ? jsonResponse({ ok: true, status: "accepted" }, 200, { "Set-Cookie": cookie })
    : redirectResponse(request, "/thank-you/", 303, { "Set-Cookie": cookie });
}

export async function handleSubscribe(request, env, fetchImpl = fetch) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (!origin || (!ALLOWED_ORIGINS.has(origin) && origin !== requestUrl.origin)) {
    return rejectSubscription(request, 403, "origin_not_allowed");
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_BYTES) return rejectSubscription(request, 413, "request_too_large");
  if (request.headers.get("Cookie")?.includes("la_subscribe_recent=1")) {
    return rejectSubscription(request, 429, "please_wait");
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return rejectSubscription(request, 400, "invalid_form");
  }

  if (clean(form.get("_honey"), 200)) return acceptSubscription(request);

  const email = clean(form.get("email"), 254).toLowerCase();
  const requestedSource = clean(form.get("source"), 40);
  const source = SUBSCRIBE_SOURCES.has(requestedSource) ? requestedSource : "unknown";
  if (!isValidEmail(email)) return rejectSubscription(request, 400, "invalid_email");

  const apiKey = clean(env.EMAILOCTOPUS_API_KEY, 500);
  const listId = clean(env.EMAILOCTOPUS_LIST_ID, 100);
  if (!apiKey || !listId) {
    console.error(JSON.stringify({ event: "newsletter_subscription_error", reason: "configuration_missing" }));
    return rejectSubscription(request, 503, "subscription_unavailable");
  }

  const payload = {
    api_key: apiKey,
    email_address: email
  };
  const sourceField = clean(env.EMAILOCTOPUS_SOURCE_FIELD, 50);
  if (sourceField) payload.fields = { [sourceField]: source };

  let response;
  let result = {};
  try {
    response = await fetchImpl(`${EMAILOCTOPUS_API_ORIGIN}/api/1.6/lists/${encodeURIComponent(listId)}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    result = await response.json().catch(() => ({}));
  } catch {
    console.error(JSON.stringify({ event: "newsletter_subscription_error", reason: "provider_unreachable" }));
    return rejectSubscription(request, 502, "subscription_failed");
  }

  if (response.ok) {
    console.log(JSON.stringify({ event: "newsletter_subscription_accepted", source }));
    return acceptSubscription(request);
  }

  const providerCode = clean(
    result?.code ?? result?.error?.code ?? result?.errors?.[0]?.code,
    80
  );

  if (response.status === 409 || providerCode === "MEMBER_EXISTS_WITH_EMAIL_ADDRESS") {
    console.log(JSON.stringify({ event: "newsletter_subscription_existing", source }));
    return acceptSubscription(request, "already_registered");
  }

  console.error(JSON.stringify({
    event: "newsletter_subscription_error",
    reason: "provider_rejected",
    code: providerCode || `http_${response.status}`
  }));
  return rejectSubscription(request, 502, "subscription_failed");
}

async function handleLoos(request, env) {
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, { Allow: "GET" });
  }

  if (env.LOO_DB && typeof env.LOO_DB.prepare === "function") {
    try {
      const result = await env.LOO_DB.prepare(
        `SELECT id,name,category,lat,lon,address,access_mode,fee_pence,fee_note,
                accessible,baby_change,changing_places,radar,opening_hours_json,
                hours_note,location_note,confidence,active,last_verified
         FROM loos WHERE active = 1`
      ).all();
      const loos = (result.results || []).map(row => ({
        ...row,
        accessible: row.accessible == null ? null : Boolean(row.accessible),
        baby_change: row.baby_change == null ? null : Boolean(row.baby_change),
        changing_places: row.changing_places == null ? null : Boolean(row.changing_places),
        radar: row.radar == null ? null : Boolean(row.radar),
        active: Boolean(row.active),
        opening_hours: row.opening_hours_json ? JSON.parse(row.opening_hours_json) : null
      }));
      return jsonResponse({ schema_version: "1.0", count: loos.length, source: "d1", loos }, 200, {
        "Cache-Control": "public, max-age=300"
      });
    } catch (error) {
      console.error(JSON.stringify({ event: "loo_db_error", message: String(error?.message || error) }));
    }
  }

  const seedUrl = new URL("/data/loos.json", request.url);
  const seedResponse = await env.ASSETS.fetch(new Request(seedUrl, request));
  if (!seedResponse.ok) return jsonResponse({ ok: false, code: "loo_data_unavailable" }, 503);
  const body = await seedResponse.text();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}

async function handleLooGeocode(request, fetchImpl = fetch) {
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, { Allow: "GET" });
  }
  const url = new URL(request.url);
  const q = clean(url.searchParams.get("q"), 160);
  if (q.length < 2) return jsonResponse({ ok: false, message: "Enter a London place or address." }, 400);

  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("q", q + ", London, UK");
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "5");
  endpoint.searchParams.set("countrycodes", "gb");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("viewbox", "-0.55,51.72,0.35,51.25");
  endpoint.searchParams.set("bounded", "1");

  try {
    const response = await fetchImpl(endpoint, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "LondonAdvanced/1.0 (https://www.londonadvanced.com)"
      },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    if (!response.ok) return jsonResponse({ ok: false, message: "Location search is temporarily unavailable." }, 502);
    const results = await response.json();
    const hit = Array.isArray(results) ? results[0] : null;
    if (!hit) return jsonResponse({ ok: false, message: "I couldn't find that place in London." }, 404);
    const lat = Number(hit.lat), lon = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return jsonResponse({ ok: false, message: "I couldn't locate that place." }, 404);
    return jsonResponse({
      ok: true,
      lat,
      lon,
      label: clean(hit.display_name, 180).replace(/, United Kingdom$/, "")
    }, 200, { "Cache-Control": "public, max-age=86400" });
  } catch {
    return jsonResponse({ ok: false, message: "Location search is temporarily unavailable." }, 502);
  }
}

function searchKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function locationMergeKey(value) {
  return searchKey(value).replace(/^(?:the|il|lo|la|i|gli|le)\s+/, "");
}

function locationScore(name, query, supportingText = "") {
  const candidate = searchKey(name);
  const needle = searchKey(query);
  if (candidate === needle) return 1200;
  if (candidate.startsWith(needle)) return 800;
  if (candidate.includes(needle)) return 520;
  const tokens = needle.split(" ").filter(Boolean);
  if (tokens.length && tokens.every(token => candidate.includes(token))) return 300;
  const searchable = `${candidate} ${searchKey(supportingText)}`;
  return tokens.length && tokens.every(token => searchable.includes(token)) ? 180 : 0;
}

function toolLink(id, locale) {
  const italian = locale === "it";
  const tools = {
    "smart-navigation": italian
      ? ["Navigazione intelligente", "/it/strumenti/navigazione-intelligente/"]
      : ["Smart Navigation", "/home/smart-navigation/"],
    "london-by-mood": italian
      ? ["Londra secondo l’umore", "/it/strumenti/londra-per-umore/"]
      : ["London by Mood", "/home/london-by-mood/"],
    "escape-the-crowds": italian
      ? ["Evita la folla", "/it/strumenti/evita-la-folla/"]
      : ["Escape the Crowds", "/home/escape-the-crowds/"],
    "loo-finder": italian
      ? ["Trova un bagno", "/it/strumenti/trova-un-bagno/"]
      : ["Loo Finder", "/loo/"]
  };
  const [title, url] = tools[id];
  return { id, title, url };
}

async function searchPublishedPlaces(query, locale, fetchImpl) {
  const endpoint = new URL("/api/places", PLACES_API_ORIGIN);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("limit", "12");
  try {
    const response = await fetchImpl(endpoint, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 60, cacheEverything: true }
    });
    if (!response.ok) throw new Error(`places_${response.status}`);
    const payload = await response.json();
    return (Array.isArray(payload.places) ? payload.places : []).map(place => {
      const summary = locale === "it"
        ? (place.hookIt || place.descriptionIt || place.hook || place.description || "Luogo presente negli strumenti London Advanced.")
        : (place.hook || place.description || "A place available in the London Advanced tools.");
      return {
        id: `location:${place.id}`,
        type: "location",
        locale,
        title: place.name,
        summary,
        url: toolLink("smart-navigation", locale).url,
        links: [
          toolLink("smart-navigation", locale),
          toolLink("london-by-mood", locale),
          toolLink("escape-the-crowds", locale)
        ],
        score: locationScore(place.name, query, summary),
        source: "places-d1"
      };
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "location_search_upstream_error", source: "places-d1", message: String(error?.message || error) }));
    return [];
  }
}

function escapeLike(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function looSearchRecord(row, query, locale) {
  const detail = [row.address, row.location_note].filter(Boolean).join(" · ");
  return {
    id: `location:loo:${row.id}`,
    type: "location",
    locale,
    title: row.name,
    summary: detail || (locale === "it" ? "Bagno verificato presente in Trova un bagno." : "Verified facility available in Loo Finder."),
    url: toolLink("loo-finder", locale).url,
    links: [toolLink("loo-finder", locale)],
    score: locationScore(row.name, query, detail),
    source: "loo-d1"
  };
}

async function searchLoos(request, env, query, locale) {
  if (env.LOO_DB && typeof env.LOO_DB.prepare === "function") {
    try {
      const needle = `%${escapeLike(query)}%`;
      const result = await env.LOO_DB.prepare(
        `SELECT id,name,address,location_note FROM loos
         WHERE active = 1 AND (name LIKE ? ESCAPE '\\' OR address LIKE ? ESCAPE '\\' OR location_note LIKE ? ESCAPE '\\')
         ORDER BY CASE WHEN lower(name) = lower(?) THEN 0 WHEN lower(name) LIKE lower(?) THEN 1 ELSE 2 END,
                  name COLLATE NOCASE LIMIT 10`
      ).bind(needle, needle, needle, query, `${escapeLike(query)}%`).all();
      return (result.results || []).map(row => looSearchRecord(row, query, locale));
    } catch (error) {
      console.error(JSON.stringify({ event: "location_search_upstream_error", source: "loo-d1", message: String(error?.message || error) }));
    }
  }

  try {
    const seedUrl = new URL("/data/loos.json", request.url);
    const response = await env.ASSETS.fetch(new Request(seedUrl, request));
    if (!response.ok) return [];
    const payload = await response.json();
    const needle = searchKey(query);
    return (payload.loos || [])
      .filter(row => row.active && searchKey(`${row.name} ${row.address || ""} ${row.location_note || ""}`).includes(needle))
      .map(row => looSearchRecord(row, query, locale))
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 10);
  } catch {
    return [];
  }
}

function mergeLocationResults(records) {
  const merged = new Map();
  for (const record of records) {
    const key = locationMergeKey(record.title);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, record);
      continue;
    }
    const links = new Map([...current.links, ...record.links].map(link => [link.id, link]));
    current.links = [...links.values()];
    current.score = Math.max(current.score, record.score);
    if (record.summary.length > current.summary.length) current.summary = record.summary;
  }
  return [...merged.values()];
}

export async function handleLocationSearch(request, env, fetchImpl = fetch) {
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, { Allow: "GET" });
  }
  const url = new URL(request.url);
  const query = clean(url.searchParams.get("q"), 48);
  const locale = url.searchParams.get("locale") === "it" ? "it" : "en";
  if (searchKey(query).length < 2) return jsonResponse({ ok: true, query, count: 0, records: [] }, 200);

  const [places, loos] = await Promise.all([
    searchPublishedPlaces(query, locale, fetchImpl),
    searchLoos(request, env, query, locale)
  ]);
  const records = mergeLocationResults([...places, ...loos])
    .filter(record => record.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 15);

  return jsonResponse({ ok: true, query, locale, count: records.length, records }, 200, {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
  });
}

function randomHex(byteLength = 24) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function decapCallbackHtml(status, payload, targetOrigin = "https://www.londonadvanced.com") {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Journal Studio sign-in</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7efed;color:#171717;font:16px system-ui}.card{max-width:420px;padding:32px;border:1px solid rgba(0,0,0,.2);background:#fff}.card strong{display:block;margin-bottom:8px;font:32px Georgia,serif}</style></head><body><div class="card"><strong>${status === "success" ? "Access confirmed" : "Sign-in failed"}</strong><span>${status === "success" ? "Returning to Journal Studio…" : "Close this window and try again."}</span></div><script>const receiveMessage=()=>{window.opener.postMessage(${JSON.stringify(message)},${JSON.stringify(targetOrigin)});window.removeEventListener("message",receiveMessage,false)};window.addEventListener("message",receiveMessage,false);window.opener.postMessage("authorizing:github",${JSON.stringify(targetOrigin)});</script></body></html>`;
}

export async function handleDecapAuth(request, env) {
  if (request.method !== "GET") return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, { Allow: "GET" });
  if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) {
    return new Response("Journal Studio authentication is not activated yet.", { status: 503 });
  }
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") || "github";
  if (provider !== "github") return new Response("Invalid provider", { status: 400 });
  const state = randomHex();
  const callback = new URL(`${DECAP_CALLBACK_PATH}?provider=github`, request.url).href;
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_OAUTH_ID);
  authorize.searchParams.set("redirect_uri", callback);
  authorize.searchParams.set("scope", "public_repo");
  authorize.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.href,
      "Cache-Control": "no-store",
      "Set-Cookie": `${DECAP_STATE_COOKIE}=${state}; Max-Age=600; Path=/api/decap/; Secure; HttpOnly; SameSite=Lax`
    }
  });
}

export async function handleDecapCallback(request, env, fetchImpl = fetch) {
  if (request.method !== "GET") return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, { Allow: "GET" });
  const url = new URL(request.url);
  const state = clean(url.searchParams.get("state"), 128);
  const expectedState = cookieValue(request, DECAP_STATE_COOKIE);
  const clearCookie = `${DECAP_STATE_COOKIE}=; Max-Age=0; Path=/api/decap/; Secure; HttpOnly; SameSite=Lax`;
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Set-Cookie": clearCookie,
    "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"
  };
  if (!state || !expectedState || state !== expectedState) {
    return new Response(decapCallbackHtml("error", { message: "Invalid OAuth state" }), { status: 400, headers });
  }
  const code = clean(url.searchParams.get("code"), 300);
  if (!code || !env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) {
    return new Response(decapCallbackHtml("error", { message: "Missing OAuth configuration" }), { status: 400, headers });
  }
  const callback = new URL(`${DECAP_CALLBACK_PATH}?provider=github`, request.url).href;
  let tokenResponse;
  try {
    tokenResponse = await fetchImpl("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.GITHUB_OAUTH_ID,
        client_secret: env.GITHUB_OAUTH_SECRET,
        code,
        redirect_uri: callback
      })
    });
  } catch {
    return new Response(decapCallbackHtml("error", { message: "GitHub could not be reached" }), { status: 502, headers });
  }
  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    return new Response(decapCallbackHtml("error", { message: "GitHub rejected the sign-in" }), { status: 502, headers });
  }
  return new Response(decapCallbackHtml("success", { token: tokenPayload.access_token }), { status: 200, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      return handleContact(request, env.CONTACT_EMAIL, {
        destination: env.CONTACT_DESTINATION,
        sender: env.CONTACT_SENDER
      });
    }
    if (url.pathname === "/api/subscribe") return handleSubscribe(request, env);
    if (url.pathname === "/api/loos") return handleLoos(request, env);
    if (url.pathname === "/api/loo-geocode") return handleLooGeocode(request);
    if (url.pathname === "/api/search-locations") return handleLocationSearch(request, env);
    if (url.pathname === "/api/decap/auth") return handleDecapAuth(request, env);
    if (url.pathname === DECAP_CALLBACK_PATH) return handleDecapCallback(request, env);
    return env.ASSETS.fetch(request);
  }
};
