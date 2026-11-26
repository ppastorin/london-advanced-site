# Sitewide support CTA

Phase: implementation and production release.
Status: implementation merged; production deployment retrigger in progress.
Scope: audit every public tool and the main English and Italian landing pages, add one prominent Ko-fi support CTA where the existing link is missing or confined to a footer or post-result state, preserve specialist contextual CTAs, test, publish and verify production.
Acceptance: all nine English tools and ten Italian tools expose a visible support CTA before their primary interaction; the homepage, events, Journal index, itineraries index, About, Methodology, Press and guide landing pages expose a prominent CTA before their lower content; copy is native in each language; links use the central Ko-fi URL and secure external-link attributes; narrow screens do not overflow; full tests and exact-head CI pass; production pages and CSS are verified.
Decision: exclude legal, search, newsletter, thank-you, Studio, WTM and sales-only calendar pages because a support solicitation would distract from their primary legal, transactional or operational purpose. Keep existing article-level and result-triggered CTAs, but do not add a second generic CTA to individual Journal articles.
Baseline: 5 English and 6 Italian public tools have no Ko-fi link at all; Loo Finder reveals support only after results; Charity Shops and Bookshops expose it only in the footer; several main landing pages expose it only in the footer, while the English events page has none.
Files: shared CTA renderer and stylesheet, prerender integration, focused audit and regression test, 35 generated public routes, current generated event/search surfaces, and this task record.
Checks: 35-route audit passes with zero failures; full site validation passes; all 185 tests pass; event validation passes for 5 current records; git diff whitespace check passes after removing one generated blank-line space.
Open items: Cloudflare continued serving the previous release more than eight minutes after merge commit 3114f6e, with the new stylesheet returning 404. GitHub post-merge validation succeeded. A documentation-only follow-up push is being used once to retrigger Workers Builds without changing the tested site tree.
Next: merge the retrigger after its exact-head check succeeds, then verify representative EN/IT tool and main routes plus the stylesheet in production.
