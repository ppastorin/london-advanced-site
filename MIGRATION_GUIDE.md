# London Advanced: Cloudflare domain migration

This release turns the existing Cloudflare landing page into the top-level London Advanced portal while preserving the five current Google Sites tool paths.

## What this release changes

- Keeps Cloudflare static deployment restricted to `dist/`.
- Converts all five tool links to same-site relative routes.
- Adds five branded wrapper pages under `/home/`.
- Embeds three Cloudflare Workers and two production Google Apps Script web apps.
- Adds a shared tool switcher, direct-open fallback and compact guide promotion.
- Adds canonical metadata, `robots.txt`, `sitemap.xml`, a custom 404 page and legacy redirects.
- Adds automated validation through `npm test` and GitHub Actions.

No DNS record is changed by this package.

## Phase 1: upload to a migration branch

1. Download and unzip this release locally.
2. In GitHub, open `ppastorin/london-advanced-site`.
3. From the branch selector, create `prepare-domain-migration` from `main`.
4. While on that branch, choose **Add file → Upload files**.
5. Upload the release contents, including `dist/`, `scripts/`, `.github/`, `package.json`, `wrangler.jsonc` and this guide. Do not upload the outer release folder or the ZIP itself.
6. Commit with `Prepare Cloudflare domain migration`.

The active production branch remains `main`; uploading to the migration branch must not replace the production deployment.

## Phase 2: confirm automated checks

Open the GitHub pull request or **Actions → Site safety checks**. The workflow must pass both:

1. `npm test`, which checks routes, endpoints, canonical URLs, sitemap entries, headers and the deployment directory.
2. `wrangler deploy --dry-run`, which validates the Cloudflare package without publishing it.

The workflow also prints the complete external-link inventory. Generate the same report locally with `npm run links`.

After the workflow reaches `main`, **Application endpoint health** runs daily at 06:15 UTC. It checks the three Workers and two Apps Script production URLs. A failed run appears under GitHub Actions and uses the repository owner's normal GitHub Actions notification settings. Run it manually at any time from **Actions → Application endpoint health → Run workflow**.

If Actions are disabled, open a GitHub Codespace on the branch and run:

```bash
npm test
npx --yes wrangler@4 deploy --dry-run
```

## Phase 3: test the Cloudflare branch preview

In Cloudflare, open **Workers & Pages → london-advanced-site → Builds/Deployments** and select the build for `prepare-domain-migration`.

Open its preview URL and test:

- `/`
- `/home/london-dashboard/`
- `/home/escape-the-crowds/`
- `/home/travel-fare-calculator/`
- `/home/smart-navigation/`
- `/home/london-by-mood/`
- `/london-travel-fare-calculator` redirects to the new fare route.
- An invalid path shows the custom 404 page.

For every tool page:

1. The branded header appears.
2. The embedded tool loads.
3. The tool itself can scroll, but the wrapper page does not create a second scrollbar.
4. **Open directly** opens the underlying production application.
5. The tool switcher opens all five internal routes.
6. The London Advanced brand returns to `/`.
7. The guide strip opens Payhip.

Test at desktop width and at approximately 390 px mobile width. Test the two Apps Script tools in an incognito browser while logged out of Google.

If an Apps Script tool refuses to load in the frame, its `doGet()` must return an `HtmlOutput` configured with:

```javascript
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
```

Redeploy that script as a new production version and retain the `/exec` URL.

## Phase 4: merge without changing the public domain

1. Create a pull request from `prepare-domain-migration` to `main`.
2. Confirm **Site safety checks** passed.
3. Merge the pull request.
4. Wait for the `main` Cloudflare deployment to succeed.
5. Test `https://london-advanced-site.ppastorin.workers.dev/` and all five `/home/.../` routes.

At this point Google Sites still owns `www.londonadvanced.com`. The new Worker release can be tested without changing public DNS.

## Phase 5: add a temporary custom domain

1. In Cloudflare open **Workers & Pages → london-advanced-site**.
2. Select **Settings → Domains & Routes → Add → Custom Domain**.
3. Add `preview.londonadvanced.com`.
4. Wait until Cloudflare reports the domain and certificate as active.
5. Repeat the full test checklist at `https://preview.londonadvanced.com/`.

Do not continue if any tool is blocked, requires an unexpected Google login, or produces two scrollbars.

## Phase 6: record the Google Sites DNS state

Before changing `www`:

1. Open **Cloudflare → DNS → Records**.
2. Locate the `www` CNAME used by Google Sites.
3. Record its target, TTL and proxy state and take a screenshot.
4. Confirm that MX, SPF, DKIM, DMARC and Google verification records will not be changed.
5. Keep the Google Site published. It provides a rollback target.

## Phase 7: move `www.londonadvanced.com`

Cloudflare cannot attach a Worker Custom Domain to a hostname that still has a CNAME.

1. Delete only the existing Google Sites `www` CNAME.
2. Immediately open **Workers & Pages → london-advanced-site → Settings → Domains & Routes**.
3. Select **Add → Custom Domain**.
4. Enter `www.londonadvanced.com` and confirm.
5. Wait until the custom domain and certificate are active.
6. Open `https://www.londonadvanced.com/` in an incognito browser.
7. Test all five preserved `/home/.../` paths.
8. Verify `https://www.londonadvanced.com/sitemap.xml` and `robots.txt`.

## Phase 8: redirect the apex domain

Create a Cloudflare redirect from:

```text
https://londonadvanced.com/*
```

to:

```text
https://www.londonadvanced.com/${1}
```

Use HTTP 301 and preserve the query string. Test both the homepage and a path with a query string.

## Phase 9: search and analytics

1. Retain Google Analytics ID `G-3ZQEZ6R171`.
2. Confirm page views and tool-link events after consenting to analytics.
3. In Google Search Console, inspect the homepage and each `/home/.../` path.
4. Submit `https://www.londonadvanced.com/sitemap.xml`.
5. Request indexing for the homepage and key tool pages.

A Search Console Change of Address is not required because the public domain is unchanged.

## Rollback

### Code rollback

In Cloudflare open **london-advanced-site → Deployments**, select the three-dot menu beside the previous working deployment and choose **Rollback**.

### Domain rollback to Google Sites

1. Remove `www.londonadvanced.com` from the Worker’s Custom Domains.
2. Restore the exact Google Sites CNAME recorded before cutover.
3. Leave the Google Site published until DNS again resolves to it.

Do not delete the Google Site until the Cloudflare portal has been stable and monitored for at least one week.
