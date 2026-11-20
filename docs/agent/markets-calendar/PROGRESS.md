# Markets calendar

## Phase 1: approved implementation and production release

Status: implementation complete; 167 tests and Cloudflare dry-run package validation pass. Release awaiting exact-head CI and production verification. Base a000f8cb2eb0842dcc190b9daf7518cbfc7cc7c2.
Branch on completion: feat/phase-1-markets-calendar.
The owner explicitly approved creation, both languages, crosslinks and production deployment. This overrides recon-only and no-merge defaults for this release.

Acceptance: approved month/day and mobile week/agenda layout; bilingual filters, search, dates, links and accessible controls; evidence-labelled three-month inventory and later announced dates; no unresolved events; safe thumbnails; EN/IT metadata, search, menus, home cards, related links, sitemap; fortnightly research refresh; full tests, exact-head CI, Cloudflare build and live byte checks.

Decisions: static first-party tool, shared deterministic date engine, no dependencies or private visitor data. Research is the owner-provided discovery register dated 20 November 2026. Announced dates and generated regular schedules remain separate. Unknown prices/hours are not invented. Unconfirmed Christmas/New Year occurrences are withheld. Existing owned venue photos only where a caption identifies the market; other thumbnails are labelled category illustrations. All Greater London accepted; no unverified outside-London venues.

Checks: focused acceptance check baseline 7 missing files, after build 0. Eight date, evidence, filter, escaping and bilingual integration tests pass. Full suite after build, before PR. Existing tool-count assertions are updated to 9 EN and 10 IT, with the new route required. No separate lint script exists.

Data: 78 market series, 697 occurrences. Later explicit dates through 26 September 2027; indexed-only Local Makers dates are held rather than promoted to confirmed. Alexandra Palace held because its venue changes and date-specific locations need verification. Working category illustrations supplied for all six categories; Victoria Park uses an existing owned market photograph.

Environment: browser-control tools are not exposed to this execution environment. Browser screenshot QA cannot run under the managed-preview rules; date and integration checks continue. No browser or test package has been installed.

Generated output: the required existing build also refreshes previously stale tracked event, journal and fare-support output from unchanged approved source. No unrelated source content has been edited.

Open items: image permissions for additional documentary thumbnails; unresolved research entries held outside public data.
Files touched: recorded by final Git manifest.
Next: open PR, verify changed-file manifest, wait for exact-head Site safety checks, merge and verify production. Set the approved fortnightly refresh after the production release.
