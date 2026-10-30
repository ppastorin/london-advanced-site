import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("charity shop inventory is complete and usable", async () => {
  const data = JSON.parse(await readFile(new URL("dist/data/charity-shops.json", root), "utf8"));
  assert.equal(data.count, 245);
  assert.equal(data.shops.length, 245);
  assert.equal(new Set(data.shops.map(shop => shop.id)).size, 245);
  assert.equal(new Set(data.shops.map(shop => shop.organization)).size, 12);
  assert.ok(data.shops.every(shop => Number.isFinite(shop.lat) && Number.isFinite(shop.lon)));
  assert.ok(data.shops.every(shop => /^(?:1|1\/2|2|2\/3|3|3\/4|4)$/.test(String(shop.tfl_zone))));
  assert.ok(data.shops.every(shop => shop.description_en && shop.description_it && shop.source_url));
  assert.ok(data.shops.some(shop => shop.subtype === "books_music"));
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
    assert.match(html, /charity-shops\.js\?v=20261030-dynamic-filters/);
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
  assert.doesNotMatch(app, /function filtered\(\)\{\s*if\(!state\.origin\)return\[\]/);
  const renderSource = app.match(/function render\(\)\{([\s\S]*?)\n\}/)?.[1] || "";
  assert.ok(
    renderSource.indexOf("state.markers.clearLayers()") < renderSource.indexOf("if(!state.origin)"),
    "filters must redraw the map before location-dependent results are handled"
  );
  assert.match(app, /state\.radius=Number\(event\.target\.value\);render\(\)/);
});
