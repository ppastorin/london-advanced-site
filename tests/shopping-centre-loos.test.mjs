import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dataset = JSON.parse(await readFile(new URL("../dist/data/loos.json", import.meta.url), "utf8"));

const auditedCentres = [
  "wimbledon-quarter",
  "broadwalk-centre-edgware",
  "livat-hammersmith",
  "mercury-shopping-centre-romford",
  "chimes-uxbridge",
  "stratford-centre",
  "angel-central",
  "london-designer-outlet",
  "broadgate-central",
  "edmonton-green-shopping-centre",
  "pavilions-uxbridge",
  "vicarage-field-barking"
];

test("loo dataset includes the London shopping-centre audit", () => {
  assert.equal(dataset.count, dataset.loos.length);
  assert.equal(dataset.count, 177);
  assert.equal(new Set(dataset.loos.map(loo => loo.id)).size, dataset.loos.length);

  const byId = new Map(dataset.loos.map(loo => [loo.id, loo]));
  for (const id of auditedCentres) {
    const loo = byId.get(id);
    assert.ok(loo, `${id} must be present`);
    assert.equal(loo.category, "shopping_centre");
    assert.equal(loo.active, true);
    assert.equal(loo.last_verified, "2026-09-28");
    assert.match(loo.source_url, /^https:\/\//);
    assert.ok(Number.isFinite(loo.lat) && Number.isFinite(loo.lon));
  }
});

test("Wimbledon Quarter and accessible retail facilities keep their practical details", () => {
  const byId = new Map(dataset.loos.map(loo => [loo.id, loo]));
  const wimbledon = byId.get("wimbledon-quarter");
  assert.equal(wimbledon.accessible, true);
  assert.equal(wimbledon.baby_change, true);
  assert.equal(wimbledon.changing_places, true);
  assert.match(wimbledon.location_note, /lower and upper floors/i);

  assert.equal(byId.get("london-designer-outlet").changing_places, true);
  assert.equal(byId.get("broadgate-central").changing_places, true);
  assert.equal(byId.get("broadwalk-centre-edgware").radar, true);
  assert.equal(byId.get("edmonton-green-shopping-centre").accessible, true);
});

test("the about panels show the current dataset count in both languages", async () => {
  const en = await readFile(new URL("../dist/loo/index.html", import.meta.url), "utf8");
  const it = await readFile(new URL("../dist/it/loo/index.html", import.meta.url), "utf8");
  assert.match(en, /177 verified locations/);
  assert.match(it, /177 luoghi verificati/);
});
