# Instruction reconciliation

## Status

- Step 1 of the approved Agent Skills migration is in progress.
- No skill files are created in this step.

## Decisions

- The events digest uses a five-day `LA-Events` lookback and accepts the actual name of every labelled newsletter, including ianVisits.
- Scheduled event publication follows branch, pull request, exact-head CI, Cloudflare deployment and live-readback safeguards.
- Instagram feed cadence is Tuesday place and Sunday Journal or tool. Weekend-event feed publishing remains paused.
- Instagram uses standing authorisation dated 20 November 2026, clean-photo carousels, normally 40 to 110 Italian words and zero to five precise hashtags.

## Acceptance criteria

- Event schema and validator accept ianVisits and other non-empty labelled source names while rejecting invalid and duplicate values.
- The repository digest prompt uses the five-day window and protected publication workflow.
- Social settings match the current cadence, standing approval, clean-image and caption policies.
- Social validation permits zero hashtags and still rejects more than five.
- Full tests and exact-head CI pass.

## Files touched

- Recorded in the final Git manifest.

## Next step

- After merge and live automation alignment, begin Step 2 with `la-safe-deployment` and `la-ui-validation`.
