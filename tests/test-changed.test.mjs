import test from "node:test";
import assert from "node:assert/strict";
import { planForFiles } from "../scripts/test-changed.mjs";

test("unknown application paths fall back to the full suite", () => {
  const plan = planForFiles(["components/new-widget.js"]);
  assert.equal(plan.mode, "full");
  assert.equal(plan.tests.length, 32);
});

test("shared build paths fall back to the full suite", () => {
  const plan = planForFiles(["worker/index.mjs"]);
  assert.equal(plan.mode, "full");
});

test("documentation-only changes need no application tests", () => {
  const plan = planForFiles(["docs/notes.md", "AGENTS.md"]);
  assert.equal(plan.mode, "none");
  assert.deepEqual(plan.tests, []);
});

test("Journal changes select Journal and dependent generated-page checks", () => {
  const plan = planForFiles(["content/journal/new.en.json"]);
  assert.equal(plan.mode, "targeted");
  assert.deepEqual(plan.tests, [
    "tests/journal.test.mjs",
    "tests/seo-positioning.test.mjs",
    "tests/sitemap-coverage.test.mjs"
  ]);
});

test("itinerary assets select route and preview checks", () => {
  const plan = planForFiles(["assets/itineraries/new-map.webp"]);
  assert.equal(plan.mode, "targeted");
  assert.ok(plan.tests.includes("tests/itineraries.test.mjs"));
  assert.ok(plan.tests.includes("tests/studio-preview.test.mjs"));
});

test("social changes select social validation checks", () => {
  const plan = planForFiles(["content/social/posts/example.json"]);
  assert.equal(plan.mode, "targeted");
  assert.deepEqual(plan.tests, [
    "tests/social.test.mjs",
    "tests/studio-media-upload.test.mjs"
  ]);
});

test("an explicitly changed test runs by itself", () => {
  const plan = planForFiles(["tests/fare-calculator.test.mjs"]);
  assert.equal(plan.mode, "targeted");
  assert.deepEqual(plan.tests, ["tests/fare-calculator.test.mjs"]);
});
