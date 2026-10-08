import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isPublicItineraryPair } from "../scripts/build-itineraries.mjs";

const approved = {
  itinerary_id: "test-itinerary",
  editorial_status: "published",
  published_at: "2026-10-08T10:00:00+01:00",
  approval: {
    status: "approved",
    approved_by: "Paolo Pastorino",
    approved_at: "2026-10-08T09:55:00+01:00"
  }
};

test("itinerary publication requires a fully approved bilingual pair", () => {
  assert.equal(isPublicItineraryPair(approved, approved), true);
  assert.equal(isPublicItineraryPair({ ...approved, editorial_status: "review" }, approved), false);
  assert.equal(isPublicItineraryPair({ ...approved, approval: { ...approved.approval, approved_at: "" } }, approved), false);
  assert.equal(isPublicItineraryPair(approved, null), false);
});

test("the Wimbledon pilot is paired, classified and remains unpublished", async () => {
  const [english, italian, englishIndex, italianIndex] = await Promise.all([
    readFile(new URL("../content/itineraries/wimbledon-without-tennis.en.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../content/itineraries/wimbledon-without-tennis.it.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../dist/itineraries/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/it/itinerari/index.html", import.meta.url), "utf8")
  ]);
  assert.equal(english.itinerary_id, italian.itinerary_id);
  assert.equal(english.editorial_status, "review");
  assert.equal(isPublicItineraryPair(english, italian), false);
  assert.equal(english.stops.length, 5);
  assert.equal(english.best_day, "any-day");
  assert.equal(english.google_maps_url, italian.google_maps_url);
  assert.match(english.google_maps_url, /Wimbledon\+Village\+Clock\+Tower/);
  assert.ok(english.images.every(image => image.src.startsWith("/assets/itineraries/")));
  assert.ok(english.map.src.startsWith("/assets/itineraries/"));
  assert.equal(english.theme, "sacred-gardens-local-history");
  assert.ok(english.stops.every(stop => stop.location_id));
  assert.doesNotMatch(englishIndex, /Wimbledon Without Tennis/);
  assert.doesNotMatch(italianIndex, /Wimbledon senza tennis/);
});

test("itinerary indexes provide bilingual metadata and client-side discovery controls", async () => {
  const [english, italian, script] = await Promise.all([
    readFile(new URL("../dist/itineraries/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/it/itinerari/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/itineraries.js", import.meta.url), "utf8")
  ]);
  assert.match(english, /data-itinerary-search/);
  assert.match(italian, /data-itinerary-search/);
  assert.match(english, /hreflang="it-IT"/);
  assert.match(italian, /hreflang="en-GB"/);
  assert.match(script, /data-itinerary-card/);
});
