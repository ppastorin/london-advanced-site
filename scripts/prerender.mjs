import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { buildItalian } from "./build-italian.mjs";
import { buildFareCalculator } from "./build-fare-calculator.mjs";

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

function siteNavigation(homepage, locale) {
  const header = homepage.match(/<header class="site-nav">[\s\S]*?<\/header>/)?.[0];
  if (!header) throw new Error(`Could not extract the ${locale} site navigation for the Loo Finder.`);

  let nav = header;
  if (locale === "en") {
    nav = nav
      .replace('class="wordmark" href="#top" aria-label="London Advanced home — back to top"', 'class="wordmark" href="/" aria-label="London Advanced homepage"')
      .replaceAll('href="#events"', 'href="/#events"')
      .replace('<button class="nav-section-button" type="button" data-scroll-target="journal">Journal</button>', '<a href="/#journal">Journal</a>')
      .replace('<button class="nav-section-button contact-nav" type="button" data-scroll-target="contact">Contact</button>', '<a class="contact-nav" href="/#contact">Contact</a>')
      .replace(/<button class="mobile-section-link" type="button" data-scroll-target="journal">([\s\S]*?)<\/button>/, '<a href="/#journal">$1</a>')
      .replace(/<button class="mobile-section-link" type="button" data-scroll-target="contact">([\s\S]*?)<\/button>/, '<a href="/#contact">$1</a>')
      .replace('class="language-switch" href="/it/"', 'class="language-switch" href="/it/strumenti/trova-un-bagno/"')
      .replace('class="mobile-language-switch" href="/it/"', 'class="mobile-language-switch" href="/it/strumenti/trova-un-bagno/"')
      .replace('href="/loo/" data-track="app-menu:Loo Finder"', 'href="/loo/" aria-current="page" data-track="app-menu:Loo Finder"');
  } else {
    nav = nav
      .replace('class="wordmark" href="#top" aria-label="London Advanced home — back to top"', 'class="wordmark" href="/it/" aria-label="Homepage London Advanced"')
      .replace('class="language-switch" href="/"', 'class="language-switch" href="/loo/"')
      .replace('class="mobile-language-switch" href="/"', 'class="mobile-language-switch" href="/loo/"')
      .replace('href="/it/strumenti/trova-un-bagno/"', 'href="/it/strumenti/trova-un-bagno/" aria-current="page"');
  }
  return nav;
}

