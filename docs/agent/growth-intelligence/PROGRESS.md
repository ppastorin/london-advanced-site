# London Advanced Growth Intelligence

## Phase status

- Phase 0: completed. Baseline and measurement caveats are recorded in the Growth Intelligence workbook.
- Phase 1: completed and deployed on 2026-11-23 through PR #170, merge `89b83da2ab7a71d9a0aaf28be7f7d9f408a20586`.
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
- Full tests: 175 passed, zero failed. `Site safety checks` succeeded for exact PR head `b4ce1e8afcb018e5dcbf36c199969585b97df095`. Cloudflare Workers Builds succeeded for the merge commit. Live analytics assets and EN/IT representative pages matched.

## Files touched

- Shared source and built assets: `analytics.js`, `analytics.css`, `dist/analytics.js`, `dist/analytics.css`.
- Runtime and build: `app.js`, `dist/app.js`, `dist/tool-page.js`, `wtm.js`, `wtm-operator.js`, `legal.js`, generated counterparts, `scripts/prerender.mjs`, `scripts/build-italian.mjs`.
- Generated public HTML pages, tests and `scripts/agent/` checks.

## Open items and next step

- Owner property mapping and independent Cloudflare access remain in `OWNER_TODO.md`.
- Phase 1 is complete. Stop here. Phase 3A was not repeated.
