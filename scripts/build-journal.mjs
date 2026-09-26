import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const contentDirectory = path.join(root, "content", "journal");
const studioDirectory = path.join(root, "studio");
const canonicalOrigin = "https://www.londonadvanced.com";

const TOOL_PATHS = {
  "london-dashboard": {
    en: ["London Dashboard", "/home/london-dashboard/", "Check weather, transport, air quality and events before leaving."],
    it: ["Dashboard di Londra", "/it/strumenti/dashboard-londra/", "Controlla meteo, trasporti, qualità dell’aria ed eventi prima di partire."]
  },
  "escape-the-crowds": {
    en: ["Escape the Crowds", "/home/escape-the-crowds/", "Compare likely crowd pressure around the destination."],
    it: ["Evita la folla", "/it/strumenti/evita-la-folla/", "Confronta la probabile pressione della folla intorno alla destinazione."]
  },
  "travel-fare-calculator": {
    en: ["Travel Fare Calculator", "/home/travel-fare-calculator/", "Compare London transport fares before travelling."],
    it: ["Calcolatore tariffe", "/it/strumenti/calcolatore-tariffe-trasporti/", "Confronta le tariffe dei trasporti londinesi prima del viaggio."]
  },
  "smart-navigation": {
    en: ["Smart Navigation", "/home/smart-navigation/", "Add worthwhile places to the journey rather than only the destination."],
    it: ["Navigazione intelligente", "/it/strumenti/navigazione-intelligente/", "Aggiungi al viaggio luoghi che meritano una deviazione."]
  },
  "london-by-mood": {
    en: ["London by Mood", "/home/london-by-mood/", "Find another place that fits the atmosphere you want."],
    it: ["Londra secondo l’umore", "/it/strumenti/londra-per-umore/", "Trova un altro luogo adatto all’atmosfera che cerchi."]
  },
  "loo-finder": {
    en: ["Loo Finder", "/loo/", "Find verified toilets and useful facilities nearby."],
    it: ["Trova un bagno", "/it/strumenti/trova-un-bagno/", "Trova bagni verificati e servizi utili nelle vicinanze."]
  }
};

const NAV_TOOLS = Object.values(TOOL_PATHS);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(value = "") {
  const url = String(value).trim();
  if (url.startsWith("/") || /^https:\/\//i.test(url) || /^mailto:/i.test(url)) return url;
  return "#";
}

function renderInline(value = "") {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${escapeHtml(safeUrl(url))}">${label}</a>`);
  return html;
}

function renderMarkdown(markdown = "") {
  const lines = String(markdown).replace(/\r/g, "").split("\n");
  const output = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listType) return;
    output.push(`<${listType}>${listItems.map(item => `<li>${renderInline(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const desired = unordered ? "ul" : "ol";
      if (listType && listType !== desired) flushList();
      listType = desired;
      listItems.push((unordered || ordered)[1]);
      continue;
    }
    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      flushParagraph();
      flushList();
      output.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return output.join("\n");
}

function safeJson(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function formatDate(value, locale) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London"
  }).format(parsed);
}

function imageFigure(image, className = "journal-figure") {
  if (!image?.src) return "";
  const width = Number(image.width) || 1600;
  const height = Number(image.height) || 1067;
  const caption = image.caption ? `<figcaption>${escapeHtml(image.caption)}${image.credit ? ` <span>© ${escapeHtml(image.credit)}</span>` : ""}</figcaption>` : "";
  return `<figure class="${className}"><img src="${escapeHtml(safeUrl(image.src))}" alt="${escapeHtml(image.alt || "")}" width="${width}" height="${height}" loading="${className.includes("hero") ? "eager" : "lazy"}" decoding="async">${caption}</figure>`;
}

function injectFigures(bodyHtml, images) {
  if (!images.length) return bodyHtml;
  let result = bodyHtml;
  const positions = [2, 5, 8];
  images.forEach((image, index) => {
    const figure = imageFigure(image);
    const matches = [...result.matchAll(/<\/p>/g)];
    const match = matches[Math.min(positions[index] - 1, matches.length - 1)];
    if (match) {
      const at = match.index + match[0].length;
      result = `${result.slice(0, at)}${figure}${result.slice(at)}`;
    } else {
      result += figure;
    }
  });
  return result;
}

function toolLinks(locale) {
  return NAV_TOOLS.map(tool => {
    const [name, href, description] = tool[locale];
    return `<a href="${href}"><span>${escapeHtml(description)}</span><strong>${escapeHtml(name)}</strong></a>`;
  }).join("");
}

