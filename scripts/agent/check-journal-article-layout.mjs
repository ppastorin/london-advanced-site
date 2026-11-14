import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

const [css, english, italian] = await Promise.all([
  read("journal.css"),
  read("dist/journal/camden-passage-angel-islington-guide/index.html"),
  read("dist/it/journal/camden-passage-angel-islington-guida/index.html")
]);

assert.match(css, /@media \(min-width: 981px\) \{[\s\S]*?\.journal-hero-image img \{ height: clamp\(320px, 38vw, 540px\); \}/);
assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\.journal-hero-image img \{ height: 72vw; \}/);

for (const [label, html] of [["English", english], ["Italian", italian]]) {
  for (const marker of [
    'class="site-nav"',
    'class="desktop-nav"',
    'class="nav-dropdown mobile-menu"',
    'class="article-header"',
    'class="journal-support"',
    'class="journal-practical"',
    'class="journal-figure journal-hero-image"',
    'class="article-layout"',
    'class="footer-meta"'
  ]) assert.ok(html.includes(marker), `${label} article is missing ${marker}`);
  assert.ok(html.includes('href="https://ko-fi.com/paolopastorino"'), `${label} article is missing Ko-fi`);
}

console.log("Journal desktop layout check passed: 2 articles, preserved mobile rules and required navigation/CTA markers.");
