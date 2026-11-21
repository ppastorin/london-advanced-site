# December flea market audit

## Phase status

- Phase 1: implementation and local validation complete, production publication pending.

## Acceptance criteria

- Add only Greater London flea, antiques and vintage markets backed by an organiser, venue or council source.
- Cover confirmed December 2026 dates and published recurring schedules through the feed coverage end.
- Keep recurring events inside the existing holiday uncertainty hold.
- Provide English and Italian summaries, source links, venues and verified hours.
- Pass the focused markets check, the full test suite and the production deployment checks.

## Decisions and assumptions

- Permanent shops and indoor retail arcades without event days are excluded.
- Separate events at the same venue are retained when the venue publishes them as distinct markets.
- Camden Passage uses the published Pierrepont Arcade schedule because its official page supplies day-specific hours.
- Bermondsey uses the current council listing time of 07:00 to 14:00.
- The malformed end year on the So Last Century organiser page is resolved by the venue's two dated event pages.
- The focused acceptance check started with 13 expected failures and now has none.

## Open items

- Publish through the protected pull request workflow and verify the live pages and feed.

## Files touched

- `docs/agent/market-december-audit/PROGRESS.md`
- `docs/agent/market-december-audit/OWNER_TODO.md`
- `tests/markets.test.mjs`
- `scripts/agent/check-markets.mjs`
- `content/markets.json`
- `dist/data/markets.json`
- `dist/markets/index.html`
- `dist/it/strumenti/mercati/index.html`

## Verification

- Focused acceptance check: 13 failures before, 0 after.
- Full suite: 172 tests passed.
- Build: 92 market series and 913 occurrences generated.
- December flea coverage: 20 series and 70 occurrences.
- Wrangler production-package dry run: passed with 1,161 assets.

## Next step

- Open the release pull request, wait for the exact-head safety check, merge and verify Cloudflare production.
