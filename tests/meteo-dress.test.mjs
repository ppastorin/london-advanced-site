import { classify, isCityWearEligible } from "../worker/meteo-dress-products.mjs";
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


test("city-wear taxonomy excludes specialist equipment by category, not by individual SKU", () => {
  const common = {
    search_price: "249.95",
    aw_deep_link: "https://www.awin1.com/example",
    merchant_image_url: "https://example.com/product.jpg",
    merchant_product_id: "sku",
    "Fashion:suitable_for": "male"
  };
  const technicalFootwear = [
    ["Snowboard Dc Shoes Scarponi Premier Hybrid Boa®", "Sport > Snowboard > Scarponi"],
    ["Salomon S/Pro Alpha", "Sport > Sci > Scarponi uomo"],
    ["Scarpe Shimano RC5", "Sport > Ciclismo > Calzature"],
    ["Adidas Predator League", "Sport > Calcio > Scarpe"]
  ];
  for (const [product_name, merchant_product_category_path] of technicalFootwear) {
    assert.equal(classify({ ...common, product_name, merchant_product_category_path }), null);
  }
  assert.equal(isCityWearEligible("sport > snowboard > scarponi", "scarpe"), false);
  assert.equal(classify({
    ...common,
    product_name: "Sneaker Uomo in pelle Chelsea",
    merchant_product_category_path: "Moda > Uomo > Calzature"
  })?.type, "scarpe");
});

test("sport taxonomy does not inherit city styles and ranking requires the selected style", () => {
  const common = {
    search_price: "99.95",
    aw_deep_link: "https://www.awin1.com/example",
    merchant_image_url: "https://example.com/product.jpg",
    merchant_product_id: "sku"
  };
  assert.deepEqual(classify({
    ...common,
    product_name: "Scarpe Running Uomo",
    merchant_product_category_path: "Sport > Running > Scarpe"
  })?.styles, ["sportivo"]);
  const app = fs.readFileSync("dist/meteo-dress/app.js", "utf8");
  assert.match(app, /!product\.styles\.includes\(profile\.style\)\) return -100/);
});
