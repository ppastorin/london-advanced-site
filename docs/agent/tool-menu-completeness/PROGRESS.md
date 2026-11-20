# Tool menu completeness

Phase 1: fix and deploy the missing Bookshops and Charity Shops links.
Base: a746f625485f082c4ee8b619760bbb0b80e90025.
Branch: fix/phase-1-tool-menu-completeness.
Authorisation: the user requested the menu fix within the approved production release. Preserve the existing tests, exact-head CI gate and Cloudflare deployment path.
Acceptance: both tools appear in desktop and mobile full menus, using canonical EN/IT routes, including the markets tool and existing editorial pages.
Cause: the shared editorial navigation catalogue omitted both tools; older generated headers also preserved incomplete lists.
Baseline: new whole-site navigation regression test fails for Bookshops in the English About menu. Existing tests do not catch this omission.
Decision: add both tools to the shared catalogue and complete missing links in existing generated headers idempotently. No dependencies or layout changes.
Files: scripts/build-journal.mjs, scripts/build-markets.mjs, tests/itinerary-navigation.test.mjs, regenerated menus and this task record.
Checks after fix: all 168 tests pass, including the whole-site desktop/mobile EN/IT menu regression. Build passes and git diff whitespace check is clean.
Next: publish the complete commit, verify the manifest and exact-head CI, merge and confirm live menus.
