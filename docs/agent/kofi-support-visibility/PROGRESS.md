# Ko-fi support visibility

## Status

- Phase: production visibility correction
- Status: validated locally
- Acceptance criteria: the Loo Finder support card is hidden before a successful result and visible once results exist; Journal and Fare Calculator behaviour remains unchanged.

## Decisions and assumptions

- Preserve the prominent support-card design.
- Add a narrow CSS rule for the existing native `hidden` attribute instead of changing result-state JavaScript.

## Files touched

- `dist/loo/loo.css`
- `tests/kofi-phase3.test.mjs`
- `docs/agent/kofi-support-visibility/PROGRESS.md`
- `docs/agent/kofi-support-visibility/OWNER_TODO.md`

## Verification

- Focused pre-build test: 2 generated-page failures, 1 pass. This established the fresh-checkout baseline.
- Full `npm test`: 157 passed, 0 failed after the production build.

## Open items

- Open the pull request and wait for the exact-head safety check.
- After merge, verify the live English and Italian Loo Finder states.

## Next step

- Release this correction through the standard pull request and Cloudflare pipeline.