function looAboutPanel(locale) {
  const copy = locale === "en" ? {
    panelTitle: "About this tool",
    close: "Close",
    kicker: "Loo Finder · methodology",
    title: "Useful because it is specific.",
    intro: [
      "The Loo Finder is a curated London toilet directory built around a practical question: can you actually use the facility when you get there?",
      "It favours documented access over large, speculative lists of pins."
    ],
    usefulFor: "Coverage",
    facts: ["123 verified locations at launch", "Public and transport toilets", "Free cultural venues", "Major shops and centres"],
    howKicker: "How it works",
    howTitle: "Search, compare, then check the conditions.",
    steps: [
      ["Search", "Use your current position or enter a London place, station or venue."],
      ["Compare", "Results are ordered mainly by distance, with a modest access and fee adjustment."],
      ["Check", "Read the access, cost, hours and practical location notes before moving."],
      ["Confirm", "Use the linked official source when access is time-sensitive or essential."]
    ],
    includedKicker: "What is included",
    includedTitle: "A smaller list with stronger evidence.",
    included: "The database prioritises dedicated public toilets, TfL and rail facilities, free museums and galleries, major department stores, shopping centres and a small number of churches where access is documented. Ordinary pubs and cafés are excluded unless they participate in an official community toilet scheme.",
    limitsKicker: "What to know",
    limitsTitle: "Verified does not mean live.",
    limits: "Toilets can close temporarily, become unavailable for cleaning or maintenance, or change access policy. Where a venue confirms toilets but does not promise access without purchase, the finder says so instead of presenting the facility as publicly guaranteed.",
    questionsKicker: "Common questions",
    questionsTitle: "Before using a result.",
    faqs: [
      ["Are pubs and cafés included?", "No, unless they participate in a documented public or community toilet scheme."],
      ["Are toilets in major shops public toilets?", "They are facilities inside the venue. When free access is not formally guaranteed, the result states that condition."],
      ["Is the information live?", "No. Records are verified and dated, but temporary faults, cleaning and closures can still happen."]
    ],
    relatedKicker: "Continue exploring",
    relatedTitle: "Plan the rest of the journey.",
    related: [
      ["See pressure before you go", "Escape the Crowds →", "/home/escape-the-crowds/"],
      ["Make the journey part of the visit", "Smart Navigation →", "/home/smart-navigation/"],
      ["Start with how you feel", "London by Mood →", "/home/london-by-mood/"]
    ],
    methodPrefix: "Read",
    methodText: "the wider London Advanced methodology",
    methodHref: "/methodology/"
  } : {
    panelTitle: "Informazioni sullo strumento",
    close: "Chiudi",
    kicker: "Trova un bagno · metodologia",
    title: "Utile perché è specifico.",
    intro: [
      "Trova un bagno è una selezione curata di servizi a Londra costruita attorno a una domanda pratica: potrai davvero usare il bagno quando arrivi?",
      "Privilegia l’accesso documentato rispetto a grandi elenchi di pin basati su supposizioni."
    ],
    usefulFor: "Copertura",
    facts: ["123 luoghi verificati al lancio", "Bagni pubblici e nei trasporti", "Sedi culturali gratuite", "Grandi negozi e centri"],
    howKicker: "Come funziona",
    howTitle: "Cerca, confronta e controlla le condizioni.",
    steps: [
      ["Cerca", "Usa la posizione attuale oppure inserisci un luogo, una stazione o una sede di Londra."],
      ["Confronta", "I risultati sono ordinati soprattutto per distanza, con un piccolo correttivo per accesso e costo."],
      ["Controlla", "Leggi accesso, costo, orari e posizione pratica prima di muoverti."],
      ["Conferma", "Usa la fonte ufficiale collegata quando l’accesso è urgente o essenziale."]
    ],
    includedKicker: "Cosa include",
    includedTitle: "Una lista più piccola, con prove migliori.",
    included: "La base dati privilegia bagni pubblici dedicati, strutture TfL e ferroviarie, musei e gallerie gratuiti, grandi magazzini, centri commerciali e poche chiese dove l’accesso è documentato. Pub e caffè ordinari sono esclusi, salvo partecipazione a un programma pubblico ufficiale.",
    limitsKicker: "Cosa sapere",
    limitsTitle: "Verificato non significa in tempo reale.",
    limits: "Un bagno può chiudere temporaneamente per pulizia o manutenzione oppure cambiare condizioni di accesso. Quando una sede conferma i servizi ma non garantisce l’accesso senza acquisto, il risultato dichiara questa condizione invece di presentare il bagno come pubblico.",
    questionsKicker: "Domande frequenti",
    questionsTitle: "Prima di usare un risultato.",
    faqs: [
      ["Sono inclusi pub e caffè?", "No, salvo partecipazione a un programma pubblico o comunitario documentato."],
      ["I bagni dei grandi negozi sono bagni pubblici?", "Sono servizi interni alla sede. Quando l’accesso gratuito non è garantito formalmente, il risultato lo indica."],
      ["Le informazioni sono in tempo reale?", "No. I dati sono verificati e datati, ma guasti, pulizie e chiusure temporanee possono comunque verificarsi."]
    ],
    relatedKicker: "Continua a esplorare",
    relatedTitle: "Organizza il resto del percorso.",
    related: [
      ["Valuta la pressione prima di partire", "Evita la folla →", "/it/strumenti/evita-la-folla/"],
      ["Trasforma il tragitto in una scoperta", "Navigazione intelligente →", "/it/strumenti/navigazione-intelligente/"],
      ["Parti da come ti senti", "Londra secondo l’umore →", "/it/strumenti/londra-per-umore/"]
    ],
    methodPrefix: "Leggi",
    methodText: "la metodologia generale di London Advanced",
    methodHref: "/it/metodologia/"
  };

  const steps = copy.steps.map(([title, text], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><h3>${title}</h3><p>${text}</p></li>`).join("");
  const faqs = copy.faqs.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join("");
  const related = copy.related.map(([label, title, href]) => `<a href="${href}"><span>${label}</span><strong>${title}</strong></a>`).join("");

  return `<dialog class="about-panel loo-about-panel" id="loo-about-panel" aria-labelledby="loo-about-title"><header class="panel-header"><div><span class="section-kicker">London Advanced</span><strong>${copy.panelTitle}</strong></div><button class="panel-close" type="button">${copy.close} <span aria-hidden="true">×</span></button></header><div class="panel-scroll"><article class="tool-information"><div class="information-lead"><div><span class="section-kicker">${copy.kicker}</span><h2 id="loo-about-title">${copy.title}</h2>${copy.intro.map(paragraph => `<p>${paragraph}</p>`).join("")}</div><aside class="quick-facts" aria-label="${copy.usefulFor}"><span>${copy.usefulFor}</span><ul>${copy.facts.map(fact => `<li>${fact}</li>`).join("")}</ul></aside></div><section class="information-section"><div class="information-heading"><span class="section-kicker">${copy.howKicker}</span><h2>${copy.howTitle}</h2></div><ol class="step-grid">${steps}</ol></section><div class="evidence-grid"><section><span class="section-kicker">${copy.includedKicker}</span><h2>${copy.includedTitle}</h2><p>${copy.included}</p></section><section><span class="section-kicker">${copy.limitsKicker}</span><h2>${copy.limitsTitle}</h2><p>${copy.limits}</p></section></div><section class="tool-questions"><span class="section-kicker">${copy.questionsKicker}</span><h2>${copy.questionsTitle}</h2><div class="question-list">${faqs}</div></section><section class="related-tools"><div class="information-heading"><span class="section-kicker">${copy.relatedKicker}</span><h2>${copy.relatedTitle}</h2></div><div class="related-grid">${related}</div><p class="related-support">${copy.methodPrefix} <a href="${copy.methodHref}">${copy.methodText}</a>.</p></section></article></div></dialog>`;
}

function nativeLooPage(template, nav, locale) {
  let page = template
    .replace(/<body><header class="site-nav">[\s\S]*?<\/header>/, "<body>")
    .replace(/<dialog class="about-panel loo-about-panel"[\s\S]*?<\/dialog>/, "")
    .replace(/<main class="shell"><header class="top">[\s\S]*?<\/header>/, '<main class="shell">')
    .replace('class="hero"', 'class="loo-hero"')
    .replace('<footer>', '<footer class="loo-footer">')
    .replace("<body>", `<body>${nav}`);

  if (!page.includes('<link rel="stylesheet" href="/styles.css">')) page = page.replace('<link rel="stylesheet" href="/loo/loo.css">', '<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/loo/loo.css">');
  if (!page.includes('<link rel="stylesheet" href="/tool-page.css">')) page = page.replace('<link rel="stylesheet" href="/loo/loo.css">', '<link rel="stylesheet" href="/tool-page.css"><link rel="stylesheet" href="/loo/loo.css">');

  const aboutText = locale === "en" ? "About this tool" : "Come funziona questo strumento";
  const footerText = locale === "en" ? "How this tool works" : "Come funziona questo strumento";
  const footerPrefix = locale === "en" ? "Source information is shown on each result." : "La fonte è indicata in ogni risultato.";
  page = page.replace(/<p class="tool-context-link">[\s\S]*?<\/p>/, "");
  page = page.replace('</p><div class="actions">', `</p><p class="tool-context-link"><button class="about-trigger" type="button" data-loo-about aria-haspopup="dialog" aria-controls="loo-about-panel">${aboutText} <span aria-hidden="true">→</span></button></p><div class="actions">`);
  page = page.replace(/<p>(?:Source information is shown on each result\.|La fonte è indicata in ogni risultato\.)[\s\S]*?<\/p>/, `<p>${footerPrefix} <button class="loo-about-text-button" type="button" data-loo-about aria-haspopup="dialog" aria-controls="loo-about-panel">${footerText} →</button></p>`);
  page = page.replace('<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"', `${looAboutPanel(locale)}<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"`);
  return page.replace(/[ \t]+$/gm, "");
}

async function buildNativeLooPages() {
  const englishHomepage = await readFile(path.join(distRoot, "index.html"), "utf8");
  const italianHomepage = await readFile(path.join(distRoot, "it/index.html"), "utf8");
  const englishTemplate = await readFile(path.join(distRoot, "loo/index.html"), "utf8");
  const italianTemplate = await readFile(path.join(distRoot, "it/loo/index.html"), "utf8");
  const englishPage = nativeLooPage(englishTemplate, siteNavigation(englishHomepage, "en"), "en");
  const italianPage = nativeLooPage(italianTemplate, siteNavigation(italianHomepage, "it"), "it");

  await Promise.all([
    writeFile(path.join(distRoot, "loo/index.html"), englishPage, "utf8"),
    writeFile(path.join(distRoot, "it/loo/index.html"), italianPage, "utf8"),
    writeFile(path.join(distRoot, "it/strumenti/trova-un-bagno/index.html"), italianPage, "utf8")
  ]);
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

function eventStructuredData(event) {
  return {
    "@type": "Event",
    "@id": `${canonicalOrigin}/events/#event-${event.id}`,
    name: event.title_en,
    description: event.summary_en,
    startDate: event.start,
    endDate: event.end,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: event.official_url,
    mainEntityOfPage: { "@id": `${canonicalOrigin}/events/#webpage` },
    location: {
      "@type": "Place",
      name: event.venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venue.address,
        postalCode: event.venue.postcode,
        addressLocality: "London",
        addressRegion: event.venue.borough,
        addressCountry: "GB"
      }
    },
    isAccessibleForFree: event.price.amount_gbp === 0,
    offers: {
      "@type": "Offer",
      url: event.booking.url || event.official_url,
      price: event.price.amount_gbp,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      validFrom: event.publish_at
    }
  };
}

function eventsStructuredData(events, feed) {
  const eventEntities = events.map(eventStructuredData);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonicalOrigin}/events/#webpage`,
        url: `${canonicalOrigin}/events/`,
        name: "Unusual London Events This Week",
        headline: "Unusual London events this week",
        description: "A twice-weekly edit of unusual, free and affordable London events, checked against official organisers.",
        inLanguage: "en-GB",
        dateModified: feed.generated_at,
        isPartOf: { "@id": `${canonicalOrigin}/#website` },
        publisher: { "@id": `${canonicalOrigin}/#organization` },
        author: { "@id": `${canonicalOrigin}/#paolo-pastorino` },
        breadcrumb: { "@id": `${canonicalOrigin}/events/#breadcrumb` },
        mainEntity: { "@id": `${canonicalOrigin}/events/#event-list` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalOrigin}/events/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "London Advanced",
            item: `${canonicalOrigin}/`
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Unusual London events this week",
            item: `${canonicalOrigin}/events/`
          }
        ]
      },
      {
        "@type": "ItemList",
        "@id": `${canonicalOrigin}/events/#event-list`,
        name: "Verified unusual London events this week",
        numberOfItems: eventEntities.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: eventEntities.map((event, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: { "@id": event["@id"] }
        }))
      },
      ...eventEntities
    ]
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
      <a class="newsletter-nav" href="/newsletter/">Newsletter</a>
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
        <a href="/newsletter/">
          <span>Useful London, occasionally</span>
          <strong>Newsletter</strong>
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
    /\nrender\(\);\s*\nbindNewsletterForms\(\);\s*\nshowNewsletterStatus\(\);\s*\ninitAnalytics\(\);\s*$/,
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
  <meta property="og:description" content="Six independent tools, field notes and an unusual London guide for discovering London beyond the obvious.">
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
  <meta name="description" content="Discover unusual London events this week and weekend: a twice-weekly edit of free and affordable things to do, checked against official organisers.">
  <meta name="author" content="Paolo Pastorino">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="London Advanced">
  <meta property="og:title" content="Unusual London Events This Week | London Advanced">
  <meta property="og:description" content="Discover unusual, free and affordable London events this week and weekend, independently checked against official organisers.">
  <meta property="og:url" content="${canonicalOrigin}/events/">
  <meta property="og:image" content="${canonicalOrigin}/assets/london-map.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${canonicalOrigin}/events/">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <title>Unusual London Events This Week | London Advanced</title>
  <script type="application/ld+json">
