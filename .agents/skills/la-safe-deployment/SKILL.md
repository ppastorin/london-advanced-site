---
name: la-safe-deployment
description: Safely release London Advanced repository changes through GitHub and Cloudflare. Use for any task that publishes, deploys, merges, releases, updates production content, changes generated deployment assets, or verifies a production rollout.
---

# Safe deployment

Release only the change authorised by the task. Treat every gate below as blocking.

## Prepare

1. Read the root `AGENTS.md`, the relevant task state when one exists, and the files that
   define the affected build and tests.
2. Start from the current `main` head on a scoped branch. Inspect the worktree first and
   preserve unrelated changes.
3. Define task-specific acceptance criteria. Keep source, generated output, tests and
   referenced assets in one atomic change.
4. During iteration, use `npm run test:changed -- --files <paths...>` when its mapping is
   applicable. Before opening the pull request, run the full `npm test`.

## Protect assets and generated output

- Do not edit generated files without updating their source when a source exists.
- If an API is used to create large binary blobs, send base64 chunks whose decoded size
  is divisible by three, concatenate them, and verify every returned blob SHA with
  `git hash-object <local-file>`.
- Build the complete commit before opening the pull request. Do not add missing assets in
  a later release.

## Review and merge

1. Inspect the final diff and changed-file manifest. It must contain every intended file
   and no unrelated file.
2. Open a pull request to `main`. Record its exact head SHA.
3. Wait for the latest `Site safety checks` run for that exact head SHA. Do not accept a
   green run for an earlier commit.
4. If a check fails, inspect the relevant failure, fix only an in-scope cause, rerun the
   full local test suite and repeat the exact-head check.
5. Merge only when the task authorises completion through production and every gate has
   passed. Never force-push, bypass a required check or weaken a ruleset to merge.

## Verify production

1. Production deployment is owned by `Workers Builds: london-advanced-site` after merge
   to `main`. Never run `wrangler deploy` or `npm run deploy` directly.
2. Wait for the Cloudflare check attached to the merge commit, not the pull-request head,
   to finish successfully.
3. Fetch the affected live route and exact asset or data URL. Confirm the expected bytes,
   identifiers or content and the user-visible page that consumes them.
4. For visible changes, apply `la-ui-validation` to the deployed route as well.
5. Report the pull request, merge commit, exact CI result, Cloudflare result, live checks
   and any unresolved exception. A successful build without a successful live readback is
   incomplete.

## Stop conditions

Leave production unchanged and report the blocker when the intended manifest is unclear,
tests fail, the exact-head check is missing, the Cloudflare build fails, live output does
not match the merge, or required authority is absent.
