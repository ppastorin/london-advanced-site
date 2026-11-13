import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderArticleSupport } from "../scripts/build-journal.mjs";

const KOFI_URL = "https://ko-fi.com/paolopastorino";
const read = path => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");

test("shared Journal support renderer is bilingual and secure", () => {
  const english = renderArticleSupport("en", "header");
  const italian = renderArticleSupport("it", "header");
  assert.match(english, /Enjoyed this article\? Buy me a flat white\./);
  assert.match(italian, /Ti è piaciuto l'articolo\? Offrimi un flat white\./);
  for (const html of [english, italian]) {
    assert.ok(html.includes(`href="${KOFI_URL}"`));
    assert.match(html, /target="_blank" rel="noopener noreferrer"/);
    assert.equal((html.match(/class="journal-support"/g) || []).length, 1);
  }
});

test("generated EN and IT articles place one visible support link before At a glance", async () => {
  for (const [path, guidePath, label] of [
    ["journal/camden-passage-angel-islington-guide/index.html", "/the-other-london/", "Enjoyed this article? Buy me a flat white."],
    ["it/journal/camden-passage-angel-islington-guida/index.html", "/it/the-other-london/", "Ti è piaciuto l'articolo? Offrimi un flat white."]
  ]) {
    const html = await read(path);
    const header = html.indexOf('class="article-header"');
    const support = html.indexOf('class="journal-support"');
    const practical = html.indexOf('class="journal-practical"');
    const guide = html.indexOf('class="journal-tools"');
    assert.ok(guide >= 0 && html.includes(`href="${guidePath}"`), `${path} is missing its guide promotion`);
    assert.ok(header < support && support < practical && practical < guide, `${path} has the wrong CTA order`);
    assert.equal((html.match(/class="journal-support"/g) || []).length, 1);
    assert.ok(html.includes(`href="${KOFI_URL}" target="_blank" rel="noopener noreferrer">${label}</a>`));
  }
});

test("Journal support styling is prominent and compact in the article header", async () => {
  const styles = await read("journal.css");
  assert.match(styles, /\.article-header-aside \{[^}]*display: grid[^}]*gap: 34px/s);
  assert.match(styles, /\.journal-support \{[^}]*padding: 22px[^}]*border-left: 4px solid var\(--journal-red\)[^}]*background: var\(--journal-cream\)/s);
  assert.match(styles, /\.journal-support a \{[^}]*display: inline-flex[^}]*min-height: 48px[^}]*font-size: 15px/s);
});
