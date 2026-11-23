# London Advanced Growth Intelligence

## Phase status

- Phase 0: completed. Baseline and measurement caveats are recorded in the Growth Intelligence workbook.
- Phase 1: implemented locally on 2026-11-23, pending PR CI, merge and production verification.
- Phase 3A: previously completed outside this release; no changes in this phase.

## Phase 1 acceptance criteria

- Every eligible public EN/IT generated HTML page loads exactly one shared analytics module.
- GA4 loads only after affirmative consent, sends an initial page view and does not load after refusal.
- The Cloudflare beacon remains independent of GA4 consent, as documented in the privacy notice.
- Existing link and WTM event labels remain available only with GA4 consent.
- Studio, noindex previews, redirects and the 404 page are excluded.
- Full `npm test`, focused analytics checks, exact-head CI and live asset/page verification succeed.

## Decisions and assumptions

- Reuse the configured measurement ID `G-3ZQEZ6R171`; the owner has not confirmed which of the two GA4 properties is authoritative. Do not combine property totals.
- Embed the existing analytics settings from `dist/content.js` in the shared generated asset; do not alter identifiers or property settings.
- Keep Cloudflare's existing consent-independent behaviour and the existing choice key `la-analytics-consent`.
- Use the prerender pass for public route coverage so new EN/IT articles and tools receive the same loader automatically.

## Verification

- Phase 0 defects: disabled homepage page views, repeated initialisation and incomplete public page coverage (three classes).
- Phase 1 local check: 96 of 96 eligible pages, zero failures.
- Full tests: 175 passed, zero failed. Final CI and live verification pending.

## Files touched

- Shared source and built assets: `analytics.js`, `analytics.css`, `dist/analytics.js`, `dist/analytics.css`.
- Runtime and build: `app.js`, `dist/app.js`, `dist/tool-page.js`, `wtm.js`, `wtm-operator.js`, `legal.js`, generated counterparts, `scripts/prerender.mjs`, `scripts/build-italian.mjs`.
- Generated public HTML pages, tests and `scripts/agent/` checks.

## Open items and next step

- Owner property mapping and independent Cloudflare access remain in `OWNER_TODO.md`.
- Open Phase 1 PR, verify exact-head Site safety checks, merge, verify Cloudflare production and update this record. Stop after Phase 1.
