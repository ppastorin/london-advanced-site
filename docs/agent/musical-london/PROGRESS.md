# Musical London article

## Phase status
Phase 1: article drafting and Studio preparation, complete pending CI and owner review.

## Acceptance criteria
- Paired English and Italian entries use the same article ID.
- Editorial status is Review with approval pending.
- All eight supplied images are referenced in the intended then-and-now order.
- Image dimensions and aspect ratios match the uploaded JPEGs.
- The Journal editor accepts up to eight images and supports explicit paragraph placement.
- Existing tests and site safety checks pass.

## Decisions
- The article covers four videos only: Rick Astley, The Verve, Dexys Midnight Runners and a-ha.
- The locations are treated as separate visits, not an artificial single itinerary.
- Original-video stills are credited as visual references; Paolo Pastorino is credited only for his photographs.
- All images use natural presentation to preserve the supplied framing.

## Assumptions
- Files ending in 1 are official-video frames; files ending in 2 are Paolo Pastorino photographs.
- The owner wants the draft visible in Studio but not published on the public Journal.

## Files touched
- content/journal/musical-london.en.json
- content/journal/musical-london.it.json
- studio/config.yml
- scripts/build-journal.mjs
- docs/agent/musical-london/PROGRESS.md
- docs/agent/musical-london/OWNER_TODO.md

## Next step
Run CI, merge the review draft after safeguards pass, then review and edit it in Studio.
