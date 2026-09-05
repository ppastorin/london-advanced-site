# London Advanced — Editorial Atlas

Production-ready static homepage for London Advanced.

## Contents

- `dist/index.html` — page shell and metadata.
- `dist/content.js` — app links, guide links, social links, article previews and analytics IDs.
- `dist/app.js` — homepage rendering, click events and analytics consent.
- `dist/styles.css` — Editorial Atlas layout and responsive styling.
- `dist/assets/` — London map and guide cover.
- `dist/_headers` — Cloudflare Pages embedding and security headers.
- `INSTALLATION_GUIDE.md` — complete GitHub, Cloudflare and Google Sites instructions.

## Local preview

Open `dist/index.html` directly in a browser, or serve the `dist` folder with any static web server.

## Routine maintenance

For most changes, edit only `dist/content.js`. Commit the change to GitHub and Cloudflare Pages will redeploy automatically.
