# Musical London article

## Phase status
Phase 1: article drafting and Studio preparation, complete.
Phase 2: owner approval and publication, complete pending CI, merge and live verification.

## Acceptance criteria
- Paired English and Italian entries use the same article ID.
- Both entries are approved by Paolo Pastorino and marked Published.
- All eight supplied images remain in the intended then-and-now order.
- The four official-video frames remain included with a copyright note.
- Existing tests and Site safety checks pass.
- English and Italian production URLs return the published article and all eight images.

## Decisions
- The article covers Rick Astley, The Verve, Dexys Midnight Runners and a-ha.
- Original-video stills are credited as visual references.
- A copyright note states that rights remain with the respective rights holders and that London Advanced claims no ownership.
- Paolo Pastorino is credited only for his contemporary photographs.

## Files touched in phase 2
- content/journal/musical-london.en.json
- content/journal/musical-london.it.json
- docs/agent/musical-london/PROGRESS.md
- docs/agent/musical-london/OWNER_TODO.md

## Next step
Complete CI, merge, allow Cloudflare Workers Builds to deploy, then verify both live pages and their image references.
