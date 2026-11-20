# Tool support CTA

Phase: implementation and production release.
Status: implementation complete, awaiting pull request checks and deployment.
Scope: move the markets calendar support request near the top of the tool in English and Italian, add a short explanation, and make the action visually prominent.
Acceptance: both market pages show one prominent support block after the introduction and before the controls; the copy is native in each language; the lower duplicate links are removed; mobile and desktop remain usable; tests and production verification pass.
Decision: apply this only to the markets calendar requested in the current conversation, not silently redesign every unrelated tool.
Baseline: the new regression failed because neither page had a prominent support block before the controls.
Files: markets/copy.mjs, markets/markets.css, scripts/build-markets.mjs, tests/markets.test.mjs, generated EN/IT pages and tool assets, plus this task record.
Checks: 169 tests pass, the new bilingual placement and duplicate-link regression passes, git diff whitespace check is clean, and the Cloudflare deployment package dry run succeeds.
Open items: none.
Next: publish the complete tested tree, verify the pull request manifest and exact-head CI, merge, then verify both live pages and asset bytes.
