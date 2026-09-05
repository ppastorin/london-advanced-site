# Validation record

Completed before packaging:

- JavaScript syntax check passed for `dist/app.js`.
- Wrangler 4.129.0 dry-run passed and read exactly eight files from `dist`.
- Rendered-markup validation passed.
- Exactly five tool cards are rendered.
- Each of the five tool destinations appears in the desktop tool menu, mobile menu, and card grid.
- Thirty-one external navigation instances use `target="_blank"`.
- No rendered link uses `target="_top"`.
- No rendered link points to `workers.dev`.
- No navigation anchor relies on a fragment-only `href`.
- The internal Tools and Journal controls use explicit same-view scrolling.
- Responsive CSS hides desktop navigation and shows the mobile menu at 900 px and below.
- All five cards render a distinct visual motif: live signal, crowd field, fare ticket, route, and mood orbit.
- Mobile cards switch to a 104 px graphical column plus a flexible text column at 600 px and below.
- Mobile-only rules remove the long card description and preserve the short purpose, title, and action.
- Mobile menu controls preserve a minimum 44 px touch target.
- Section spacing and hero height were reduced without removing content.
- All five `londonadvanced.com` tool URLs returned HTTP 200 during endpoint checks.
- Payhip, Facebook, and Instagram destinations resolved successfully; logged-out Facebook requests redirect to Facebook login.

The live Google Sites page was inspected separately. Its custom-embed sandbox includes `allow-popups` and `allow-popups-to-escape-sandbox`, but it does not include `allow-top-navigation` or `allow-top-navigation-by-user-activation`. This is why new tabs are supported and same-tab top-level replacement is blocked.

The final real-device and post-deployment acceptance tests are in `INSTALL_AND_TEST.md`.
