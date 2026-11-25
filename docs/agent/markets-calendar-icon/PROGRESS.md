# Markets Calendar homepage icon

Phase: production bug fix.
Status: implementation prepared on 25 November 2026.
Branch: fix/markets-calendar-icon.

Acceptance criteria:
- The Markets Calendar card renders a calendar SVG instead of the text undefined on the English homepage.
- The same card renders correctly on the Italian homepage.
- A regression test fails when any configured homepage tool lacks an icon in either language bundle.
- Site safety checks pass for the exact pull request head before merge.
- Cloudflare production deployment completes and both live homepages are verified.

Decisions:
- Reuse the calendar SVG already present in the canonical root app bundle.
- Fix the English production bundle, the generated Italian bundle and the original integration guard.
- Add one mapping completeness test instead of a one-off string assertion.

Files touched: dist/app.js, dist/it/app.js, tests/markets.test.mjs, scripts/agent/integrate-markets.mjs, this file, OWNER_TODO.md.
Check failures before: 2 production bundles lacked the configured calendar icon.
Check failures after: pending pull request CI and live verification.
Open items: none for the owner.
Next step: open the pull request, wait for exact-head CI, merge, then verify production.
