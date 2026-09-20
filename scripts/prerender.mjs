import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const canonicalOrigin = "https://www.londonadvanced.com";

function browserContext(site = null) {
  const document = {
    querySelector(selector) {
      return selector === "#site" ? site : null;
    },
    querySelectorAll() {
      return [];
    },
    getElementById() {
      return null;
    },
    addEventListener() {}
  };
  const context = {
    window: {
      location: { hostname: "prerender.invalid", search: "" }
    },
    document,
    URL,
    URLSearchParams,
    Intl,
    Date,
    console
  };
  vm.createContext(context);
  return context;
}

function safeJson(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function homeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${canonicalOrigin}/#website`,
        url: `${canonicalOrigin}/`,
        name: "London Advanced",
        alternateName: "LondonAdvanced.com",
        description: "Independent tools, field notes and an unusual London guide for discovering the city beyond the obvious.",
        inLanguage: "en-GB",
        publisher: { "@id": `${canonicalOrigin}/#organization` },
        author: { "@id": `${canonicalOrigin}/#paolo-pastorino` }
      },
      {
        "@type": "Organization",
        "@id": `${canonicalOrigin}/#organization`,
        name: "London Advanced",
        url: `${canonicalOrigin}/`,
        logo: {
          "@type": "ImageObject",
          url: `${canonicalOrigin}/assets/london-advanced-logo.svg`,
          width: 512,
          height: 512
        },
        founder: { "@id": `${canonicalOrigin}/#paolo-pastorino` },
        sameAs: [
          "https://www.instagram.com/londonadvanced",
          "https://www.facebook.com/groups/223988130303794/"
        ]
      },
      {
        "@type": "Person",
        "@id": `${canonicalOrigin}/#paolo-pastorino`,
        name: "Paolo Pastorino",
        url: `${canonicalOrigin}/`,
        jobTitle: "Founder and editor",
        worksFor: { "@id": `${canonicalOrigin}/#organization` },
        sameAs: ["https://www.instagram.com/londonadvanced"]
      }
    ]
  };
}

function eventsStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalOrigin}/events/#webpage`,
    url: `${canonicalOrigin}/events/`,
    name: "This week, beyond the obvious",
    description: "A twice-weekly edit of unusual, free and low-cost London events, independently verified by London Advanced.",
    inLanguage: "en-GB",
    isPartOf: { "@id": `${canonicalOrigin}/#website` },
    publisher: { "@id": `${canonicalOrigin}/#organization` },
    author: { "@id": `${canonicalOrigin}/#paolo-pastorino` }
  };
}

function renderToolMenuLinks(data) {
  return data.apps.map(app => `
    <a href="${app.href}" data-track="app-menu:${app.name}">
      <span>${app.short}</span>
      <strong>${app.name}</strong>
    </a>`).join("");
}

function renderProjectMenuLinks() {
  return `<a href="/about/" data-track="project:about">
      <span>The person and purpose</span>
      <strong>About</strong>
    </a>
    <a href="/methodology/" data-track="project:methodology">
      <span>Sources, decisions and limits</span>
      <strong>Methodology</strong>
    </a>`;
}

function renderCommunityMenuLinks(data) {
  return `
    <a href="${data.links.facebook}" target="_blank" rel="noopener" data-track="social:menu-facebook">
      <span>Join the discussion</span>
      <strong>Facebook group ↗</strong>
    </a>
    <a href="${data.links.instagram}" target="_blank" rel="noopener" data-track="social:menu-instagram">
      <span>Follow the photography</span>
      <strong>Instagram ↗</strong>
    </a>`;
}