function navigation(locale, active = "journal", alternatePath = locale === "en" ? "/it/journal/" : "/journal/") {
  const it = locale === "it";
  const home = it ? "/it/" : "/";
  const tools = toolLinks(locale);
  const guide = "https://payhip.com/TheOtherLondon";
  const labels = it ? {
    nav: "Navigazione principale", tools: "Strumenti", guide: "Guida", week: "Questa settimana", journal: "Journal",
    newsletter: "Newsletter", contact: "Contatti", project: "Progetto", community: "Community", menu: "Menu",
    explore: "Esplora", highlights: "Highlights", allEvents: "Tutti gli eventi", projectHeading: "Il Progetto",
    about: "Chi sono", methodology: "Metodologia", switchText: "English", switchLabel: "Passa alla versione inglese",
    places: "Luoghi, itinerari e idee", eventsIntro: "La selezione completa", aboutIntro: "La persona e lo scopo",
    methodIntro: "Fonti, decisioni e limiti", questions: "Domande e suggerimenti"
  } : {
    nav: "Main navigation", tools: "Tools", guide: "Guide", week: "This week", journal: "Journal",
    newsletter: "Newsletter", contact: "Contact", project: "Project", community: "Community", menu: "Menu",
    explore: "Explore", highlights: "Highlights", allEvents: "All events", projectHeading: "Project",
    about: "About", methodology: "Methodology", switchText: "Italiano", switchLabel: "Switch to the Italian version",
    places: "Places, walks and local ideas", eventsIntro: "The complete weekend edit", aboutIntro: "The person and purpose",
    methodIntro: "Sources, decisions and limits", questions: "Questions and suggestions"
  };
  const eventsPath = it ? "/it/eventi/" : "/events/";
  const eventHighlights = it ? "/it/#eventi" : "/#events";
  const journalPath = it ? "/it/journal/" : "/journal/";
  const newsletterPath = it ? "/it/#newsletter" : "/newsletter/";
  const contactPath = it ? "/it/#contatti" : "/#contact";
  const aboutPath = it ? "/it/chi-sono/" : "/about/";
  const methodologyPath = it ? "/it/metodologia/" : "/methodology/";
  const facebook = "https://www.facebook.com/groups/223988130303794/";
  const instagram = "https://www.instagram.com/londonadvanced";
  const projectLinks = `<a href="${aboutPath}"><span>${labels.aboutIntro}</span><strong>${labels.about}</strong></a><a href="${methodologyPath}"><span>${labels.methodIntro}</span><strong>${labels.methodology}</strong></a>`;
  const communityLinks = `<a href="${facebook}" target="_blank" rel="noopener"><span>${it ? "Partecipa alla conversazione" : "Join the discussion"}</span><strong>${it ? "Gruppo Facebook" : "Facebook group"} ↗</strong></a><a href="${instagram}" target="_blank" rel="noopener"><span>${it ? "Segui le fotografie" : "Follow the photography"}</span><strong>Instagram ↗</strong></a>`;
  return `<header class="site-nav"><a class="wordmark" href="${home}" aria-label="${it ? "Homepage London Advanced" : "London Advanced homepage"}"><svg class="brand-mark" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5"/><path class="brand-needle" d="m23.7 10.3-3.2 10.2-10.2 3.2 3.2-10.2 10.2-3.2Z"/><circle class="brand-centre" cx="18" cy="18" r="2.2"/></svg><span class="brand-name">London Advanced</span></a><nav class="desktop-nav" aria-label="${labels.nav}"><details class="nav-dropdown tools-menu"><summary>${labels.tools}</summary><div class="nav-menu-panel tools-menu-panel">${tools}</div></details><a href="${guide}" target="_blank" rel="noopener">${labels.guide}</a><details class="nav-dropdown week-menu"><summary>${labels.week}</summary><div class="nav-menu-panel week-menu-panel"><a href="${eventHighlights}"><span>${it ? "Tre proposte in evidenza" : "Three featured selections"}</span><strong>${labels.highlights}</strong></a><a href="${eventsPath}"><span>${labels.eventsIntro}</span><strong>${labels.allEvents}</strong></a></div></details><a href="${journalPath}"${active === "journal" ? ' aria-current="page"' : ""}>${labels.journal}</a><a class="newsletter-nav" href="${newsletterPath}">${labels.newsletter}</a><a class="contact-nav" href="${contactPath}">${labels.contact}</a><details class="nav-dropdown project-menu"><summary>${labels.project}</summary><div class="nav-menu-panel project-menu-panel">${projectLinks}</div></details><details class="nav-dropdown community-menu"><summary>${labels.community}</summary><div class="nav-menu-panel community-menu-panel">${communityLinks}</div></details><a class="language-switch" href="${alternatePath}" lang="${it ? "en" : "it"}" hreflang="${it ? "en-GB" : "it-IT"}" aria-label="${labels.switchLabel}"><span aria-hidden="true">🌐</span>${labels.switchText}</a></nav><a class="mobile-language-switch" href="${alternatePath}" lang="${it ? "en" : "it"}" hreflang="${it ? "en-GB" : "it-IT"}" aria-label="${labels.switchLabel}"><span aria-hidden="true">🌐</span>${labels.switchText}</a><details class="nav-dropdown mobile-menu"><summary aria-label="${it ? "Apri il menu" : "Open navigation menu"}"><span>${labels.menu}</span></summary><div class="nav-menu-panel mobile-menu-panel"><p class="mobile-menu-heading">${labels.tools}</p>${tools}<p class="mobile-menu-heading">${labels.explore}</p><a href="${guide}" target="_blank" rel="noopener"><span>The Other London</span><strong>${labels.guide} ↗</strong></a><a href="${eventsPath}"><span>${labels.eventsIntro}</span><strong>${it ? "Eventi" : "This week"}</strong></a><a href="${journalPath}" aria-current="page"><span>${labels.places}</span><strong>Journal</strong></a><a href="${newsletterPath}"><span>${it ? "Londra utile, ogni tanto" : "Useful London, occasionally"}</span><strong>Newsletter</strong></a><a href="${contactPath}"><span>${labels.questions}</span><strong>${labels.contact}</strong></a><p class="mobile-menu-heading">${labels.projectHeading}</p>${projectLinks}</div></details></header>`;
}

