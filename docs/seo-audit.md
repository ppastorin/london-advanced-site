# SEO crawl and index audit

Audit date: 7 November 2026

Branch: `seo-indexing-fixes`

Input: clean local build from `main`, plus targeted live redirect checks

## Executive summary

The 23 October Search Console snapshot does not describe the current build. The current Journal hubs render all 21 published English articles and all 21 Italian twins as plain HTML links. The five English articles called out in the brief are now two clicks from the English homepage, and their Italian twins are three clicks from it. They are not orphans and are not reachable only from the sitemap.

The current sitemap is materially better than the snapshot implies. It contains all 86 unique indexable canonical URLs, including Charity Shops, Bookshops and Meteo Dress, and contains no redirect, `noindex`, 404 or non-canonical target. Hreflang is reciprocal and complete for every real EN/IT pair.

The remaining defects are narrower:

1. `/wtm/` and `/wtm/operator/` form an indexable island. `/wtm/operator/` is a true orphan and neither URL is reachable from the homepage.
2. `/it/bookshops/` and `/it/charity-shops/` are live 200 duplicate routes with canonicals pointing to the Italian tool URLs, but have no redirects. This wastes crawl capacity and could explain redirect or canonical noise after Google discovers old routes.
3. Site navigation is generated from competing tool lists. Homepage parity is correct at 8 English and 9 Italian tools, but Journal navigation still exposes only the older six tools.
4. Five English and five Italian tool wrapper pages send an `Explore the guide` link directly to Payhip instead of the internal guide landing page.
5. Meteo Dress is correctly an Italian-only page at `/meteo-dress/`, but it lacks an explicit meta robots tag and uses `lang="it"` rather than `it-IT`. It has no real translation, so hreflang must not be invented.
6. Twenty-seven valid sitemap entries have no `lastmod`. Existing dates are content-derived or explicitly stored, not a build timestamp.

The hard truth is that the original archive diagnosis is now obsolete. Adding pagination or another archive layer would add complexity without solving a current crawl problem. The remaining work should strengthen existing links and remove crawl ambiguity, not rebuild a hub that already lists everything.

## Method

Commands used:

```bash
npm ci
npm run build
node scripts/seo/audit-built-site.mjs > /tmp/seo-audit.json
```

The audit script reads generated HTML only, parses canonical, robots, hreflang, sitemap and `_redirects`, then crawls crawlable `<a href>` links from `/`. It counts unique linking pages, not duplicate desktop and mobile anchors.

## 1. Indexable build URLs versus sitemap

- Physical HTML files: 100.
- Physical HTML files with an indexable canonical: 89.
- Unique indexable canonical URLs: 86.
- Explicit `noindex` HTML files: 11.
- Indexable HTML missing a canonical: 0.
- Sitemap URLs: 86.
- Indexable canonicals missing from sitemap: 0.
- Sitemap URLs not backed by an indexable canonical page: 0.
- Sitemap URLs that redirect, return 404, are `noindex`, or point away from their own canonical: 0.

The three extra physical indexable files are aliases sharing another page's canonical:

| Physical route | Canonical | Live behavior |
|---|---|---|
| `/it/loo/` | `/it/strumenti/trova-un-bagno/` | 301 to canonical route |
| `/it/bookshops/` | `/it/strumenti/librerie/` | 200, no redirect |
| `/it/charity-shops/` | `/it/strumenti/negozi-di-beneficenza/` | 200, no redirect |

Charity Shops, Bookshops, Meteo Dress and their real Italian equivalents are present in the sitemap. There is no Italian Meteo Dress twin. The existing `/meteo-dress/` page is Italian-only.

## 2. Sitemap quality

- All 86 locations are absolute `https://www.londonadvanced.com` URLs.
- Both language sets are present where translations exist.
- 59 entries have `lastmod`; 27 do not.
- Journal dates come from each article's `updated_at` or `published_at` field.
- Itinerary dates come from each itinerary's `updated_at` or `published_at` field.
- Journal and itinerary hub dates use the latest published child modification date.
- Event and homepage dates use the event feed generation date and latest Journal update.
- Guide and Meteo Dress dates are stored dates.
- The generator preserves prior metadata for other static pages. It does not assign the build time to every URL.

The missing `lastmod` URLs are the main static hubs and tools: About, Methodology, Newsletter, privacy and copyright pages, all primary tool wrappers except Meteo Dress, both WTM pages, and their paired Italian pages. Phase 2 should add explicit source-driven dates. It must not use `new Date()` during every build.