function renderEventsHeader(data) {
  const tools = renderToolMenuLinks(data);
  const project = renderProjectMenuLinks();
  const community = renderCommunityMenuLinks(data);

  return `<header class="site-nav">
    <a class="wordmark" href="/" aria-label="London Advanced home">
      <svg class="brand-mark" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15.5"/>
        <path class="brand-needle" d="m23.7 10.3-3.2 10.2-10.2 3.2 3.2-10.2 10.2-3.2Z"/>
        <circle class="brand-centre" cx="18" cy="18" r="2.2"/>
      </svg>
      <span class="brand-name">London Advanced</span>
    </a>
    <nav class="desktop-nav" aria-label="Main navigation">
      <details class="nav-dropdown tools-menu">
        <summary>Tools</summary>
        <div class="nav-menu-panel tools-menu-panel">${tools}</div>
      </details>
      <a href="${data.links.guideStore}" target="_blank" rel="noopener" data-track="guide:menu">Guide</a>
      <details class="nav-dropdown week-menu">
        <summary>This week</summary>
        <div class="nav-menu-panel week-menu-panel">
          <a href="/#events" data-track="events:menu-highlights">
            <span>Three featured selections</span>
            <strong>Highlights</strong>
          </a>
          <a href="/events/" aria-current="page" data-track="events:menu-all">
            <span>The complete weekend edit</span>
            <strong>All events</strong>
          </a>
        </div>
      </details>
      <a href="/#journal">Journal</a>
      <a class="contact-nav" href="/#contact">Contact</a>
      <details class="nav-dropdown project-menu">
        <summary>Project</summary>
        <div class="nav-menu-panel project-menu-panel">${project}</div>
      </details>
      <details class="nav-dropdown community-menu">
        <summary>Community</summary>
        <div class="nav-menu-panel community-menu-panel">${community}</div>
      </details>
    </nav>
    <details class="nav-dropdown mobile-menu">
      <summary aria-label="Open navigation menu"><span>Menu</span></summary>
      <div class="nav-menu-panel mobile-menu-panel">
        <p class="mobile-menu-heading">Tools</p>
        ${tools.trim()}
        <p class="mobile-menu-heading">Explore</p>
        <a href="${data.links.guideStore}" target="_blank" rel="noopener noreferrer" data-track="guide:mobile-menu">
          <span>The Other London</span>
          <strong>Guide ↗</strong>
        </a>
        <details class="mobile-week-menu">
          <summary><span>Weekend selections</span><strong>This week</strong></summary>
          <div>
            <a href="/#events" data-track="events:mobile-highlights">
              <span>Three featured selections</span>
              <strong>Highlights</strong>
            </a>
            <a href="/events/" aria-current="page" data-track="events:mobile-all">
              <span>The complete weekend edit</span>
              <strong>All events</strong>
            </a>
          </div>
        </details>
        <a href="/#journal">
          <span>Places and ideas</span>
          <strong>Journal</strong>
        </a>
        <a href="/#contact">
          <span>Questions and suggestions</span>
          <strong>Contact me</strong>
        </a>
        <p class="mobile-menu-heading">Project</p>
        ${project}
        <p class="mobile-menu-heading">Community</p>
        ${community.trim()}
      </div>
    </details>
  </header>`;
}

async function renderHomepage(feed) {
  const contentSource = await readFile(path.join(distRoot, "content.js"), "utf8");
  const appSource = await readFile(path.join(distRoot, "app.js"), "utf8");
  const site = { innerHTML: "" };
  const context = browserContext(site);

  vm.runInContext(contentSource, context, { filename: "dist/content.js" });
  const executable = appSource.replace(
    /\nrender\(\);\s*\ninitAnalytics\(\);\s*$/,
    "\nwindow.__PRERENDER__ = { render, activeDigest, renderEventCard };"
  );
  vm.runInContext(executable, context, { filename: "dist/app.js" });

  const renderer = context.window.__PRERENDER__;
  renderer.render();
  const renderTime = new Date(feed.generated_at);
  const homepageEvents = renderer.activeDigest(feed, renderTime);
  let main = site.innerHTML;

  if (homepageEvents.length) {
    const cards = homepageEvents.map(renderer.renderEventCard).join("");
    const updated = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London"
    }).format(renderTime);
    const activeCount = feed.events.filter(event =>
      event.publication_status === "approved" &&
      Date.parse(event.publish_at) <= renderTime.getTime() &&
      Date.parse(event.expire_at) > renderTime.getTime()
    ).length;

    main = main
      .replace(
        '<section id="events" class="events-section section-wrap" hidden>',
        '<section id="events" class="events-section section-wrap">'
      )
      .replace(
        '<div class="events-grid" data-events-feed aria-live="polite"></div>',
        `<div class="events-grid" data-events-feed aria-live="polite">${cards}</div>`
      )
      .replace(
        '<span data-events-updated>Updated Sunday and Thursday</span>',
        `<span data-events-updated>Last edited ${updated} · London time</span>`
      )
      .replace(
        '>See the complete edit <span aria-hidden="true">→</span></a>',
        `>See all ${activeCount} weekend pick${activeCount === 1 ? "" : "s"} <span aria-hidden="true">→</span></a>`
      )
      .replaceAll(" data-events-nav hidden", " data-events-nav");
  }

  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Independent tools, field notes and an unusual London guide for discovering the city beyond the obvious.">
  <meta name="author" content="Paolo Pastorino">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="London Advanced">
  <meta property="og:title" content="London Advanced — London beyond the obvious">
  <meta property="og:description" content="Five independent tools, field notes and an unusual London guide for discovering London beyond the obvious.">
  <meta property="og:url" content="${canonicalOrigin}/">
  <meta property="og:image" content="${canonicalOrigin}/assets/london-map.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${canonicalOrigin}/">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <title>London Advanced — London beyond the obvious</title>
  <script type="application/ld+json">
${safeJson(homeStructuredData())}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Caslon+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="site">${main}</div>
  <script src="/content.js"></script>
  <script src="/app.js"></script>
