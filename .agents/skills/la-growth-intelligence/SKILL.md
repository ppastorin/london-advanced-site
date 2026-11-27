---
name: la-growth-intelligence
description: Measure, interpret and govern London Advanced acquisition, engagement and tool-journey growth. Use for Search Console or GA4 reviews, landing-page experiments, analytics validation, funnel instrumentation, Cloudflare comparisons, growth backlogs, post-release measurement, or implementation decisions based on growth evidence.
---

# Growth intelligence

Turn comparable evidence into bounded decisions. Keep methodology here, current phase state
in `docs/agent/growth-intelligence/PROGRESS.md`, and review-specific dates, targets, pages,
events and thresholds in the selected file under `docs/agent/growth-intelligence/reviews/`.

## Establish scope

1. Read `AGENTS.md`, the current progress and owner-action files, and the dated review input
   named by the task or automation. Do not reuse dates or targets from an earlier review.
2. Confirm whether the run is measurement, validation, recommendation or an explicitly
   approved implementation. A review does not authorise production changes.
3. Use the reporting authority and comparison sources recorded in current state or the dated
   input. Keep production and legacy properties separate and never combine their totals.
4. Record missing access, incomplete windows, data lag and source limitations before analysis.

## Measure acquisition

- Use equal, non-overlapping pre- and post-release windows unless the dated input explicitly
  justifies another design. Respect Search Console reporting lag and release dates.
- Pull page totals, query totals and query-to-page rows separately. Never sum dimensional
  extracts as though they were independent traffic totals.
- Report clicks, impressions, CTR and average position for every scoped page. Interpret CTR
  only beside position and the dated input's minimum-volume threshold and position guardrail.
- Check indexing, recrawl and the title or description actually served by Google before
  attributing a CTR movement to changed copy.
- Preserve page-level baselines from the authoritative workbook or dated evidence. Do not
  reconstruct missing values from rounded aggregate totals.

## Measure product journeys

- Treat GA4 results as the consented subset, not total usage. Validate a new event in Realtime
  or DebugView before interpreting low later counts as a broken implementation.
- Count meaningful completed actions and useful outcomes. Do not track every keystroke,
  filter toggle or automatic example.
- Send only bounded metadata such as tool, language and method. Never send raw searches,
  coordinates, user-entered values or other personal data.
- Instrument embedded tools inside their own application or through a documented,
  origin-checked `postMessage` contract. Parent-page views do not reveal internal journeys.
- Compare Cloudflare and GA4 only over comparable scope and dates. Explain consent, bot
  filtering and definition differences; never add or merge their totals.

## Apply the decision gate

Use the thresholds in the dated review input:

- keep a page unchanged when its target is met and position is stable;
- hold longer when CTR improves but the target is not met, unless the sample is already
  sufficient and the served snippet is demonstrably wrong;
- prepare one evidence-based title or description revision when CTR is flat or lower,
  position is stable and minimum volume is met;
- investigate ranking, crawl, intent and competing results before blaming copy when position
  breaches the guardrail;
- mark low-volume results inconclusive;
- defer copy judgement while Google still serves the old snippet.

Do not change article bodies without a separate content case. Do not optimise multiple
variables at once when the objective is causal learning.

## Record the result

1. Update the authoritative Growth Intelligence workbook with source extracts, calculation
   notes, caveats and page-level decisions.
2. Add results and evidence to the dated review file. Update `PROGRESS.md` only when phase
   status, an active constraint or the next decision changes.
3. Separate observed facts from inference. State sample sizes and avoid causal claims that
   the data cannot support.
4. Return a prioritised recommendation containing keep, hold, revise and investigate groups,
   plus unresolved access or data-quality blockers.

## Implement only approved changes

Require explicit approval of the post-review actions. Preserve successful pages, consent,
public URLs and unrelated analytics. Add focused regression coverage and follow
`la-safe-deployment`; use `la-ui-validation` as well for visible changes. Stop if the requested
change conflicts with the measured decision, exposes personal data, mixes reporting
authorities or cannot pass exact-head and live verification.
