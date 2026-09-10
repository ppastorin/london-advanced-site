# Approved destination inventory

The file `dist/content.js` is the single source of truth for all five tool routes and embedded application endpoints.

| Tool | Public London Advanced route | Embedded production application |
|---|---|---|
| London Dashboard | `/home/london-dashboard/` | `https://london-now.ppastorin.workers.dev/` |
| Escape the Crowds | `/home/escape-the-crowds/` | `https://london-advanced-crowd-pressure.ppastorin.workers.dev/` |
| Travel Fare Calculator | `/home/travel-fare-calculator/` | Google Apps Script deployment ending `WjPg/exec` |
| Smart Navigation | `/home/smart-navigation/` | Google Apps Script deployment ending `z34w/exec` |
| London by Mood | `/home/london-by-mood/` | `https://london-by-mood.ppastorin.workers.dev/` |

## Link rules

- Landing-page cards and menus must link to the relative London Advanced routes, not directly to the embedded applications.
- Apps Script production destinations must end in `/exec`, never `/dev`.
- `sites.google.com` must not appear in navigable content under `dist/`.
- Endpoint changes must be made in `dist/content.js`; `npm test` must then be updated deliberately if an approved endpoint changes.
- Payhip, Facebook, Instagram, Google Fonts, Google Analytics and Cloudflare Analytics remain approved external services.

## Legacy redirects

`dist/_redirects` preserves:

- `/home` → `/`
- `/london-travel-fare-calculator` → `/home/travel-fare-calculator/`
