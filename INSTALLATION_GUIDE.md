# Install London Advanced — Editorial Atlas

## Read this first

There are two Cloudflare deployment methods below. Use **Method A: GitHub integration** for the real site. It gives you automatic deployments whenever you update the repository. Method B is included as a recovery/manual option. Do not create two separate production Pages projects.

Before deployment, the five tool links still point to their current Google Sites pages. That is deliberate and keeps the homepage usable during the migration.

## 1. Check the editable settings

Open `dist/content.js` and verify:

- Payhip guide and store links.
- Facebook group link.
- Instagram link.
- The five existing app page links.
- The three initial Field Notes entries.

The analytics values are placeholders and will not send data until replaced:

```js
analytics: {
  googleAnalyticsId: "G-XXXXXXXXXX",
  cloudflareBeaconToken: "REPLACE_WITH_CLOUDFLARE_TOKEN"
}
```

Do not rename or move the files inside `dist` unless you also update their references in `index.html`.

## 2. Test it on your computer

The quickest check is to extract the GitHub package and double-click `dist/index.html`.

For a more accurate local test, open a terminal in the extracted project folder and run:

```bash
python -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`. Stop the server with `Ctrl+C`.

## 3. Create the GitHub repository

1. Sign in to GitHub.
2. Select **New repository**.
3. Name it `london-advanced-site`.
4. Choose **Private** unless you deliberately want the code public.
5. Do not add a README, `.gitignore` or licence because the package already contains them.
6. Create the repository.
7. Extract `London-Advanced-Editorial-Atlas-GitHub-v1.zip` on your computer.
8. On the empty repository page choose **uploading an existing file**.
9. Upload all extracted files and folders, including `.gitignore`, `dist`, `README.md` and `INSTALLATION_GUIDE.md`.
10. Commit them to the `main` branch.

Using GitHub Desktop is equally valid: create a local repository from the extracted folder, publish it to GitHub, and keep `main` as the production branch.

## 4. Deploy through Cloudflare — Method A, recommended

1. Sign in to Cloudflare.
2. Open **Workers & Pages**.
3. Select **Create application** and then **Pages**.
4. Choose the option to connect/import an existing Git repository.
5. Authorise GitHub if Cloudflare has not been connected before.
6. Select `london-advanced-site`.
7. Use these production settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Build command | Leave blank |
| Deploy command | Leave blank — do not use `npx wrangler deploy` |
| Build output directory | `dist` |
| Root directory | Leave blank |

8. Save and deploy.
9. Wait for the deployment to finish, then open the supplied `*.pages.dev` address.
10. Test all five app cards, both guide buttons and both social links.

Every later commit to `main` will trigger a new production deployment. Work on a separate branch for unfinished changes so they produce preview deployments instead.

### If Cloudflare runs `npx wrangler deploy`

That is the wrong command for a Pages Git integration. The characteristic error is `Missing entry-point to Worker script or to assets directory`.

1. Open the Cloudflare project.
2. Open **Settings → Build** or **Settings → Builds & deployments**.
3. Edit the production build configuration.
4. Remove `npx wrangler deploy` from **Deploy command** so the field is empty.
5. Confirm that **Build command** is also empty and **Build output directory** is `dist`.
6. Save the configuration.
7. Open **Deployments**, select the failed deployment and retry it.

If Cloudflare will not allow an empty deploy command, the project was created as a Workers Builds project rather than a Pages Git-integration project. Do not add a Worker entry point to work around that mistake. Delete only that failed Cloudflare project and recreate it through **Workers & Pages → Create application → Pages → Connect to Git**. Your GitHub repository is unaffected.

## 5. Cloudflare direct upload — Method B, manual fallback

Use `London-Advanced-Editorial-Atlas-Cloudflare-v1.zip`. It contains `index.html`, `_headers`, JavaScript, CSS and the `assets` folder at the archive root.

1. In **Workers & Pages**, create a Pages application using **Direct Upload**.
2. Name the project `london-advanced-editorial-atlas`.
3. Upload the Cloudflare ZIP or drag the extracted files into the uploader.
4. Deploy and test the resulting address.

Direct Upload does not give you the same automatic GitHub deployment workflow. It is for a first test or emergency replacement, not the recommended maintenance model.

## 6. Add a Cloudflare custom subdomain

Do this only after the `*.pages.dev` version works.

1. Open the Pages project.
2. Open **Custom domains** and choose **Set up a custom domain**.
3. Enter a subdomain such as `hub.londonadvanced.com`.
4. Follow Cloudflare's DNS confirmation process.
5. Wait until the domain and certificate both show as active.
6. Open the custom address directly and test it before embedding it in Google Sites.

Do not move `www.londonadvanced.com` away from Google Sites at this stage. Use a subdomain for the Cloudflare page.

## 7. Embed it correctly in Google Sites

Use a **full-page embed**. Do not place this long homepage in a normal fixed-height embed block.

1. Open the London Advanced site in the Google Sites editor.
2. Open the **Pages** panel.
3. Select the new-page control and choose **Full page embed**.
4. Name the page `Home New` while testing.
5. Enter `https://hub.londonadvanced.com` or the working `*.pages.dev` address.
6. Publish the Google Site.
7. Test the published page on desktop and a real phone.
8. After it is confirmed, set the new page as the homepage or rename/reorganise the old and new pages.

Do not delete the old homepage until the new embedded page works on the published site. Google Sites preview is not enough.

The supplied `_headers` file permits framing from `https://www.londonadvanced.com` and `https://sites.google.com`. If you use a different Google Sites custom hostname, add it to the `frame-ancestors` line and redeploy.

## 8. Configure Google Analytics

### Parent Google Site

1. Create or select a GA4 property for London Advanced.
2. Copy its web measurement ID, beginning `G-`.
3. In Google Sites open **Settings → Analytics**.
4. Paste the ID and republish.

### Editorial Atlas and app clicks

1. Put the same `G-` ID in `dist/content.js`.
2. Commit the change to `main`.
3. Wait for Cloudflare to redeploy.
4. Open the homepage, allow analytics, click an app and check GA4 Realtime.

The embedded page has its own consent prompt because the Google Sites cookie choice does not reliably control scripts inside a separate Cloudflare iframe.

## 9. Configure Cloudflare Web Analytics

1. In Cloudflare open **Web Analytics**.
2. Add the Editorial Atlas Pages site.
3. Copy the JavaScript beacon token.
4. Replace `REPLACE_WITH_CLOUDFLARE_TOKEN` in `dist/content.js`.
5. Commit the change and wait for deployment.

Cloudflare Web Analytics measures page and performance traffic. GA4 is retained for consented interaction events such as app and guide clicks.

## 10. Normal updates

For app links, descriptions, social links or homepage cards:

1. Edit `dist/content.js` in GitHub.
2. Use **Commit changes**.
3. Commit directly to `main` only when the change is ready for production.
4. Check the Cloudflare deployment status.
5. Confirm the published Google Sites page after deployment.

For colours or layout, edit `dist/styles.css`. For page structure or tracking behaviour, edit `dist/app.js`.

## 11. Rollback

If a deployment is broken:

1. Open the Cloudflare Pages project.
2. Open **Deployments**.
3. Find the last known-good production deployment.
4. Use Cloudflare's rollback option if available, or revert the problematic GitHub commit and push the revert to `main`.

Restore the last working version first, then diagnose the change separately.