</body>
</html>
`;
}

async function renderEventsPage(feed, data) {
  const contentSource = await readFile(path.join(distRoot, "content.js"), "utf8");
  const eventsSource = await readFile(path.join(distRoot, "events/events.js"), "utf8");
  const context = browserContext();

  vm.runInContext(contentSource, context, { filename: "dist/content.js" });
  const executable = eventsSource.replace(
    /\ndocument\.querySelector\("\[data-facebook-link\]"\)[\s\S]*$/,
    "\nwindow.__PRERENDER__ = { activeEvents, renderGroups, formatDay };"
  );
  vm.runInContext(executable, context, { filename: "dist/events/events.js" });

  const renderer = context.window.__PRERENDER__;
  const renderTime = new Date(feed.generated_at);
  const events = renderer.activeEvents(feed, renderTime);
  const groups = renderer.renderGroups(events);
  const countLabel = `${events.length} verified event${events.length === 1 ? "" : "s"}`;

  let rangeLabel = "Updated Sunday and Thursday";
  if (events.length) {
    const timestamps = events.flatMap(event => [Date.parse(event.start), Date.parse(event.end)]);
    const from = new Date(Math.min(...timestamps));
    const until = new Date(Math.max(...timestamps));
    const updated = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London"
    }).format(renderTime);
    rangeLabel = `${renderer.formatDay(from)} – ${renderer.formatDay(until)} · Last edited ${updated}`;
  }

  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="A twice-weekly edit of unusual, free and low-cost London events, independently verified by London Advanced.">
  <meta name="author" content="Paolo Pastorino">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="London Advanced">
  <meta property="og:title" content="This week, beyond the obvious — London Advanced">
  <meta property="og:description" content="Verified London events selected for unusual access, local character and exceptional value.">
  <meta property="og:url" content="${canonicalOrigin}/events/">
  <meta property="og:image" content="${canonicalOrigin}/assets/london-map.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${canonicalOrigin}/events/">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <title>This week, beyond the obvious — London Advanced</title>
  <script type="application/ld+json">
${safeJson(eventsStructuredData())}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Caslon+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="events-page">
  ${renderEventsHeader(data)}

  <main>
    <section class="events-page-hero">
      <div>
        <span class="eyebrow">Twice-weekly London edit</span>
        <h1>This week,<br><em>beyond the obvious.</em></h1>
      </div>
      <div class="events-page-intro">
        <p>Free and low-cost events selected for unusual access, local character and a London story worth following.</p>
        <span data-events-range>${rangeLabel}</span>
      </div>
    </section>

    <section class="events-list-wrap" aria-labelledby="events-list-title">
      <div class="events-list-toolbar">
        <h2 id="events-list-title">The complete edit</h2>
        <span data-events-count aria-live="polite">${countLabel}</span>
      </div>
      <div class="events-list" data-events-list aria-live="polite"${events.length ? "" : " hidden"}>${groups}
      </div>
      <div class="events-empty" data-events-empty${events.length ? " hidden" : ""}>
        <h2>The current edit has closed.</h2>
        <p>The next verified selection is published on Sunday and Thursday.</p>
        <a class="button dark" href="/">Return to London Advanced</a>
      </div>
    </section>

    <section class="events-page-community">
      <div>
        <span class="eyebrow">Continue the conversation</span>
        <p>Found something worth adding to the next edit?</p>
      </div>
      <a href="${data.links.facebook}" data-facebook-link target="_blank" rel="noopener">Discuss it in the Facebook group ↗</a>
    </section>
  </main>

  <footer>
    <div><strong>London Advanced</strong><span>Independent tools and field notes for a less obvious London.</span></div>
    <a href="/">Back to the homepage</a>
    <small>© <span data-year>${new Date().getFullYear()}</span> Paolo Pastorino</small>
  </footer>

  <script src="/content.js"></script>
  <script src="/events/events.js"></script>
</body>
</html>
`;
}

export async function prerender() {
  const feed = JSON.parse(await readFile(path.join(distRoot, "data/events.json"), "utf8"));

  const dataContext = browserContext();
  vm.runInContext(
    await readFile(path.join(distRoot, "content.js"), "utf8"),
    dataContext,
    { filename: "dist/content.js" }
  );

  const [homepage, eventsPage] = await Promise.all([
    renderHomepage(feed),
    renderEventsPage(feed, dataContext.window.LONDON_ADVANCED)
  ]);

  await Promise.all([
    writeFile(path.join(distRoot, "index.html"), homepage, "utf8"),
    writeFile(path.join(distRoot, "events/index.html"), eventsPage, "utf8")
  ]);

  console.log(`Pre-rendered the homepage and ${feed.events.length} event records into static HTML.`);
}

const directRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (directRun) await prerender();
