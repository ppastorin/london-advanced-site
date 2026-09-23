import test from "node:test";
import assert from "node:assert/strict";
import { FARE_CONFIG } from "../apps/fare-calculator/fare-config.mjs";
import { bestAdultOysterStrategy, calculateFarePlan, paygCappedFare, validateFareInputs } from "../apps/fare-calculator/fare-engine.mjs";

test("published 2026 fare configuration is internally consistent", () => {
  assert.equal(FARE_CONFIG.oysterCardCost, 10.5);
  assert.equal(FARE_CONFIG.adultDailyCap, 8.9);
  assert.equal(FARE_CONFIG.adultWeeklyCap, 44.7);
  assert.equal(FARE_CONFIG.adult7DayTravelcard, 44.7);
  assert.equal(FARE_CONFIG.youngVisitorDailyCap, FARE_CONFIG.adultDailyCap / 2);
  assert.equal(FARE_CONFIG.youngVisitorWeeklyCap, FARE_CONFIG.adultWeeklyCap / 2);
  assert.equal(FARE_CONFIG.fareLastChecked, "23 September 2026");
});

test("adult PAYG applies the Monday-Sunday cap", () => {
  assert.equal(paygCappedFare("2026-09-21", 7, 8.9, 44.7), 44.7);
  assert.equal(paygCappedFare("2026-09-23", 7, 8.9, 44.7), 62.3);
});

test("adult Oyster selects a consecutive 7 Day Travelcard when it beats split-week capping", () => {
  const strategy = bestAdultOysterStrategy("2026-09-23", 7);
  assert.equal(strategy.code, "oysterTravelcard7");
  assert.equal(strategy.fare, 44.7);
});

test("Young Visitor pricing includes half-rate weekly capping", () => {
  const mondayTrip = calculateFarePlan({ adults: 1, ages: [13], startDate: "2026-09-21", days: 7, oysterOwned: 1 });
  const young = mondayTrip.recommendations.find(row => row.age === 13);
  assert.equal(young.oyster.fare, 22.35);

  const splitWeekTrip = calculateFarePlan({ adults: 1, ages: [13], startDate: "2026-09-23", days: 7, oysterOwned: 1 });
  const splitWeekYoung = splitWeekTrip.recommendations.find(row => row.age === 13);
  assert.equal(splitWeekYoung.oyster.fare, 31.15);
});

test("family example assigns an existing Oyster to the 13-year-old", () => {
  const result = calculateFarePlan({ adults: 2, ages: [10, 13], startDate: "2026-09-23", days: 5, oysterOwned: 1 });
  assert.equal(result.ok, true);
  assert.equal(result.mixed.effective, 111.25);
  assert.equal(result.allContactless, 133.5);
  const ten = result.recommendations.find(row => row.age === 10);
  const thirteen = result.recommendations.find(row => row.age === 13);
  assert.equal(ten.free, true);
  assert.equal(thirteen.recommended, "oyster");
  assert.equal(thirteen.usesExistingOyster, true);
  assert.equal(thirteen.oyster.fare, 22.25);
});

test("a child Oyster purchase includes the current card fee and estimated load", () => {
  const result = calculateFarePlan({ adults: 1, ages: [13], startDate: "2026-09-23", days: 5, oysterOwned: 0 });
  const young = result.recommendations.find(row => row.age === 13);
  assert.equal(young.newOysterCard, true);
  assert.equal(young.effectiveCost, 32.75);
  assert.equal(young.cashRequired, 35.5);
});

test("16 and 17 year olds use adult fares in this model", () => {
  const result = calculateFarePlan({ adults: 0, ages: [16, 17], startDate: "2026-09-21", days: 5, oysterOwned: 0 });
  assert.equal(result.ok, true);
  for (const row of result.recommendations) assert.equal(row.contactless.fare, 44.5);
});

test("validation enforces accompanied under-11 limits and input boundaries", () => {
  assert.equal(validateFareInputs({ adults: 0, ages: [8], startDate: "2026-09-21", days: 2, oysterOwned: 0 }).code, "under11NeedsAdult");
  assert.equal(validateFareInputs({ adults: 1, ages: [5, 6, 7, 8, 9], startDate: "2026-09-21", days: 2, oysterOwned: 0 }).code, "tooManyUnder11");
  assert.equal(validateFareInputs({ adults: 1, ages: [], startDate: "bad", days: 2, oysterOwned: 0 }).code, "invalidDate");
  assert.equal(validateFareInputs({ adults: 1, ages: [], startDate: "2026-09-21", days: 15, oysterOwned: 0 }).code, "invalidDays");
});

