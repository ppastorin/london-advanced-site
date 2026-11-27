---
name: la-markets-refresh
description: Research, validate and publish London Advanced Markets Calendar updates. Use for scheduled or manual market refreshes, new market discovery, date or recurrence corrections, holiday exceptions, bilingual market copy, source rechecks, and markets production releases.
---

# Markets refresh

Refresh the existing evidence-based calendar. Never rebuild it from the initial seed.

## Start from canonical state

1. Read `AGENTS.md`, `content/markets.json`, `docs/agent/markets-calendar/PROGRESS.md`,
   `tests/markets.test.mjs`, `markets/engine.mjs` and `scripts/build-markets.mjs` from the
   current `main` branch.
2. Treat `content/markets.json` as the source of truth. The files under
   `scripts/quarantine/markets-initial/` are historical bootstrap artefacts and must not
   be executed, copied back or used to overwrite later research.
3. Work in batches of at most ten series. Maintain the coming three full calendar months
   and retain every later explicitly announced date.

## Research with primary evidence

- Recheck each existing series through its saved organiser, venue or council URL before
  changing its `checked` date. Discover additions through official organiser and venue
  calendars, not directories, stale snippets or last-year listings.
- Include flea, vintage, antique, car-boot, farmers, producer, craft and maker markets in
  Greater London. Treat flower and specialist-food markets as separate optional
  categories. Include an outside-London venue only when geographic eligibility and TfL
  zone 1 to 4 access are verified for that venue; never assign a zone from a postcode.
- Keep announced dates separate from calculated recurrence. Advance recurrence bounds
  only after checking seasonal rules. Use occurrence overrides for changed venues or
  hours and preserve cancellations, exclusions and winter closures.
- Check Christmas and New Year exceptions individually. Unknown hours, prices, locations
  or access remain unknown. Use visitor hours and admission prices, not seller setup
  times or pitch fees.
- Retain the previous `checked` date and stale state when a source cannot be checked. Do
  not update the feed timestamp until the complete research pass finishes.
- Hold malformed, conflicting, duplicate or overlapping listings until resolved. Never
  infer dates from a recurrence when the official source announces exceptions.

## Write and validate

1. Preserve proper names and write short original summaries in English and native
   Italian. Use only owned or authorised market photographs with matching venue evidence
   and credits; otherwise retain the labelled category illustration.
2. Record a concise change log and unresolved-source list in the task state. If nothing
   substantive changed, stop without producing an empty release.
3. Run the focused market tests while iterating, then the full `npm test`. Verify the
   generated EN/IT pages, data, date engine, search, sitemap, language pairing,
   navigation and relevant crosslinks.

## Publish

Follow `la-safe-deployment`. Commit the canonical source and every generated deployment
asset produced from it in the same change. After the exact-head checks, merge and
Cloudflare build succeed, verify both live language routes plus the exact market data and
changed asset bytes. Report series and occurrence counts, coverage bounds, stale sources,
held listings and unresolved exceptions.
