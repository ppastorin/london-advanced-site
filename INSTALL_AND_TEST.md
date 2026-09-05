# Install and test v1.6

## 1. Confirm the package structure

At the root of the repository, the files must appear exactly like this:

```text
wrangler.jsonc
dist/
  _headers
  app.js
  content.js
  index.html
  styles.css
  assets/
    guide-cover.jpg
    london-map.jpg
```

Do not put `wrangler.jsonc` inside `dist`. It must be at the GitHub repository root.

## 2. Upload to GitHub

1. Open the `ppastorin/london-advanced-site` repository.
2. Open the production branch, `main`.
3. Choose **Add file → Upload files**.
4. Drag `wrangler.jsonc` and the complete `dist` folder from this package into the upload area.
5. If GitHub reports existing files, allow these package files to replace the files with the same paths.
6. Commit with the message `Release v1.6 usability and visual refresh`.
7. In the GitHub file list, open `wrangler.jsonc` and confirm it contains `"directory": "./dist"`.

The old root-level `app.js`, `styles.css`, `content.js`, `index.html`, and `assets` can remain. Cloudflare will ignore them after it reads this `wrangler.jsonc`.

## 3. Verify the Cloudflare build settings before deployment

In **Workers & Pages → london-advanced-site → Settings → Builds**, use:

- Production branch: `main`
- Build command: leave empty / None
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

Save only if a value needs changing. Do not enter `dist` as the root directory: `wrangler.jsonc` already selects it as the asset directory.

## 4. Verify the Cloudflare deployment log

After the GitHub commit, wait for the automatic production deployment and open its log.

The log must show that Wrangler detected the committed configuration and uses `./dist` as the assets directory. It must not create a new fallback Wrangler file and must not say that the output directory is `.`.

If it still says `Output Directory: .`, stop there and check these two points:

1. The filename is exactly `wrangler.jsonc` — not `wrangles.jsonc`, `wrangler.json`, or `wrangler.jsonc.txt`.
2. The file is at the repository root selected by Cloudflare, not inside `dist`.

## 5. Test the Worker directly first

Open `https://london-advanced-site.ppastorin.workers.dev/` in a private/incognito browser window.

On desktop:

1. Open **Tools** and click each of the five entries. Each must automatically open the corresponding `https://www.londonadvanced.com/home/...` page in a new tab.
2. Click each of the five large tool cards. They must behave the same way.
3. Click **Guide**. It must open the Payhip store in a new tab.
4. Open **Community**, then test Facebook and Instagram. Each must open in a new tab. Facebook may show its sign-in page when logged out; this is normal.
5. Click **Journal**. It must scroll within the current page and must not open a tab.
6. Click **Explore the tools**. It must scroll to the tool cards in the current page.
7. Confirm each tool card has a distinct graphical header and that the two upper cards align cleanly with the three lower cards.

Do not continue until these tests pass.

## 6. Test the published Google Sites page

Do not change or recreate the existing Google Sites embed. Publish the Google Site if it has unpublished changes, then open `https://www.londonadvanced.com/home` in a new private/incognito window.

Repeat the desktop tests from step 5. A normal left click must now open each external destination automatically; right-clicking and manually choosing a new tab should no longer be necessary.

If nothing opens, check whether the browser displays a blocked pop-up icon. Allow pop-ups for `www.londonadvanced.com` and repeat one normal click. These are direct user-clicked links, so standard browser settings normally allow them.

## 7. Test as mobile

Use a real phone if possible. Also test in Chrome DevTools with both a narrow Android profile and an iPhone profile.

1. Reload the published page at a width below 900 px.
2. Confirm that the desktop navigation is hidden and the **Menu** pill is visible.
3. Tap **Menu** and verify all five tools, Guide, Journal, Facebook, and Instagram are present.
4. Tap each external item one at a time. It must open a new browser tab/view automatically.
5. Return to the homepage after each test and reopen the menu. The menu should close after a selection.
6. Tap **Journal**. It must close the menu and scroll within the embedded homepage.
7. Tap **Explore the tools**. It must scroll in the same view.
8. Check portrait and landscape orientation. Confirm that the menu panel fits inside the screen, scrolls vertically when needed, and causes no horizontal page overflow.
9. Test at approximately 320 px, 390 px, 600 px, and 900 px widths.
10. At 600 px and below, confirm each tool is a compact horizontal card and that its long description is intentionally hidden.

## 8. Final cache check

If the old behavior remains after a successful deployment:

1. Confirm the latest Cloudflare deployment is marked Production.
2. Open the Worker URL with a temporary query string, for example `/?navigation-test=15`.
3. Hard-refresh the Google Sites page.
4. Test in an incognito window to bypass browser cache.

Do not edit the Google Sites embed code for this release. The fix is entirely in the Cloudflare-hosted page.
