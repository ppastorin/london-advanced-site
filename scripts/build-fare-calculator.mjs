import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const source = path.join(root, "apps/fare-calculator");
const destination = path.join(root, "dist/apps/fare-calculator");

function page(locale) {
  const italian = locale === "it";
  const language = italian ? "it-IT" : "en-GB";
  const title = italian ? "Calcolatore delle tariffe di Londra" : "London Travel Fare Calculator";
  const loading = italian ? "Caricamento del calcolatore…" : "Loading fare calculator…";
  const noScript = italian ? "Il calcolatore richiede JavaScript." : "The calculator requires JavaScript.";
  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex,follow">
  <title>${title} | London Advanced</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;700&family=Libre+Caslon+Display&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/apps/fare-calculator/fare-calculator.css">
</head>
<body data-locale="${locale}">
  <div id="fare-calculator-app" aria-live="polite"><p class="loading">${loading}</p></div>
  <noscript>${noScript}</noscript>
  <script type="module" src="/apps/fare-calculator/fare-calculator-app.mjs"></script>
</body>
</html>`;
}

export async function buildFareCalculator() {
  await mkdir(path.join(destination, "en"), { recursive: true });
  await mkdir(path.join(destination, "it"), { recursive: true });
  for (const name of ["fare-config.mjs", "fare-engine.mjs", "translations.mjs", "fare-calculator-app.mjs", "fare-calculator.css"]) {
    await copyFile(path.join(source, name), path.join(destination, name));
  }
  await Promise.all([
    writeFile(path.join(destination, "en/index.html"), page("en"), "utf8"),
    writeFile(path.join(destination, "it/index.html"), page("it"), "utf8")
  ]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildFareCalculator();

