London Advanced navigation fix v1.3

Replace only these three files in the GitHub repository's dist folder:

  dist/app.js
  dist/content.js
  dist/styles.css

Do not upload these files to the repository root.
Do not replace wrangler.jsonc or dist/_headers.

Changes:
- LA logo opens https://www.londonadvanced.com/home in the top window.
- Tools is a dropdown containing the five public Google Sites tool pages.
- Guide opens the Payhip store.
- Community opens the Facebook group.
- Journal scrolls within the current page without exposing a workers.dev anchor.
- Explore the tools scrolls within the current page without exposing a workers.dev anchor.
- No href="#..." or workers.dev navigation links remain in the application code.

After committing to main, wait for the Cloudflare production build and test the
published Google Sites page in an incognito window.
