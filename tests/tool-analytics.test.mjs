import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Fare Calculator records only a successful user-requested calculation", async () => {
  const source = await readFile("apps/fare-calculator/fare-calculator-app.mjs", "utf8");
  assert.match(source, /calculate\(false\);/);
  assert.match(source, /if \(scroll\) \{[\s\S]*?event\("fare_calculation_completed", \{ tool_id: "travel_fare_calculator", language: locale \}\)/);
});

test("Loo Finder events contain journey metadata but no search or location values", async () => {
  const source = await readFile("dist/loo/loo.js", "utf8");
  assert.match(source, /event\(name,\{tool_id:"loo_finder",language:IT\?"it":"en",\.\.\.context\}\)/);
  assert.match(source, /track\("loo_nearby_search_started"\)/);
  assert.match(source, /track\("loo_place_search_completed",\{search_method:"venue"\}\)/);
  assert.match(source, /track\("loo_place_search_completed",\{search_method:"place"\}\)/);
});
