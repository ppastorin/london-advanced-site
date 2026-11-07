import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderArticleSupport } from "../scripts/build-journal.mjs";

const KOFI_URL = "https://ko-fi.com/paolopastorino";
const read = path => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");

test("shared Journal support renderer is bilingual and secure", () => {
  const english = renderArticleSupport("en");
  const italian = renderArticleSupport("it");
  assert.match(english, /Enjoyed this article\? Buy me a flat white\./);
  assert.match(italian, /Ti è piaciuto l'articolo\? Offrimi un flat white\./);
  for (const html of [english, italian]) {
    assert.ok(html.includes(`href="${KOFI_URL}"`));
    assert.match(html, /target="_blank" rel="noopener noreferrer"/);
    assert.equal((html.match(/class="journal-support"/g) || []).length, 1);
  }
});

test("generated EN and IT articles place one discreet support link after the guide promotion", async () => {
  for (const [path, guidePath, label] of [
    ["journal/camden-passage-angel-islington-guide/index.html", "/the-other-london/", "Enjoyed this article? Buy me a flat white."],
    ["it/journal/camden-passage-angel-islington-guida/index.html", "/it/the-other-london/", "Ti è piaciuto l'articolo? Offrimi un flat white."]
  ]) {
    const html = await read(path);
    const guide = html.indexOf(`href="${guidePath}"`);
    const support = html.indexOf('class="journal-support"');
    const newsletter = html.indexOf('class="journal-newsletter"');
    assert.ok(guide >= 0, `${path} is missing its guide promotion`);
    assert.ok(guide < support && support < newsletter, `${path} has the wrong CTA order`);
    assert.equal((html.match(/class="journal-support"/g) || []).length, 1);
    assert.ok(html.includes(`href="${KOFI_URL}" target="_blank" rel="noopener noreferrer">${label}</a>`));
  }
});

test("Journal support styling remains secondary to the guide promotion", async () => {
  const styles = await read("journal.css");
  assert.match(styles, /\.journal-support \{[^}]*padding: 22px[^}]*text-align: center/s);
  assert.match(styles, /\.journal-support a \{[^}]*font-size: 14px/s);
});
