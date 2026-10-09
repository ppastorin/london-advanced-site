import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const dist = path.join(root, "dist");
const journal = path.join(root, "content", "journal");
const itineraries = path.join(root, "content", "itineraries");
const canonicalOrigin = "https://www.londonadvanced.com";

function publicArticle(article) {
  return article?.editorial_status === "published" &&
    article.approval?.status === "approved" &&
    Boolean(article.approval?.approved_by) &&
    Boolean(article.approval?.approved_at) &&
    Boolean(article.published_at);
}

function cleanMarkdown(value = "") {
  return String(value)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadPortalData(relativePath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(await readFile(path.join(dist, relativePath), "utf8"), context, { filename: relativePath });
  return context.window.LONDON_ADVANCED;
}

async function loadPublishedArticles() {
  const files = (await readdir(journal)).filter(file => /\.(en|it)\.json$/.test(file));
  const articles = [];
  for (const file of files) {
    const locale = file.endsWith(".it.json") ? "it" : "en";
    const article = JSON.parse(await readFile(path.join(journal, file), "utf8"));
    if (!publicArticle(article)) continue;
    articles.push({
      id: `article:${article.article_id}:${locale}`,
      type: "article",
      locale,
      title: article.title,
      summary: article.dek || article.description,
      url: locale === "it" ? `/it/journal/${article.slug}/` : `/journal/${article.slug}/`,
      tags: article.tags || [],
      keywords: [article.eyebrow, article.seo_title].filter(Boolean),
      content: cleanMarkdown(article.body),
      updated_at: article.updated_at || article.published_at
    });
  }
  return articles;
}

async function loadPublishedItineraries() {
  const files = (await readdir(itineraries)).filter(file => /\.(en|it)\.json$/.test(file));
  const records = [];
  for (const file of files) {
    const locale = file.endsWith(".it.json") ? "it" : "en";
    const itinerary = JSON.parse(await readFile(path.join(itineraries, file), "utf8"));
    if (!publicArticle(itinerary)) continue;
    records.push({
      id: `itinerary:${itinerary.itinerary_id}:${locale}`,
      type: "itinerary",
      locale,
      title: itinerary.title,
      summary: itinerary.dek || itinerary.description,
      url: locale === "it" ? `/it/itinerari/${itinerary.slug}/` : `/itineraries/${itinerary.slug}/`,
      tags: [itinerary.theme, itinerary.area, itinerary.best_day, itinerary.environment, ...(itinerary.tags || [])],
      keywords: [itinerary.walking_level, itinerary.transit_level, itinerary.season, ...(itinerary.stops || []).flatMap(stop => [stop.name, stop.location_id])].filter(Boolean),
      content: cleanMarkdown(`${itinerary.body || ""} ${(itinerary.stops || []).map(stop => `${stop.name} ${stop.summary || ""}`).join(" ")}`),
      updated_at: itinerary.updated_at || itinerary.published_at
    });
  }
  return records;
}

function activeEvents(feed) {
  const referenceTime = Date.parse(feed.generated_at);
  if (!Number.isFinite(referenceTime) || !Array.isArray(feed.events)) return [];
  return feed.events.filter(event =>
    event.publication_status === "approved" &&
    Number.isInteger(event.advanced?.score) && event.advanced.score >= 7 &&
    Date.parse(event.publish_at) <= referenceTime &&
    Date.parse(event.expire_at) > referenceTime
  );
}

function eventRecords(locale, feed) {
  const it = locale === "it";
  const categories = it ? {
    "architecture": "Architettura",
    "art-design": "Arte e design",
    "community": "Community",
    "heritage-history": "Patrimonio e storia",
    "local-culture": "Cultura locale",
    "nature": "Natura",
    "talk": "Incontro",
    "urban-exploration": "Esplorazione urbana"
  } : {
    "architecture": "Architecture",
    "art-design": "Art and design",
    "community": "Community",
    "heritage-history": "Heritage and history",
    "local-culture": "Local culture",
    "nature": "Nature",
    "talk": "Talk",
    "urban-exploration": "Urban exploration"
  };
  const date = new Intl.DateTimeFormat(it ? "it-IT" : "en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London"
  });

  return activeEvents(feed).map(event => {
    const title = it ? (event.title_it || event.title_en) : event.title_en;
    const description = it ? (event.summary_it || event.summary_en) : event.summary_en;
    const price = event.price.amount_gbp === 0 ? (it ? "Gratuito" : "Free") : event.price.display;
    const category = categories[event.category] || event.category;
    const context = `${date.format(new Date(event.start))} · ${event.venue.name} · ${price}`;
    return {
      id: `event:${event.id}:${locale}`,
      type: "event",
      locale,
      title,
      summary: `${context} — ${description}`,
      url: `${it ? "/it/eventi/" : "/events/"}#event-${event.id}`,
      tags: [category, price, event.venue.borough, event.price.classification],
      keywords: [
        event.venue.name,
        event.venue.address,
        event.venue.postcode,
        event.venue.borough,
        it ? "evento eventi questa settimana weekend gratuito economico" : "event events this week weekend free affordable"
      ],
      content: it ? description : `${description} ${event.advanced?.reason || ""}`,
      updated_at: feed.generated_at,
      expires_at: event.expire_at
    };
  });
}

