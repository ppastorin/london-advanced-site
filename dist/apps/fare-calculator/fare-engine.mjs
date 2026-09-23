import { FARE_CONFIG } from "./fare-config.mjs";

export function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function ceilToIncrement(value, increment) {
  if (value <= 0) return 0;
  return round2(Math.ceil((value - 1e-9) / increment) * increment);
}

function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.getUTCFullYear() !== Number(match[1]) || date.getUTCMonth() !== Number(match[2]) - 1 || date.getUTCDate() !== Number(match[3])) return null;
  return date;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function mondayKey(date) {
  const weekday = date.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDays(date, offset).toISOString().slice(0, 10);
}

export function validateFareInputs(input, config = FARE_CONFIG) {
  const adults = Number(input?.adults);
  const ages = Array.isArray(input?.ages) ? input.ages.map(Number) : [];
  const days = Number(input?.days);
  const oysterOwned = Number(input?.oysterOwned);

  if (!Number.isInteger(adults) || adults < 0 || adults > 20) return { code: "invalidAdults" };
  if (!ages.every(age => Number.isInteger(age) && age >= 0 && age <= 17) || ages.length > 15) return { code: "invalidAges" };
  if (!parseIsoDate(input?.startDate)) return { code: "invalidDate" };
  if (!Number.isInteger(days) || days < 1 || days > 14) return { code: "invalidDays" };
  if (!Number.isInteger(oysterOwned) || oysterOwned < 0 || oysterOwned > 35) return { code: "invalidOysterCount" };
  if (adults === 0 && ages.length === 0) return { code: "noTravellers" };

  const under11 = ages.filter(age => age <= 10).length;
  if (under11 > 0 && adults === 0) return { code: "under11NeedsAdult" };
  if (under11 > adults * config.freeUnder11PerAdult) {
    return { code: "tooManyUnder11", limit: config.freeUnder11PerAdult };
  }
  if (days > config.youngVisitorMaxDays && ages.some(age => age >= 11 && age <= 15)) {
    return { code: "youngVisitorDuration", limit: config.youngVisitorMaxDays };
  }

  const oysterEligible = adults + ages.filter(age => age >= 11).length;
  if (oysterOwned > oysterEligible) return { code: "tooManyOysterCards", limit: oysterEligible };
  return null;
}

export function paygCappedFare(startDate, days, dailyCap, weeklyCap) {
  const start = typeof startDate === "string" ? parseIsoDate(startDate) : startDate;
  if (!start || days <= 0) return 0;
  const daysByWeek = new Map();

  for (let offset = 0; offset < days; offset += 1) {
    const key = mondayKey(addDays(start, offset));
    daysByWeek.set(key, (daysByWeek.get(key) || 0) + 1);
  }

  let total = 0;
  daysByWeek.forEach(dayCount => {
    total += Math.min(dayCount * dailyCap, weeklyCap);
  });
  return round2(total);
}

export function bestAdultOysterStrategy(startDate, days, config = FARE_CONFIG) {
  const start = typeof startDate === "string" ? parseIsoDate(startDate) : startDate;
  const candidates = [];
  const paygFare = paygCappedFare(start, days, config.adultDailyCap, config.adultWeeklyCap);
  const paygCash = ceilToIncrement(paygFare, config.paygLoadIncrement);
  candidates.push({ code: "oysterPaygCapped", fare: paygFare, cash: paygCash, unused: round2(paygCash - paygFare), priority: 3 });

  if (days <= 7) {
    candidates.push({ code: "oysterTravelcard7", fare: config.adult7DayTravelcard, cash: config.adult7DayTravelcard, unused: 0, priority: 1 });
  } else {
    for (let offset = 0; offset <= days - 7; offset += 1) {
      const beforeFare = paygCappedFare(start, offset, config.adultDailyCap, config.adultWeeklyCap);
      const afterDays = days - offset - 7;
      const afterFare = paygCappedFare(addDays(start, offset + 7), afterDays, config.adultDailyCap, config.adultWeeklyCap);
      const paygOutsidePass = round2(beforeFare + afterFare);
      const paygLoad = paygOutsidePass > 0 ? ceilToIncrement(paygOutsidePass, config.paygLoadIncrement) : 0;
      candidates.push({
        code: paygOutsidePass > 0 ? "oysterTravelcard7Payg" : "oysterTravelcard7",
        fare: round2(config.adult7DayTravelcard + paygOutsidePass),
        cash: round2(config.adult7DayTravelcard + paygLoad),
        unused: round2(paygLoad - paygOutsidePass),
        priority: 2
      });
    }
    candidates.push({ code: "oysterTravelcards2", fare: round2(2 * config.adult7DayTravelcard), cash: round2(2 * config.adult7DayTravelcard), unused: 0, priority: 1 });
  }

  candidates.sort((a, b) => {
    if (Math.abs(a.fare - b.fare) > 0.001) return a.fare - b.fare;
    if (Math.abs(a.cash - b.cash) > 0.001) return a.cash - b.cash;
    if (Math.abs(a.unused - b.unused) > 0.001) return a.unused - b.unused;
    return a.priority - b.priority;
  });
  return candidates[0];
}