## 3. Static internal link graph

All core editorial and tool pages are reachable from `/` within three clicks. The only unreachable indexable URLs are `/wtm/` and `/wtm/operator/`.

The ten formerly stuck articles now have these positions:

| URL | Unique inbound pages | Click depth |
|---|---:|---:|
| `/journal/london-city-farms-free-community-guide/` | 5 | 2 |
| `/journal/london-community-gardens-hidden-green-spaces/` | 8 | 2 |
| `/journal/london-food-markets-beyond-borough/` | 4 | 2 |
| `/journal/magnificent-seven-cemeteries-london/` | 4 | 2 |
| `/journal/unusual-london-bookshops-to-visit/` | 5 | 2 |
| `/it/journal/city-farm-londra-gratuite-comunita/` | 5 | 3 |
| `/it/journal/community-garden-londra-spazi-verdi-nascosti/` | 8 | 3 |
| `/it/journal/mercati-gastronomici-londra-oltre-borough/` | 4 | 3 |
| `/it/journal/magnificent-seven-cimiteri-londra/` | 4 | 3 |
| `/it/journal/librerie-insolite-londra-da-visitare/` | 5 | 3 |

No canonical page is reachable only through the sitemap except the two disconnected WTM pages. `/wtm/operator/` has zero inbound links. `/wtm/` has one inbound link from the disconnected operator page.

## 4. Journal hub and archive behavior

`scripts/build-journal.mjs` loads bilingual JSON pairs from `content/journal/`. A pair is public only when both languages are marked `published`, both approvals are complete, and both have `published_at`. Public articles are sorted by descending publication date.

Both `/journal/` and `/it/journal/` render every public article. The current build has 21 cards on each hub. There is no pagination or separate archive because nothing is truncated. The homepage separately previews the latest three articles.

Related reads already exist and are data-driven through `related_articles` and `related_tools`. The stated examples are already connected: Magnificent Seven links to Highgate, and the viewpoint guide links to One Leadenhall. The gap is narrower: Bookshops and Charity Shops do not exist in the shared Journal tool mapping, so articles cannot select those newer tools as their relevant tool link.

## 5. Hreflang

- All actual EN/IT pairs have absolute `en-GB`, `it-IT` and `x-default` links.
- All paired pages self-reference.
- All pairs are reciprocal.
- `x-default` points to the English URL.
- Every paired language switcher checked points to the exact twin URL.
- No paired alternate points to a redirect or non-indexable URL.

Correctly unpaired pages are `/newsletter/`, `/meteo-dress/`, `/wtm/` and `/wtm/operator/`. Meteo Dress has only Italian content despite living outside `/it/`. Adding English hreflang or a fake Italian mirror would violate the real-translation requirement.

## 6. Canonical and robots metadata

All 86 canonical URLs are self-canonical, use the correct `www` HTTPS origin and do not point to redirects. There is no accidental `noindex` among canonical public pages.

The 11 intentional `noindex` files are the 404 page, two embedded fare-calculator app pages, two search pages, two post-submission thank-you pages, two Studio pages and two WTM demo pages.

Meteo Dress relies on the default index behavior because it has no meta robots tag. It should receive `index,follow` for consistency, together with `lang="it-IT"`. This is a head-only correction and does not change its URL or canonical.

## 7. Redirects

Repository rules in `dist/_redirects`:

```text
/home                                      -> /                                             301
/home/                                     -> /                                             301
/london-travel-fare-calculator             -> /home/travel-fare-calculator/                 301
/london-travel-fare-calculator/            -> /home/travel-fare-calculator/                 301
/it/loo/                                    -> /it/strumenti/trova-un-bagno/                 301
/loo/about                                  -> /loo/?about=1                                 301
/loo/about/                                 -> /loo/?about=1                                 301
/it/strumenti/trova-un-bagno/info           -> /it/strumenti/trova-un-bagno/?about=1          301
/it/strumenti/trova-un-bagno/info/          -> /it/strumenti/trova-un-bagno/?about=1          301
```

Static analysis found no redirect chains, loops or internal canonical-page links to a redirect. Live checks confirmed:

- HTTP, HTTPS non-www and HTTP www each reach HTTPS www in one hop.
- Non-trailing-slash page requests reach their slash URL in one hop.
- `/home`, the legacy fare URL and `/it/loo/` reach their intended final URL in one hop.
- `/it/bookshops/` and `/it/charity-shops/` remain 200 aliases and should become direct 301 redirects only after explicit approval.

