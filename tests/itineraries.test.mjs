import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isPublicItineraryPair, renderItineraryDetail } from "../scripts/build-itineraries.mjs";

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

test("the Wimbledon itinerary is paired, approved and published in both languages", async () => {
  const [english, italian, englishIndex, italianIndex] = await Promise.all([
    readFile(new URL("../content/itineraries/wimbledon-without-tennis.en.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../content/itineraries/wimbledon-without-tennis.it.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../dist/itineraries/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/it/itinerari/index.html", import.meta.url), "utf8")
  ]);
  assert.equal(english.itinerary_id, italian.itinerary_id);
  assert.equal(english.editorial_status, "published");
  assert.equal(english.approval.status, "approved");
  assert.equal(english.approval.approved_by, "Paolo Pastorino");
  assert.ok(english.approval.approved_at);
  assert.ok(english.published_at);
  assert.equal(isPublicItineraryPair(english, italian), true);
  assert.equal(english.stops.length, 5);
  assert.equal(english.best_day, "any-day");
  assert.equal(english.google_maps_url, italian.google_maps_url);
  assert.match(english.google_maps_url, /Wimbledon\+Village\+Clock\+Tower/);
  assert.ok(english.images.every(image => image.src.startsWith("/assets/itineraries/")));
  assert.ok(english.map.src.startsWith("/assets/itineraries/"));
  assert.equal(english.theme, "sacred-gardens-local-history");
  assert.ok(english.stops.every(stop => stop.location_id));
  assert.ok(english.stops.every(stop => stop.place_url?.startsWith("https://www.google.com/maps/")));
  assert.ok(italian.stops.every(stop => stop.place_url?.startsWith("https://www.google.com/maps/")));
  assert.match(english.pace_note, /times are indicative/i);
  assert.match(italian.pace_note, /orari sono indicativi/i);
  assert.match(englishIndex, /Wimbledon Without Tennis/);
  assert.match(italianIndex, /Wimbledon senza tennis/);
});

test("published itinerary pages expose the full route, every location and the pace note", async () => {
  const [englishData, italianData] = await Promise.all([
    readFile(new URL("../content/itineraries/wimbledon-without-tennis.en.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../content/itineraries/wimbledon-without-tennis.it.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  const english = renderItineraryDetail({ ...englishData, locale: "en" }, italianData, new Map(), false);
  const italian = renderItineraryDetail({ ...italianData, locale: "it" }, englishData, new Map(), false);
  assert.match(english, /Open the route in Google Maps/);
  assert.match(italian, /Apri l’itinerario in Google Maps/);
  assert.equal((english.match(/Open this location/g) || []).length, 5);
  assert.equal((italian.match(/Apri questo luogo/g) || []).length, 5);
  assert.match(english, /The times are indicative/);
  assert.match(italian, /Gli orari sono indicativi/);
  assert.match(english, /Wimbledon\+Village\+Clock\+Tower/);
  assert.match(italian, /Wimbledon\+Village\+Clock\+Tower/);
  assert.doesNotMatch(english, /Unpublished itinerary preview/);
  assert.doesNotMatch(italian, /Anteprima itinerario non pubblicata/);
});

test("the Wimbledon itinerary and Buddhapadipa article link to each other", async () => {
  const [englishItinerary, italianItinerary, englishArticle, italianArticle] = await Promise.all([
    readFile(new URL("../dist/itineraries/wimbledon-without-tennis/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/it/itinerari/wimbledon-senza-tennis/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/journal/buddhapadipa-temple-wimbledon-visit/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/it/journal/buddhapadipa-temple-wimbledon-visita/index.html", import.meta.url), "utf8")
  ]);
  assert.match(englishItinerary, /\/journal\/buddhapadipa-temple-wimbledon-visit\//);
  assert.match(italianItinerary, /\/it\/journal\/buddhapadipa-temple-wimbledon-visita\//);
  assert.match(englishArticle, /\/itineraries\/wimbledon-without-tennis\//);
  assert.match(italianArticle, /\/it\/itinerari\/wimbledon-senza-tennis\//);
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
