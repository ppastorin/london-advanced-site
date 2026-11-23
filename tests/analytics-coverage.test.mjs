import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

async function htmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(target));
    else if (entry.name.endsWith(".html")) files.push(target);
  }
  return files;
}

test("one analytics loader covers every eligible public EN/IT page", async () => {
  let eligible = 0;
  for (const file of await htmlFiles("dist")) {
    const relative = path.relative("dist", file).replaceAll(path.sep, "/");
    const html = await readFile(file, "utf8");
    if (relative.startsWith("studio/") || relative === "404.html" ||
        /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html) ||
        /<meta\s+http-equiv="refresh"/i.test(html) || !html.includes("</body>")) continue;
    eligible++;
    assert.equal((html.match(/src="\/analytics\.js"/g) || []).length, 1, relative);
    assert.equal((html.match(/href="\/analytics\.css"/g) || []).length, 1, relative);
  }
  assert.ok(eligible >= 80, `Expected broad public coverage, saw ${eligible}`);
  for (const relative of ["studio/index.html", "wtm/demo/index.html"]) {
    assert.doesNotMatch(await readFile(`dist/${relative}`, "utf8"), /src="\/analytics\.js"/);
  }
});

test("GA4 loads once with a page view only after consent and respects refusal and revocation", async () => {
  const code = await readFile("dist/analytics.js", "utf8");
  for (const initial of [null, "no", "yes"]) {
    let saved = initial;
    const scripts = [];
    const buttons = [];
    const consent = {
      dataset: {},
      setAttribute() {}, remove() {},
      querySelectorAll() { return buttons; },
      set innerHTML(markup) {
        assert.match(markup, /privacy|privacy\//);
        for (const value of ["no", "yes"]) buttons.push({ dataset: { consent: value }, addEventListener(_name, cb) { this.click = cb; } });
      }
    };
    const context = {
      Date, encodeURIComponent,
      window: {},
      localStorage: { getItem() { return saved; }, setItem(_key, value) { saved = value; }, removeItem() { saved = null; } },
      document: {
        documentElement: { lang: "en-GB" },
        createElement() { return { dataset: {} }; },
        head: { appendChild(node) { scripts.push(node); } },
        body: { appendChild() {} }
      }
    };
    context.document.createElement = tag => tag === "div" ? consent : { dataset: {} };
    vm.runInNewContext(code, context);
    const gaScripts = () => scripts.filter(script => script.src?.includes("googletagmanager"));
    assert.equal(gaScripts().length, initial === "yes" ? 1 : 0);
    assert.equal(scripts.filter(script => script.src?.includes("cloudflareinsights")).length, 1);
    if (initial === null) {
      buttons[0].click();
      assert.equal(gaScripts().length, 0);
    }
    if (initial === "yes") {
      assert.equal(context.window.dataLayer.filter(args => args[0] === "config").length, 1);
      assert.equal(context.window.dataLayer.find(args => args[0] === "config")[2].send_page_view, true);
      context.window.LAAnalytics.revoke();
      assert.equal(context.window["ga-disable-G-3ZQEZ6R171"], true);
    }
  }
});

test("Italian consent and post-consent page view", async () => {
  const code = await readFile("dist/analytics.js", "utf8");
  let choice = null;
  let buttons;
  const context = {
    Date, encodeURIComponent, window: {},
    localStorage: { getItem() { return choice; }, setItem(_key, value) { choice = value; } },
    document: {
      documentElement: { lang: "it-IT" },
      head: { appendChild() {} }, body: { appendChild() {} },
      createElement(tag) {
        if (tag !== "div") return { dataset: {} };
        return { setAttribute() {}, remove() {}, set innerHTML(value) { assert.match(value, /No, grazie/); },
          querySelectorAll() { return buttons = ["no", "yes"].map(value => ({ dataset: { consent: value }, addEventListener(_event, cb) { this.click = cb; } })); } };
      }
    }
  };
  vm.runInNewContext(code, context);
  buttons[1].click();
  assert.equal(choice, "yes");
  assert.equal(context.window.dataLayer.filter(args => args[0] === "config").length, 1);
});
