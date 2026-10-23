import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../dist/wtm/operator/index.html", import.meta.url), "utf8");
const demo = await readFile(new URL("../dist/wtm/operator/demo/index.html", import.meta.url), "utf8");
const demoJs = await readFile(new URL("../dist/wtm-operator-demo.js", import.meta.url), "utf8");

test("operator page presents one controlled free-time use case", () => {
  assert.match(html, /Make the free hours part of the/);
  assert.match(html, /Turn two free hours before dinner into a confident choice/);
  assert.match(html, /one London product/i);
  assert.equal((html.match(/<iframe\b/g) || []).length, 1, "page should include exactly one live demo");
});

test("operator page embeds an Italian traveller demo with visible attribution", () => {
  assert.match(html, /<iframe src="\/wtm\/operator\/demo\/"/);
  assert.match(demo, /Hai due ore libere/);
  assert.match(demo, /OP-DEMO \/ LON-CITY-4D \/ DEP-03NOV \/ BLOOM-01 \/ LEADER-WA/);
  for (const id of ["poc_id", "product_id", "departure_id", "property_id", "channel_id"]) {
    assert.match(demoJs, new RegExp(id));
  }
  assert.match(demoJs, /recommendation-completed/);
});

test("operator pilot is bounded and measurable", () => {
  for (const marker of [
    "3–5 departures", "Up to 300 passengers", "Up to 3 London hotels",
    "Days 1–14", "Days 15–30", "Days 31–75", "Days 76–90",
    "Reach", "Completion", "Action", "Usefulness", "Distribution adoption"
  ]) assert.ok(html.toLowerCase().includes(marker.toLowerCase()), `missing ${marker}`);
});

test("operator page explains privacy, co-marketing and rollout economics", () => {
  for (const marker of [
    "What is not required", "No passenger name", "Optional co-marketing",
    "£2,400", "£2.50", "£1.50", "not a binding quote"
  ]) assert.ok(html.includes(marker), `missing ${marker}`);
  assert.match(html, /href="\/#contact"/);
  assert.doesNotMatch(html, /mailto:/i);
});

test("operator landing page is canonical while its demo is noindex", () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.londonadvanced\.com\/wtm\/operator\/">/);
  assert.match(html, /<meta name="robots" content="index,follow">/);
  assert.match(demo, /<meta name="robots" content="noindex,nofollow">/);
});