function isBetterPlan(candidate, current) {
  if (!current) return true;
  if (Math.abs(candidate.effective - current.effective) > 0.001) return candidate.effective < current.effective;
  if (Math.abs(candidate.cash - current.cash) > 0.001) return candidate.cash < current.cash;
  if (Math.abs(candidate.unused - current.unused) > 0.001) return candidate.unused < current.unused;
  return candidate.oysterCount < current.oysterCount;
}

export function optimiseMixedStrategy(travellers, oysterOwned, config = FARE_CONFIG) {
  const baseContactless = round2(travellers.reduce((total, traveller) => total + traveller.contactless.fare, 0));
  const ranked = travellers.map((traveller, index) => ({
    index,
    savingBeforeCard: round2(traveller.contactless.fare - traveller.oyster.fare)
  })).sort((a, b) => {
    if (Math.abs(a.savingBeforeCard - b.savingBeforeCard) > 0.001) return b.savingBeforeCard - a.savingBeforeCard;
    if (Math.abs(travellers[a.index].oyster.cash - travellers[b.index].oyster.cash) > 0.001) return travellers[a.index].oyster.cash - travellers[b.index].oyster.cash;
    return a.index - b.index;
  });

  let best = null;
  for (let oysterCount = 0; oysterCount <= travellers.length; oysterCount += 1) {
    const chosenRanked = ranked.slice(0, oysterCount);
    const chosen = new Set(chosenRanked.map(item => item.index));
    const rawSaving = chosenRanked.reduce((total, item) => total + item.savingBeforeCard, 0);
    const ownedUsed = Math.min(oysterOwned, oysterCount);
    const newCards = Math.max(0, oysterCount - ownedUsed);
    const cardCost = round2(newCards * config.oysterCardCost);
    const effective = round2(baseContactless - rawSaving + cardCost);
    let cash = cardCost;
    let unused = 0;
    travellers.forEach((traveller, index) => {
      if (chosen.has(index)) {
        cash += traveller.oyster.cash;
        unused += traveller.oyster.unused;
      } else {
        cash += traveller.contactless.fare;
      }
    });
    const candidate = { chosen, effective, cash: round2(cash), unused: round2(unused), oysterCount, ownedUsed, newCards, cardCost };
    if (isBetterPlan(candidate, best)) best = candidate;
  }

  const chosenIndices = Array.from(best.chosen);
  const existingCardIndices = new Set(chosenIndices.slice().sort((a, b) => {
    const aSaving = travellers[a].contactless.fare - travellers[a].oyster.fare;
    const bSaving = travellers[b].contactless.fare - travellers[b].oyster.fare;
    if (Math.abs(aSaving - bSaving) > 0.001) return aSaving - bSaving;
    return a - b;
  }).slice(0, best.ownedUsed));

  const recommendations = travellers.map((traveller, index) => {
    if (!best.chosen.has(index)) {
      return { ...traveller, recommended: "contactless", effectiveCost: traveller.contactless.fare, cashRequired: traveller.contactless.fare, unusedCredit: 0, usesExistingOyster: false, newOysterCard: false };
    }
    const usesExistingOyster = existingCardIndices.has(index);
    const newOysterCard = !usesExistingOyster;
    const cardCost = newOysterCard ? config.oysterCardCost : 0;
    return {
      ...traveller,
      recommended: "oyster",
      effectiveCost: round2(traveller.oyster.fare + cardCost),
      cashRequired: round2(traveller.oyster.cash + cardCost),
      unusedCredit: traveller.oyster.unused,
      usesExistingOyster,
      newOysterCard
    };
  });
  return { ...best, recommendations };
}

