import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dataset = JSON.parse(await readFile(new URL("../dist/data/loos.json", import.meta.url), "utf8"));

test("National Portrait Gallery is included with its verified facilities", () => {
  const gallery = dataset.loos.find(loo => loo.id === "national-portrait-gallery");

  assert.ok(gallery, "National Portrait Gallery must be present");
  assert.equal(gallery.category, "free_entry_venue");
  assert.equal(gallery.access_mode, "free_entry_venue");
  assert.equal(gallery.fee_pence, 0);
  assert.equal(gallery.accessible, true);
  assert.equal(gallery.baby_change, true);
  assert.equal(gallery.changing_places, true);
  assert.equal(gallery.last_verified, "2026-10-18");
  assert.equal(gallery.source_type, "official");
  assert.equal(gallery.source_url, "https://www.npg.org.uk/visit/accessibility/");
  assert.match(gallery.location_note, /Floors -2, -3 and 4/);
});
