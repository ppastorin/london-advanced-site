# Phase 1 patch manifest

Copy the paths in this archive over the same paths in the London Advanced homepage
repository. Read `EVENTS_PHASE1_DEPLOYMENT.md` before deploying.

## New files

- `.github/workflows/validate-events.yml`
- `automation/DIGEST_TO_GITHUB_PROMPT.md`
- `dist/data/events.json`
- `schema/events.schema.json`
- `scripts/stage-events.mjs`
- `scripts/validate-events.mjs`
- `tests/validator.test.mjs`
- `EVENTS_PHASE1_DEPLOYMENT.md`
- `PHASE1_PATCH_MANIFEST.md`

## Modified files

- `dist/_headers`
- `dist/app.js`
- `dist/styles.css`
- `package.json`
- `scripts/validate-site.mjs`

No existing image, tool route, Worker configuration or content record is removed.