function footer(locale) {
  const it = locale === "it";
  return `<footer><div><strong>London Advanced</strong><span>${it ? "Strumenti indipendenti e appunti sul campo per una Londra meno ovvia." : "Independent tools and field notes for a less obvious London."}</span></div><div class="footer-meta"><a href="${it ? "/it/journal/" : "/journal/"}">Journal</a><a href="${it ? "/it/eventi/" : "/events/"}">${it ? "Questa settimana" : "This week"}</a><a href="${it ? "/it/chi-sono/" : "/about/"}">${it ? "Chi sono" : "About"}</a><a href="${it ? "/it/metodologia/" : "/methodology/"}">${it ? "Metodologia" : "Methodology"}</a></div><small>© ${new Date().getFullYear()} Paolo Pastorino</small></footer>`;
}

function pageHead({ locale, route, alternateRoute, title, description, image, type = "website", schema, noindex = false }) {
  const it = locale === "it";
  const canonical = `${canonicalOrigin}${route}`;
  const alternate = `${canonicalOrigin}${alternateRoute}`;
  const xDefault = locale === "en" ? canonical : alternate;
  return `<!doctype html><html lang="${it ? "it-IT" : "en-GB"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><meta name="author" content="Paolo Pastorino"><meta name="robots" content="${noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"}"><meta property="og:type" content="${type}"><meta property="og:site_name" content="London Advanced"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${escapeHtml(image || `${canonicalOrigin}/assets/london-map.jpg`)}"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en-GB" href="${it ? alternate : canonical}"><link rel="alternate" hreflang="it-IT" href="${it ? canonical : alternate}"><link rel="alternate" hreflang="x-default" href="${xDefault}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><title>${escapeHtml(title)}</title><script type="application/ld+json">${safeJson(schema)}</script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Caslon+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/journal.css"></head>`;
}