export function calculateFarePlan(input, config = FARE_CONFIG) {
  const validationError = validateFareInputs(input, config);
  if (validationError) return { ok: false, error: validationError };

  const startDate = parseIsoDate(input.startDate);
  const adultContactlessFare = paygCappedFare(startDate, input.days, config.adultDailyCap, config.adultWeeklyCap);
  const adultOyster = bestAdultOysterStrategy(startDate, input.days, config);
  const youngVisitorFare = paygCappedFare(startDate, input.days, config.youngVisitorDailyCap, config.youngVisitorWeeklyCap);
  const youngVisitorCash = ceilToIncrement(youngVisitorFare, config.paygLoadIncrement);
  const paidTravellers = [];
  const freeTravellers = [];

  for (let index = 0; index < input.adults; index += 1) {
    paidTravellers.push({
      id: `adult-${index + 1}`,
      kind: "adult",
      index,
      contactless: { fare: adultContactlessFare, strategyCode: "contactlessAdultCapped" },
      oyster: { ...adultOyster, strategyCode: adultOyster.code }
    });
  }

  input.ages.forEach((age, index) => {
    if (age <= 10) {
      freeTravellers.push({ id: `child-${index + 1}`, kind: "child", index, age, free: true });
    } else if (age <= 15) {
      paidTravellers.push({
        id: `child-${index + 1}`,
        kind: "child",
        index,
        age,
        contactless: { fare: adultContactlessFare, strategyCode: "contactlessAdultRate" },
        oyster: { fare: youngVisitorFare, cash: youngVisitorCash, unused: round2(youngVisitorCash - youngVisitorFare), strategyCode: "youngVisitor" }
      });
    } else {
      paidTravellers.push({
        id: `child-${index + 1}`,
        kind: "child",
        index,
        age,
        contactless: { fare: adultContactlessFare, strategyCode: "contactlessAdultCapped" },
        oyster: { ...adultOyster, strategyCode: adultOyster.code }
      });
    }
  });

  const mixed = optimiseMixedStrategy(paidTravellers, input.oysterOwned, config);
  const allContactless = round2(paidTravellers.reduce((total, traveller) => total + traveller.contactless.fare, 0));
  const allOysterUsers = paidTravellers.length;
  const allOysterOwnedUsed = Math.min(input.oysterOwned, allOysterUsers);
  const allOysterNewCards = Math.max(0, allOysterUsers - allOysterOwnedUsed);
  const allOysterCardCost = round2(allOysterNewCards * config.oysterCardCost);
  const allOysterFare = round2(paidTravellers.reduce((total, traveller) => total + traveller.oyster.fare, 0));
  const allOysterCash = round2(paidTravellers.reduce((total, traveller) => total + traveller.oyster.cash, 0));
  const allOysterUnused = round2(paidTravellers.reduce((total, traveller) => total + traveller.oyster.unused, 0));

  return {
    ok: true,
    input,
    recommendations: mixed.recommendations.concat(freeTravellers),
    mixed,
    allContactless,
    allOyster: {
      effective: round2(allOysterFare + allOysterCardCost),
      cash: round2(allOysterCash + allOysterCardCost),
      unused: allOysterUnused,
      users: allOysterUsers,
      ownedUsed: allOysterOwnedUsed,
      newCards: allOysterNewCards,
      cardCost: allOysterCardCost
    }
  };
}

