# London Advanced Growth Intelligence

## Current phase state

- Phase 0 baseline: complete. The Growth Intelligence workbook contains the preserved
  baseline and measurement caveats.
- Phase 1 measurement repair: deployed through PR #170, merge
  `89b83da2ab7a71d9a0aaf28be7f7d9f408a20586`. Consent controls, page-view collection and
  eligible EN/IT route coverage were verified in production.
- Phase 2A search landing pages: deployed through PR #172, merge
  `60aac6edf873073e7ee17347889db7eed2fa1328`. Six English landing pages were verified live.
- Phase 2A consent-aware tool events: deployed through PR #173, merge
  `3ba95248a02f8de8438725942de2c5828bbcead3`. The three scoped event implementations and
  privacy constraints pass repository tests.
- Phase 3A: previously completed outside these releases; no current action is attached to
  this phase.

## Active constraints

- The next decision point is the scheduled Phase 2 measurement review. Its scope and dated
  inputs are in `reviews/2026-12-21-phase-2.md`.
- The six Phase 2A pages remain frozen until that review except for factual errors, broken
  pages or material legal risk.
- No post-review page revision or Phase 2B journey instrumentation is approved yet.
- Production and legacy GA4 reporting must remain separate.
- Independent Cloudflare Web Analytics comparison remains blocked by access or export.

## Verified implementation state

- Shared consent-aware analytics covers eligible public English and Italian pages while
  excluding Studio, noindex previews, redirects and the 404 page.
- Cloudflare beacon collection remains independent of the GA4 consent choice, as documented
  in the privacy notice.
- `fare_calculation_completed`, `loo_nearby_search_started` and
  `loo_place_search_completed` contain bounded journey metadata and no raw search or
  location values.

## Next step

- Run the dated Phase 2 measurement review, update its evidence and the Growth Intelligence
  workbook, then seek approval for any resulting implementation.
- Keep owner-only GA4 administration and Cloudflare access work in `OWNER_TODO.md`.
