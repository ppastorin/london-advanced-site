import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../dist/wtm/index.html", import.meta.url), "utf8");
const demo = await readFile(new URL("../dist/wtm/demo/index.html", import.meta.url), "utf8");
const demoJs = await readFile(new URL("../dist/wtm-demo.js", import.meta.url), "utf8");

test("WTM page presents one property-aware hotel use case", () => {
  assert.match(html, /Property-aware discovery without a technology project\./);
  assert.match(html, /Help a guest use the next few hours well\./);
  assert.equal((html.match(/<iframe\b/g) || []).length, 1, "page should include exactly one live demo");
});

test("WTM page embeds a dedicated co-branded hotel demo", () => {
  assert.match(html, /<iframe src="\/wtm\/demo\/"/);
  assert.match(demo, /The London House/);
  assert.match(demo, /Fictional demo property/);
  assert.match(demo, /The London House · Russell Square/);
  assert.match(demoJs, /recommendation-completed/);
  assert.match(demoJs, /positive usefulness signal/);
});

test("WTM proposition defines a measurable 90-day pilot", () => {
  for (const marker of [
    "Days 1–14", "Days 15–30", "Days 31–75", "Days 76–90",
    "Reach", "Completion", "Action", "Usefulness", "Staff adoption",
    "stop, iterate or scale"
  ]) assert.ok(html.toLowerCase().includes(marker.toLowerCase()), `missing ${marker}`);
});

test("WTM page covers brand value, co-marketing, product expansion and costs", () => {
  for (const marker of [
    "Distinctive local expertise", "Optional co-marketing", "Crowd Pressure",
    "Smart Navigation", "90-day pilot", "£4,500", "£450", "Portfolio rollout"
  ]) assert.ok(html.includes(marker), `missing ${marker}`);
});

test("WTM page provides a contact path and honest commercial caveats", () => {
  assert.match(html, /href="\/#contact"/);
  assert.match(html, /not claimed industry benchmarks/i);
  assert.match(html, /not a binding quote/i);
  assert.doesNotMatch(html, /mailto:/i);
});

test("WTM landing page is canonical while the embedded demo is noindex", () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.londonadvanced\.com\/wtm\/">/);
  assert.match(html, /<meta name="robots" content="index,follow">/);
  assert.match(demo, /<meta name="robots" content="noindex,nofollow">/);
});
