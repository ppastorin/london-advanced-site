# Ko-fi CTA placement

## Status

- Phase: homepage and article visibility
- Status: validated locally

## Acceptance criteria

- English and Italian homepages show one prominent support section after the free tools and before the events feed.
- Every generated article shows one support CTA in the opening header, before the practical summary.
- Ko-fi links use the central URL, open in a new tab and retain `noopener noreferrer`.
- Footer, guide, newsletter and tool behaviour remain unchanged.
- Desktop and narrow layouts remain readable without overflow.

## Decisions

- Retain the existing footer link as a secondary fallback because it is shared across the site.
- Move the article CTA from the end of the page into the right-hand header column above “At a glance” or “In breve”.
- Use existing typography, colours and button styles. No widget, script, dependency or analytics change.

## Files touched

- `dist/app.js`
- `dist/styles.css`
- `scripts/build-italian.mjs`
- `scripts/build-journal.mjs`
- `journal.css`
- `tests/kofi-phase1.test.mjs`
- `tests/kofi-phase2.test.mjs`
- `docs/agent/kofi-cta-placement/PROGRESS.md`
- `docs/agent/kofi-cta-placement/OWNER_TODO.md`

## Verification

- Focused Ko-fi tests: 8 passed, 0 failed.
- Full `npm test`: 158 passed, 0 failed.
- Managed visual preview: unavailable because this repository has no Sites development script or hosting manifest. Production visual verification remains required after deployment.

## Open items

- Open and merge a dedicated pull request after exact-head CI passes.
- Verify the live English and Italian homepage and article placements.

## Next step

- Release through the standard pull request and Cloudflare pipeline.
