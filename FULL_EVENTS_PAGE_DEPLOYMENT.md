# London Advanced full events page — browser-only deployment

This package extends the existing events feature without changing the Cloudflare
architecture. The homepage continues to show three editorial choices. The new
`/events/` page shows the complete verified list, currently seven events, from the same
`dist/data/events.json` file.

No terminal, GitHub Desktop, API configuration, database or additional Worker is needed.

## 1. Upload through GitHub

1. Extract `London-Advanced-Events-Full-List-v2.0.zip` using Windows **Extract All**.
2. Open `https://github.com/ppastorin/London-advanced-site`.
3. Confirm the branch selector says **main**.
4. Select **Add file → Upload files**.
5. Open the extracted package folder and select these seven top-level items:
   - `automation`
   - `dist`
   - `schema`
   - `scripts`
   - `tests`
   - `FULL_EVENTS_PAGE_DEPLOYMENT.md`
   - `PHASE2_PATCH_MANIFEST.md`
6. Drag the selected items onto GitHub's upload area.
7. Confirm paths start directly with `dist/`, `schema/`, `scripts/` and so on. Cancel if
   GitHub shows an additional outer ZIP folder in every path.
8. Enter commit message `Add complete events page`.
9. Select **Create a new branch for this commit and start a pull request**.
10. Use branch name `feature-full-events-page`.
11. Select **Propose changes**, then **Create pull request**.

## 2. Inspect the pull request

The pull request should contain 13 changed files:

- 11 application or automation files
- 2 documentation files
- no deletions

Confirm these two new page files are present:

- `dist/events/index.html`
- `dist/events/events.js`

Confirm `dist/data/events.json` contains:

- `schema_version` set to `1.1`
- seven events
- three values in `homepage_event_ids`

Do not merge if unrelated tool pages, assets, `content.js`, `wrangler.jsonc` or GitHub
workflow files have changed.

## 3. Wait for the existing safety check

Open the pull request's **Checks** tab. **Site safety checks** must be green.

Its validation now proves:

- the homepage and `/events/` route are present;
- one to eight fully approved events are accepted;
- only one to three existing event IDs can be selected for the homepage;
- invalid prices, low scores, duplicates and missing homepage references are rejected;
- the deployment package is structurally valid.

## 4. Test the Cloudflare branch preview

1. Open **Cloudflare → Workers & Pages → london-advanced-site**.
2. Open **Deployments → View build history**.
3. Find the build for `feature-full-events-page` and confirm it says **Success**.
4. Open its preview URL.

### Homepage checks

- The homepage displays exactly three event cards.
- Under the cards, **See all 7 weekend picks →** is visible.
- That link opens the preview's `/events/` page.
- The five existing tools still open correctly.
- Guide, Journal and Community are unchanged.

### Full page checks

Open `/events/` on the same preview address.

- The heading is **This week, beyond the obvious**.
- The page reports **7 verified events**.
- Events are grouped by date and sorted by start time.
- Each event shows category, price, time, description, venue, full address and booking
  status.
- **Check official details** opens the correct official or booking page in a new tab.
- **Home**, **Tools**, the wordmark and footer homepage link work.
- The Facebook link opens the existing London Advanced group.

### Phone checks

Open the preview on a real phone.

- Every event becomes one vertical card.
- Text and buttons remain readable.
- There is no horizontal scrolling and no second vertical scrollbar.
- The complete address does not overflow.
- Homepage and full-page links work normally.

## 5. Merge and verify production

When the preview and phone tests pass:

1. Return to the GitHub pull request.
2. Select **Squash and merge**.
3. Use title `Add complete events page`.
4. Select **Confirm squash and merge**.
5. Keep the feature branch until production has been checked.
6. In Cloudflare, wait for the new `main` build to show **Success**.
7. Open these addresses in a private/incognito window:
   - `https://www.londonadvanced.com/`
   - `https://www.londonadvanced.com/events/`
   - `https://www.londonadvanced.com/data/events.json`
8. Confirm the homepage has three cards, the full page has seven events and the JSON has
   schema version `1.1`.
9. Delete the feature branch only after these checks pass.

## 6. Update the existing scheduled task

Do this only after production is working.

1. In ChatGPT, open **Tasks**.
2. Open the existing **London Advanced Digest** task.
3. Keep Sunday and Thursday at 11:00 Europe/London.
4. Replace its instructions with `automation/DIGEST_TO_GITHUB_PROMPT.md` from this
   package.
5. Do not create another task.
6. Run it once manually if **Run now** is available.

The task must still change exactly one GitHub file:

`dist/data/events.json`

The replacement JSON may contain one to eight approved events and must name one to three
of those IDs in `homepage_event_ids`.

After the controlled run, verify that the homepage and full page contain the same event
records, with only the designated homepage selection limited to three.
