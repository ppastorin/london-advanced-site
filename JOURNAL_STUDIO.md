# London Advanced Journal Studio

## What this adds

- A private Decap CMS editor at `/studio/`.
- One bilingual article entry with English and Italian shown in the same editorial workflow.
- GitHub-backed drafts, review branches and revision history.
- Static English and Italian Journal indexes and article pages.
- Article, Person, CollectionPage, ItemList and BreadcrumbList structured data.
- Canonical, `en-GB`, `it-IT` and `x-default` links.
- Automatic homepage cards, sitemap entries, Atom feed and relevant-tool pathways.
- A hard publication gate: neither language can go live until both are complete, marked Published and carry an approval record.

Decap CMS is MIT-licensed and the self-hosted application has no licence fee. GitHub and Cloudflare remain subject to the limits of the account plans already in use.

## Content model

Each article is stored as a locale pair:

```text
content/journal/<article-id>.en.json
content/journal/<article-id>.it.json
```

The permanent `article_id` joins the pair. Each language can have its own headline, search metadata, body, slug, captions, alternative text and practical copy. Dates, sources, related tools and workflow state are kept aligned by the Studio.

Published output is generated under:

```text
/journal/<english-slug>/
/it/journal/<italian-slug>/
```

## Workflow

1. **Draft** — writing and image selection are incomplete.
2. **Ready for Paolo** — the two versions are ready to review in the Studio preview.
3. **Approved** — Paolo has accepted content and presentation.
4. **Published** — the Decap editorial workflow merges the content change into `main`.

The site compiler independently enforces publication. A record appears publicly only when:

- English and Italian files both exist;
- both have `editorial_status: published`;
- both have `approval.status: approved`;
- `approved_by`, `approved_at` and `published_at` are present.

This means a mistaken click or incomplete translation does not silently publish an article.

## Image intake

For the initial six articles, Google Drive is the source archive. No manifest is required. Images are visually reviewed, selected and imported into `assets/journal/` with captions and alternative text prepared in the Studio.

For later self-managed articles, images can be uploaded in the Studio. Decap converts supported uploads to WebP, limits them to 2400 pixels wide, compresses them at 86% quality and removes embedded metadata. Originals should remain in Google Drive.

## Local commands

```bash
npm run prerender          # production-safe build; excludes drafts
npm run prerender:preview  # also creates noindex draft preview routes
npm test                   # structural, content, security and application tests
npm run preview            # local Cloudflare Worker preview
```

## One-time production activation

The Studio uses the existing Cloudflare Worker as a GitHub OAuth proxy. This avoids Netlify, Decap Turbo and another paid platform. A GitHub OAuth App must still be registered once because Cloudflare Access proves identity to Cloudflare but does not grant write permission to GitHub.

Create a GitHub OAuth App with:

- Homepage URL: `https://www.londonadvanced.com/studio/`
- Authorization callback URL: `https://www.londonadvanced.com/api/decap/callback?provider=github`

Add the resulting values to the `london-advanced-site` Worker as encrypted secrets:

- `GITHUB_OAUTH_ID`
- `GITHUB_OAUTH_SECRET`

The OAuth implementation uses a short-lived, HttpOnly state cookie and rejects callbacks with missing or mismatched state.

Finally, extend the existing Cloudflare Access application to protect `/studio/*` for the site owner. GitHub authentication is still required inside the protected route because it supplies the repository permission used by Decap.

## First design proof

`va-east-storehouse` is included as an English/Italian draft. It is intentionally not publishable and uses the London map as a clearly labelled temporary image. Replace that image after the Google Drive folder is shared, then use this article to settle voice, length and image rhythm before drafting the other five.
