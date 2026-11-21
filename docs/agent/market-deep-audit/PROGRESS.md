# Deep London market audit

## Scope

Audit December 2026 date by date across organiser calendars, venue programmes, councils and ticketing pages. Add a maximum batch of ten verified missing market series and correct misleading aggregator labels.

## Acceptance checks

- Ten newly verified series exist in the bilingual feed with source links, dates, times, venues and specific descriptions.
- Copeland Park on 12 December is named DIY Christmas Art Market.
- Peckham Salvage Yard is listed only on its announced 17 January 2027 date.
- The uncorroborated Go East Walthamstow listing is not published.
- Generated English and Italian pages expose the refreshed feed.
- Full tests, deployment dry run, exact-head CI and production checks pass.

## Progress

- 2026-11-21: Date-by-date research completed for the first ten-record batch.
- 2026-11-21: Focused regression expectations added before data changes.
- 2026-11-21: Baseline acceptance check reported ten missing records.
- 2026-11-21: Added ten verified series and eleven dated occurrences. The focused check now reports zero failures and all twelve market tests pass.
- 2026-11-21: Full suite passed with 172 tests. Wrangler dry run read 1,161 deployment files successfully.
