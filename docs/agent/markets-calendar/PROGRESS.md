# Markets calendar

## Phase 1: approved implementation and production release

Status: deployed and verified on 20 November 2026. PR #164 passed exact-head CI, merged, and Cloudflare Workers Builds succeeded. Both live language routes and 14 page/data/module/style/illustration assets match the tested bytes. Base a000f8cb2eb0842dcc190b9daf7518cbfc7cc7c2.
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
Next: the enabled fortnightly research refresh begins 4 December 2026 morning, Europe/London. See automation/MARKETS_REFRESH_PROMPT.md. Durable release evidence and exact identifiers are recorded in merged PR #164. Optional owner action: provide more owned/authorised market photos.

Post-release operational record: PR head 53a755eee295cf9416b22986735530cd619ab660, merge a746f625485f082c4ee8b619760bbb0b80e90025, Site safety checks 44759771257, Workers Build c2efb0dd-eb54-460b-a78b-76b7af54fac9. All 138 intended files verified in PR manifest. Live homepage/search/sitemap crosslinks pass in both languages. Release evidence is also retained in the merged PR body, without creating a redundant production deployment for this local status update.
