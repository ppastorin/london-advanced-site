# Instruction reconciliation

## Status

- Steps 1 and 2 are complete.
- Step 3 is implemented and locally validated; pull-request verification remains.

## Decisions

- The events digest uses a five-day `LA-Events` lookback and accepts the actual name of every labelled newsletter, including ianVisits.
- Scheduled event publication follows branch, pull request, exact-head CI, Cloudflare deployment and live-readback safeguards.
- Instagram feed cadence is Tuesday place and Sunday Journal or tool. Weekend-event feed publishing remains paused.
- Instagram uses standing authorisation dated 20 November 2026, clean-photo carousels, normally 40 to 110 Italian words and zero to five precise hashtags.
- `AGENTS.md` retains only repository-wide scope, evidence, change-safety and writing safeguards.
- Release mechanics live in `la-safe-deployment`; visual and responsive proof lives in `la-ui-validation`.
- Skill-only changes trigger the existing site-safety workflow.
- `la-events-digest` owns the five-day source window, editorial selection, feed creation,
  deterministic validation and protected publication workflow.
- The scheduled prompt is a concise entry point and no longer duplicates digest policy.
- Newsletter source names remain open-ended, but must be trimmed and unique without
  case-sensitive duplicates.

## Acceptance criteria

- Event schema and validator accept ianVisits and other non-empty labelled source names while rejecting invalid and duplicate values.
- The repository digest prompt uses the five-day window and protected publication workflow.
- Social settings match the current cadence, standing approval, clean-image and caption policies.
- Social validation permits zero hashtags and still rejects more than five.
- Full tests and exact-head CI pass.
- Both skills have valid frontmatter and retain the safeguards removed from `AGENTS.md`.
- Regression tests enforce skill routing, release gates, UI proof and CI path coverage.
- Digest regression tests enforce the source model, five-day window, validator invocation,
  single-file publication path and concise scheduled prompt.

## Files touched

- Recorded in the final Git manifests for pull requests 179, 180 and the Step 3 pull request.

## Next step

- After Step 3 is merged and deployed, begin Step 4 of the approved migration sequence.
