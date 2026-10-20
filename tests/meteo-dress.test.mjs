import { classify } from "../worker/meteo-dress-products.mjs";
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
  assert.match(app, /picks\.slice\(0,4\)/);
});

test("recommendations use one distinct product family per outfit role", () => {
  const app = fs.readFileSync("dist/meteo-dress/app.js", "utf8");
  assert.match(app, /function productFamilyKey/);
  assert.match(app, /productFamilyKey\(chosen\) === productFamilyKey\(p\)/);
  assert.doesNotMatch(app, /const remaining = productCatalog/);
});

test("feed taxonomy rejects phone holders and classifies fleece gloves as accessories", () => {
  const common = {
    search_price: "19.95",
    aw_deep_link: "https://www.awin1.com/example",
    merchant_image_url: "https://example.com/product.jpg",
    merchant_product_id: "sku"
  };
  assert.equal(classify({
    ...common,
    product_name: "Running Nike Fascia Braccio Porta Smartphone",
    merchant_product_category_path: "Sport > Running > Accessori"
  }), null);
  assert.equal(classify({
    ...common,
    product_name: "Running Nike Guanti Pile Tech Fleece",
    merchant_product_category_path: "Sport > Running > Accessori > Guanti",
    "Fashion:suitable_for": "male"
  })?.type, "accessorio");
  assert.deepEqual(classify({
    ...common,
    product_name: "Sci Reusch Guanti Travis Gtx Ragazzo",
    merchant_product_category_path: "Sport > Sci > Guanti"
  })?.sections, ["bambino"]);
  assert.deepEqual(classify({
    ...common,
    product_name: "Sci Reusch Guanti Ben Baby",
    merchant_product_category_path: "Sport > Sci > Guanti"
  })?.sections, ["bambino"]);
});
