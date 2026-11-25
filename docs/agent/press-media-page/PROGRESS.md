# Press and media page

## Status

- Phase: complete, awaiting release
- Branch: `feat/press-media-page`
- Baseline focused check: 4 failures
- Final focused check: 0 failures
- Full test suite: 181 passed, 0 failed

## Acceptance criteria

- Publish factual English and Italian press pages at `/press/` and `/it/stampa/`.
- Cover the editorial mission, platform innovations, guide, audience and scale, original photography, and media contact route.
- Add the page to desktop and mobile project navigation.
- Replace the homepage Contact menu button with a dependable anchor.
- Include canonical, reciprocal hreflang, structured data, responsive layout, sitemap discovery and regression checks.
- Pass the focused check and full `npm test` before release.

## Decisions

- Use the existing site design, map, guide cover and original journal photography.
- Publish the defensible 2,500+ Facebook community figure and platform scale facts. Do not publish weak or volatile GA4 and Instagram figures.
- Keep media enquiries on the existing contact form. Do not expose a private email address.
- Place Press and media inside the Project menu to avoid crowding the primary navigation.
- Replace Contact buttons with anchors so the fix does not depend on missing JavaScript binding.
- Managed browser preview was unavailable because this repository has no Sites preview manifest or `dev` script. Static validation and the full suite passed.

## Files touched

- `scripts/agent/check-press-page.mjs`
- `docs/agent/press-media-page/PROGRESS.md`
- `docs/agent/press-media-page/OWNER_TODO.md`
- `scripts/build-press-pages.mjs`
- `press.css`
- `tests/press-page.test.mjs`
- Navigation and generated deployment assets across EN and IT routes

## Next step

- Commit, open the pull request, wait for the exact-head safety check, merge and verify production.
