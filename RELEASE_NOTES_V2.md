# London Advanced v2.0 — direct Cloudflare portal

## Added

- Five branded tool routes matching the existing Google Sites paths.
- Embedded production endpoints for three Cloudflare tools and two Apps Script tools.
- Shared full-height tool wrapper designed to avoid double scrolling.
- Same-view navigation from the landing page to each tool route.
- Tool switcher and direct-open fallback.
- Compact guide promotion on every tool page.
- Canonical metadata, Open Graph metadata, sitemap, robots file and custom 404 page.
- Legacy path redirects.
- Automated structural, destination and Wrangler validation.
- GitHub Actions checks for every pull request and production change.
- Daily and manually triggered health checks for all five underlying application endpoints.

## Changed

- Portal home is now `/` rather than the Google Sites `/home` page.
- Tool URLs are relative routes, making branch and custom-domain testing reliable.
- Cloudflare continues to publish only `dist/`.
- Unknown paths now use the custom 404 page.

## Not changed

- The three application Workers remain independent deployments.
- The Fare Optimizer and Smart Navigation remain entirely on Google Apps Script.
- Existing Payhip, Facebook, Instagram and analytics destinations remain in place.
- This release makes no DNS changes.
