import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dataset = JSON.parse(await readFile(new URL("../dist/data/loos.json", import.meta.url), "utf8"));

const requiredParkFacilities = [
  "gunnersbury-park-toilets",
  "hyde-park-bandstand",
  "hyde-park-reservoir",
  "regents-park-qeii-garden",
  "regents-park-queen-marys-gardens",
  "greenwich-park-maze-hill",
  "richmond-park-pembroke-lodge",
  "bushy-park-pheasantry-cafe",
  "holland-park-stable-yard-toilets",
  "crystal-palace-park-penge-gate-toilets",
  "finsbury-park-cafe-toilets",
  "battersea-park-beechmore-toilets"
];

test("loo dataset includes the verified public-park audit", () => {
  assert.equal(dataset.count, dataset.loos.length);
  assert.equal(dataset.count, 165);
  assert.equal(new Set(dataset.loos.map(loo => loo.id)).size, dataset.loos.length);

  const byId = new Map(dataset.loos.map(loo => [loo.id, loo]));
  for (const id of requiredParkFacilities) {
    const loo = byId.get(id);
    assert.ok(loo, `${id} must be present`);
    assert.equal(loo.category, "public_toilet");
    assert.equal(loo.access_mode, "public_park");
    assert.equal(loo.active, true);
    assert.equal(loo.last_verified, "2026-09-26");
    assert.match(loo.source_url, /^https:\/\//);
    assert.ok(Number.isFinite(loo.lat) && Number.isFinite(loo.lon));
  }
});

test("park accessibility facts remain explicit where officially documented", () => {
  const byId = new Map(dataset.loos.map(loo => [loo.id, loo]));
  assert.equal(byId.get("gunnersbury-park-toilets").accessible, true);
  assert.equal(byId.get("regents-park-qeii-garden").changing_places, true);
  assert.equal(byId.get("greenwich-park-maze-hill").changing_places, true);
  assert.equal(byId.get("holland-park-stable-yard-toilets").changing_places, true);
  assert.equal(byId.get("crystal-palace-park-penge-gate-toilets").changing_places, true);
});
