export const FARE_CONFIG = Object.freeze({
  version: "2026-09-23",
  zonesLabel: "Zones 1–2",
  fareLastChecked: "23 September 2026",
  oysterCardCost: 10.5,
  paygLoadIncrement: 5,
  adultDailyCap: 8.9,
  adultWeeklyCap: 44.7,
  adult7DayTravelcard: 44.7,
  youngVisitorDiscount: 0.5,
  youngVisitorDailyCap: 4.45,
  youngVisitorWeeklyCap: 22.35,
  youngVisitorMaxDays: 14,
  freeUnder11PerAdult: 4,
  sources: Object.freeze({
    fares: "https://content.tfl.gov.uk/adult-fares.pdf",
    caps: "https://tfl.gov.uk/fares/find-fares/capping",
    visitors: "https://tfl.gov.uk/travel-information/visiting-london/getting-around-london/best-ways-for-visitors-to-pay",
    visitorOyster: "https://tfl.gov.uk/travel-information/visiting-london/visitor-oyster-card",
    children: "https://tfl.gov.uk/fares/free-and-discounted-travel"
  })
});

