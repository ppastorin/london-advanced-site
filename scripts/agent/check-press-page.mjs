import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const failures = [];

async function checkFile(relativePath, markers) {
  let content = "";
  try {
    content = await readFile(path.join(root, relativePath), "utf8");
  } catch {
    failures.push(`${relativePath}: missing`);
    return;
  }
  for (const marker of markers) {
    if (!content.includes(marker)) failures.push(`${relativePath}: missing ${marker}`);
  }
}

await checkFile("dist/press/index.html", [
  'rel="canonical" href="https://www.londonadvanced.com/press/"',
  'hreflang="it-IT" href="https://www.londonadvanced.com/it/stampa/"',
  "Editorial mission",
  "Platform innovations",
  "Platform scale",
  "Languages",
  "Original photography",
  "Media contact"
]);

await checkFile("dist/it/stampa/index.html", [
  'rel="canonical" href="https://www.londonadvanced.com/it/stampa/"',
  'hreflang="en-GB" href="https://www.londonadvanced.com/press/"',
  "Missione editoriale",
  "Innovazioni della piattaforma",
  "Dimensioni della piattaforma",
  "Lingue",
  "Fotografia originale",
  "Contatti per i media"
]);

await checkFile("dist/app.js", [
  'href="#contact"',
  'href="/press/"'
]);

const app = await readFile(path.join(root, "dist/app.js"), "utf8");
if (app.includes('contact-nav" type="button"')) {
  failures.push("dist/app.js: Contact remains a JavaScript-only button");
}

for (const [relativePath, forbidden] of [
  ["dist/press/index.html", ["2,500+", "Facebook community members"]],
  ["dist/it/stampa/index.html", ["2.500+", "Membri della community Facebook"]]
]) {
  const content = await readFile(path.join(root, relativePath), "utf8");
  for (const marker of forbidden) {
    if (content.includes(marker)) failures.push(`${relativePath}: still contains ${marker}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(`Press page check: ${failures.length} failure(s)`);
  process.exitCode = 1;
} else {
  console.log("Press page check: 0 failures");
}