function articleSchema(article, pair, locale, route, alternateRoute, hero) {
  const it = locale === "it";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${canonicalOrigin}${route}#article`,
        headline: article.title,
        description: article.description,
        image: (article.images || []).filter(image => image.src).map(image => `${canonicalOrigin}${image.src}`),
        datePublished: article.published_at || undefined,
        dateModified: article.updated_at || article.published_at || undefined,
        inLanguage: it ? "it-IT" : "en-GB",
        author: { "@id": `${canonicalOrigin}/#paolo-pastorino` },
        publisher: { "@id": `${canonicalOrigin}/#organization` },
        mainEntityOfPage: { "@id": `${canonicalOrigin}${route}#webpage` },
        about: (article.tags || []).map(name => ({ "@type": "Thing", name }))
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalOrigin}${route}#webpage`,
        url: `${canonicalOrigin}${route}`,
        name: article.title,
        primaryImageOfPage: hero?.src ? { "@type": "ImageObject", url: `${canonicalOrigin}${hero.src}` } : undefined,
        isPartOf: { "@id": `${canonicalOrigin}/${it ? "it/" : ""}journal/#collection` },
        inLanguage: it ? "it-IT" : "en-GB",
        translationOfWork: { "@id": `${canonicalOrigin}${alternateRoute}#article` }
      },
      {
        "@type": "Person",
        "@id": `${canonicalOrigin}/#paolo-pastorino`,
        name: "Paolo Pastorino",
        jobTitle: it ? "Fondatore ed editor" : "Founder and editor",
        url: `${canonicalOrigin}${it ? "/it/chi-sono/" : "/about/"}`
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalOrigin}${route}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "London Advanced", item: `${canonicalOrigin}${it ? "/it/" : "/"}` },
          { "@type": "ListItem", position: 2, name: "Journal", item: `${canonicalOrigin}${it ? "/it/journal/" : "/journal/"}` },
          { "@type": "ListItem", position: 3, name: article.title, item: `${canonicalOrigin}${route}` }
        ]
      }
    ]
  };
}

function renderPractical(article, locale) {
  const items = article.practical || [];
  if (!items.length) return "";
  return `<aside class="journal-practical"><span>${locale === "it" ? "In breve" : "At a glance"}</span><dl>${items.map(item => `<div><dt>${escapeHtml(item.label)}</dt><dd>${item.url ? `<a href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener">${escapeHtml(item.value)} ↗</a>` : escapeHtml(item.value)}</dd></div>`).join("")}</dl></aside>`;
}

function renderRelatedTools(article, locale) {
  const tools = (article.related_tools || []).map(id => TOOL_PATHS[id]?.[locale]).filter(Boolean);
  if (!tools.length) return "";
  const it = locale === "it";
  return `<section class="journal-tools"><div><span class="journal-kicker">${it ? "Pianifica la visita" : "Plan the visit"}</span><h2>${it ? "Usa il Journal insieme agli strumenti." : "Use the Journal with the tools."}</h2></div><div class="journal-tool-grid">${tools.map(([name, href, description]) => `<a href="${href}"><span>${escapeHtml(description)}</span><strong>${escapeHtml(name)} →</strong></a>`).join("")}</div></section>`;
}

function renderSources(article, locale) {
  const sources = article.sources || [];
  if (!sources.length) return "";
  const it = locale === "it";
  return `<details class="journal-sources"><summary>${it ? "Fonti e verifica" : "Sources and verification"}</summary><div><p>${it ? "Le informazioni pratiche sono state controllate presso le seguenti fonti. Verifica sempre la sede prima di una visita sensibile a orari o accesso." : "Practical information was checked against the sources below. Always confirm with the venue before a time- or access-sensitive visit."}</p><ul>${sources.map(source => `<li><a href="${escapeHtml(safeUrl(source.url))}" target="_blank" rel="noopener">${escapeHtml(source.label)} ↗</a>${source.checked_at ? ` <span>· ${escapeHtml(formatDate(source.checked_at, locale))}</span>` : ""}</li>`).join("")}</ul></div></details>`;
}

function articleRoute(article, locale, preview) {
  const base = locale === "it" ? "/it/journal/" : "/journal/";
  return preview ? `${base}_preview/${article.article_id}/` : `${base}${article.slug}/`;
}

