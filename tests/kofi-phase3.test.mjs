import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const KOFI_URL = "https://ko-fi.com/paolopastorino";
const source = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const built = path => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");

test("Fare Calculator support uses central config and stays hidden until a user success", async () => {
  const [builder, app, translations, english, italian] = await Promise.all([
    source("scripts/build-fare-calculator.mjs"),
    source("apps/fare-calculator/fare-calculator-app.mjs"),
    source("apps/fare-calculator/translations.mjs"),
    built("apps/fare-calculator/en/index.html"),
    built("apps/fare-calculator/it/index.html")
  ]);

  assert.match(builder, /import \{ KOFI_URL \} from "\.\/site-config\.mjs"/);
  for (const html of [english, italian]) assert.ok(html.includes(`data-kofi-url="${KOFI_URL}"`));
  assert.match(translations, /That helped\? Buy me a flat white\./);
  assert.match(translations, /Ti è stato utile\? Offrimi un flat white\./);
  assert.match(app, /id="support" class="result-support hidden"/);
  assert.match(app, /target="_blank" rel="noopener noreferrer"/);
  assert.match(app, /calculate\(false\)/);
  assert.match(app, /els\.support\.classList\.toggle\("hidden", !scroll\)/);
  assert.match(app, /els\.support\.classList\.add\("hidden"\);\n    els\.results\.classList\.add\("hidden"\)/);
  assert.equal((app.match(/id="support"/g) || []).length, 1);
});

test("Loo Finder support is bilingual, secure and revealed only with result rows", async () => {
  const [english, italian, app] = await Promise.all([
    built("loo/index.html"),
    built("it/strumenti/trova-un-bagno/index.html"),
    built("loo/loo.js")
  ]);

  for (const [html, label] of [
    [english, "That helped? Buy me a flat white."],
    [italian, "Ti è stato utile? Offrimi un flat white."]
  ]) {
    assert.equal((html.match(/id="loo-support"/g) || []).length, 1);
    assert.ok(html.includes(`href="${KOFI_URL}" target="_blank" rel="noopener noreferrer">${label}</a>`));
    assert.match(html, /id="loo-support" class="result-support" hidden/);
  }
  assert.match(app, /support\.hidden=rows\.length===0/);
  assert.ok(app.indexOf("support.hidden=rows.length===0") > app.indexOf("map(rows,state.origin)"));
});

test("result support styling remains compact on narrow screens", async () => {
  const [fareCss, looCss] = await Promise.all([
    source("apps/fare-calculator/fare-calculator.css"),
    built("loo/loo.css")
  ]);
  assert.match(fareCss, /\.result-support \{[^}]*text-align: center[^}]*font-size: 0\.9rem/s);
  assert.match(looCss, /\.result-support\{[^}]*text-align:center[^}]*font-size:\.9rem/s);
});
