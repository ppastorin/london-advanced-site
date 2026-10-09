import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(target));
    else if (entry.name.endsWith(".html")) files.push(target);
  }
  return files;
}

test("every complete site menu links to the locale-matched itinerary index", async () => {
  let checked = 0;
  for (const file of await htmlFiles(dist)) {
    if (file.includes(`${path.sep}studio${path.sep}`)) continue;
    const html = await readFile(file, "utf8");
    const header = html.match(/<header class="site-nav">[\s\S]*?<\/header>/)?.[0] || "";
    if (!header.includes('class="desktop-nav"')) continue;

    const italian = /<html lang="it(?:-IT)?"/i.test(html) || file.includes(`${path.sep}it${path.sep}`);
    const href = italian ? "/it/itinerari/" : "/itineraries/";
    const matches = header.match(new RegExp(`href="${href}"`, "g")) || [];
    assert.ok(matches.length >= 2, `${path.relative(root, file)} must link to ${href} in desktop and mobile navigation`);
    checked += 1;
  }
  assert.ok(checked >= 40, "expected to validate the complete navigation across the rendered site");
});

test("the itinerary index and detail menus expose the correct active section", async () => {
  for (const file of [
    "dist/itineraries/index.html",
    "dist/itineraries/wimbledon-without-tennis/index.html",
    "dist/it/itinerari/index.html",
    "dist/it/itinerari/wimbledon-senza-tennis/index.html"
  ]) {
    const html = await readFile(path.join(root, file), "utf8");
    const header = html.match(/<header class="site-nav">[\s\S]*?<\/header>/)?.[0] || "";
    assert.match(header, /href="\/(?:it\/itinerari|itineraries)\/" aria-current="page"/);
  }
});