function renderArticle(article, pair, locale, preview = false) {
  const it = locale === "it";
  const route = articleRoute(article, locale, preview);
  const alternateRoute = articleRoute(pair, it ? "en" : "it", preview);
  const hero = (article.images || []).find(image => image.role === "hero") || (article.images || [])[0];
  const inlineImages = (article.images || []).filter(image => image !== hero);
  const body = injectFigures(renderMarkdown(article.body), inlineImages);
  const title = article.seo_title || `${article.title} | London Advanced`;
  const schema = articleSchema(article, pair, locale, route, alternateRoute, hero);
  const publishedLabel = formatDate(article.published_at || article.updated_at, locale);
  const readLabel = article.reading_minutes ? `${article.reading_minutes} ${it ? "min di lettura" : "min read"}` : "";
  const previewBanner = preview ? `<div class="journal-preview-banner"><strong>${it ? "Anteprima non pubblicata" : "Unpublished preview"}</strong><span>${it ? "Questa pagina non è indicizzata e non appare nel Journal pubblico." : "This page is not indexed and does not appear in the public Journal."}</span></div>` : "";
  return `${pageHead({ locale, route, alternateRoute, title, description: article.description, image: hero?.src ? `${canonicalOrigin}${hero.src}` : undefined, type: "article", schema, noindex: preview })}<body class="journal-page journal-article-page">${previewBanner}${navigation(locale, "journal", alternateRoute)}<main><nav class="journal-breadcrumbs" aria-label="${it ? "Percorso" : "Breadcrumb"}"><a href="${it ? "/it/" : "/"}">London Advanced</a><span>/</span><a href="${it ? "/it/journal/" : "/journal/"}">Journal</a><span>/</span><span>${escapeHtml(article.title)}</span></nav><article><header class="article-header"><div class="article-heading"><span class="journal-kicker">${escapeHtml(article.eyebrow || (it ? "Appunti sul campo" : "Field notes"))}</span><h1>${escapeHtml(article.title)}</h1><p class="article-dek">${escapeHtml(article.dek)}</p><div class="article-meta"><span>${it ? "Di" : "By"} <a href="${it ? "/it/chi-sono/" : "/about/"}">Paolo Pastorino</a></span>${publishedLabel ? `<span>${publishedLabel}</span>` : ""}${readLabel ? `<span>${readLabel}</span>` : ""}</div></div>${renderPractical(article, locale)}</header>${imageFigure(hero, "journal-figure journal-hero-image")}<div class="article-layout"><div class="article-body">${body}${renderSources(article, locale)}</div><aside class="article-rail"><div class="author-card"><span>${it ? "Scritto e fotografato da" : "Written and photographed by"}</span><strong>Paolo Pastorino</strong><p>${it ? "Vive a Londra dal 2018 e raccoglie luoghi che meritano di essere guardati due volte." : "Living in London since 2018 and collecting places that reward a second look."}</p><a href="${it ? "/it/chi-sono/" : "/about/"}">${it ? "Chi sono" : "About Paolo"} →</a></div><div class="article-share"><span>${it ? "Lingua" : "Language"}</span><a href="${alternateRoute}" hreflang="${it ? "en-GB" : "it-IT"}">${it ? "Read in English" : "Leggi in italiano"} →</a></div></aside></div></article>${renderRelatedTools(article, locale)}<section class="journal-newsletter"><span class="journal-kicker">${it ? "La lettera da Londra" : "The London letter"}</span><h2>${it ? "Nuovi luoghi, solo quando meritano una mail." : "New places, only when they deserve an email."}</h2><p>${it ? "Una nota occasionale e curata con luoghi, percorsi ed eventi utili. Mai riempitivi." : "An occasional, carefully edited note with useful places, routes and events. No filler."}</p><a class="button dark" href="${it ? "/it/#newsletter" : "/newsletter/"}">${it ? "Iscriviti" : "Join the newsletter"}</a></section></main>${footer(locale)}<script src="/journal.js"></script></body></html>`;
}

function card(article, locale, preview = false) {
  const it = locale === "it";
  const image = (article.images || []).find(item => item.role === "hero") || (article.images || [])[0];
  const route = articleRoute(article, locale, preview);
  return `<article class="journal-card"><a class="journal-card-image" href="${route}">${image?.src ? `<img src="${escapeHtml(safeUrl(image.src))}" alt="${escapeHtml(image.alt || "")}" width="${Number(image.width) || 1200}" height="${Number(image.height) || 800}" loading="lazy">` : `<span aria-hidden="true">LA</span>`}</a><div><span class="journal-kicker">${escapeHtml(article.eyebrow || (it ? "Appunti sul campo" : "Field notes"))}</span><h2><a href="${route}">${escapeHtml(article.title)}</a></h2><p>${escapeHtml(article.dek || article.description)}</p><div class="journal-card-meta"><span>${formatDate(article.published_at || article.updated_at, locale)}</span><a href="${route}">${it ? "Leggi" : "Read"} →</a></div></div></article>`;
}

