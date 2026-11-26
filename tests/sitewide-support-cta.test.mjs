import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const KOFI_URL = "https://ko-fi.com/paolopastorino";
const read = path => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");

const englishTools = [
  "home/london-dashboard/index.html",
  "home/escape-the-crowds/index.html",
  "home/travel-fare-calculator/index.html",
  "home/smart-navigation/index.html",
  "home/london-by-mood/index.html",
  "loo/index.html",
  "charity-shops/index.html",
  "bookshops/index.html",
  "markets/index.html"
];

const italianTools = [
  "it/strumenti/dashboard-londra/index.html",
  "it/strumenti/evita-la-folla/index.html",
  "it/strumenti/calcolatore-tariffe-trasporti/index.html",
  "it/strumenti/navigazione-intelligente/index.html",
  "it/strumenti/londra-per-umore/index.html",
  "it/strumenti/trova-un-bagno/index.html",
  "it/strumenti/negozi-di-beneficenza/index.html",
  "it/strumenti/librerie/index.html",
  "it/strumenti/mercati/index.html",
  "meteo-dress/index.html"
];

const mainPages = [
  "index.html", "it/index.html",
  "events/index.html", "it/eventi/index.html",
  "journal/index.html", "it/journal/index.html",
  "itineraries/index.html", "it/itinerari/index.html",
  "about/index.html", "it/chi-sono/index.html",
  "methodology/index.html", "it/metodologia/index.html",
  "press/index.html", "it/stampa/index.html",
  "the-other-london/index.html", "it/the-other-london/index.html"
];

async function assertProminent(path, action) {
  const html = await read(path);
  const cta = html.indexOf('data-sitewide-support="true"');
  const footer = html.indexOf("<footer");
  assert.ok(cta >= 0, `${path} is missing the prominent support CTA`);
  assert.ok(footer < 0 || cta < footer, `${path} keeps support in the footer`);
  assert.ok(html.includes(`href="${KOFI_URL}" target="_blank" rel="noopener noreferrer"`), `${path} has an unsafe or wrong support link`);
  assert.ok(html.includes(action), `${path} has the wrong support action`);
  assert.equal((html.match(/data-sitewide-support="true"/g) || []).length, 1, `${path} duplicates the sitewide CTA`);
  assert.ok(html.includes('<link rel="stylesheet" href="/support-cta.css">'), `${path} is missing support CTA styling`);
}

test("every public tool has one prominent bilingual support CTA", async () => {
  for (const path of englishTools) await assertProminent(path, "Buy me a flat white");
  for (const path of italianTools) await assertProminent(path, "Offrimi un flat white");
});

test("main English and Italian pages have one prominent support CTA", async () => {
  for (const path of mainPages) {
    await assertProminent(path, path.startsWith("it/") ? "Offrimi un flat white" : "Buy me a flat white");
  }
});

test("support CTA stylesheet is responsive and tool shells allocate a grid row", async () => {
  const css = await read("support-cta.css");
  assert.match(css, /\.sitewide-support\s*\{[^}]*display:\s*grid[^}]*border-left:\s*4px solid/s);
  assert.match(css, /\.sitewide-support__action\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.tool-shell\[data-has-sitewide-support="true"\]\s*\{[^}]*grid-template-rows:\s*auto auto minmax\(0,\s*1fr\) auto/s);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*\.sitewide-support__action\s*\{[^}]*width:\s*100%/s);
});
