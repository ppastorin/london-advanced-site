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
  "dist/about/index.html",
  "dist/methodology/index.html",
  "dist/it/index.html",
  "dist/it/chi-sono/index.html",
  "dist/it/metodologia/index.html",
  "dist/it/eventi/index.html",
  "dist/it/content.js",
  "dist/it/app.js",
  "dist/it/tool-page.js",
  "dist/it/eventi/events.js",
  "dist/newsletter/index.html",
  "dist/newsletter/thanks/index.html",
  "dist/thank-you/index.html",
  "dist/editorial.css",
  "dist/editorial.js",
  "dist/tool-page.css",
  "dist/tool-page.js",
  "dist/_headers",
  "dist/_redirects",
  "dist/404.html",
  "dist/robots.txt",
  "dist/sitemap.xml",
  "dist/assets/guide-cover.jpg",
  "dist/assets/london-map.jpg",
  "dist/assets/favicon.svg",
  "dist/assets/london-advanced-logo.svg"
];
requiredAssets.forEach(requireFile);

const wranglerText = requireFile("wrangler.jsonc");
try {
  const wrangler = JSON.parse(wranglerText);
  if (wrangler.main !== "./worker/index.mjs") fail('wrangler.jsonc must use "./worker/index.mjs" as its Worker entrypoint.');
  if (wrangler.assets?.directory !== "./dist") fail('wrangler.jsonc must set assets.directory to "./dist".');
  if (wrangler.assets?.binding !== "ASSETS") fail('wrangler.jsonc must expose the static assets as the "ASSETS" binding.');
  if (!wrangler.assets?.run_worker_first?.includes("/api/contact")) fail("The contact endpoint must run through the Worker.");
  if (!wrangler.assets?.run_worker_first?.includes("/api/subscribe")) fail("The newsletter endpoint must run through the Worker.");
  if (wrangler.keep_vars !== true) fail("wrangler.jsonc must preserve dashboard variables and secrets during deployment.");
  if (wrangler.assets?.not_found_handling !== "404-page") fail('wrangler.jsonc must use not_found_handling "404-page".');
  const contactEmail = wrangler.send_email?.find((binding) => binding.name === "CONTACT_EMAIL");
  if (contactEmail?.destination_address !== "ppastorin@gmail.com") {
    fail("wrangler.jsonc must bind CONTACT_EMAIL to the verified contact destination.");
  }
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

const homepageHtml = requireFile("dist/index.html");
const contentText = requireFile("dist/content.js");
const appText = requireFile("dist/app.js");
const stylesText = requireFile("dist/styles.css");
const prerenderText = requireFile("scripts/prerender.mjs");

if (!homepageHtml.includes('<main id="top">') || homepageHtml.includes('<div id="site"></div>')) {
  fail("The homepage must contain pre-rendered content instead of an empty JavaScript shell.");
}
if (!homepageHtml.includes('class="event-card"') || !homepageHtml.includes('data-events-feed')) {
  fail("The homepage must contain pre-rendered current event cards.");
}
for (const schemaType of ["WebSite", "Organization", "Person"]) {
  if (!homepageHtml.includes(`"@type": "${schemaType}"`)) fail(`Homepage JSON-LD is missing ${schemaType}.`);
}
if (!homepageHtml.includes('<meta property="og:site_name" content="London Advanced">')) {
  fail("The homepage is missing og:site_name.");
}
if (!homepageHtml.includes('<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">')) {
  fail("The homepage is missing its favicon link.");
}
if (!homepageHtml.includes("https://www.londonadvanced.com/assets/london-advanced-logo.svg")) {
  fail("Homepage Organization data is missing the canonical logo URL.");
}
if (!appText.includes("if (!site.innerHTML.trim())")) {
  fail("dist/app.js must preserve the pre-rendered homepage during hydration.");
}
if (!prerenderText.includes("renderHomepage") || !prerenderText.includes("renderEventsPage")) {
  fail("scripts/prerender.mjs must render both the homepage and events page.");
}
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
if (!sitemap.includes("https://www.londonadvanced.com/about/")) fail("Sitemap is missing /about/.");
if (!sitemap.includes("https://www.londonadvanced.com/methodology/")) fail("Sitemap is missing /methodology/.");
if (!sitemap.includes("https://www.londonadvanced.com/newsletter/")) fail("Sitemap is missing /newsletter/.");
for (const { href } of expectedTools.values()) {
  if (!sitemap.includes(`https://www.londonadvanced.com${href}`)) fail(`Sitemap is missing ${href}`);
}

const italianRoutes = [
  "/it/", "/it/chi-sono/", "/it/metodologia/", "/it/eventi/",
  "/it/strumenti/dashboard-londra/", "/it/strumenti/evita-la-folla/",
  "/it/strumenti/calcolatore-tariffe-trasporti/",
  "/it/strumenti/navigazione-intelligente/", "/it/strumenti/londra-per-umore/"
];
for (const route of italianRoutes) {
  if (!sitemap.includes(`https://www.londonadvanced.com${route}`)) fail(`Sitemap is missing ${route}`);
  const file = route === "/it/"
    ? path.join(distRoot, "it/index.html")
    : path.join(distRoot, route.replace(/^\//, ""), "index.html");
  if (!fs.existsSync(file)) { fail(`Missing Italian route ${route}`); continue; }
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes('<html lang="it-IT">')) fail(`${route} must declare it-IT.`);
  if (!html.includes('hreflang="en-GB"') || !html.includes('hreflang="it-IT"') || !html.includes('hreflang="x-default"')) {
    fail(`${route} is missing paired hreflang links.`);
  }
  if (!html.includes(`<link rel="canonical" href="https://www.londonadvanced.com${route}">`)) {
    fail(`${route} has the wrong canonical URL.`);
  }
}

const eventsHtml = requireFile("dist/events/index.html");
const eventsScript = requireFile("dist/events/events.js");
if (!eventsHtml.includes('<link rel="canonical" href="https://www.londonadvanced.com/events/">')) {
  fail("The full events page is missing its canonical URL.");
}
if (!eventsHtml.includes('data-events-list') || !eventsHtml.includes('/events/events.js')) {
  fail("The full events page shell or script reference is missing.");
}
if (!eventsHtml.includes('class="events-list-card"') || eventsHtml.includes("Loading current events")) {
  fail("The full events page must contain pre-rendered event cards and a static count.");
}
if (!eventsHtml.includes('<meta property="og:site_name" content="London Advanced">') ||
    !eventsHtml.includes('<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">')) {
  fail("The events page is missing site identity metadata.");
}
for (const marker of [
  '<title>Unusual London Events This Week | London Advanced</title>',
  '<h1>Unusual London events,<br><em>this week.</em></h1>',
  'things to do in London this week and weekend',
  'checked against the official organiser',
  '"@type": "CollectionPage"',
  '"@type": "BreadcrumbList"',
  '"@type": "ItemList"',
  '"@type": "Event"',
  '"@type": "PostalAddress"',
  '"eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"',
  '"eventStatus": "https://schema.org/EventScheduled"'
]) {
  if (!eventsHtml.includes(marker)) fail(`The events page search targeting or structured data is missing ${marker}.`);
}
const eventSchemaCount = (eventsHtml.match(/"@type": "Event"/g) || []).length;
const renderedEventCount = (eventsHtml.match(/class="events-list-card"/g) || []).length;
if (eventSchemaCount !== renderedEventCount) {
  fail(`The events page has ${renderedEventCount} rendered events but ${eventSchemaCount} Event schema entities.`);
}
if (!eventsScript.includes('fetch("/data/events.json"') || !eventsScript.includes('schema_version !== "1.1"')) {
  fail("The full events page does not use the version 1.1 events feed.");
}
try {
  new vm.Script(eventsScript, { filename: "dist/events/events.js" });
} catch (error) {
  fail(`dist/events/events.js has invalid JavaScript: ${error.message}`);
}

for (const [toolId, { href }] of expectedTools) {
  const toolHtml = requireFile(path.join("dist", href.replace(/^\//, ""), "index.html"));
  for (const marker of [
    '<html lang="en-GB">',
    'class="tool-shell enriched-tool-page"',
    'class="about-trigger"',
    'class="about-panel"',
    'class="panel-close"',
    'class="step-grid"',
    'class="evidence-grid"',
    'class="worked-example"',
    'class="tool-questions"',
    'class="question-list"',
    'class="related-grid"',
    '"@type": "WebApplication"',
    '"@type": "BreadcrumbList"',
    '"@type": "FAQPage"',
    '<meta name="author" content="Paolo Pastorino">',
    '<meta property="og:site_name" content="London Advanced">',
    '<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">'
  ]) {
    if (!toolHtml.includes(marker)) fail(`The enriched ${toolId} page is missing ${marker}.`);
  }
  const visibleQuestionCount = (toolHtml.match(/<details><summary>/g) || []).length;
  const schemaQuestionCount = (toolHtml.match(/"@type": "Question"/g) || []).length;
  if (visibleQuestionCount !== 3 || schemaQuestionCount !== 3) {
    fail(`${href} must contain three visible questions and three matching FAQ schema questions.`);
  }
  for (const internalHref of ["/methodology/", toolId === "london-dashboard" || toolId === "travel-fare-calculator" ? "/newsletter/" : "/events/"]) {
    if (!toolHtml.includes(`href="${internalHref}"`)) fail(`${href} is missing the contextual internal link to ${internalHref}`);
  }
}

for (const page of [
  { path: "dist/about/index.html", canonical: "https://www.londonadvanced.com/about/", type: "AboutPage" },
  { path: "dist/methodology/index.html", canonical: "https://www.londonadvanced.com/methodology/", type: "WebPage" }
]) {
  const html = requireFile(page.path);
  for (const marker of [
    `<link rel="canonical" href="${page.canonical}">`,
    `"@type": "${page.type}"`,
    '"@type": "BreadcrumbList"',
    '<meta name="author" content="Paolo Pastorino">',
    '<meta property="og:site_name" content="London Advanced">',
    '<link rel="stylesheet" href="/editorial.css">',
    '<script src="/editorial.js"></script>',
    'class="nav-dropdown tools-menu"',
    'class="nav-dropdown project-menu"',
    'class="nav-dropdown community-menu"'
  ]) {
    if (!html.includes(marker)) fail(`${page.path} is missing ${marker}.`);
  }
}

const editorialScript = requireFile("dist/editorial.js");
try {
  new vm.Script(editorialScript, { filename: "dist/editorial.js" });
} catch (error) {
  fail(`dist/editorial.js has invalid JavaScript: ${error.message}`);
}

if (!appText.includes('href="/about/"') || !appText.includes('href="/methodology/"')) {
  fail("The homepage navigation must link to About and Methodology.");
}

for (const { href } of expectedTools.values()) {
  if (!requireFile("dist/about/index.html").includes(`href="${href}"`)) fail(`The About page is missing a contextual link to ${href}`);
}

for (const marker of [
  'class="events-page-pathways"',
  'href="/home/london-dashboard/"',
  'href="/home/smart-navigation/"',
  'href="/home/escape-the-crowds/"',
  'href="/methodology/"'
]) {
  if (!eventsHtml.includes(marker)) fail(`The events page internal-linking section is missing ${marker}.`);
}

const newsletterInternalHtml = requireFile("dist/newsletter/index.html");
for (const marker of [
  'class="newsletter-discovery section-wrap"',
  'href="/events/"',
  'href="/home/london-by-mood/"',
  'href="/home/london-dashboard/"',
  'href="/about/"'
]) {
  if (!newsletterInternalHtml.includes(marker)) fail(`The newsletter internal-linking section is missing ${marker}.`);
}
if (!homepageHtml.includes('class="wordmark" href="#top"') || !homepageHtml.includes('aria-label="London Advanced home — back to top"')) {
  fail("The homepage wordmark must link back to the top of the page.");
}
for (const marker of [
  'id="contact"',
  'data-scroll-target="contact"',
  'action="/api/contact"',
  'name="started_at"',
  'name="_honey"',
  'data-contact-form'
]) {
  if (!homepageHtml.includes(marker)) fail(`The contact experience is missing ${marker}.`);
}
if (homepageHtml.includes("formsubmit.co") || homepageHtml.includes("paolo.pastorino@gmail.com")) {
  fail("The public homepage must not expose the delivery provider or target email address.");
}
for (const network of ["facebook", "instagram"]) {
  const count = (homepageHtml.match(new RegExp(`data-track="social:${network}"`, "g")) || []).length;
  if (count !== 1) fail(`The homepage must show the ${network} social link exactly once outside navigation; found ${count}.`);
}
const homepageFooter = homepageHtml.match(/<footer id="community">[\s\S]*?<\/footer>/)?.[0] || "";
if (homepageFooter.includes('class="social-links"')) fail("The homepage footer must not repeat the social links.");
if (!homepageFooter.includes('href="#contact"')) fail("The homepage footer must link to the contact form.");

for (const marker of [
  'id="newsletter"',
  'action="/api/subscribe"',
  'data-newsletter-form',
  'name="source" value="homepage"',
  'No spam',
  'never more than two or three times in a month'
]) {
  if (!homepageHtml.includes(marker)) fail(`The homepage newsletter experience is missing ${marker}.`);
}

const newsletterHtml = requireFile("dist/newsletter/index.html");
for (const marker of [
  '<link rel="canonical" href="https://www.londonadvanced.com/newsletter/">',
  'action="/api/subscribe"',
  'data-newsletter-form',
  'name="source" value="newsletter-page"',
  'No spam',
  'no fixed weekly schedule'
]) {
  if (!newsletterHtml.includes(marker)) fail(`The newsletter landing page is missing ${marker}.`);
}
const newsletterThanksHtml = requireFile("dist/newsletter/thanks/index.html");
if (!newsletterThanksHtml.includes("Check your inbox") || !newsletterThanksHtml.includes('href="/"')) {
  fail("The newsletter confirmation page must explain the next step and link home.");
}

const thankYouHtml = requireFile("dist/thank-you/index.html");
if (!thankYouHtml.includes("Thank you") || !thankYouHtml.includes('href="/"')) {
  fail("The thank-you page must confirm submission and link back to the homepage.");
}
const contactWorker = requireFile("worker/index.mjs");
for (const marker of ["/api/contact", "started_at", "ASSETS.fetch", "env.CONTACT_EMAIL", "CONTACT_DESTINATION"]) {
  if (!contactWorker.includes(marker)) fail(`The contact Worker is missing ${marker}.`);
}
for (const marker of ["/api/subscribe", "handleSubscribe", "EMAILOCTOPUS_API_KEY", "EMAILOCTOPUS_LIST_ID", "MEMBER_EXISTS_WITH_EMAIL_ADDRESS"]) {
  if (!contactWorker.includes(marker)) fail(`The newsletter Worker is missing ${marker}.`);
}

if (failures.length) {
  console.error("\nLondon Advanced validation failed:\n");
  failures.forEach((message, index) => console.error(`${index + 1}. ${message}`));
  process.exit(1);
}

console.log("London Advanced validation passed.");
console.log(`Checked ${requiredAssets.length} required assets and ${expectedTools.size} tool routes.`);
console.log("All tool destinations use the approved central configuration.");