function collectionSchema(locale, route, articles) {
  const it = locale === "it";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonicalOrigin}${route}#collection`,
        url: `${canonicalOrigin}${route}`,
        name: it ? "Londra insolita: luoghi, itinerari e guide locali" : "Unusual London places, walks and local guides",
        description: it ? "Appunti originali su luoghi insoliti, passeggiate e dettagli trascurati di Londra." : "Original field notes on unusual London places, walks and overlooked details.",
        inLanguage: it ? "it-IT" : "en-GB",
        author: { "@id": `${canonicalOrigin}/#paolo-pastorino` },
        mainEntity: { "@id": `${canonicalOrigin}${route}#articles` }
      },
      {
        "@type": "ItemList",
        "@id": `${canonicalOrigin}${route}#articles`,
        numberOfItems: articles.length,
        itemListElement: articles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${canonicalOrigin}${articleRoute(article, locale, false)}`,
          name: article.title
        }))
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "London Advanced", item: `${canonicalOrigin}${it ? "/it/" : "/"}` },
          { "@type": "ListItem", position: 2, name: "Journal", item: `${canonicalOrigin}${route}` }
        ]
      }
    ]
  };
}

function renderIndex(articles, locale) {
  const it = locale === "it";
  const route = it ? "/it/journal/" : "/journal/";
  const alternateRoute = it ? "/journal/" : "/it/journal/";
  const title = it ? "Londra insolita: luoghi, itinerari e guide locali | London Advanced" : "Unusual London places, walks and local guides | London Advanced";
  const description = it ? "Appunti originali su luoghi insoliti, passeggiate e dettagli trascurati di Londra, scritti e fotografati da Paolo Pastorino." : "Original field notes on unusual London places, walks and overlooked details, written and photographed by Paolo Pastorino.";
  const cards = articles.length ? `<div class="journal-index-grid">${articles.map(article => card(article, locale)).join("")}</div>` : `<div class="journal-empty"><span>01—06</span><h2>${it ? "Le prime storie sono in preparazione." : "The first stories are being prepared."}</h2><p>${it ? "Sei luoghi e itinerari apriranno il Journal. Ogni articolo sarà pubblicato insieme in inglese e italiano, con fotografie originali e informazioni verificate." : "Six places and walks will open the Journal. Every article will be published in English and Italian together, with original photography and checked practical information."}</p></div>`;
  return `${pageHead({ locale, route, alternateRoute, title, description, type: "website", schema: collectionSchema(locale, route, articles) })}<body class="journal-page journal-index-page">${navigation(locale, "journal", alternateRoute)}<main><section class="journal-index-hero"><span class="journal-kicker">London Advanced · Journal</span><h1>${it ? "Londra, raccontata<br><em>dal marciapiede.</em>" : "London, reported<br><em>from the pavement.</em>"}</h1><div><p>${it ? "Luoghi, passeggiate e dettagli che premiano un secondo sguardo. Scritti sul campo, verificati presso le fonti e accompagnati da fotografie originali." : "Places, walks and details that reward a second look. Written from direct experience, checked against sources and paired with original photography."}</p><span>${it ? "Di Paolo Pastorino" : "By Paolo Pastorino"}</span></div></section><section class="journal-index-list"><div class="journal-index-heading"><span>${it ? "Ultimi articoli" : "Latest stories"}</span><p>${it ? "Nessun calendario editoriale artificiale: viene pubblicato solo ciò che vale il tempo del lettore." : "No artificial publishing quota: only work that earns the reader’s time."}</p></div>${cards}</section><section class="journal-index-pathways"><div><span class="journal-kicker">${it ? "Dal racconto all’azione" : "From story to action"}</span><h2>${it ? "Scopri un luogo. Poi organizza meglio la visita." : "Find a place. Then plan the visit better."}</h2></div><div class="journal-tool-grid">${["london-by-mood", "smart-navigation", "escape-the-crowds"].map(id => { const [name, href, desc] = TOOL_PATHS[id][locale]; return `<a href="${href}"><span>${escapeHtml(desc)}</span><strong>${escapeHtml(name)} →</strong></a>`; }).join("")}</div></section></main>${footer(locale)}<script src="/journal.js"></script></body></html>`;
}

export function isPublicPair(en, it) {
  if (!en || !it) return false;
  if (en.editorial_status !== "published" || it.editorial_status !== "published") return false;
  for (const article of [en, it]) {
    if (article.approval?.status !== "approved") return false;
    if (!article.approval?.approved_by || !article.approval?.approved_at || !article.published_at) return false;
  }
  return true;
}

function validatePair(en, it, id) {
  const errors = [];
  if (!en || !it) errors.push(`${id} is missing its ${en ? "Italian" : "English"} version.`);
  for (const [locale, article] of [["en", en], ["it", it]]) {
    if (!article) continue;
    for (const field of ["article_id", "title", "slug", "description", "dek", "body"]) {
      if (!String(article[field] || "").trim()) errors.push(`${id}.${locale} is missing ${field}.`);
    }
    if (article.article_id !== id) errors.push(`${id}.${locale} has a mismatched article_id.`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug || "")) errors.push(`${id}.${locale} has an invalid slug.`);
    if (String(article.description || "").length > 165) errors.push(`${id}.${locale} description exceeds 165 characters.`);
  }
  if (en && it && en.editorial_status !== it.editorial_status) errors.push(`${id} has inconsistent editorial status across languages.`);
  return errors;
}

async function loadArticles() {
  await mkdir(contentDirectory, { recursive: true });
  const files = (await readdir(contentDirectory)).filter(file => /\.(en|it)\.json$/.test(file));
  const pairs = new Map();
  for (const file of files) {
    const match = file.match(/^(.*)\.(en|it)\.json$/);
    const article = JSON.parse(await readFile(path.join(contentDirectory, file), "utf8"));
    const id = match[1];
    if (!pairs.has(id)) pairs.set(id, { id });
    pairs.get(id)[match[2]] = article;
  }
  const errors = [...pairs.values()].flatMap(pair => validatePair(pair.en, pair.it, pair.id));
  if (errors.length) throw new Error(`Journal content validation failed:\n- ${errors.join("\n- ")}`);
  return [...pairs.values()];
}

async function writePage(route, html) {
  const target = path.join(dist, route.replace(/^\//, ""), "index.html");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
}

async function integrateHomepage(locale, articles) {
  const file = path.join(dist, locale === "it" ? "it/index.html" : "index.html");
  let html = await readFile(file, "utf8");
  html = html.replaceAll('href="/#journal"', 'href="/journal/"').replaceAll('href="/it/#journal"', 'href="/it/journal/"');
  html = html
    .replace('<button class="nav-section-button" type="button" data-scroll-target="journal">Journal</button>', `<a href="${locale === "it" ? "/it/journal/" : "/journal/"}">Journal</a>`)
    .replace(/<button class="mobile-section-link" type="button" data-scroll-target="journal">([\s\S]*?)<\/button>/, `<a href="${locale === "it" ? "/it/journal/" : "/journal/"}">$1</a>`);
  if (!html.includes('href="/journal.css"')) html = html.replace("</head>", '  <link rel="stylesheet" href="/journal.css">\n</head>');
  const it = locale === "it";
  const preview = articles.slice(0, 3);
  const cards = preview.length ? preview.map(article => card(article, locale)).join("") : `<div class="journal-home-empty"><strong>${it ? "Le prime sei storie sono in preparazione." : "The first six stories are being prepared."}</strong><span>${it ? "Fotografie originali, due lingue, informazioni verificate." : "Original photography, two languages, checked practical information."}</span></div>`;
  const section = `<section id="journal" class="journal section-wrap"><div class="section-heading horizontal"><div><span>02 / ${it ? "Appunti sul campo" : "Field notes"}</span><h2>${it ? "Londra merita un secondo sguardo." : "London rewards a second look."}</h2></div><p>${it ? "Luoghi insoliti, percorsi tranquilli e dettagli trascurati, scritti e fotografati da Paolo." : "Unusual places, quieter routes and overlooked details, written and photographed by Paolo."}</p></div><div class="journal-home-grid">${cards}</div><a class="journal-all-link" href="${it ? "/it/journal/" : "/journal/"}">${it ? "Esplora il Journal" : "Explore the Journal"} <span aria-hidden="true">→</span></a></section>`;
  html = html.replace(/<section id="journal" class="journal section-wrap">[\s\S]*?<\/section>/, section);
  await writeFile(file, html, "utf8");
}

async function integrateAllNavigation() {
  const walk = async directory => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith(".html")) {
        let html = await readFile(full, "utf8");
        const updated = html.replaceAll('href="/#journal"', 'href="/journal/"').replaceAll('href="/it/#journal"', 'href="/it/journal/"');
        if (updated !== html) await writeFile(full, updated, "utf8");
      }
    }
  };
  await walk(dist);
}

async function updateSitemap(publishedPairs) {
  const file = path.join(dist, "sitemap.xml");
  let sitemap = await readFile(file, "utf8");
  const routes = ["/journal/", "/it/journal/"];
  for (const pair of publishedPairs) routes.push(articleRoute(pair.en, "en", false), articleRoute(pair.it, "it", false));
  sitemap = sitemap.replace(/\n?<url><loc>https:\/\/www\.londonadvanced\.com\/(?:it\/)?journal\/[^<]*<\/loc><\/url>/g, "");
  sitemap = sitemap.replace(/^\s+$/gm, "").replace(/\n{2,}/g, "\n");
  const entries = routes.map(route => `  <url><loc>${canonicalOrigin}${route}</loc></url>`).join("\n");
  sitemap = sitemap.replace("</urlset>", `${entries}\n</urlset>`);
  await writeFile(file, sitemap, "utf8");
}

async function writeFeed(publishedPairs) {
  const items = publishedPairs.flatMap(pair => [
    { ...pair.en, locale: "en" },
    { ...pair.it, locale: "it" }
  ]).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const feed = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>London Advanced Journal</title><id>${canonicalOrigin}/journal/</id><link href="${canonicalOrigin}/journal/feed.xml" rel="self"/><updated>${items[0]?.updated_at || items[0]?.published_at || new Date(0).toISOString()}</updated>${items.map(article => { const route = articleRoute(article, article.locale, false); return `<entry><title>${escapeHtml(article.title)}</title><id>${canonicalOrigin}${route}</id><link href="${canonicalOrigin}${route}"/><updated>${article.updated_at || article.published_at}</updated><summary>${escapeHtml(article.description)}</summary></entry>`; }).join("")}</feed>`;
  await mkdir(path.join(dist, "journal"), { recursive: true });
  await writeFile(path.join(dist, "journal", "feed.xml"), feed, "utf8");
}

