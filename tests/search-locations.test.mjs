import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

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

test("location search returns every pub candidate without matching public as pub", async () => {
  let upstreamUrl;
  const places = [
    ...Array.from({ length: 31 }, (_, index) => ({
      id: `PUB-${index}`,
      name: `Pub venue ${index}`,
      category: "FOOD",
      description: `An independent pub with a distinctive room ${index}.`,
      hook: `An independent pub with a distinctive room ${index}.`
    })),
    {
      id: "WAXY-SISTER",
      name: "Waxy's Little Sister",
      category: "FOOD",
      description: "A compact Irish-pub setting around the corner.",
      hook: "A compact Irish-pub setting around the corner."
    },
    {
      id: "WHITE-SWAN-1",
      name: "The White Swan",
      category: "FOOD",
      description: "A Twickenham riverside pub.",
      hook: "A Twickenham riverside pub."
    },
    {
      id: "WHITE-SWAN-2",
      name: "White Swan",
      category: "FOOD",
      description: "A Richmond riverside pub.",
      hook: "A Richmond riverside pub."
    },
    ...Array.from({ length: 80 }, (_, index) => ({
      id: `PUBLIC-${index}`,
      name: `Public space ${index}`,
      category: "AREA",
      description: "A public garden and open space.",
      hook: "A public garden and open space."
    }))
  ];
  const fetchImpl = async request => {
    upstreamUrl = new URL(request);
    return Response.json({ places });
  };
  const response = await handleLocationSearch(
    new Request("https://www.londonadvanced.com/api/search-locations?q=pub&locale=en"),
    {},
    fetchImpl
  );
  const payload = await response.json();

  assert.equal(upstreamUrl.searchParams.get("limit"), "250");
  assert.equal(upstreamUrl.searchParams.get("compact"), "1");
  assert.equal(upstreamUrl.searchParams.get("categories"), "FOOD,BUILDING");
  assert.equal(payload.count, 34);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok(payload.records.every(record => record.keywords.includes("pub")));
  assert.ok(payload.records.every(record => !record.title.startsWith("Public space")));
  assert.ok(payload.records.some(record => record.title === "Waxy's Little Sister"));
  assert.equal(payload.records.filter(record => /^(?:The )?White Swan$/.test(record.title)).length, 2);
});

test("browser search treats short queries as words and keeps the full result count", async () => {
  const source = await readFile("search/search.js", "utf8");
  const executable = source.match(/function normalize[\s\S]*?(?=function renderResults)/)?.[0];
  assert.ok(executable, "Could not isolate the browser search scorer");
  const context = { window: {}, Intl };
  vm.createContext(context);
  vm.runInContext(`const pageLocale = "en";\n${executable}\nwindow.__TEST__ = { normalize, scoreRecord };`, context);

  const pub = { title: "The Dove", keywords: ["pub"], tags: ["FOOD"], summary: "A riverside pub.", content: "" };
  const publicSpace = { title: "Public garden", keywords: [], tags: ["AREA"], summary: "A public open space.", content: "" };
  assert.ok(context.window.__TEST__.scoreRecord(pub, "pub") > 0);
  assert.equal(context.window.__TEST__.scoreRecord(publicSpace, "pub"), 0);
  assert.doesNotMatch(source, /\.slice\(0, 20\);/);
  assert.match(source, /Show all \$\{total\} results/);
  assert.match(source, /SEARCH_API_VERSION/);
});
