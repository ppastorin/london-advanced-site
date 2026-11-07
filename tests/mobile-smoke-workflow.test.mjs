import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(".github/workflows/mobile-shop-smoke.yml", "utf8");
const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
const browserPackage = JSON.parse(await readFile("tests/browser/package.json", "utf8"));
const browserSpec = await readFile("tests/browser/specs/mobile-tools.spec.mjs", "utf8");

test("mobile smoke is selective, validation-only and covers direct main pushes", () => {
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:\n\s+branches:\n\s+- main/);
  assert.match(workflow, /dist\/bookshops\/\*\*/);
  assert.match(workflow, /dist\/charity-shops\/\*\*/);
  assert.doesNotMatch(workflow, /content\/journal\/\*\*/);
  assert.doesNotMatch(workflow, /wrangler deploy/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
});

test("mobile smoke reuses only an exact successful PR-head run", () => {
  assert.match(workflow, /head_sha:\s*merged\.head\.sha/);
  assert.match(workflow, /run\.head_sha === merged\.head\.sha/);
  assert.match(workflow, /run\.conclusion === 'success'/);
  assert.match(workflow, /if:\s*needs\.scope\.outputs\.run_browser == 'true'/);
});

test("browser dependencies stay isolated and fixtures cover both widths and locales", () => {
  assert.equal(rootPackage.devDependencies["@playwright/test"], undefined);
  assert.equal(browserPackage.devDependencies["@playwright/test"], "1.65.0");
  assert.match(browserSpec, /\[375, 390\]/);
  assert.match(browserSpec, /\/it\/strumenti\/negozi-di-beneficenza\//);
  assert.match(browserSpec, /\/it\/strumenti\/librerie\//);
  assert.match(browserSpec, /data-marker-count/);
});
