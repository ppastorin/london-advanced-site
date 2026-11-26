# Instruction reconciliation

## Status

- Step 1 is complete.
- Step 2 is implemented and locally validated; pull-request verification remains.

## Decisions

- The events digest uses a five-day `LA-Events` lookback and accepts the actual name of every labelled newsletter, including ianVisits.
- Scheduled event publication follows branch, pull request, exact-head CI, Cloudflare deployment and live-readback safeguards.
- Instagram feed cadence is Tuesday place and Sunday Journal or tool. Weekend-event feed publishing remains paused.
- Instagram uses standing authorisation dated 20 November 2026, clean-photo carousels, normally 40 to 110 Italian words and zero to five precise hashtags.
- `AGENTS.md` retains only repository-wide scope, evidence, change-safety and writing safeguards.
- Release mechanics live in `la-safe-deployment`; visual and responsive proof lives in `la-ui-validation`.
- Skill-only changes trigger the existing site-safety workflow.

## Acceptance criteria

- Event schema and validator accept ianVisits and other non-empty labelled source names while rejecting invalid and duplicate values.
- The repository digest prompt uses the five-day window and protected publication workflow.
- Social settings match the current cadence, standing approval, clean-image and caption policies.
- Social validation permits zero hashtags and still rejects more than five.
- Full tests and exact-head CI pass.
- Both skills have valid frontmatter and retain the safeguards removed from `AGENTS.md`.
- Regression tests enforce skill routing, release gates, UI proof and CI path coverage.

## Files touched

- Recorded in the final Git manifest.

## Next step

- After Step 2 is merged and deployed, begin Step 3 of the approved migration sequence.