function toolRecords(locale, portal, searchConfig) {
  const definitions = new Map(searchConfig.map(tool => [tool.id, tool]));
  const records = portal.apps.map(tool => {
    const definition = definitions.get(tool.id);
    if (!definition?.keywords?.[locale]?.length) {
      throw new Error(`Search metadata is missing for tool ${tool.id} in ${locale}.`);
    }
    return {
      id: `tool:${tool.id}:${locale}`,
      type: "tool",
      locale,
      title: tool.name,
      summary: tool.description,
      url: tool.href,
      tags: [tool.short],
      keywords: definition.keywords[locale],
      content: `${tool.short} ${tool.description}`
    };
  });
  const portalIds = new Set(portal.apps.map(tool => tool.id));
  const unused = searchConfig.filter(tool => !portalIds.has(tool.id));
  if (unused.length) throw new Error(`Search metadata refers to unknown tools: ${unused.map(tool => tool.id).join(", ")}.`);
  return records;
}

function guideRecord(locale) {
  const it = locale === "it";
  return {
    id: `guide:the-other-london:${locale}`,
    type: "guide",
    locale,
    title: "The Other London",
    summary: it
      ? "110 luoghi insoliti oltre l’ovvio: guida indipendente con fotografie originali, dettagli pratici e mappe."
      : "110 unusual places beyond the obvious: an independent field guide with original photography, practical details and maps.",
    url: it ? "/it/the-other-london/" : "/the-other-london/",
    tags: it ? ["Guida", "Luoghi", "Londra insolita"] : ["Guide", "Places", "Unusual London"],
    keywords: it
      ? ["the other london", "guida londra", "luoghi segreti", "londra insolita", "paolo pastorino"]
      : ["the other london", "London guide", "hidden London", "unusual places", "Paolo Pastorino"],
    content: it
      ? "Aree edifici musei curiosità parchi luoghi religiosi shopping panorami anteprima gratuita"
      : "Areas buildings museums oddities parks religious places shopping views free sampler"
  };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function searchPage(locale) {
  const it = locale === "it";
  const route = it ? "/it/cerca/" : "/search/";
  const alternate = it ? "/search/" : "/it/cerca/";
  const title = it ? "Cerca in London Advanced" : "Search London Advanced";
  const description = it
    ? "Cerca luoghi, articoli e strumenti pratici in London Advanced."
    : "Search places, articles and practical tools across London Advanced.";
  const placeholder = it ? "Prova “Trinity Buoy Wharf”, “Oyster” o “meteo”" : "Try “Trinity Buoy Wharf”, “Oyster” or “weather”";
  return `<!doctype html><html lang="${it ? "it-IT" : "en-GB"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${canonicalOrigin}${route}"><link rel="alternate" hreflang="en-GB" href="${canonicalOrigin}${it ? alternate : route}"><link rel="alternate" hreflang="it-IT" href="${canonicalOrigin}${it ? route : alternate}"><link rel="alternate" hreflang="x-default" href="${canonicalOrigin}/search/"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><title>${title}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Caslon+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/search.css"></head><body class="search-page"><header class="search-header"><a class="wordmark" href="${it ? "/it/" : "/"}" aria-label="${it ? "Homepage London Advanced" : "London Advanced homepage"}"><svg class="brand-mark" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5"/><path class="brand-needle" d="m23.7 10.3-3.2 10.2-10.2 3.2 3.2-10.2 10.2-3.2Z"/><circle class="brand-centre" cx="18" cy="18" r="2.2"/></svg><span class="brand-name">London Advanced</span></a><a class="search-language" href="${alternate}" lang="${it ? "en" : "it"}" hreflang="${it ? "en-GB" : "it-IT"}">${it ? "English" : "Italiano"}</a></header><main class="search-main"><section class="search-intro"><span class="search-kicker">London Advanced · ${it ? "Ricerca" : "Search"}</span><h1>${it ? "Cosa stai cercando?" : "What are you looking for?"}</h1><p>${escapeHtml(description)}</p></section><form class="search-form" data-search-form role="search"><label class="search-visually-hidden" for="site-search">${it ? "Cerca" : "Search"}</label><input id="site-search" name="q" type="search" autocomplete="off" placeholder="${escapeHtml(placeholder)}" data-search-input><button type="submit">${it ? "Cerca" : "Search"}</button></form><p class="search-summary" data-search-summary aria-live="polite"></p><section class="search-results" data-search-results aria-live="polite"></section></main><script src="/search.js" defer></script></body></html>`;
}

function searchIconLink(locale, className) {
  const it = locale === "it";
  return `<a class="${className}" href="${it ? "/it/cerca/" : "/search/"}" aria-label="${it ? "Cerca in London Advanced" : "Search London Advanced"}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><span class="search-visually-hidden">${it ? "Cerca" : "Search"}</span></a>`;
}

function integrateItineraryMenuLink(html, locale) {
  if (!html.includes('class="site-nav"')) return html;
  const it = locale === "it";
  const journalPath = it ? "/it/journal/" : "/journal/";
  const itineraryPath = it ? "/it/itinerari/" : "/itineraries/";
  const newsletterPath = it ? "/it/#newsletter" : "/newsletter/";
  const label = it ? "Itinerari" : "Itineraries";
  const description = it ? "Percorsi curati di una giornata" : "Curated one-day routes";

  return html.replace(/<header class="site-nav">[\s\S]*?<\/header>/, header => {
    let updated = header.replace(/<nav class="desktop-nav"[\s\S]*?<\/nav>/, nav => {
      if (nav.includes(`href="${itineraryPath}"`)) return nav;
      const journal = new RegExp(`(<a\\b[^>]*href="${journalPath}"[^>]*>Journal<\\/a>)`);
      return nav.replace(journal, `$1<a href="${itineraryPath}">${label}</a>`);
    });
    const mobileStart = updated.indexOf('<div class="nav-menu-panel mobile-menu-panel">');
    if (mobileStart >= 0) {
      const menu = updated.slice(mobileStart);
      if (!menu.includes(`href="${itineraryPath}"`)) {
        const journal = new RegExp(`(<a\\b[^>]*href="${journalPath}"[^>]*>[\\s\\S]*?<strong>Journal<\\/strong>\\s*<\\/a>)`);
        const itineraryLink = `<a href="${itineraryPath}"><span>${description}</span><strong>${label}</strong></a>`;
        let linked = menu.replace(journal, `$1${itineraryLink}`);
        if (linked === menu) {
          const newsletter = new RegExp(`(<a\\b[^>]*href="${newsletterPath}"[^>]*>)`);
          linked = menu.replace(newsletter, `${itineraryLink}$1`);
        }
        updated = `${updated.slice(0, mobileStart)}${linked}`;
      }
    }
    return updated;
  });
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

async function integrateSearchLinks() {
  const files = (await walk(dist)).filter(file => file.endsWith(".html") && !file.includes(`${path.sep}studio${path.sep}`) && !file.includes(`${path.sep}search${path.sep}`) && !file.includes(`${path.sep}cerca${path.sep}`));
  for (const file of files) {
    let html = await readFile(file, "utf8");
    const locale = /<html lang="it(?:-IT)?"/i.test(html) || file.includes(`${path.sep}it${path.sep}`) ? "it" : "en";
    html = integrateItineraryMenuLink(html, locale);
    if (!html.includes('href="/search.css"')) html = html.replace("</head>", '<link rel="stylesheet" href="/search.css"></head>');
    if (html.includes('class="desktop-nav"') && !html.includes('class="site-search-link"')) {
      html = html.replace(/(<nav class="desktop-nav"[\s\S]*?)(<\/nav>)/, `$1${searchIconLink(locale, "site-search-link")}$2`);
    }
    if (html.includes('class="mobile-language-switch"') && !html.includes('class="mobile-search-link"')) {
      html = html.replace(/(<a class="mobile-language-switch")/, `${searchIconLink(locale, "mobile-search-link")}$1`);
    }
    if (html.includes('class="tool-actions"') && !html.includes('class="tool-search-link"')) {
      html = html.replace('<div class="tool-actions">', `<div class="tool-actions">${searchIconLink(locale, "tool-search-link")}`);
    }
    await writeFile(file, html, "utf8");
  }
}

export async function buildSearch() {
  const [englishPortal, italianPortal, searchConfig, articles, itineraryRecords, eventsFeed] = await Promise.all([
    loadPortalData("content.js"),
    loadPortalData("it/content.js"),
    readFile(path.join(root, "content", "search-tools.json"), "utf8").then(JSON.parse),
    loadPublishedArticles(),
    loadPublishedItineraries(),
    readFile(path.join(dist, "data", "events.json"), "utf8").then(JSON.parse)
  ]);
  const englishEvents = eventRecords("en", eventsFeed);
  const italianEvents = eventRecords("it", eventsFeed);
  const english = [guideRecord("en"), ...toolRecords("en", englishPortal, searchConfig), ...articles.filter(article => article.locale === "en"), ...itineraryRecords.filter(item => item.locale === "en"), ...englishEvents];
  const italian = [guideRecord("it"), ...toolRecords("it", italianPortal, searchConfig), ...articles.filter(article => article.locale === "it"), ...itineraryRecords.filter(item => item.locale === "it"), ...italianEvents];

  await Promise.all([
    mkdir(path.join(dist, "search"), { recursive: true }),
    mkdir(path.join(dist, "it", "cerca"), { recursive: true }),
    mkdir(path.join(dist, "data"), { recursive: true })
  ]);
  await Promise.all([
    writeFile(path.join(dist, "data", "search-index.en.json"), `${JSON.stringify({ locale: "en", records: english }, null, 2)}\n`, "utf8"),
    writeFile(path.join(dist, "data", "search-index.it.json"), `${JSON.stringify({ locale: "it", records: italian }, null, 2)}\n`, "utf8"),
    writeFile(path.join(dist, "search", "index.html"), searchPage("en"), "utf8"),
    writeFile(path.join(dist, "it", "cerca", "index.html"), searchPage("it"), "utf8"),
    copyFile(path.join(root, "search", "search.js"), path.join(dist, "search.js")),
    copyFile(path.join(root, "search", "search.css"), path.join(dist, "search.css"))
  ]);
  await integrateSearchLinks();
  console.log(`Built bilingual search with ${english.length} English and ${italian.length} Italian records, including ${englishEvents.length} current events.`);
}
