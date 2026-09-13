# London Advanced Events — browser-only installation and testing

This procedure uses the normal GitHub, Cloudflare and ChatGPT screens. You do not need
Git, Node.js, a terminal, GitHub Desktop or any command-line tool.

## What will happen

The supplied files are uploaded to a temporary GitHub branch. GitHub runs the automated
tests. Cloudflare builds that branch as a non-production preview. You inspect the preview
on desktop and phone. Only then do you merge it into `main`, which updates the live site.
The scheduled Gmail-to-GitHub write is enabled last.

## Part 1 — download and unpack the package

1. Download `London-Advanced-Events-Phase1-v1.1-UI.zip`.
2. In Windows File Explorer, right-click the ZIP and select **Extract All**.
3. Open the extracted folder. At its top level you should see folders including
   `.github`, `automation`, `dist`, `schema`, `scripts` and `tests`, plus several files.
4. Do not upload the ZIP itself and do not upload the outer folder as one nested folder.
   GitHub needs the contents placed at the repository root.

## Part 2 — prepare Cloudflare's safe preview path

Do this before uploading the files so that the temporary GitHub branch produces a
preview rather than changing production.

1. Sign in to the **Cloudflare dashboard**.
2. Open **Workers & Pages**.
3. Select **london-advanced-site**.
4. Open **Settings**, then **Build**.
5. Under **Build configuration**, select **Edit** and check these values:

   | Field | Value to use |
   |---|---|
   | Git repository | `ppastorin/London-advanced-site` |
   | Production branch / Git branch | `main` |
   | Build command | `npm test` |
   | Deploy command | `npx wrangler deploy` |
   | Non-production branch deploy command | `npx wrangler versions upload` |
   | Root directory | Leave empty |

   These are values pasted into Cloudflare fields. You do not run them yourself.

6. Save the configuration.
7. Still under **Settings → Build**, open **Build variables and secrets**.
8. Add a non-secret variable named `NODE_VERSION` with value `22`, then save it.
9. Open **Settings → Build → Branch control**.
10. Confirm the production branch is `main`.
11. Enable **Builds for non-production branches** and save.
12. Open **Settings → Domains & Routes**.
13. Confirm **Preview URLs** is enabled. Enable and confirm it if necessary.

Do not merge anything yet. Cloudflare officially treats non-production branch builds as
preview versions and does not promote them to production.

## Part 3 — upload through the GitHub website

1. Sign in to GitHub and open:
   `https://github.com/ppastorin/London-advanced-site`
2. Confirm the branch selector above the file list says **main**.
3. Select **Add file**, then **Upload files**.
4. Return to the extracted package in Windows File Explorer.
5. Select all nine top-level items: six folders and three files. Drag those selected
   items—not the outer extracted folder—onto GitHub's upload area. GitHub will preserve
   the folders, producing fourteen changed files in total.
6. Wait until GitHub finishes listing the uploaded files.
7. Check the paths. They must begin directly with `.github/`, `automation/`, `dist/`,
   `schema/`, `scripts/` or `tests/`. If every path starts with the package name, cancel:
   the package was uploaded one folder too deep.
8. In **Commit message**, enter:
   `Add validated twice-weekly events digest`
9. Select **Create a new branch for this commit and start a pull request**.
10. Name the branch `feature-twice-weekly-events` if GitHub asks for a name.
11. Select **Propose changes**.
12. On the next screen, set the pull-request title to:
    `Add validated twice-weekly events digest`
13. Select **Create pull request**.

This upload is small and within GitHub's browser-upload limits. GitHub recommends using
a new branch rather than committing browser uploads directly to the default branch.

## Part 4 — inspect the change before trusting the tests

On the pull-request page, open **Files changed**.

The expected result is fourteen changed files: nine new and five modified. Check that:

- `dist/app.js`, `dist/styles.css` and `dist/_headers` are modified, not deleted;
- `package.json` and `scripts/validate-site.mjs` are modified, not deleted;
- `dist/data/events.json` is new;
- the new workflow, schema, automation instruction and tests are present;
- no image, tool page, existing route or `wrangler.jsonc` is deleted;
- there is no unexpected outer package directory.

If any existing site file is shown as deleted, do not merge. Close the pull request and
repeat the upload.

## Part 5 — read the GitHub automated-test result

1. Return to the pull request's **Conversation** tab.
2. Find the checks area near the merge controls. Wait until the checks stop showing a
   yellow dot or “in progress”.
3. The check named **Validate events feed** must be green.
4. Select **Details** beside that check.
5. Open the **Validate site and event feed** job and expand its test step.
6. Confirm the log contains all of the following outcomes:

   - `London Advanced validation passed`
   - six event tests passed
   - zero event tests failed
   - `Valid events feed: 3 events`

The six tests include rejection of low-scoring, unverified, overpriced and duplicate
events, as well as feeds containing more than three cards. You do not need to damage the
JSON manually to prove those failure cases.

If the check does not appear, open the repository's **Actions** tab. Enable Actions if
GitHub asks, then return to the pull request and use **Re-run jobs**. Do not merge without
a green result.

## Part 6 — inspect the Cloudflare branch preview

1. Return to the **Cloudflare dashboard**.
2. Open **Workers & Pages → london-advanced-site → Deployments**.
3. Select **View build history**.
4. Open the build whose branch is `feature-twice-weekly-events`.
5. It must show **Success**. In the log, confirm the build-command/test stage passed
   before the upload stage.
6. Open the new version under **Version History** and use the **Preview URL**. It should
   have a prefix before the Worker name, similar to:
   `<version>-london-advanced-site.<account>.workers.dev`
