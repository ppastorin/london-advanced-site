import assert from "node:assert/strict";
import test from "node:test";
import { selectTests } from "../scripts/test-changed.mjs";

test("changed-test selection maps tool changes deterministically", () => {
  const result = selectTests(["dist/bookshops/bookshops.js", "dist/bookshops/bookshops-extra.css"]);
  assert.equal(result.mode, "targeted");
  assert.deepEqual(result.tests, ["tests/bookshops.test.mjs"]);
  assert.equal(result.needsBuild, true);
});

test("changed-test selection combines independent mappings without duplicates", () => {
  const result = selectTests(["apps/fare-calculator/fare-engine.mjs", "content/social/posts/example.json"]);
  assert.equal(result.mode, "targeted");
  assert.deepEqual(result.tests, ["tests/fare-calculator.test.mjs", "tests/social.test.mjs", "tests/studio-preview.test.mjs"]);
});

test("changed-test selection recognises Studio media-only changes", () => {
  const result = selectTests(["assets/instagram/example.jpg", "dist/assets/instagram/example.jpg"]);
  assert.equal(result.mode, "none");
  assert.deepEqual(result.tests, []);
});

test("changed-test selection falls back to full regression for shared or unknown paths", () => {
  assert.equal(selectTests(["worker/index.mjs"]).mode, "full");
  assert.equal(selectTests(["new-unmapped-area/file.js"]).mode, "full");
});
