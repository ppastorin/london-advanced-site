import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../dist/wtm/index.html", import.meta.url), "utf8");

test("WTM page presents one clear hotel guest-discovery use case", () => {
  assert.match(html, /A guest-discovery layer for London hotels\./);
  assert.match(html, /Hotel guest discovery,/);
  assert.equal((html.match(/<iframe\b/g) || []).length, 1, "page should include exactly one live demo");
});

test("WTM page embeds the live London by Mood demo", () => {
  assert.match(html, /<iframe src="https:\/\/london-by-mood\.ppastorin\.workers\.dev\/"/);
  assert.match(html, /Open the live demo in a new tab/);
});

test("WTM page defines the 90-day pilot and a contact path", () => {
  for (const marker of ["Days 1–14", "Days 15–75", "Days 76–90", "Stop, iterate or scale", 'href="\/#contact"']) {
    assert.ok(html.toLowerCase().includes(marker.toLowerCase()), `missing ${marker}`);
  }
  assert.doesNotMatch(html, /mailto:/i);
});

test("WTM page is canonical and indexable", () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.londonadvanced\.com\/wtm\/">/);
  assert.match(html, /<meta name="robots" content="index,follow">/);
});
