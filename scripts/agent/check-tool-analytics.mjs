import { readFile } from "node:fs/promises";

const checks = [
  ["analytics.js", "event(name, context = {})"],
  ["apps/fare-calculator/fare-calculator-app.mjs", '"fare_calculation_completed"'],
  ["dist/loo/loo.js", '"loo_nearby_search_started"'],
  ["dist/loo/loo.js", '"loo_place_search_completed"']
];

let failures = 0;
for (const [file, marker] of checks) {
  const source = await readFile(file, "utf8");
  if (!source.includes(marker)) {
    failures += 1;
    console.error(`FAIL ${file}: missing ${marker}`);
  }
}

console.log(`Tool analytics check: ${checks.length - failures}/${checks.length} passed.`);
if (failures) process.exitCode = 1;
