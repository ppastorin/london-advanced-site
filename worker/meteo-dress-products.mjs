const FEED_SECRET = "AWIN_MAXISPORT_FEED_URL";
const CACHE_SECONDS = 6 * 60 * 60;
const MAX_PRODUCTS = 1200;

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
});

function* csvRows(text) {
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); yield row; row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); yield row; }
}

const has = (text, pattern) => pattern.test(text);

const SPORT_CONTEXT = /running|fitness|sport|trekking|outdoor|sci|snowboard|ciclismo|cycling|calcio|football|rugby|arrampicata|climbing|alpinismo/;
const SPECIALIST_FOOTWEAR_CONTEXT = /snowboard|sci(?:\s|$)|ciclismo|cycling|calcio|football|rugby|arrampicata|climbing|alpinismo|atletica|track\s*(?:and|&)\s*field/;
const TECHNICAL_HARDGOODS = /\b(casco|helmet|maschera|goggle|attacchi?|bindings?|tavola|bastoncini?|protezioni?|ramponi?|crampons?)\b/;

export function isCityWearEligible(path, type) {
  if (type === "scarpe" && has(path, SPECIALIST_FOOTWEAR_CONTEXT)) return false;
  if (type === "accessorio" && has(path, TECHNICAL_HARDGOODS)) return false;
  return true;
}

export function classify(record) {
  const name = record.product_name || "";
  const path = [record.merchant_product_category_path, record.merchant_product_second_category, record.merchant_product_third_category, record["Fashion:category"], name].filter(Boolean).join(" ").toLowerCase();
  if (has(path, /pantalon|calzamaglia|\bshorts?\b/)) return null;
  if (has(path, /smartphone|porta[ -]?telefono|phone holder|fascia braccio|armband/)) return null;
  let type = "";
  if (has(path, /guant|moffol|cappell|berrett|sciarp|scaldacollo|occhial|sunglasses|paraorecchie|fascia/)) type = "accessorio";
  else if (has(path, /giacc|jacket|cappott|piumin|parka|impermeabil|guscio|\brain\b/)) type = has(path, /cappott|piumin|parka/) ? "cappotto" : "impermeabile";
  else if (has(path, /magli|felp|pullover|cardigan|pile|sweat|t-shirt|camici/)) type = "maglia";
  else if (has(path, /scarpe|sneaker|stival|calzatur|sandali|\bboots?\b|\bshoes?\b|footwear/)) type = "scarpe";
  if (!type || !isCityWearEligible(path, type)) return null;

  const suitable = String(record["Fashion:suitable_for"] || "").toLowerCase();
  const sections = [];
  if (has(`${path} ${suitable}`, /\bdonna\b|\bwomen\b|\bfemale\b/)) sections.push("donna");
  if (has(`${path} ${suitable}`, /\buomo\b|\bmen\b|\bmale\b/)) sections.push("uomo");
  if (has(`${path} ${suitable}`, /bambin|ragazz|\bbaby\b|\bjunior\b|\bkids?\b|\bboys?\b|\bgirls?\b/)) sections.push("bambino");
  if (!sections.length) sections.push("unisex");
  else if (!sections.includes("bambino") && has(suitable, /unisex/)) sections.push("unisex");

  const styles = has(path, SPORT_CONTEXT) ? ["sportivo"] : ["casual", "urbano", "essenziale"];
  if (has(path, /elegant|classico|cappotto|camici|mocassin|loafer|derby|oxford|stringat|chelsea|trench/)) styles.push("elegante");
  const warmth = has(path, /piumin|imbott|termic|sci|snowboard|pile|invern/) ? 4 : has(path, /cappott|parka|lana|felp|pullover/) ? 3 : has(path, /giacc|impermeabil|guscio|stival/) ? 2 : 1;
  const rain = has(path, /impermeabil|waterproof|\brain\b|gore-tex|goretex|guscio/) ? 4 : has(path, /stival|trekking/) ? 2 : 0;
  const price = Number.parseFloat(record.search_price || record.store_price || "");
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    id: record.parent_product_id || record.product_model || record.aw_product_id || record.merchant_product_id,
    variantId: record.merchant_product_id,
    name: name.trim(), brand: (record.brand_name || "Maxi Sport").trim(), merchant: "Maxi Sport",
    category: path, price, image: record.merchant_image_url || record.large_image || record.aw_image_url,
    url: record.aw_deep_link, sections: [...new Set(sections)], styles: [...new Set(styles)],
    warmth, rain, type, tier: price < 60 ? "conveniente" : price < 150 ? "media" : "premium",
    size: String(record["Fashion:size"] || "").trim()
  };
}

export function normalizeFeed(text) {
  const iterator = csvRows(text);
  const first = iterator.next();
  if (first.done) throw new Error("empty_feed");
  const headers = first.value.map(value => value.replace(/^\uFEFF/, ""));
  for (const required of ["aw_deep_link", "product_name", "merchant_product_id", "search_price"]) {
    if (!headers.includes(required)) throw new Error("invalid_feed");
  }
  const products = new Map();
  let snapshotUpdated = "";
  for (const values of iterator) {
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
    if (String(record.is_for_sale || "1") === "0" || String(record.in_stock || "1") === "0") continue;
    const item = classify(record);
    if (!item || !item.url || !item.image || !/^https:\/\//i.test(item.url)) continue;
    const key = `${item.id}|${item.name}`;
    const existing = products.get(key);
    if (existing) {
      if (item.size && !existing.sizes.includes(item.size)) existing.sizes.push(item.size);
      if (item.price < existing.price) { existing.price = item.price; existing.url = item.url; existing.variantId = item.variantId; }
    } else if (products.size < MAX_PRODUCTS) {
      const { size, ...product } = item;
      product.sizes = size ? [size] : [];
      products.set(key, product);
    }
    if (record.last_updated && record.last_updated > snapshotUpdated) snapshotUpdated = record.last_updated;
  }
  const output = [...products.values()];
  if (output.length < 4) throw new Error("insufficient_products");
  return { source: "Maxi Sport IT via Awin", snapshotUpdated: snapshotUpdated ? `${snapshotUpdated.replace(" ", "T")}Z` : new Date().toISOString(), products: output };
}

async function downloadFeed(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("invalid_feed_url");
  const response = await fetch(parsed, { redirect: "follow", headers: { Accept: "text/csv,application/gzip,application/octet-stream" } });
  if (!response.ok || !response.body) throw new Error(`feed_http_${response.status}`);
  const isGzip = /gzip|octet-stream/i.test(response.headers.get("Content-Type") || "") || parsed.pathname.endsWith(".gz");
  const body = isGzip ? response.body.pipeThrough(new DecompressionStream("gzip")) : response.body;
  return new Response(body).text();
}

export async function handleMeteoDressProducts(request, env) {
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, { Allow: "GET" });
  if (!env[FEED_SECRET]) return json({ error: "feed_not_configured", message: `Add the ${FEED_SECRET} Worker secret to enable the live catalogue.` }, 503, { "Cache-Control": "no-store" });
  const cache = caches.default;
  const cacheKey = new Request(new URL("/__cache/meteo-dress-products-v7", request.url));
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  try {
    const payload = normalizeFeed(await downloadFeed(env[FEED_SECRET]));
    const response = json(payload, 200, { "Cache-Control": `public, max-age=300, s-maxage=${CACHE_SECONDS}`, "X-Content-Type-Options": "nosniff" });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    console.error("Meteo Dress feed refresh failed", error?.message || "unknown_error");
    return json({ error: "feed_unavailable", message: "The product catalogue is temporarily unavailable." }, 502, { "Cache-Control": "no-store" });
  }
}
