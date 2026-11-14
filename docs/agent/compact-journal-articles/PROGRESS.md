# Compact Journal articles

## Status

- Phase: desktop article opening correction
- Status: validated locally

## Acceptance criteria

- Desktop title, complete hero image and practical panel share one compact opening grid.
- Hero images retain their full aspect ratio and are never cropped on desktop.
- The first article paragraph begins materially higher than in the previous production template.
- Desktop title, header, support panel and content spacing are compact.
- Layout changes apply only above the existing 980px desktop breakpoint, so mobile remains unchanged.
- English and Italian articles retain the desktop and mobile menus, Ko-fi CTA, practical links, language link and footer.
- The full test suite and the dedicated layout check pass before release.

## Decisions

- Change the shared Journal renderer and stylesheet so all current and future bilingual articles inherit the redesign.
- Place the hero figure inside the existing semantic article header so the three-column layout needs no wrapper or `display: contents` workaround.
- Use a three-column desktop opening for the heading, uncropped hero and support/practical panel.
- Keep the existing document order and mobile rules so the mobile flow remains unchanged.
- Keep the existing content width and sticky author rail to preserve comfortable reading line length.

## Files touched

- `journal.css`
- `scripts/build-journal.mjs`
- `scripts/agent/check-journal-article-layout.mjs`
- `tests/journal.test.mjs`
- `docs/agent/compact-journal-articles/PROGRESS.md`
- `docs/agent/compact-journal-articles/OWNER_TODO.md`

## Verification

- Pre-change acceptance check: 2 failures, no opening wrapper and cropped desktop hero.
- Full `npm test`: 159 passed, 0 failed.
- Dedicated Journal layout check: passed for English and Italian articles.
- Production visual measurements remain required after deployment.

## Open items

- None.

## Next step

- Release through the pull request pipeline, then measure the production layout.
