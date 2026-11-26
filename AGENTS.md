# London Advanced repository safeguards

These instructions apply to every task in this repository. A specific instruction from
the owner may override them only when it names the safeguard being changed and the
intended scope.

## Scope and evidence

- Change only what the task requires. Preserve unrelated user work and record useful
  extras as suggestions instead of implementing them.
- Use facts supported by the repository, the task or a current authoritative source.
  Mark missing facts and uncertainty; do not invent values, claims or citations.
- Never expose or commit credentials, tokens, personal data or environment secrets.
- Do not delete data, change public URLs or schemas, or alter CI, deployment or
  environment configuration unless the task explicitly requires it.

## Working changes

- Use a scoped branch. Keep the change reviewable and do not rewrite shared history.
- Match existing structure, naming, design and test conventions. Inspect one relevant
  example before introducing a new pattern.
- Keep referenced source, generated output, tests and binary assets in the same atomic
  change. Verify API-created binary blob SHAs against the local files.
- For multi-phase or resumable work, maintain `docs/agent/<task>/PROGRESS.md` and
  `OWNER_TODO.md`. Do not create state files for a small single-pass task.

## Required workflows

- For any change intended for production, follow `la-safe-deployment` in
  `.agents/skills/la-safe-deployment/SKILL.md`. Never deploy directly with Wrangler.
- For a visible interface or responsive-layout change, also follow `la-ui-validation`
  in `.agents/skills/la-ui-validation/SKILL.md` before release.
- Fix failures introduced by the change. Do not skip, weaken or hide checks to obtain a
  pass.

## Published writing

Use plain, specific, factual copy. Match the surrounding language and spelling variant,
and write Italian natively rather than as a literal translation.