${safeJson(eventsStructuredData(events, feed))}
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
        <span class="eyebrow">Beyond the obvious · twice-weekly edit</span>
        <h1>Unusual London events,<br><em>this week.</em></h1>
      </div>
      <div class="events-page-intro">
        <p>Discover free and affordable things to do in London this week and weekend, selected for unusual access, local character and a story worth following. Every listing is checked against the official organiser before publication.</p>
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

    <section class="events-page-pathways" aria-labelledby="events-pathways-title">
      <div class="events-pathways-heading">
        <span class="eyebrow">Plan the rest of the day</span>
        <h2 id="events-pathways-title">Turn an event into a better London route.</h2>
        <p>Check live conditions before leaving, find an interesting detour, or compare likely crowd pressure around your destination.</p>
      </div>
      <div class="events-pathways-grid">
        <a href="/home/london-dashboard/"><span>Weather, transport and air quality</span><strong>Check the London Dashboard →</strong></a>
        <a href="/home/smart-navigation/"><span>Interesting places close to your journey</span><strong>Build a smarter route →</strong></a>
        <a href="/home/escape-the-crowds/"><span>Expected pressure now and later</span><strong>Compare crowd levels →</strong></a>
      </div>
      <p class="events-method-link">Read <a href="/methodology/">how events are selected, verified and kept independent</a>.</p>
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
    <div class="footer-meta"><a href="/newsletter/">Newsletter</a><a href="/about/">About</a><a href="/methodology/">Methodology</a><a href="/">Homepage</a></div>
    <small>© <span data-year>${new Date().getFullYear()}</span> Paolo Pastorino</small>
  </footer>

  <script src="/content.js"></script>
  <script src="/events/events.js"></script>
</body>
</html>
`;
}

export async function prerender() {
  await buildFareCalculator();
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

  await buildItalian();
  await buildNativeLooPages();

  console.log(`Pre-rendered the bilingual homepage and ${feed.events.length} event records into static HTML.`);
}

const directRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (directRun) await prerender();
