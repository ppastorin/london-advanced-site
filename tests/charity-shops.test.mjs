import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("charity shop inventory is complete and usable", async () => {
  const data = JSON.parse(await readFile(new URL("dist/data/charity-shops.json", root), "utf8"));
  assert.equal(data.count, 316);
  assert.equal(data.shops.length, 316);
  assert.equal(new Set(data.shops.map(shop => shop.id)).size, 316);
  assert.equal(new Set(data.shops.map(shop => shop.place_id)).size, 316);
  assert.equal(new Set(data.shops.map(shop => shop.organization)).size, 15);
  assert.ok(data.shops.every(shop => Number.isFinite(shop.lat) && Number.isFinite(shop.lon)));
  assert.ok(data.shops.every(shop => /^(?:1|1\/2|2|2\/3|3|3\/4|4)$/.test(String(shop.tfl_zone))));
  assert.ok(data.shops.every(shop => shop.description_en && shop.description_it && shop.source_url));
  assert.ok(data.shops.some(shop => shop.subtype === "books_music"));
  assert.equal(data.shops.filter(shop => shop.organization === "Cancer Research UK").length, 47);
  assert.ok(data.shops.some(shop => shop.id === "cancer-research-uk-richmond" && shop.postcode === "TW9 1SX" && shop.tfl_zone === "4"));
  assert.equal(data.shops.filter(shop => shop.organization === "British Red Cross").length, 14);
  assert.equal(data.shops.filter(shop => shop.organization === "Princess Alice Hospice").length, 7);
  assert.ok(data.shops.some(shop => shop.id === "princess-alice-hospice-west-ealing-alices-attic" && shop.subtype === "furniture_electrical"));
  assert.ok(data.shops.some(shop => shop.id === "british-red-cross-palmers-green-bookshop" && shop.subtype === "books_music"));
  assert.ok(data.shops.some(shop => shop.id === "british-red-cross-fulham-furniture-and-electrical" && shop.subtype === "furniture_electrical"));
  for (const id of ["oxfam-ealing-bookshop", "oxfam-muswell-hill-bookshop", "oxfam-kentish-town-books-music"]) {
    assert.ok(data.shops.some(shop => shop.id === id && shop.subtype === "books_music"), `missing ${id}`);
  }
});

test("charity shop tool exposes mobile filters, map, EN/IT routes and methodology", async () => {
  const [english, italian, app] = await Promise.all([
    readFile(new URL("dist/charity-shops/index.html", root), "utf8"),
    readFile(new URL("dist/it/strumenti/negozi-di-beneficenza/index.html", root), "utf8"),
    readFile(new URL("dist/charity-shops/charity-shops.js", root), "utf8")
  ]);

  for (const html of [english, italian]) {
    assert.match(html, /class="site-nav"/);
    assert.match(html, /class="charity-nav-about"[^>]*data-charity-about/);
    assert.match(html, /<footer\b/);
    assert.match(html, /id="radius"[^>]*max="1000"/);
    assert.match(html, /id="charity-options"/);
    assert.match(html, /id="charity-map"/);
    assert.match(html, /charity-shops\.js\?v=20261106-mobile-v1/);
    assert.match(html, /charity-shops-mobile\.css\?v=20261106-mobile-v1/);
    assert.equal((html.match(/charity-shops-mobile\.css/g) || []).length, 1);
    assert.match(html, /316 (?:shops|negozi)/);
    assert.match(html, /15 (?:charity organisations|organizzazioni)/);
    assert.match(html, /class="charity-intro"[^>]*>[^<]*316/);
    assert.match(html, /class="about-panel charity-about-panel"/);
    const hero = html.match(/<section class="charity-hero">([\s\S]*?)<\/section>/)?.[1] || "";
    assert.doesNotMatch(hero, /data-charity-about/);
  }
  assert.match(english, /<html lang="en-GB">/);
  assert.match(italian, /<html lang="it-IT">/);
  assert.match(app, /fetch\("\/api\/charity-shops/);
  assert.match(app, /\/api\/charity-geocode/);
  assert.match(app, /markerClusterGroup/);
  assert.match(app, /navigator\.geolocation/);
  assert.match(app, /function initMobileUI/);
  assert.match(app, /data-mobile-view="map"/);
  assert.match(app, /className="mobile-filter-scroll"/);
  assert.match(app, /className="mobile-filter-footer"/);
  assert.doesNotMatch(app, /function filtered\(\)\{\s*if\(!state\.origin\)return\[\]/);
  const renderSource = app.match(/function render\(fit=false\)\{([\s\S]*?)\n\}/)?.[1] || "";
  assert.ok(
    renderSource.indexOf("state.markers.clearLayers()") < renderSource.indexOf("if(!state.origin)"),
    "filters must redraw the map before location-dependent results are handled"
  );
  assert.match(app, /state\.radius=Number\(event\.target\.value\);render\(\)/);
});

test("charity shop mobile layout keeps controls clear of the map and filter options", async () => {
  const css = await readFile(new URL("dist/charity-shops/charity-shops-mobile.css", root), "utf8");
  assert.match(css, /@media\(max-width:680px\)/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 46px 46px/);
  assert.match(css, /\.charity-map-wrap\{position:relative;top:auto;margin:0/);
  assert.match(css, /\.mobile-filter-scroll\{display:block;flex:1 1 auto;min-height:0/);
  assert.match(css, /\.mobile-filter-footer\{position:relative/);
  assert.doesNotMatch(css, /\.mobile-filter-footer\{position:fixed/);
  assert.match(css, /\.mobile-map-view \.charity-results\{display:none\}/);
  assert.match(css, /\.mobile-list-view \.charity-map-wrap\{display:none\}/);
  assert.match(css, /touch-action:pan-x pan-y/);
});
