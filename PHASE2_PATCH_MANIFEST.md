# Phase 2 patch manifest

## New files

- `dist/events/index.html`
- `dist/events/events.js`
- `FULL_EVENTS_PAGE_DEPLOYMENT.md`
- `PHASE2_PATCH_MANIFEST.md`

## Modified files

- `automation/DIGEST_TO_GITHUB_PROMPT.md`
- `dist/app.js`
- `dist/data/events.json`
- `dist/sitemap.xml`
- `dist/styles.css`
- `schema/events.schema.json`
- `scripts/validate-events.mjs`
- `scripts/validate-site.mjs`
- `tests/validator.test.mjs`

## Behavioural contract

- `events` contains between one and eight fully approved records.
- `homepage_event_ids` contains between one and three unique IDs from `events`.
- The homepage follows `homepage_event_ids` order and never shows more than three cards.
- `/events/` shows every active record, grouped by London calendar date.
- The scheduled task continues to replace only `dist/data/events.json`.
- Invalid, expired or unavailable data fails closed.
