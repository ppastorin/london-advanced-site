# London Advanced release safeguards

## Binary assets

- Treat image and other binary updates as part of the same atomic release as the content or tests that reference them.
- When GitHub blobs are created through an API, upload large binaries in base64 chunks whose decoded chunk size is divisible by three, then concatenate the chunks before creating the blob.
- Verify every returned blob SHA against `git hash-object <local-file>` before building the tree.
- Build the complete tree and commit before creating the release branch or pull request.
- After opening a pull request, verify that its changed-file manifest contains every intended source and deployed asset before relying on CI.

## Publication

- Run `npm test` before opening a pull request.
- Do not merge until the latest `Site safety checks` run succeeds for the exact pull-request head SHA.
- Production is deployed only by Cloudflare Workers Builds after the merge to `main`; verify the live asset bytes and page after deployment.

These rules apply to every task in this repository unless the task prompt explicitly overrides one.

## 1. Scope and phases
- Do only what the task prompt asks. If the work is split into phases, execute only the phase named. If none is named, do recon only and stop.
- Finish and commit one phase before starting the next. Never start a phase "to save time".
- Do not refactor, rename, reformat or upgrade anything outside the stated scope. Log tempting extras in the state file as suggestions instead.

## 2. State file (persistent memory)
- Keep one state file per task at docs/agent/<task-slug>/PROGRESS.md containing: phase status, decisions, assumptions, open items, files touched, and the next step.
- Read it first in every session. Update it at the end of every phase and every batch. Never rely on chat history.
- Keep a second file, OWNER_TODO.md in the same folder, for anything that needs a human: missing data, external actions, decisions, unverifiable facts.

## 3. Token and context discipline
- Start with a cheap map: directory tree to depth 2, file counts, key config files. Never read the whole repo.
- Search with rg, read with sed -n ranges. Do not print files over 150 lines. Do not open images, PDFs, binaries, lockfiles, minified or generated files. Inspect large data files with jq, head or schema extraction only.
- Make bulk changes with a script (kept in scripts/agent/), not repeated manual edits. Prefer one script touching many files over many tool calls.
- Process large jobs in batches of at most 10 items. Write results to files, not to chat.
- Verify with scripts that print only failures plus a one-line summary. Do not re-read output files to check them.
- Do not echo file contents, diffs or logs back into chat unless asked. Summarise.
- If context is getting long, finish the current batch, update the state file, commit, and stop with the exact line: RESUME FROM PHASE <n>, BATCH <m>.

## 4. Facts and assumptions
- Use only facts present in the repo, the task prompt or provided data. Never invent names, numbers, dates, prices, quotes, citations, addresses or claims.
- If a needed fact is missing, skip that field, leave a clear marker (TODO_OWNER) and log it in OWNER_TODO.md.
- Do not ask questions unless truly blocked. Otherwise choose the safest, most reversible assumption, record it in the state file, and continue.
- State uncertainty plainly in the report. Do not fill gaps with plausible guesses.

## 5. Safety and reversibility
- Work on a branch per phase (<type>/phase-<n>). One commit per phase with a clear message. Never merge, force-push, rewrite history or delete branches.
- Do not delete files, change public URLs, alter database schemas, touch secrets or env files, or modify CI/deploy config unless the task requires it. If a URL must change, add the appropriate redirect for the detected host.
- Do not add dependencies unless necessary. If you must, prefer one already in the project, and log why.
- Do not run destructive commands, network installs or external calls beyond what the task needs.
- Never commit credentials, tokens or personal data.

## 6. Quality and verification
- Match existing conventions: structure, naming, formatting, design system, test style. Read one comparable existing example before creating a new thing.
- Every phase needs acceptance criteria. If the prompt gives none, define them in the state file before starting, then check against them.
- Create or extend a check script (scripts/agent/check.*) early. Run it before and after each phase and record the failure counts.
- Fix failures you introduced. Do not hide, skip or weaken checks to make them pass.
- Run the project's existing tests, linter and build for anything you changed, and report the result.

## 7. Writing standards (for any copy, docs, comments or commit messages)
- Plain, specific, factual. No hype, filler or marketing superlatives.
- Never use em dashes or en dashes. Use commas, colons, full stops or parentheses.
- Match the language and spelling variant of the surrounding content. Write non-English text natively, not as a literal translation.
- Respect any tone or voice defined in the task prompt.

## 8. Reporting (after every phase, 10 lines maximum)
Phase, branch, files changed (count), check failures before and after, decisions made, open items for the owner, next step. No long summaries, no restating the prompt.

## 9. Precedence
Task prompt overrides this file. Safety rules in section 5 override everything except an explicit, specific instruction from the owner in the current prompt.
