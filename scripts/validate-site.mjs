import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const failures = [];

function fail(message) {
  failures.push(message);
}

function requireFile(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    fail(`Missing required file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

const requiredAssets = [
  "dist/index.html",
  "dist/styles.css",
  "dist/app.js",
  "dist/content.js",
  "dist/data/events.json",
  "dist/events/index.html",
  "dist/events/events.js",
  "dist/tool-page.css",
  "dist/tool-page.js",
  "dist/_headers",
  "dist/_redirects",
  "dist/404.html",
  "dist/robots.txt",
  "dist/sitemap.xml",
  "dist/assets/guide-cover.jpg",
  "dist/assets/london-map.jpg"
];
requiredAssets.forEach(requireFile);

const wranglerText = requireFile("wrangler.jsonc");
try {
  const wrangler = JSON.parse(wranglerText);
  if (wrangler.assets?.directory !== "./dist") fail('wrangler.jsonc must set assets.directory to "./dist".');
  if (wrangler.assets?.not_found_handling !== "404-page") fail('wrangler.jsonc must use not_found_handling "404-page".');
} catch (error) {
  fail(`wrangler.jsonc is not valid JSON: ${error.message}`);
}

const expectedTools = new Map([
  ["london-dashboard", {
    href: "/home/london-dashboard/",
    embedUrl: "https://london-now.ppastorin.workers.dev/"
  }],
  ["escape-the-crowds", {
    href: "/home/escape-the-crowds/",
    embedUrl: "https://london-advanced-crowd-pressure.ppastorin.workers.dev/"
  }],
  ["travel-fare-calculator", {
    href: "/home/travel-fare-calculator/",
    embedUrl: "https://script.google.com/macros/s/AKfycby3upcYSg-jR3idu9_aUbeT_ooAPLF5D-5fjxDbrERvULyLUsp1mxPGzEa9GyByX6WjPg/exec"
  }],
  ["smart-navigation", {
    href: "/home/smart-navigation/",
    embedUrl: "https://script.google.com/macros/s/AKfycbxcjGjLqBgTqItDVRKspQTDE__wL6y7WAd2Lr617vOfhzrqMX9tvKEXW6_OxbfK2Yz34w/exec"
  }],
  ["london-by-mood", {
    href: "/home/london-by-mood/",
    embedUrl: "https://london-by-mood.ppastorin.workers.dev/"
  }]
]);

const contentText = requireFile("dist/content.js");
const appText = requireFile("dist/app.js");
const stylesText = requireFile("dist/styles.css");
if (!appText.includes('id="events"') || !appText.includes('fetch("/data/events.json"') || !appText.includes('href="/events/"')) {
  fail("The homepage event component or its JSON feed request is missing.");
}
if (!stylesText.includes(".events-section") || !stylesText.includes(".event-card")) {
  fail("The homepage event component styles are missing.");
}
const sandbox = { window: {} };
try {
  vm.runInNewContext(contentText, sandbox, { filename: "dist/content.js" });
  const data = sandbox.window.LONDON_ADVANCED;
  if (!data) {
    fail("dist/content.js did not create window.LONDON_ADVANCED.");
  } else {
    if (data.links?.home !== "/") fail('The portal home link must be relative: "/".');
    if (!Array.isArray(data.apps) || data.apps.length !== expectedTools.size) {
      fail(`Expected ${expectedTools.size} tools in dist/content.js.`);
    } else {
      for (const tool of data.apps) {
        const expected = expectedTools.get(tool.id);
        if (!expected) {
          fail(`Unexpected tool id: ${tool.id}`);
          continue;
        }
        if (tool.href !== expected.href) fail(`${tool.id} has an incorrect internal route: ${tool.href}`);
        if (tool.embedUrl !== expected.embedUrl) fail(`${tool.id} has an incorrect embed URL: ${tool.embedUrl}`);
        if (tool.embedUrl.includes("/dev")) fail(`${tool.id} uses an Apps Script /dev URL; production must use /exec.`);

        const routeFile = path.join(distRoot, tool.href.replace(/^\//, ""), "index.html");
        if (!fs.existsSync(routeFile)) {
          fail(`Missing route page for ${tool.id}: ${path.relative(projectRoot, routeFile)}`);
          continue;
        }
        const routeHtml = fs.readFileSync(routeFile, "utf8");
        if (!routeHtml.includes(`data-tool-id="${tool.id}"`)) fail(`${tool.href} has the wrong data-tool-id.`);
        if (!routeHtml.includes(`<link rel="canonical" href="https://www.londonadvanced.com${tool.href}">`)) {
          fail(`${tool.href} is missing its canonical URL.`);
        }
      }
    }
  }
} catch (error) {
  fail(`dist/content.js could not be evaluated: ${error.message}`);
}

const textExtensions = new Set([".html", ".js", ".css", ".json", ".xml", ".txt"]);
const textFiles = walk(distRoot).filter(file => textExtensions.has(path.extname(file)) || ["_headers", "_redirects"].includes(path.basename(file)));
const navigableText = textFiles
  .filter(file => path.basename(file) !== "_headers")
  .map(file => fs.readFileSync(file, "utf8"))
  .join("\n");

if (/sites\.google\.com/i.test(navigableText)) fail("A navigable Google Sites URL remains under dist/.");
if (/script\.google\.com\/macros\/s\/[^\s\"']+\/dev(?:[\s\"'?]|$)/i.test(navigableText)) {
  fail("An Apps Script /dev URL remains under dist/.");
}

for (const forbiddenName of ["wrangler.jsonc", "README.md", "INSTALL.md", "package.json"] ) {
  if (walk(distRoot).some(file => path.basename(file) === forbiddenName)) fail(`Sensitive/control file must not be published in dist/: ${forbiddenName}`);
}

const headers = requireFile("dist/_headers");
if (!headers.includes("/data/events.json") || !headers.includes("max-age=300")) {
  fail("dist/_headers must give the events feed a five-minute cache policy.");
}
for (const requiredFrameHost of [
  "london-now.ppastorin.workers.dev",
  "london-advanced-crowd-pressure.ppastorin.workers.dev",
  "london-by-mood.ppastorin.workers.dev",
  "script.google.com"
]) {
  if (!headers.includes(requiredFrameHost)) fail(`dist/_headers does not allow iframe host: ${requiredFrameHost}`);
}

const sitemap = requireFile("dist/sitemap.xml");
if (!sitemap.includes("https://www.londonadvanced.com/events/")) fail("Sitemap is missing /events/.");
for (const { href } of expectedTools.values()) {
  if (!sitemap.includes(`https://www.londonadvanced.com${href}`)) fail(`Sitemap is missing ${href}`);
}

const eventsHtml = requireFile("dist/events/index.html");
const eventsScript = requireFile("dist/events/events.js");
if (!eventsHtml.includes('<link rel="canonical" href="https://www.londonadvanced.com/events/">')) {
  fail("The full events page is missing its canonical URL.");
}
if (!eventsHtml.includes('data-events-list') || !eventsHtml.includes('/events/events.js')) {
  fail("The full events page shell or script reference is missing.");
}
if (!eventsScript.includes('fetch("/data/events.json"') || !eventsScript.includes('schema_version !== "1.1"')) {
  fail("The full events page does not use the version 1.1 events feed.");
}
try {
  new vm.Script(eventsScript, { filename: "dist/events/events.js" });
} catch (error) {
  fail(`dist/events/events.js has invalid JavaScript: ${error.message}`);
}

if (failures.length) {
  console.error("\nLondon Advanced validation failed:\n");
  failures.forEach((message, index) => console.error(`${index + 1}. ${message}`));
  process.exit(1);
}

console.log("London Advanced validation passed.");
console.log(`Checked ${requiredAssets.length} required assets and ${expectedTools.size} tool routes.`);
console.log("All tool destinations use the approved central configuration.");
