import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const feed = JSON.parse(await readFile("dist/data/events.json", "utf8"));
const referenceTime = Date.parse(feed.generated_at);
const activeEvents = feed.events.filter(event =>
  event.publication_status === "approved" &&
  Number.isInteger(event.advanced?.score) && event.advanced.score >= 7 &&
  Date.parse(event.publish_at) <= referenceTime &&
  Date.parse(event.expire_at) > referenceTime
);

test("search indexes every current event in both languages with a stable deep link", async () => {
  for (const locale of ["en", "it"]) {
    const index = JSON.parse(await readFile(`dist/data/search-index.${locale}.json`, "utf8"));
    const records = index.records.filter(record => record.type === "event");
    const route = locale === "it" ? "/it/eventi/" : "/events/";

    assert.equal(records.length, activeEvents.length);
    for (const event of activeEvents) {
      const record = records.find(candidate => candidate.id === `event:${event.id}:${locale}`);
      assert.ok(record, `${locale} search index is missing ${event.id}`);
      assert.equal(record.url, `${route}#event-${event.id}`);
      assert.equal(record.expires_at, event.expire_at);
      assert.ok(record.keywords.includes(event.venue.name));
    }
  }
});

test("event pages expose every search destination as an anchor", async () => {
  const [english, italian] = await Promise.all([
    readFile("dist/events/index.html", "utf8"),
    readFile("dist/it/eventi/index.html", "utf8")
  ]);
  for (const event of activeEvents) {
    const anchor = `id="event-${event.id}"`;
    assert.ok(english.includes(anchor), `English events page is missing ${anchor}`);
    assert.ok(italian.includes(anchor), `Italian events page is missing ${anchor}`);
  }
});

test("the browser removes expired event records and the Italian event renderer works", async () => {
  const [searchScript, italianEventsScript] = await Promise.all([
    readFile("dist/search.js", "utf8"),
    readFile("dist/it/eventi/events.js", "utf8")
  ]);
  assert.match(searchScript, /Date\.parse\(record\.expires_at\) > Date\.now\(\)/);
  assert.doesNotMatch(italianEventsScript, /evento\.publication_status|for \(const evento of eventos\)|No current eventos|verificatio/);

  const executable = italianEventsScript.replace(
    /\ndocument\.querySelector\("\[data-facebook-link\]"\)[\s\S]*$/,
    "\nwindow.__TEST__ = { activeEvents, renderGroups };"
  );
  const context = { window: { LONDON_ADVANCED: {} }, URL, URLSearchParams, Intl, Date, console };
  vm.createContext(context);
  vm.runInContext(executable, context, { filename: "dist/it/eventi/events.js" });
  const renderedEvents = context.window.__TEST__.activeEvents(feed, new Date(feed.generated_at));
  assert.equal(renderedEvents.length, activeEvents.length);
  assert.match(context.window.__TEST__.renderGroups(renderedEvents), /id="event-/);
});