The three Search Console `Page with redirect` records are plausibly legacy paths above, but the supplied data does not include their URLs, so they cannot be identified exactly. The `Redirect error` cannot be reproduced from repository rules or tested host variants. Its URL must be exported from Search Console before Phase 2 can claim to fix it.

## 8. Link and navigation inconsistencies

### Meteo Dress

The Italian homepage consistently links to `/meteo-dress/`. This is not a broken link. It reflects an Italian-only tool that uses a root-level public URL. There is no real `/it/` twin, so Phase 2 must preserve the public route and must not manufacture a translation.

### Tool counts

The homepage counts are correct: 8 English tools and 9 Italian tools including Meteo Dress. The inconsistency is sitewide navigation. The Journal generator's `TOOL_PATHS` contains only the original six tools, omitting Charity Shops and Bookshops in both languages and Meteo Dress in Italian. This creates competing navigation inventories.

### Guide targets

The homepage uses the internal guide landing page for discovery and Payhip only for explicit purchase actions. That distinction is sound. Five English and five Italian legacy tool wrappers break it: their `Explore the guide` strip points straight to Payhip. Those strips should link to `/the-other-london/` or `/it/the-other-london/`; explicit `Buy` actions should remain on Payhip.

### Language switchers

All pages with real bilingual pairs point to their exact twin. Meteo Dress links to the English homepage because no English Meteo Dress page exists. Its switch is a fallback navigation link, not an alternate translation.

## 9. Tool-page static content

All 17 canonical tool pages contain server-rendered descriptive copy and crawlable internal links. Approximate static text ranges from 436 to 914 words. The interactive interface may use an iframe or JavaScript, but Google does not need to execute it to see the title, purpose, methodology, limitations and onward links.

All canonical tools are in the sitemap. English tools are one click from `/`; Italian tools are two clicks from `/`. Meteo Dress is two clicks from `/` through the Italian homepage.

## Recommended Phase 2 plan, ranked by expected crawl impact

1. Resolve the two WTM indexable islands. Decide whether they remain public indexable propositions. If yes, link them from a relevant project page. If no, explicit approval is required before adding `noindex` and removing them from the sitemap.
2. Add direct redirects for `/it/bookshops/` and `/it/charity-shops/` to their canonical Italian tool routes, subject to explicit approval because these are public URLs.
3. Unify the shared navigation inventory so Journal and wrapper pages expose 8 English and 9 Italian tools. Point guide discovery strips to the internal landing pages.
4. Keep the existing full Journal hubs. Do not add redundant pagination. Extend the existing data-driven related-link system only where it is weak, especially Bookshops and Charity Shops tool mappings and a consistent 3 to 4 related articles.
5. Add a compact homepage `More from the Journal` block beyond the latest three. This is incremental strengthening, not an orphan fix.
6. Add real `lastmod` values for the 27 static pages using explicit source metadata, never a build timestamp.
7. Add Meteo Dress `index,follow` and `lang="it-IT"`. Preserve `/meteo-dress/` and do not add hreflang without a real translation.
8. Preserve current canonical and hreflang output, then add regression checks for reciprocity, exact sitemap equality, unique canonical routes and three-click reachability.
9. Obtain the four exact Search Console redirect URLs before changing any further redirect rule.

Phase A as originally described should be treated as already satisfied by the current full hubs. Phase E is also currently satisfied and needs tests, not a rewrite. Phase F is partly blocked on the two redirect approvals and the missing Search Console URL export.

## Appendix: full indexable link graph

`Inbound` is the number of unique canonical pages containing at least one static link to the URL. `Depth` is measured from `/` using static HTML links only.

