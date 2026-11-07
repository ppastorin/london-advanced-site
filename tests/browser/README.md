# Mobile shop smoke tests

This isolated Playwright package covers Charity Shops and Bookshops at 375 px and 390 px. Each case loads both the English and Italian routes and checks search-control alignment, toolbar/map separation, filter-sheet layout, filter-driven marker updates, and map/list switching.

The tests intercept the shop APIs, geocoding, Leaflet and map tiles. Their four-shop fixtures are deliberately small and stable; the Node data-integrity tests remain responsible for the complete production datasets and the approved totals in `config/shop-baselines.json`.

Run from the repository root after preparing `dist/`:

```bash
npm ci --prefix tests/browser
npm run prerender:preview
npm test --prefix tests/browser
```

The dedicated workflow runs only when the two tool implementations, bilingual routes, datasets, approved baselines, shared layout inputs or browser-test infrastructure change. Browser dependencies are not part of the root lockfile or ordinary `npm ci`.
