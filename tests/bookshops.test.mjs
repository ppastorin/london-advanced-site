import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("bookshop inventory is classified, bilingual and geographically usable", async () => {
  const data = JSON.parse(await readFile(new URL("dist/data/bookshops.json", root), "utf8"));
  assert.equal(data.count, 113);
  assert.equal(data.shops.length, 113);
  assert.equal(new Set(data.shops.map(shop => shop.id)).size, 113);
  assert.ok(data.shops.every(shop => Number.isFinite(shop.lat) && Number.isFinite(shop.lon)));
  assert.ok(data.shops.every(shop => /^(?:1|1\/2|2|2\/3|3|3\/4)$/.test(String(shop.zone))));
  assert.ok(data.shops.every(shop => shop.description && shop.description_it && shop.source));
  assert.ok(data.shops.every(shop => Array.isArray(shop.specialism_tags) && Array.isArray(shop.feature_tags)));
  assert.ok(new Set(data.shops.map(shop => shop.type)).size >= 6);
  assert.ok(data.shops.some(shop => shop.type === "second-hand"));
  assert.ok(data.shops.some(shop => shop.type === "rare-antiquarian"));
  assert.ok(data.shops.some(shop => shop.feature_tags.includes("cafe-food")));
  assert.ok(data.shops.some(shop => shop.feature_tags.includes("heritage-story")));
  assert.ok(!data.shops.some(shop => ["Bendico", "The Enchanted Spine"].includes(shop.name)));
});

test("bookshop tool provides EN/IT routes, combinable filters, map and directions", async () => {
  const [english, italian, app] = await Promise.all([
    readFile(new URL("dist/bookshops/index.html", root), "utf8"),
    readFile(new URL("dist/it/strumenti/librerie/index.html", root), "utf8"),
    readFile(new URL("dist/bookshops/bookshops.js", root), "utf8")
  ]);
  for (const html of [english, italian]) {
    assert.match(html, /class="site-nav"/);
    assert.match(html, /class="bookshop-nav-about"[^>]*data-bookshop-about/);
    assert.match(html, /id="radius"[^>]*max="5000"/);
    assert.match(html, /data-filter-group="type"/);
    assert.match(html, /data-filter-group="specialism"/);
    assert.match(html, /data-filter-group="feature"/);
    assert.match(html, /id="bookshop-map"/);
    assert.match(html, /bookshops\.js\?v=20261104-v1/);
    assert.match(html, /class="about-panel bookshop-about-panel"/);
  }
  assert.match(english, /<html lang="en-GB">/);
  assert.match(italian, /<html lang="it-IT">/);
  assert.match(app, /fetch\("\/api\/bookshops/);
  assert.match(app, /\/api\/bookshop-geocode/);
  assert.match(app, /markerClusterGroup/);
  assert.match(app, /navigator\.geolocation/);
  assert.match(app, /google\.com\/maps\/dir/);
  assert.match(app, /state\.specialisms/);
  assert.match(app, /state\.features/);
});

test("Cloudflare routes bookshop API requests through the Worker", async () => {
  const config = await readFile(new URL("wrangler.jsonc", root), "utf8");
  assert.match(config, /"\/api\/bookshops"/);
  assert.match(config, /"\/api\/bookshop-geocode"/);
});
