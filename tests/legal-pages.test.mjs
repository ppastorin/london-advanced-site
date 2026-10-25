import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = relative => readFile(new URL(`../dist/${relative}`, import.meta.url), "utf8");

test("bilingual privacy and copyright pages are generated with reciprocal language links", async () => {
  const [privacyEn, privacyIt, copyrightEn, copyrightIt] = await Promise.all([
    read("privacy/index.html"),
    read("it/privacy/index.html"),
    read("copyright/index.html"),
    read("it/copyright/index.html")
  ]);

  assert.match(privacyEn, /rel="canonical" href="https:\/\/www\.londonadvanced\.com\/privacy\/"/);
  assert.match(privacyEn, /hreflang="it-IT" href="https:\/\/www\.londonadvanced\.com\/it\/privacy\/"/);
  assert.match(privacyIt, /hreflang="en-GB" href="https:\/\/www\.londonadvanced\.com\/privacy\/"/);
  assert.match(copyrightEn, /rel="canonical" href="https:\/\/www\.londonadvanced\.com\/copyright\/"/);
  assert.match(copyrightIt, /rel="canonical" href="https:\/\/www\.londonadvanced\.com\/it\/copyright\/"/);
});

test("privacy notice reflects the site's real processing and makes the no-retention claim specific to tools", async () => {
  const privacy = await read("privacy/index.html");
  for (const marker of [
    "does not retain the locations, preferences or answers",
    "EmailOctopus",
    "Google Analytics",
    "Cloudflare Web Analytics",
    "la_contact_recent",
    "la_subscribe_recent",
    "Information Commissioner"
  ]) assert.ok(privacy.includes(marker), `Privacy page is missing ${marker}`);
  assert.ok(!privacy.includes("no personal data is retained"), "The page must not make a false site-wide no-retention claim.");
});

test("copyright terms reserve original content, data, interfaces and machine-learning reuse", async () => {
  const copyright = await read("copyright/index.html");
  for (const marker of [
    "original photographs",
    "database right",
    "scrape, crawl, harvest",
    "generative-AI or machine-learning system",
    "Copyright concerns and corrections",
    "All rights are reserved"
  ]) assert.ok(copyright.includes(marker), `Copyright page is missing ${marker}`);
});

test("both homepages expose legal links and collection-time privacy notices", async () => {
  const [english, italian] = await Promise.all([read("index.html"), read("it/index.html")]);
  for (const [html, privacyPath, copyrightPath] of [
    [english, "/privacy/", "/copyright/"],
    [italian, "/it/privacy/", "/it/copyright/"]
  ]) {
    assert.ok(html.includes(`href="${privacyPath}"`), `Homepage is missing ${privacyPath}`);
    assert.ok(html.includes(`href="${copyrightPath}"`), `Homepage is missing ${copyrightPath}`);
  }
  assert.match(english, /newsletter-consent[\s\S]*Privacy notice/);
  assert.match(italian, /newsletter-consent[\s\S]*Informativa sulla privacy/);
});
