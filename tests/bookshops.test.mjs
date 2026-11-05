import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("bookshop inventory is classified, bilingual and geographically usable", async () => {
  const data = JSON.parse(await readFile(new URL("dist/data/bookshops.json", root), "utf8"));
  assert.equal(data.count, 124);
  assert.equal(data.shops.length, 124);
  assert.equal(new Set(data.shops.map(shop => shop.id)).size, 124);
  assert.equal(new Set(data.shops.map(shop => shop.place_id)).size, 124);
  assert.ok(data.shops.every(shop => Number.isFinite(shop.lat) && Number.isFinite(shop.lon)));
  assert.ok(data.shops.every(shop => /^(?:1|1\/2|2|2\/3|3|3\/4)$/.test(String(shop.zone))));
  assert.ok(data.shops.every(shop => shop.description && shop.description_it && shop.source));
  assert.ok(data.shops.every(shop => Array.isArray(shop.specialism_tags) && Array.isArray(shop.feature_tags)));
  assert.ok(new Set(data.shops.map(shop => shop.type)).size >= 6);
  assert.ok(data.shops.some(shop => shop.type === "second-hand"));
  assert.ok(data.shops.some(shop => shop.type === "rare-antiquarian"));
  assert.ok(data.shops.some(shop => shop.feature_tags.includes("cafe-food")));
  assert.ok(data.shops.some(shop => shop.feature_tags.includes("heritage-story")));
  assert.equal(data.shops.filter(shop => shop.ownership === "Oxfam").length, 16);
  for (const branch of ["Balham", "Camden", "Chiswick", "Crouch End", "Ealing", "Hampstead", "Highgate", "Kentish Town", "Muswell Hill", "Portobello", "Victoria"]) {
    assert.ok(data.shops.some(shop => shop.ownership === "Oxfam" && shop.branch.includes(branch)), `missing Oxfam ${branch}`);
  }
  assert.ok(!data.shops.some(shop => shop.ownership === "Oxfam" && shop.branch.includes("Wanstead")));
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
    assert.match(html, /bookshops\.js\?v=20261105-mobile-v1/);
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

test("bookshop and charity endpoints use canonical D1 with static fail-safe exports", async () => {
  const worker = await readFile(new URL("worker/index.mjs", root), "utf8");
  assert.match(worker, /canonicalCollectionResponse\(request, env, "\/api\/bookshops"/);
  assert.match(worker, /canonicalCollectionResponse\(request, env, "\/api\/charity-shops"/);
  assert.match(worker, /X-London-Advanced-Data-Source/);
  assert.match(worker, /canonical-d1/);
  assert.match(worker, /static-fail-safe/);
  assert.doesNotMatch(worker, /source: "bookshops-static"/);
});

test("bookshop filters use a compact responsive layout", async () => {
  const [css, app] = await Promise.all([
    readFile(new URL("dist/bookshops/bookshops-extra.css", root), "utf8"),
    readFile(new URL("dist/bookshops/bookshops.js", root), "utf8")
  ]);
  assert.match(css, /grid-template-columns: minmax\(250px, \.62fr\) minmax\(0, 1\.38fr\)/);
  assert.match(css, /fieldset:nth-of-type\(2\),[\s\S]*fieldset:nth-of-type\(3\),[\s\S]*reset-filters \{ grid-column: 1 \/ -1; \}/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /max-height: none; overflow: visible/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*bookshop-controls \{ position: fixed/);
  assert.match(css, /mobile-map-view \.bookshop-results \{ display: none/);
  assert.match(css, /leaflet-control-zoom a[\s\S]*width: 44px/);
  assert.match(app, /function initMobileUI\(\)/);
  assert.match(app, /data-mobile-view="map"/);
  assert.match(app, /mobile-filter-apply/);
  assert.match(app, /if\(!isMobile\(\)\).*scrollIntoView/);
});