7. First open the preview URL normally. The demonstration digest must be hidden because
   it is deliberately dated 2099.
8. Add `?events-demo=1` to the end of that preview URL and reload it.
9. The section **THIS WEEK, BEYOND THE OBVIOUS** must now appear below the five tools and
   above the guide, with three cards clearly marked `DEMO`.

The demo switch works on a Cloudflare version-preview address but is blocked on the
production Worker address and on `londonadvanced.com`.

## Part 7 — perform the visual and functional tests

### Desktop browser

On the preview URL ending in `?events-demo=1`, check:

- **This week** appears in the top navigation and scrolls to the event section;
- three event cards fit in one row without overlapping;
- every card shows a date/time, title, summary, venue, price and booking state;
- each **Check details** link opens a new browser tab;
- the section is between Tools and the Guide;
- the following Guide, Journal and Community sections still appear normally;
- all five existing tool cards and their menu links still open the correct tool.

Then remove `?events-demo=1` and reload. The event section and its **This week** menu item
must both disappear.

### Phone

Open the same public preview URL ending in `?events-demo=1` on a real phone. Check:

- the page has one vertical scrollbar, not two;
- the menu opens and closes normally;
- **This week** appears inside the mobile menu and reaches the section;
- event cards stack in a single column;
- no text or button extends beyond the right edge;
- the three cards can be read without horizontal scrolling;
- the five existing tools remain usable.

Testing on a real phone is more valuable here than merely narrowing a desktop window.

### JSON endpoint

Open the preview URL again and replace everything after `.workers.dev` with:
`/data/events.json`

The browser should show a JSON document containing:

- `schema_version` equal to `1.0`;
- `timezone` equal to `Europe/London`;
- three demonstration events;
- `valid_from` and `valid_until` dates in 2099.

## Part 8 — merge and test production

Merge only when the GitHub check, Cloudflare preview, desktop test, phone test and JSON
endpoint test have all passed.

1. Return to the GitHub pull request.
2. Select **Merge pull request**.
3. Select **Confirm merge**.
4. Keep the temporary branch until production has been verified.
5. In Cloudflare, open **Deployments → View build history**.
6. Open the newest build for branch `main` and wait for **Success**.
7. Open `https://www.londonadvanced.com/` in a private/incognito browser window.
8. Confirm the homepage and all five tools still work.
9. Confirm no event section or **This week** menu item is visible yet. That is correct:
   the bundled records are demonstrations, not real recommendations.
10. Open `https://www.londonadvanced.com/data/events.json`. It should show the valid
    demonstration JSON.
11. Open `https://www.londonadvanced.com/?events-demo=1`. The demonstration cards must
    remain hidden on production.

If the production build fails, do not start the scheduled writer. Open its build log in
Cloudflare, correct the problem on a new GitHub branch, and leave the previous deployment
active.

## Part 9 — enable the existing scheduled task

Do not create another task. Keep the existing schedule at Sunday and Thursday, 11:00
`Europe/London`.

1. In ChatGPT, open **Tasks** from your profile menu or task-management area.
2. Open the existing **London Advanced Digest** task.
3. Select its edit control.
4. Keep its existing schedule unchanged.
5. Open `automation/DIGEST_TO_GITHUB_PROMPT.md` from the GitHub repository, select the
   raw text, and copy it.
6. Replace the task instruction with that text and save.
7. Confirm Gmail and GitHub remain connected to ChatGPT.
8. Use **Run now** once if that control is available. Otherwise wait for the next
   scheduled run and treat it as the controlled first run.

## Part 10 — validate the first real automated refresh

1. Open the GitHub repository and select **Commits** above the file list.
2. Open the newest commit beginning `content(events): refresh`.
3. It must show exactly **1 changed file**:
   `dist/data/events.json`.
4. Reject the result if application code, configuration or another file changed.
5. Open the JSON file and verify every event manually against its official link:
   date, time, venue, price and booking status.
6. Confirm there are no more than three events and no obvious duplicates.
7. In Cloudflare, open the new `main` build. It must show **Success**.
8. Open `https://www.londonadvanced.com/data/events.json` and confirm it contains the
   same generated timestamp and event titles as GitHub.
9. Open the homepage in a private/incognito window. Confirm the real event cards appear.
10. Repeat the phone checks from Part 7.

The first automated refresh is not a routine run. It is an acceptance test. Do not rely
on unattended publication until this complete sequence has passed once.

## Rollback using the normal UI

If the pull request causes a production problem:

1. Return to the merged pull request in GitHub.
2. Use **Revert** if GitHub displays it.
3. Create the proposed revert pull request and merge it.
4. Confirm Cloudflare deploys the revert successfully.

If only one automated digest is wrong, open its commit in GitHub and use the available
revert control, or restore the previous `dist/data/events.json` through a corrective pull
request. Pause the scheduled task until the cause is understood.

## Final acceptance checklist

- [ ] Fourteen expected files, with no unexpected deletions.
- [ ] GitHub `Validate events feed` check is green.
- [ ] Cloudflare non-production branch build is successful.
- [ ] Normal preview hides the demo; preview plus `?events-demo=1` shows three cards.
- [ ] Desktop layout, existing tools and links work.
- [ ] Real-phone layout has no horizontal or double scrolling.
- [ ] Production build succeeds after merge.
- [ ] Production refuses to show the demonstration records.
- [ ] The first scheduled refresh changes only `dist/data/events.json`.
- [ ] Every first-run event has been manually checked against its official page.
