import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("Meteo Dress uses the protected Worker feed", () => {
  const app = fs.readFileSync("dist/meteo-dress/app.js", "utf8");
  const html = fs.readFileSync("dist/meteo-dress/index.html", "utf8");
  const worker = fs.readFileSync("worker/index.mjs", "utf8");
  const config = fs.readFileSync("wrangler.jsonc", "utf8");
  assert.match(app, /fetch\("\/api\/meteo-dress-products"/);
  assert.doesNotMatch(app, /maxisport-products\.json/);
  assert.match(worker, /handleMeteoDressProducts/);
  assert.match(config, /\/api\/meteo-dress-products/);
  assert.match(html, /Pubblicità – link affiliati/);
  assert.equal(fs.existsSync("dist/meteo-dress/maxisport-products.json"), false);
});

test("warm-weather safeguards remain in the recommender", () => {
  const app = fs.readFileSync("dist/meteo-dress/app.js", "utf8");
  assert.match(app, /isGlove && calc\.effective > 5/);
  assert.match(app, /isColdHeadwear && calc\.effective > 9/);
  assert.match(app, /picks\.length >= 4/);
});
