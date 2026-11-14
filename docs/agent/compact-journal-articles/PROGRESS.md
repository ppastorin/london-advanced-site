# Compact Journal articles

## Status

- Phase: desktop article template redesign
- Status: validated locally

## Acceptance criteria

- Desktop article heroes are capped at 540px and use substantially less viewport height.
- Desktop title, header, content and section spacing are more compact.
- Layout changes apply only above the existing 980px desktop breakpoint, so mobile remains unchanged.
- English and Italian articles retain the desktop and mobile menus, Ko-fi CTA, practical links, language link and footer.
- The full test suite and the dedicated layout check pass before release.

## Decisions

- Change the shared Journal stylesheet only, so all current and future bilingual articles inherit the redesign.
- Use a desktop-only media query rather than altering the mobile rules that already work.
- Keep the existing content width and sticky author rail to preserve comfortable reading line length.

## Files touched

- `journal.css`
- `scripts/agent/check-journal-article-layout.mjs`
- `tests/journal.test.mjs`
- `docs/agent/compact-journal-articles/PROGRESS.md`
- `docs/agent/compact-journal-articles/OWNER_TODO.md`

## Verification

- Pre-change compact-layout check: 2 failures.
- Full `npm test`: 159 passed, 0 failed.
- Dedicated Journal layout check: passed for English and Italian articles.
- Browser rendering could not reach the executor-local preview across the isolated browser boundary. Production visual verification remains required after deployment.

## Open items

- None.

## Next step

- Release through the pull request pipeline, then verify production.
