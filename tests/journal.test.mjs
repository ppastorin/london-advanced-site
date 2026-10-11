import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isPublicPair } from "../scripts/build-journal.mjs";
import { handleDecapAuth, handleDecapCallback } from "../worker/index.mjs";

const approved = {
  article_id: "test-article",
  editorial_status: "published",
  published_at: "2026-09-27T09:00:00+01:00",
  approval: {
    status: "approved",
    approved_by: "Paolo Pastorino",
    approved_at: "2026-09-27T08:55:00+01:00"
  }
};

test("publication gate requires two fully approved language records", () => {
  assert.equal(isPublicPair(approved, approved), true);
  assert.equal(isPublicPair({ ...approved, editorial_status: "review" }, approved), false);
  assert.equal(isPublicPair({ ...approved, approval: { ...approved.approval, approved_by: "" } }, approved), false);
  assert.equal(isPublicPair(approved, null), false);
});

test("the approved bilingual launch articles pass the publication gate", async () => {
  const articleIds = [
    "blackheath-greenwich-walk",
    "city-dragon-walk",
    "one-leadenhall-terrace",
    "quentin-blake-centre",
    "trinity-buoy-wharf",
    "va-east-storehouse",
    "magnificent-seven-cemeteries",
    "london-city-farms",
    "london-community-gardens"
  ];

  for (const articleId of articleIds) {
    const [english, italian] = await Promise.all([
      readFile(new URL(`../content/journal/${articleId}.en.json`, import.meta.url), "utf8").then(JSON.parse),
      readFile(new URL(`../content/journal/${articleId}.it.json`, import.meta.url), "utf8").then(JSON.parse)
    ]);
    assert.equal(english.article_id, italian.article_id);
    assert.equal(isPublicPair(english, italian), true);
    assert.equal(english.editorial_status, "published");
    assert.equal(italian.editorial_status, "published");
  }
});

test("new Journal articles expose indexable bilingual metadata and reciprocal links", async () => {
  const pages = [
    ["../dist/journal/magnificent-seven-cemeteries-london/index.html", "https://www.londonadvanced.com/journal/magnificent-seven-cemeteries-london/", "/it/journal/magnificent-seven-cimiteri-londra/"],
    ["../dist/it/journal/magnificent-seven-cimiteri-londra/index.html", "https://www.londonadvanced.com/it/journal/magnificent-seven-cimiteri-londra/", "/journal/magnificent-seven-cemeteries-london/"],
    ["../dist/journal/london-city-farms-free-community-guide/index.html", "https://www.londonadvanced.com/journal/london-city-farms-free-community-guide/", "/it/journal/city-farm-londra-gratuite-comunita/"],
    ["../dist/it/journal/city-farm-londra-gratuite-comunita/index.html", "https://www.londonadvanced.com/it/journal/city-farm-londra-gratuite-comunita/", "/journal/london-city-farms-free-community-guide/"],
    ["../dist/journal/london-community-gardens-hidden-green-spaces/index.html", "https://www.londonadvanced.com/journal/london-community-gardens-hidden-green-spaces/", "/it/journal/community-garden-londra-spazi-verdi-nascosti/"],
    ["../dist/it/journal/community-garden-londra-spazi-verdi-nascosti/index.html", "https://www.londonadvanced.com/it/journal/community-garden-londra-spazi-verdi-nascosti/", "/journal/london-community-gardens-hidden-green-spaces/"]
  ];

  for (const [file, canonical, alternate] of pages) {
    const html = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
    assert.match(html, /<meta property="og:type" content="article">/);
    assert.match(html, /<meta property="article:published_time" content="2026-10-12T00:23:45\+01:00">/);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/www\.londonadvanced\.com\/assets\/journal\//);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
    assert.ok(html.includes(`href="${alternate}" hreflang=`));
    assert.match(html, /"@type": "Article"/);
  }

  const reciprocalPages = [
    ["../dist/journal/highgate-cemetery-east-west-guide/index.html", "/journal/magnificent-seven-cemeteries-london/"],
    ["../dist/journal/wandle-trail-london-river-walk/index.html", "/journal/london-city-farms-free-community-guide/"],
    ["../dist/journal/wesleys-chapel-bunhill-fields-guide/index.html", "/journal/london-community-gardens-hidden-green-spaces/"]
  ];
  for (const [file, target] of reciprocalPages) {
    const html = await readFile(new URL(file, import.meta.url), "utf8");
    assert.ok(html.includes(`href="${target}"`), `${file} must link to ${target}`);
  }
});

test("article heroes preserve their configured crop focus in both languages", async () => {
  const [english, italian, dragonEnglish, dragonItalian, trinityEnglish, trinityItalian, styles] = await Promise.all([
    readFile(new URL("../dist/journal/blackheath-to-greenwich-walk/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/it/journal/passeggiata-blackheath-greenwich/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/journal/city-of-london-dragon-walk/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/it/journal/passeggiata-draghi-city-of-london/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/journal/trinity-buoy-wharf-lighthouse/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/it/journal/trinity-buoy-wharf-faro-londra/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/journal.css", import.meta.url), "utf8")
  ]);
  for (const html of [english, italian]) {
    assert.match(html, /class="journal-figure journal-hero-image"/);
    assert.match(html, /style="object-position: 50% 78%"/);
  }
  for (const html of [dragonEnglish, dragonItalian]) {
    assert.match(html, /style="object-position: 50% 12%"/);
  }
  for (const html of [trinityEnglish, trinityItalian]) {
    assert.match(html, /style="object-position: 50% 0%"/);
    assert.match(html, /class="journal-figure journal-hero-image journal-image-natural"/);
  }
  assert.match(styles, /\.article-body \.journal-figure img \{ height: auto; max-height: none; object-fit: contain; \}/);
});

test("Decap OAuth starts with state protection and exchanges a valid callback", async () => {
  const env = { GITHUB_OAUTH_ID: "client-id", GITHUB_OAUTH_SECRET: "client-secret" };
  const auth = await handleDecapAuth(new Request("https://www.londonadvanced.com/api/decap/auth?provider=github"), env);
  assert.equal(auth.status, 302);
  const redirect = new URL(auth.headers.get("location"));
  const state = redirect.searchParams.get("state");
  assert.ok(state);
  assert.equal(redirect.hostname, "github.com");
  const cookie = auth.headers.get("set-cookie").split(";")[0];
  const callback = new Request(`https://www.londonadvanced.com/api/decap/callback?provider=github&code=test-code&state=${state}`, {
    headers: { Cookie: cookie }
  });
  let exchangeBody;
  const response = await handleDecapCallback(callback, env, async (_url, options) => {
    exchangeBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ access_token: "test-token" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  });
  assert.equal(response.status, 200);
  assert.equal(exchangeBody.client_secret, "client-secret");
  const html = await response.text();
  assert.match(html, /authorization:github:success/);
  assert.match(html, /test-token/);
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
});

test("Decap OAuth rejects a callback with the wrong state", async () => {
  const response = await handleDecapCallback(
    new Request("https://www.londonadvanced.com/api/decap/callback?provider=github&code=test&state=wrong", {
      headers: { Cookie: "la_decap_oauth_state=expected" }
    }),
    { GITHUB_OAUTH_ID: "client-id", GITHUB_OAUTH_SECRET: "client-secret" },
    async () => { throw new Error("must not exchange"); }
  );
  assert.equal(response.status, 400);
});
