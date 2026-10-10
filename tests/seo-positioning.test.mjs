import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

test("The Other London owns the broad unusual-things-to-do search intent", async () => {
  const html = await readFile(path.join(dist, "the-other-london", "index.html"), "utf8");

  assert.match(html, /<title>Unusual things to do in London: 110 places \| London Advanced<\/title>/);
  assert.match(html, /<h1>Unusual things to do in London,/);
  assert.match(html, /Four ways to get off the beaten track\./);
  assert.match(html, /16 unusual London places to start with\./);
  assert.match(html, /"@type":"ItemList"/);
  assert.match(html, /href="\/journal\/wandle-trail-london-river-walk\/"/);
});

test("homepage points to the SEO pillar with descriptive link text", async () => {
  const html = await readFile(path.join(dist, "index.html"), "utf8");

  assert.match(html, /Find unusual things to do →<\/a>/);
  assert.match(html, /Explore 110 unusual London places<\/a>/);
  assert.match(html, /<title>London Advanced — unusual places, tools and local guides<\/title>/);
});

test("every published English Journal article links to the unusual-London pillar", async () => {
  const journal = path.join(dist, "journal");
  const slugs = (await readdir(journal, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && !entry.name.startsWith("_"))
    .map(entry => entry.name);

  assert.ok(slugs.length >= 12, "expected the published English Journal articles");
  for (const slug of slugs) {
    const html = await readFile(path.join(journal, slug, "index.html"), "utf8");
    assert.match(html, /href="\/the-other-london\/"/, `${slug} should link to The Other London`);
    assert.match(html, /Explore 110 unusual things to do and places to see across London\./, `${slug} should use descriptive guide context`);
  }
});
