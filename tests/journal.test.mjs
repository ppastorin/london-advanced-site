import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isPublicPair } from "../scripts/build-journal.mjs";
import { handleDecapAuth, handleDecapCallback, handleMediaCommit } from "../worker/index.mjs";

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

test("Studio media publication creates a protected pull request with source and deployed paths", async () => {
  const sha = "a".repeat(40);
  let createdTree;
  let createdRef;
  let createdPullRequest;
  const fetchImpl = async (url, options = {}) => {
    const pathname = new URL(url).pathname + new URL(url).search;
    if (pathname === "/repos/ppastorin/london-advanced-site") {
      return Response.json({ permissions: { push: true } });
    }
    if (pathname.endsWith("/git/ref/heads/main")) return Response.json({ object: { sha: "base-commit" } });
    if (pathname.endsWith("/git/commits/base-commit")) return Response.json({ tree: { sha: "base-tree" } });
    if (pathname.endsWith("/git/trees/base-tree?recursive=1")) return Response.json({ tree: [], truncated: false });
    if (pathname.endsWith("/git/trees") && options.method === "POST") {
      createdTree = JSON.parse(options.body);
      return Response.json({ sha: "next-tree" });
    }
    if (pathname.endsWith("/git/commits") && options.method === "POST") {
      return Response.json({ sha: "next-commit" });
    }
    if (pathname.endsWith("/git/refs") && options.method === "POST") {
      createdRef = JSON.parse(options.body);
      return Response.json({ object: { sha: "next-commit" } }, { status: 201 });
    }
    if (pathname.endsWith("/pulls") && options.method === "POST") {
      createdPullRequest = JSON.parse(options.body);
      return Response.json({ number: 91, html_url: "https://github.com/ppastorin/london-advanced-site/pull/91" }, { status: 201 });
    }
    throw new Error(`Unexpected GitHub request: ${pathname}`);
  };
  const response = await handleMediaCommit(new Request("https://www.londonadvanced.com/api/studio/media/commit", {
    method: "POST",
    headers: {
      Origin: "https://www.londonadvanced.com",
      Authorization: "Bearer test-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      entries: [{ path: "assets/instagram/001-weekend/cover.jpg", sha }],
      message: "media: test Instagram upload",
      allowOverwrite: false
    })
  }), fetchImpl);
  assert.equal(response.status, 200);
  assert.deepEqual(createdTree.tree.map(entry => entry.path), [
    "assets/instagram/001-weekend/cover.jpg",
    "dist/assets/instagram/001-weekend/cover.jpg"
  ]);
  assert.match(createdRef.ref, /^refs\/heads\/studio-media\//);
  assert.equal(createdRef.sha, "next-commit");
  assert.equal(createdPullRequest.base, "main");
  assert.match(createdPullRequest.head, /^studio-media\//);
  assert.deepEqual(await response.json(), {
    ok: true,
    count: 1,
    commitSha: "next-commit",
    commitUrl: "https://github.com/ppastorin/london-advanced-site/commit/next-commit",
    pullRequestNumber: 91,
    pullRequestUrl: "https://github.com/ppastorin/london-advanced-site/pull/91",
    status: "validation_pending"
  });
});

test("Studio media publication reports recoverable missing blobs", async () => {
  const fetchImpl = async (url, options = {}) => {
    const pathname = new URL(url).pathname + new URL(url).search;
    if (pathname === "/repos/ppastorin/london-advanced-site") return Response.json({ permissions: { push: true } });
    if (pathname.endsWith("/git/ref/heads/main")) return Response.json({ object: { sha: "base-commit" } });
    if (pathname.endsWith("/git/commits/base-commit")) return Response.json({ tree: { sha: "base-tree" } });
    if (pathname.endsWith("/git/trees/base-tree?recursive=1")) return Response.json({ tree: [], truncated: false });
    if (pathname.endsWith("/git/trees") && options.method === "POST") {
      return Response.json({ message: "not a valid object" }, { status: 422 });
    }
    throw new Error(`Unexpected GitHub request: ${pathname}`);
  };
  const response = await handleMediaCommit(new Request("https://www.londonadvanced.com/api/studio/media/commit", {
    method: "POST",
    headers: { Origin: "https://www.londonadvanced.com", Authorization: "Bearer test-token" },
    body: JSON.stringify({ entries: [{ path: "assets/instagram/cover.jpg", sha: "b".repeat(40) }] })
  }), fetchImpl);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "missing_blobs");
});

test("Studio media publication builds large batches in chained tree chunks", async () => {
  const entries = Array.from({ length: 60 }, (_, index) => ({
    path: `assets/instagram/weekend/image-${index}.jpg`,
    sha: index.toString(16).padStart(40, "0")
  }));
  const treeBodies = [];
  const fetchImpl = async (url, options = {}) => {
    const pathname = new URL(url).pathname + new URL(url).search;
    if (pathname === "/repos/ppastorin/london-advanced-site") return Response.json({ permissions: { push: true } });
    if (pathname.endsWith("/git/ref/heads/main")) return Response.json({ object: { sha: "base-commit" } });
    if (pathname.endsWith("/git/commits/base-commit")) return Response.json({ tree: { sha: "base-tree" } });
    if (pathname.endsWith("/git/trees/base-tree?recursive=1")) return Response.json({ tree: [], truncated: false });
    if (pathname.endsWith("/git/trees") && options.method === "POST") {
      const body = JSON.parse(options.body);
      treeBodies.push(body);
      return Response.json({ sha: `tree-${treeBodies.length}` }, { status: 201 });
    }
    if (pathname.endsWith("/git/commits") && options.method === "POST") {
      assert.equal(JSON.parse(options.body).tree, "tree-2");
      return Response.json({ sha: "next-commit" }, { status: 201 });
    }
    if (pathname.endsWith("/git/refs") && options.method === "POST") return Response.json({ object: { sha: "next-commit" } }, { status: 201 });
    if (pathname.endsWith("/pulls") && options.method === "POST") return Response.json({ number: 92, html_url: "https://github.com/ppastorin/london-advanced-site/pull/92" }, { status: 201 });
    throw new Error(`Unexpected GitHub request: ${pathname}`);
  };
  const response = await handleMediaCommit(new Request("https://www.londonadvanced.com/api/studio/media/commit", {
    method: "POST",
    headers: { Origin: "https://www.londonadvanced.com", Authorization: "Bearer test-token" },
    body: JSON.stringify({ entries })
  }), fetchImpl);
  assert.equal(response.status, 200);
  assert.equal(treeBodies.length, 2);
  assert.equal(treeBodies[0].base_tree, "base-tree");
  assert.equal(treeBodies[0].tree.length, 100);
  assert.equal(treeBodies[1].base_tree, "tree-1");
  assert.equal(treeBodies[1].tree.length, 20);
});
