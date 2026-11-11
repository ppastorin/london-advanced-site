# CI and test efficiency

## Commands

- `npm test` remains the release regression. It rebuilds `dist/`, runs the site and social validators, all Node test files, and the event validator.
- `npm run test:changed` is a local feedback command. It compares `origin/main...HEAD` plus uncommitted files, prepares the preview build when selected tests consume generated files, and runs only the mapped Node tests.
- `npm run test:changed -- --base <ref> --head <ref>` selects tests for an explicit commit range.
- `npm run links` prints only the external-link count and generated-file count. `npm run links:details` prints the complete URL-to-file inventory.

## Selection safety

The selector is intentionally conservative. Direct test edits select that test. Tool, Journal, itinerary, social, event, legal, guide and Studio paths have explicit mappings. Recognised documentation and Instagram media-only changes require no Node test. Shared build code, deployment configuration, packages, workflows, the Worker router and any unrecognised path fall back to `npm test`.

Adding a source area therefore requires adding an explicit rule and selector assertion; omission cannot silently skip regression coverage.

## GitHub Actions scope

Every ordinary pull request still receives the complete regression and Wrangler dry-run. A Studio media-only pull request may reuse the existing job context only when every changed file is a non-deleted file under the six source/generated media allowlisted roots. The separate Studio auto-merge workflow independently checks the same roots before merging.

After a merge to `main`, GitHub Actions reuses the exact successful pull-request head validation only when the GitHub API associates the new commit with a merged PR to `main` and finds a successful `Site safety checks` run for that exact head SHA. Direct pushes, manual runs, missing API evidence and ambiguous cases run the complete validation. Cloudflare Workers Builds remains the sole production deployer and continues to run `npm test` after a merge.

## Checkout decision

The 6 November 2026 baseline was 11.4 seconds for checkout and 5.7 seconds for `npm ci`, against a repository of roughly 440 MB and 1,114 deployment assets. This change does not alter checkout depth, sparse patterns, dependency caching or installation. Those are release inputs as well as performance costs; the current evidence does not establish that excluding them is safe. The first material savings come from avoiding the entire checkout/install on strictly verified media-only PRs and from reusing exact successful PR validation after merge.