| URL | Sitemap | Lastmod | Inbound | Depth |
|---|---:|---|---:|---:|
| `/` | yes | 2026-10-08T14:03:54.000Z | 45 | 0 |
| `/about/` | yes | missing | 40 | 1 |
| `/bookshops/` | yes | missing | 8 | 1 |
| `/charity-shops/` | yes | missing | 8 | 1 |
| `/copyright/` | yes | missing | 6 | 1 |
| `/events/` | yes | 2026-10-08T14:03:54.000Z | 40 | 1 |
| `/home/escape-the-crowds/` | yes | missing | 41 | 1 |
| `/home/london-by-mood/` | yes | missing | 41 | 1 |
| `/home/london-dashboard/` | yes | missing | 39 | 1 |
| `/home/smart-navigation/` | yes | missing | 41 | 1 |
| `/home/travel-fare-calculator/` | yes | missing | 38 | 1 |
| `/it/` | yes | 2026-10-08T14:03:54.000Z | 42 | 1 |
| `/it/chi-sono/` | yes | missing | 38 | 2 |
| `/it/copyright/` | yes | missing | 6 | 2 |
| `/it/eventi/` | yes | 2026-10-08T14:03:54.000Z | 36 | 2 |
| `/it/itinerari/` | yes | 2026-11-02T21:45:51.000Z | 36 | 2 |
| `/it/itinerari/highgate-ferrovia-perduta-bosco-cimitero/` | yes | 2026-11-02T21:45:51.000Z | 6 | 3 |
| `/it/itinerari/va-east-basso-lea-mulini-faro/` | yes | 2026-11-02T21:45:51.000Z | 4 | 3 |
| `/it/itinerari/wimbledon-senza-tennis/` | yes | 2026-10-09T10:22:35.000Z | 4 | 3 |
| `/it/journal/` | yes | 2026-11-02T21:45:51.000Z | 38 | 2 |
| `/it/journal/buddhapadipa-temple-wimbledon-visita/` | yes | 2026-10-02T10:07:49.000Z | 4 | 3 |
| `/it/journal/camden-passage-angel-islington-guida/` | yes | 2026-10-24T09:05:35.000Z | 4 | 2 |
| `/it/journal/chiswick-hogarth-house-gardens-mosaic-house/` | yes | 2026-10-16T20:27:15.000Z | 5 | 3 |
| `/it/journal/city-farm-londra-gratuite-comunita/` | yes | 2026-10-16T20:27:15.000Z | 5 | 3 |
| `/it/journal/community-garden-londra-spazi-verdi-nascosti/` | yes | 2026-10-11T23:23:45.000Z | 8 | 3 |
| `/it/journal/crystal-palace-park-dinosauri-sfingi-subway/` | yes | 2026-10-02T10:07:49.000Z | 6 | 3 |
| `/it/journal/eel-pie-island-twickenham-storia-open-studios/` | yes | 2026-10-24T09:05:35.000Z | 4 | 2 |
| `/it/journal/highgate-cemetery-guida-east-west/` | yes | 2026-11-02T21:45:51.000Z | 5 | 3 |
| `/it/journal/librerie-insolite-londra-da-visitare/` | yes | 2026-10-16T20:27:15.000Z | 5 | 3 |
| `/it/journal/magnificent-seven-cimiteri-londra/` | yes | 2026-11-02T21:45:51.000Z | 4 | 3 |
| `/it/journal/mercati-gastronomici-londra-oltre-borough/` | yes | 2026-10-24T09:05:35.000Z | 4 | 3 |
| `/it/journal/panorami-insoliti-londra-con-storia/` | yes | 2026-11-02T21:45:51.000Z | 4 | 3 |
| `/it/journal/parkland-walk-ferrovia-abbandonata-londra/` | yes | 2026-11-02T21:45:51.000Z | 5 | 2 |
| `/it/journal/passeggiata-blackheath-greenwich/` | yes | 2026-09-27T16:23:43.000Z | 11 | 3 |
| `/it/journal/passeggiata-draghi-city-of-london/` | yes | 2026-09-27T16:23:43.000Z | 7 | 3 |
| `/it/journal/quentin-blake-centre-illustrazione/` | yes | 2026-09-27T16:23:43.000Z | 6 | 3 |
| `/it/journal/terrazza-pubblica-one-leadenhall/` | yes | 2026-10-16T20:27:15.000Z | 6 | 3 |
| `/it/journal/trinity-buoy-wharf-faro-londra/` | yes | 2026-11-02T21:45:51.000Z | 12 | 3 |
| `/it/journal/va-east-storehouse/` | yes | 2026-11-02T21:45:51.000Z | 6 | 3 |
| `/it/journal/wandle-trail-fiume-londra/` | yes | 2026-10-26T08:55:26.000Z | 8 | 3 |
| `/it/journal/wesleys-chapel-bunhill-fields-guida/` | yes | 2026-10-11T23:23:45.000Z | 5 | 3 |
| `/it/metodologia/` | yes | missing | 43 | 2 |
| `/it/privacy/` | yes | missing | 6 | 2 |
| `/it/strumenti/calcolatore-tariffe-trasporti/` | yes | missing | 40 | 2 |
| `/it/strumenti/dashboard-londra/` | yes | missing | 40 | 2 |
| `/it/strumenti/evita-la-folla/` | yes | missing | 40 | 2 |
| `/it/strumenti/librerie/` | yes | missing | 9 | 2 |
| `/it/strumenti/londra-per-umore/` | yes | missing | 36 | 2 |
| `/it/strumenti/navigazione-intelligente/` | yes | missing | 39 | 2 |
| `/it/strumenti/negozi-di-beneficenza/` | yes | missing | 9 | 2 |
| `/it/strumenti/trova-un-bagno/` | yes | missing | 36 | 2 |
| `/it/the-other-london/` | yes | 2026-10-10 | 36 | 2 |
| `/itineraries/` | yes | 2026-11-02T21:45:51.000Z | 36 | 1 |
| `/itineraries/highgate-lost-railway-ancient-wood-cemetery/` | yes | 2026-11-02T21:45:51.000Z | 6 | 2 |
| `/itineraries/va-east-lower-lea-mills-lighthouse/` | yes | 2026-11-02T21:45:51.000Z | 4 | 2 |
| `/itineraries/wimbledon-without-tennis/` | yes | 2026-10-09T10:22:35.000Z | 4 | 2 |
| `/journal/` | yes | 2026-11-02T21:45:51.000Z | 38 | 1 |
| `/journal/blackheath-to-greenwich-walk/` | yes | 2026-09-27T16:23:43.000Z | 11 | 2 |
| `/journal/buddhapadipa-temple-wimbledon-visit/` | yes | 2026-10-02T10:07:49.000Z | 4 | 2 |
| `/journal/camden-passage-angel-islington-guide/` | yes | 2026-10-24T09:05:35.000Z | 4 | 1 |
| `/journal/chiswick-hogarth-house-gardens-mosaic-house/` | yes | 2026-10-16T20:27:15.000Z | 5 | 2 |
| `/journal/city-of-london-dragon-walk/` | yes | 2026-09-27T16:23:43.000Z | 7 | 2 |
| `/journal/crystal-palace-park-dinosaurs-sphinxes-subway/` | yes | 2026-10-02T10:07:49.000Z | 6 | 2 |
| `/journal/eel-pie-island-twickenham-history-open-studios/` | yes | 2026-10-24T09:05:35.000Z | 4 | 1 |
| `/journal/highgate-cemetery-east-west-guide/` | yes | 2026-11-02T21:45:51.000Z | 5 | 2 |
| `/journal/london-city-farms-free-community-guide/` | yes | 2026-10-16T20:27:15.000Z | 5 | 2 |
| `/journal/london-community-gardens-hidden-green-spaces/` | yes | 2026-10-11T23:23:45.000Z | 8 | 2 |
| `/journal/london-food-markets-beyond-borough/` | yes | 2026-10-24T09:05:35.000Z | 4 | 2 |
| `/journal/magnificent-seven-cemeteries-london/` | yes | 2026-11-02T21:45:51.000Z | 4 | 2 |
| `/journal/one-leadenhall-public-terrace/` | yes | 2026-10-16T20:27:15.000Z | 6 | 2 |
| `/journal/parkland-walk-london-lost-railway/` | yes | 2026-11-02T21:45:51.000Z | 5 | 1 |
| `/journal/quentin-blake-centre-for-illustration/` | yes | 2026-09-27T16:23:43.000Z | 6 | 2 |
| `/journal/trinity-buoy-wharf-lighthouse/` | yes | 2026-11-02T21:45:51.000Z | 12 | 2 |
| `/journal/unusual-london-bookshops-to-visit/` | yes | 2026-10-16T20:27:15.000Z | 5 | 2 |
| `/journal/unusual-london-viewpoints-with-a-story/` | yes | 2026-11-02T21:45:51.000Z | 4 | 2 |
| `/journal/va-east-storehouse/` | yes | 2026-11-02T21:45:51.000Z | 6 | 2 |
| `/journal/wandle-trail-london-river-walk/` | yes | 2026-10-26T08:55:26.000Z | 8 | 2 |
| `/journal/wesleys-chapel-bunhill-fields-guide/` | yes | 2026-10-11T23:23:45.000Z | 5 | 2 |
| `/loo/` | yes | missing | 36 | 1 |
| `/meteo-dress/` | yes | 2026-10-20 | 6 | 2 |
| `/methodology/` | yes | missing | 45 | 1 |
| `/newsletter/` | yes | missing | 37 | 1 |
| `/privacy/` | yes | missing | 6 | 1 |
| `/the-other-london/` | yes | 2026-10-10 | 38 | 1 |
| `/wtm/` | yes | missing | 1 | unreachable |
| `/wtm/operator/` | yes | missing | 0 | unreachable |
