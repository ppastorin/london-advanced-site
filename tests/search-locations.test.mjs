import assert from "node:assert/strict";
import test from "node:test";

import { handleLocationSearch } from "../worker/index.mjs";

test("location search merges a shared place into links for all applicable tools", async () => {
  const LOO_DB = {
    prepare() {
      return {
        bind() {
          return {
            all: async () => ({ results: [{
              id: "british-museum",
              name: "British Museum",
              address: "Great Russell Street",
              location_note: "Toilets inside the museum"
            }] })
          };
        }
      };
    }
  };
  const fetchImpl = async () => Response.json({ places: [{
    id: "M1",
    name: "The British Museum",
    description: "A major museum in Bloomsbury.",
    hook: "A collection spanning world history."
  }] });
  const response = await handleLocationSearch(
    new Request("https://www.londonadvanced.com/api/search-locations?q=British%20Museum&locale=en"),
    { LOO_DB },
    fetchImpl
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.count, 1);
  assert.equal(payload.records[0].title, "The British Museum");
  assert.deepEqual(payload.records[0].links.map(link => link.id), [
    "smart-navigation",
    "london-by-mood",
    "escape-the-crowds",
    "loo-finder"
  ]);
});
