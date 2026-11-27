# Instruction reconciliation

## Status

- Steps 1 through 5 are complete.
- The markets and Instagram skills are merged, deployed and used by the existing scheduled
  automations. The weekend Reel automation remains intentionally paused.

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
- `la-markets-refresh` owns the evidence, recurrence, bilingual validation and protected
  publication workflow for market updates.
- Initial market seed and integration scripts are quarantined outside the active agent
  script directory and fail immediately if invoked.
- `la-instagram` owns preparation, media validation, scheduling, planner reconciliation
  and performance interpretation.
- Instagram JSON, Studio defaults and deterministic settings validation share the same
  two-slot cadence, standing approval, clean carousel, zero-to-five hashtag, monthly cap
  and paused weekend-event policies.

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
- Markets and Instagram regression tests enforce skill delegation, script quarantine,
  settings reconciliation and concise automation prompts.

## Files touched

- Recorded in the final Git manifests for pull requests 179, 180, 182 and 184.

## Next step

- Begin Step 6 of the approved migration sequence.
