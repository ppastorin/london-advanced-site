# Columbia Road and date-range search

Phase: implementation and production release.
Status: implementation complete, awaiting pull request checks and deployment.
Scope: add Columbia Road Flower Market to the bounded market feed and allow inclusive date-range searches in the English and Italian calendar UI.
Acceptance: Columbia Road appears every Sunday within the verified coverage except the existing unconfirmed holiday hold; the range accepts start and end dates, filters inclusively, survives URL and language changes, handles reversed bounds safely, and does not break single-day calendar selection; bilingual copy, mobile layout, tests, CI and production checks pass.
Decisions: use the published Sunday 08:00 to approximately 15:00 schedule and make the approximate closing explicit. Keep the existing single-day calendar interaction, adding an optional start/end range that takes precedence when set.
Baseline: two regressions failed because Columbia Road and the two range inputs were absent.
Files: bounded market data, market engine/app/copy/styles, market builder and generated EN/IT pages/assets, tests, acceptance checker and this task record.
Checks: 171 tests pass; 79 series and 710 bounded occurrences build; Columbia Road creates 13 verified-horizon Sundays after the holiday hold; inclusive and reversed ranges pass; acceptance checker reports zero failures; git diff whitespace check and Cloudflare dry run pass.
Open items: none.
Next: publish the complete tested tree, verify the pull request manifest and exact-head CI, merge, then confirm the live EN/IT controls, range behaviour and Columbia Road results.