async function syncStudio() {
  await rm(path.join(dist, "studio"), { recursive: true, force: true });
  await cp(studioDirectory, path.join(dist, "studio"), { recursive: true });
}

async function syncJournalAssets() {
  const source = path.join(root, "assets", "journal");
  const target = path.join(dist, "assets", "journal");
  await mkdir(source, { recursive: true });
  await rm(target, { recursive: true, force: true });
  await cp(source, target, {
    recursive: true,
    filter: file => !path.basename(file).startsWith(".")
  });
}

export async function buildJournal({ includeDrafts = false } = {}) {
  const pairs = await loadArticles();
  const publishedPairs = pairs.filter(pair => isPublicPair(pair.en, pair.it));
  const englishPublished = publishedPairs.map(pair => pair.en).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const italianPublished = publishedPairs.map(pair => pair.it).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));

  await Promise.all([
    writePage("/journal/", renderIndex(englishPublished, "en")),
    writePage("/it/journal/", renderIndex(italianPublished, "it")),
    cp(path.join(root, "journal.css"), path.join(dist, "journal.css")),
    cp(path.join(root, "journal.js"), path.join(dist, "journal.js")),
    syncStudio(),
    syncJournalAssets()
  ]);

  for (const pair of publishedPairs) {
    await writePage(articleRoute(pair.en, "en", false), renderArticle(pair.en, pair.it, "en", false));
    await writePage(articleRoute(pair.it, "it", false), renderArticle(pair.it, pair.en, "it", false));
  }

  if (includeDrafts) {
    for (const pair of pairs.filter(pair => !isPublicPair(pair.en, pair.it))) {
      await writePage(articleRoute(pair.en, "en", true), renderArticle(pair.en, pair.it, "en", true));
      await writePage(articleRoute(pair.it, "it", true), renderArticle(pair.it, pair.en, "it", true));
    }
  } else {
    await rm(path.join(dist, "journal", "_preview"), { recursive: true, force: true });
    await rm(path.join(dist, "it", "journal", "_preview"), { recursive: true, force: true });
  }

  await Promise.all([
    integrateHomepage("en", englishPublished),
    integrateHomepage("it", italianPublished),
    updateSitemap(publishedPairs),
    writeFeed(publishedPairs)
  ]);
  await integrateAllNavigation();
  console.log(`Built Journal Studio, ${publishedPairs.length} published bilingual article pair(s)${includeDrafts ? ` and ${pairs.length - publishedPairs.length} draft preview pair(s)` : ""}.`);
}
