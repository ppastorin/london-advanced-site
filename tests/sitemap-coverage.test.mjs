import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { collectIndexableCanonicalUrls, parseSitemap } from "../scripts/build-sitemap.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

test("sitemap exactly covers every public indexable canonical page", async () => {
  const canonicalUrls = [...await collectIndexableCanonicalUrls(dist)].sort();
  const sitemap = parseSitemap(await readFile(path.join(dist, "sitemap.xml"), "utf8"));
  const sitemapUrls = sitemap.map(entry => entry.loc);

  assert.equal(sitemapUrls.length, new Set(sitemapUrls).size, "sitemap must not contain duplicate URLs");
  assert.deepEqual([...sitemapUrls].sort(), canonicalUrls);
});

test("The Other London bilingual guide is included", async () => {
  const sitemap = parseSitemap(await readFile(path.join(dist, "sitemap.xml"), "utf8"));
  const urls = new Set(sitemap.map(entry => entry.loc));

  assert(urls.has("https://www.londonadvanced.com/the-other-london/"));
  assert(urls.has("https://www.londonadvanced.com/it/the-other-london/"));
});
