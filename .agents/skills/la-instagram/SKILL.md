---
name: la-instagram
description: Prepare, validate, schedule and reconcile London Advanced Instagram content through Studio, the repository queue and Metricool. Use for Instagram post creation, carousel or Reel media, captions, mentions, hashtags, scheduling, planner reconciliation, analytics reviews, publication checks, or repairs to social automation.
---

# Instagram workflow

Use `content/social/settings.json` as policy, `content/social/posts/` as the durable queue,
and the live Metricool planner as delivery state. Do not copy policy into automation
prompts.

## Read current state

1. Read `AGENTS.md`, `content/social/settings.json`, `scripts/validate-social.mjs`, every
   relevant post record, the live Metricool brand `5985082` planner and open Studio items.
2. Deduplicate by post ID, topic, source reference, media folder, scheduled slot and stable
   Metricool UUID. Treat the current planner ID as replaceable and the UUID as stable.
3. Count published and scheduled items in the target calendar month. Never exceed the
   configured monthly limit or re-enable paused weekend-event publishing.

## Prepare posts

- Fill only vacant configured Tuesday and Sunday slots. Skip an already-filled slot; do
  not add filler to satisfy a requested count.
- Use Paolo's original photographs. Default to a purposeful carousel of three to six
  distinct images with the strongest first. Preserve the complete photograph and a
  consistent supported size, normally 1080 x 1350. Do not add text, logos, title panels,
  labels or fake watermarks to photo carousels. Never substitute generated imagery.
- Write natural Italian within the configured range, beginning with the place or a
  photographed detail. Keep English to the configured optional treatment. Avoid invented
  visits or reactions, engagement bait, generic questions and unsupported access claims.
- Verify unstable facts through official sources. Add accurate image-level alternative
  text and only relevant first-party-verified mentions. Do not guess handles, send DMs,
  invite collaborators or tag unrelated accounts. Use zero to the configured maximum of
  precise hashtags.
- Record standing approval exactly as configured. Do not claim an individual Studio
  review when the basis is standing authorisation.

## Validate media and records

1. Decode every final image. Check format, dimensions, aspect ratio, byte size, ordering,
   duplicates, margins, focal content, phone-size crops and alt text. Tie the evidence to
   exact file hashes.
2. For a justified Reel, use 1080 x 1920 H.264/yuv420p. When text is necessary, keep glyph
   bounds inside the project limits `x=96..850` and `y=420..1200`; inspect every scene and
   transition against simulated profile, caption, controls, feed and tall-phone crops.
   Do not describe simulation as actual Instagram verification or force a slideshow into
   a Reel for presumed reach.
3. Run `node scripts/validate-social.mjs content/social/posts`. Leave a failed item in
   review or pending with the exact blocker.
4. Persist new or corrected records and media through `la-safe-deployment` so the
   scheduler can reproduce the exact files.

## Schedule approved records

1. Re-read settings, queue, planner and Studio immediately before scheduling. An eligible
   record must be approved, use the configured standing-authorisation attribution, have a
   future `scheduled_for`, verified source evidence and fully validated local media.
2. Resolve an existing planner entry by UUID or matching date, content and media before
   creating anything. Update the existing item when found; never repost published content
   or recreate an item because its numeric planner ID changed.
3. Send ordered local file paths, Instagram-only provider data, `autoPublish: true` and
   `isAiGenerated: false`. Omit unsupported network data and preserve applicable Instagram
   and carousel-tag fields. Keep the record's approved time; do not run an uncontrolled
   timing experiment.
4. Re-read Metricool after the write. Verify caption, media, date, provider, UUID and
   auto-publish, preferably by downloading and decoding delivered media. Update the queue
   record with truthful planner metadata through the protected repository workflow.
5. On an API error, inspect current planner state before one materially corrected retry.
   Never repeat an identical rejected request.

## Evaluate performance

Use current comparable seven-day results rather than embedding a permanent benchmark.
Separate reach, views, saves, shares and follows; compare formats separately. Do not infer
causation, shadow bans, non-follower distribution or timing effects from missing or
non-age-matched data.

## Stop conditions

Do not prepare or schedule when policy, rights, facts, source evidence, media validation,
planner identity, monthly capacity or repository safety is unresolved. Report the precise
blocker without sending outreach, enabling paid promotion or adding another platform.
