import { access, cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { escapeHtml, footer, navigation, renderMarkdown, safeUrl } from "./build-journal.mjs";

const root = process.cwd();
const dist = path.join(root, "dist");
const contentDirectory = path.join(root, "content", "itineraries");
const journalDirectory = path.join(root, "content", "journal");
const canonicalOrigin = "https://www.londonadvanced.com";

const CLASSIFICATION_LABELS = {
  theme: {
    en: { "sacred-gardens-local-history": "Sacred spaces, gardens and local history", "industrial-afterlives": "Industrial afterlives", "nature-and-infrastructure": "Nature and infrastructure", "craft-and-design": "Craft and design", "layers-of-history": "Layers of history" },
    it: { "sacred-gardens-local-history": "Spazi sacri, giardini e storia locale", "industrial-afterlives": "Eredità industriali", "nature-and-infrastructure": "Natura e infrastrutture", "craft-and-design": "Artigianato e design", "layers-of-history": "Strati di storia" }
  },
  area: { en: { "south-west": "South-west London", north: "North London", east: "East London", "north-west": "North-west London" }, it: { "south-west": "Londra sud-ovest", north: "Londra nord", east: "Londra est", "north-west": "Londra nord-ovest" } },
  best_day: { en: { "any-day": "Any day", sunday: "Sunday", saturday: "Saturday", weekend: "Weekend", weekday: "Weekday" }, it: { "any-day": "Qualsiasi giorno", sunday: "Domenica", saturday: "Sabato", weekend: "Weekend", weekday: "Giorno feriale" } },
  environment: { en: { mixed: "Indoor and outdoor", outdoor: "Mostly outdoors", indoor: "Mostly indoors" }, it: { mixed: "Interni ed esterni", outdoor: "Prevalentemente all’aperto", indoor: "Prevalentemente al chiuso" } },
  walking_level: { en: { easy: "Easy", moderate: "Moderate", active: "Active" }, it: { easy: "Facile", moderate: "Moderato", active: "Impegnativo" } },
  transit_level: { en: { none: "No public transport", light: "One or two short rides", moderate: "Several short rides" }, it: { none: "Senza trasporto pubblico", light: "Uno o due brevi tragitti", moderate: "Diversi brevi tragitti" } }
};

function classification(item, field) {
  return CLASSIFICATION_LABELS[field]?.[item.locale]?.[item[field]] || item[field] || "";
}

function safeJson(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function publicRecord(record) {
  return record?.editorial_status === "published" &&
    record.approval?.status === "approved" &&
    Boolean(record.approval?.approved_by) &&
    Boolean(record.approval?.approved_at) &&
    Boolean(record.published_at);
}

export function isPublicItineraryPair(en, it) {
  return Boolean(en && it && en.itinerary_id === it.itinerary_id && publicRecord(en) && publicRecord(it));
}

function validatePair(en, it, id) {
  const errors = [];
  if (!en || !it) return [`${id} must have both English and Italian files.`];
  for (const [locale, item] of [["en", en], ["it", it]]) {
    if (item.itinerary_id !== id) errors.push(`${id}.${locale} has a mismatched itinerary_id.`);
    if (!item.title || !item.slug || !item.description || !item.dek) errors.push(`${id}.${locale} is missing core editorial copy.`);
    if (!Array.isArray(item.stops) || item.stops.length < 2) errors.push(`${id}.${locale} needs at least two stops.`);
    if (!item.theme || !item.area || !item.best_day || !item.environment || !item.walking_level || !item.transit_level) {
      errors.push(`${id}.${locale} is missing a controlled classification field.`);
    }
    if (item.description?.length > 165) errors.push(`${id}.${locale} search description is longer than 165 characters.`);
  }
  if (en.editorial_status !== it.editorial_status) errors.push(`${id} must keep workflow status aligned across languages.`);
  if (publicRecord(en) || publicRecord(it)) {
    if (!isPublicItineraryPair(en, it)) errors.push(`${id} cannot publish until both languages are approved.`);
    for (const [locale, item] of [["en", en], ["it", it]]) {
      if (!item.google_maps_url) errors.push(`${id}.${locale} needs a Google Maps itinerary before publication.`);
      if (!item.pace_note) errors.push(`${id}.${locale} needs an indicative-timing note before publication.`);
      if (item.stops.some(stop => !stop.place_url)) errors.push(`${id}.${locale} needs an individual URL for every stop before publication.`);
      if (!item.map?.src) errors.push(`${id}.${locale} needs a finished route map before publication.`);
      if (!Array.isArray(item.images) || !item.images.some(image => image.role === "hero")) {
        errors.push(`${id}.${locale} needs a hero photograph before publication.`);
      }
    }
  }
  return errors;
}

async function loadPairs() {
  const files = (await readdir(contentDirectory)).filter(file => /\.(en|it)\.json$/.test(file));
  const pairs = new Map();
  for (const file of files) {
    const locale = file.endsWith(".it.json") ? "it" : "en";
    const record = JSON.parse(await readFile(path.join(contentDirectory, file), "utf8"));
    const id = record.itinerary_id;
    if (!id) throw new Error(`${file} is missing itinerary_id.`);
    if (!pairs.has(id)) pairs.set(id, { id });
    pairs.get(id)[locale] = record;
  }
  const errors = [...pairs.values()].flatMap(pair => validatePair(pair.en, pair.it, pair.id));
  if (errors.length) throw new Error(`Itinerary content validation failed:\n- ${errors.join("\n- ")}`);
  return [...pairs.values()];
}

async function loadJournal(locale) {
  const files = (await readdir(journalDirectory)).filter(file => file.endsWith(`.${locale}.json`));
  const articles = new Map();
  for (const file of files) {
    const item = JSON.parse(await readFile(path.join(journalDirectory, file), "utf8"));
    if (publicRecord(item)) articles.set(item.article_id, item);
  }
  return articles;
}

function routeFor(item, locale, preview = false) {
  const base = locale === "it" ? "/it/itinerari/" : "/itineraries/";
  return preview ? `${base}_preview/${item.itinerary_id}/` : `${base}${item.slug}/`;
}

function itineraryNavigation(locale, alternateRoute) {
  return navigation(locale, "itineraries", alternateRoute);
}

function itineraryFooter(locale) {
  return footer(locale);
}

function pageHead({ locale, route, alternateRoute, title, description, image, schema, noindex = false }) {
  const it = locale === "it";
  const canonical = `${canonicalOrigin}${route}`;
  const alternate = `${canonicalOrigin}${alternateRoute}`;
  const xDefault = it ? alternate : canonical;
  return `<!doctype html><html lang="${it ? "it-IT" : "en-GB"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><meta name="author" content="Paolo Pastorino"><meta name="robots" content="${noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"}"><meta property="og:type" content="website"><meta property="og:site_name" content="London Advanced"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${escapeHtml(image || `${canonicalOrigin}/assets/london-map.jpg`)}"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en-GB" href="${it ? alternate : canonical}"><link rel="alternate" hreflang="it-IT" href="${it ? canonical : alternate}"><link rel="alternate" hreflang="x-default" href="${xDefault}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><title>${escapeHtml(title)}</title><script type="application/ld+json">${safeJson(schema)}</script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Caslon+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/journal.css"><link rel="stylesheet" href="/itineraries.css"></head>`;
}

function imageFocalStyle(image = {}) {
  const x = Number.isFinite(Number(image.focal_x)) ? Math.min(100, Math.max(0, Number(image.focal_x))) : 50;
  const y = Number.isFinite(Number(image.focal_y)) ? Math.min(100, Math.max(0, Number(image.focal_y))) : 50;
  return ` style="object-position:${x}% ${y}%"`;
}

function heroFigure(item) {
  const image = item.images?.find(candidate => candidate.role === "hero") || item.images?.[0];
  if (!image?.src) return `<div class="itinerary-asset-placeholder"><strong>${item.locale === "it" ? "Fotografia da scegliere" : "Photograph to be selected"}</strong><span>${item.locale === "it" ? "La bozza resta revisionabile senza pubblicare un’immagine temporanea." : "The draft remains reviewable without publishing a temporary image."}</span></div>`;
  return `<figure class="journal-figure journal-hero-image"><img src="${escapeHtml(safeUrl(image.src))}" alt="${escapeHtml(image.alt || "")}" width="${Number(image.width) || 1800}" height="${Number(image.height) || 1200}"${imageFocalStyle(image)}><figcaption>${escapeHtml(image.caption || "")}${image.credit ? ` <span>© ${escapeHtml(image.credit)}</span>` : ""}</figcaption></figure>`;
}

function routeMap(item) {
  const it = item.locale === "it";
  const map = item.map || {};
  const mapVisual = map.src
    ? `<figure><img src="${escapeHtml(safeUrl(map.src))}" alt="${escapeHtml(map.alt || "")}" width="${Number(map.width) || 1600}" height="${Number(map.height) || 1000}"><figcaption>${escapeHtml(map.caption || "")}${map.credit ? ` <span>© ${escapeHtml(map.credit)}</span>` : ""}</figcaption></figure>`
    : `<div class="itinerary-map-placeholder"><span>${it ? "Mappa editoriale" : "Editorial route map"}</span><strong>${it ? "Da disegnare dopo la selezione fotografica" : "To be designed after photo selection"}</strong><p>${it ? "La struttura del percorso e le fermate sono già disponibili per la revisione." : "The route structure and stops are already available for review."}</p></div>`;
  const mapsLink = item.google_maps_url
    ? `<a class="button dark" href="${escapeHtml(safeUrl(item.google_maps_url))}" target="_blank" rel="noopener">${it ? "Apri l’itinerario in Google Maps" : "Open the route in Google Maps"} ↗</a>`
    : `<span class="itinerary-maps-pending">${it ? "Link Google Maps da aggiungere prima della pubblicazione" : "Google Maps link required before publication"}</span>`;
  return `<section class="itinerary-map"><div><span class="journal-kicker">${it ? "Il percorso" : "The route"}</span><h2>${it ? "Una giornata, leggibile a colpo d’occhio." : "One day, readable at a glance."}</h2>${mapsLink}</div>${mapVisual}</section>`;
}

function stopTimeline(item) {
  const it = item.locale === "it";
  const paceNote = item.pace_note ? `<p class="itinerary-pace-note"><strong>${it ? "Segui il tuo ritmo." : "Set your own pace."}</strong> ${escapeHtml(item.pace_note)}</p>` : "";
  return `<section class="itinerary-timeline"><div class="itinerary-section-heading"><span class="journal-kicker">${it ? "Programma" : "Schedule"}</span><h2>${it ? "Dall’arrivo all’ultima sosta." : "From arrival to the final stop."}</h2></div>${paceNote}<ol>${item.stops.map(stop => {
    const photo = (item.images || []).find(image => image.role !== "hero" && Number(image.stop_order) === Number(stop.order));
    const figure = photo?.src ? `<figure class="stop-photo"><img src="${escapeHtml(safeUrl(photo.src))}" alt="${escapeHtml(photo.alt || "")}" width="${Number(photo.width) || 1800}" height="${Number(photo.height) || 1200}" loading="lazy"${imageFocalStyle(photo)}><figcaption>${escapeHtml(photo.caption || "")}${photo.credit ? ` <span>© ${escapeHtml(photo.credit)}</span>` : ""}</figcaption></figure>` : "";
    const place = stop.place_url ? `<a class="stop-place" href="${escapeHtml(safeUrl(stop.place_url))}" target="_blank" rel="noopener">${it ? "Apri questo luogo" : "Open this location"} ↗</a>` : "";
    const article = stop.article_url ? `<a class="stop-article" href="${escapeHtml(safeUrl(stop.article_url))}">${it ? "Leggi l’articolo collegato" : "Read the linked story"} →</a>` : "";
    const links = place || article ? `<div class="stop-links">${place}${article}</div>` : "";
    const onward = stop.transport_to_next ? `<p class="stop-onward"><strong>${it ? "Poi" : "Next"}:</strong> ${escapeHtml(stop.transport_to_next)}${stop.travel_minutes ? ` · ${Number(stop.travel_minutes)} min` : ""}</p>` : "";
    return `<li><div class="stop-time"><strong>${escapeHtml(stop.arrival || "")}</strong><span>${Number(stop.duration_minutes) || 0} min</span></div><div class="stop-copy"><span>${escapeHtml(stop.location_id || "")}</span><h3>${escapeHtml(stop.name)}</h3><p>${escapeHtml(stop.summary || "")}</p>${figure}${stop.opening_note ? `<p class="stop-hours">${escapeHtml(stop.opening_note)}</p>` : ""}${links}${onward}</div></li>`;
  }).join("")}</ol></section>`;
}

function relatedArticles(item, articles) {
  const it = item.locale === "it";
  const related = (item.related_articles || []).map(id => articles.get(id)).filter(Boolean);
  if (!related.length) return "";
  return `<section class="journal-tools itinerary-related"><div><span class="journal-kicker">${it ? "Approfondisci" : "Read more"}</span><h2>${it ? "Articoli collegati alle tappe." : "Stories connected to the stops."}</h2></div><div class="journal-tool-grid">${related.map(article => `<a href="${it ? `/it/journal/${article.slug}/` : `/journal/${article.slug}/`}"><span>${escapeHtml(article.dek || article.description)}</span><strong>${escapeHtml(article.title)} →</strong></a>`).join("")}</div></section>`;
}

function sources(item) {
  const it = item.locale === "it";
  if (!item.sources?.length) return "";
  return `<details class="journal-sources"><summary>${it ? "Fonti e verifica" : "Sources and verification"}</summary><div><p>${it ? "Orari e accessi possono cambiare: controlla sempre le fonti ufficiali prima di partire." : "Hours and access can change: always check the official sources before setting out."}</p><ul>${item.sources.map(source => `<li><a href="${escapeHtml(safeUrl(source.url))}" target="_blank" rel="noopener">${escapeHtml(source.label)} ↗</a>${source.checked_at ? ` <span>· ${escapeHtml(source.checked_at)}</span>` : ""}</li>`).join("")}</ul></div></details>`;
}

function detailSchema(item, route, alternateRoute) {
  const it = item.locale === "it";
  const canonical = `${canonicalOrigin}${route}`;
  const index = `${canonicalOrigin}${it ? "/it/itinerari/" : "/itineraries/"}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristTrip",
        "@id": `${canonical}#trip`,
        name: item.title,
        description: item.description,
        url: canonical,
        itinerary: {
          "@type": "ItemList",
          itemListElement: item.stops.map((stop, indexValue) => ({
            "@type": "ListItem",
            position: indexValue + 1,
            item: { "@type": "TouristAttraction", name: stop.name, identifier: stop.location_id, url: stop.place_url }
          }))
        },
        inLanguage: it ? "it-IT" : "en-GB"
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "London Advanced", item: `${canonicalOrigin}${it ? "/it/" : "/"}` },
          { "@type": "ListItem", position: 2, name: it ? "Itinerari" : "Itineraries", item: index },
          { "@type": "ListItem", position: 3, name: item.title, item: canonical }
        ]
      },
      { "@type": "WebPage", "@id": canonical, url: canonical, name: item.title, isPartOf: { "@id": `${index}#collection` }, translationOfWork: `${canonicalOrigin}${alternateRoute}` }
    ]
  };
}

export function renderItineraryDetail(item, pair, articles, preview) {
  const it = item.locale === "it";
  const route = routeFor(item, item.locale, preview);
  const alternateRoute = routeFor(pair, it ? "en" : "it", preview);
  const body = renderMarkdown(item.body || "");
  const quick = [
    [it ? "Giorno migliore" : "Best day", classification(item, "best_day")],
    [it ? "Durata" : "Duration", item.duration],
    [it ? "A piedi" : "Walking", `${item.distance_km} km · ${classification(item, "walking_level")}`],
    [it ? "Trasporti" : "Transport", classification(item, "transit_level")],
    [it ? "Equilibrio" : "Balance", classification(item, "environment")]
  ];
  const banner = preview ? `<div class="journal-preview-banner"><strong>${it ? "Anteprima itinerario non pubblicata" : "Unpublished itinerary preview"}</strong><span>${it ? "Questa bozza non appare nell’indice pubblico né nella ricerca." : "This draft does not appear in the public index or search."}</span></div>` : "";
  const hero = item.images?.find(image => image.role === "hero") || item.images?.[0];
  const title = item.seo_title || `${item.title} | London Advanced`;
  return `${pageHead({ locale: item.locale, route, alternateRoute, title, description: item.description, image: hero?.src ? `${canonicalOrigin}${hero.src}` : undefined, schema: detailSchema(item, route, alternateRoute), noindex: preview })}<body class="journal-page itinerary-page">${banner}${itineraryNavigation(item.locale, alternateRoute)}<main><nav class="journal-breadcrumbs" aria-label="${it ? "Percorso" : "Breadcrumb"}"><a href="${it ? "/it/" : "/"}">London Advanced</a><span>/</span><a href="${it ? "/it/itinerari/" : "/itineraries/"}">${it ? "Itinerari" : "Itineraries"}</a><span>/</span><span>${escapeHtml(item.title)}</span></nav><article><header class="itinerary-header"><div><span class="journal-kicker">${escapeHtml(item.eyebrow || (it ? "Itinerario di un giorno" : "One-day itinerary"))}</span><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.dek)}</p><div class="itinerary-tags"><span>${escapeHtml(classification(item, "theme"))}</span><span>${escapeHtml(classification(item, "area"))}</span><span>${escapeHtml(classification(item, "best_day"))}</span></div></div><dl>${quick.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "")}</dd></div>`).join("")}</dl></header>${heroFigure(item)}${routeMap(item)}${stopTimeline(item)}<div class="article-layout"><div class="article-body">${body}${sources(item)}</div><aside class="article-rail"><div class="author-card"><span>${it ? "Ideato, verificato e fotografato da" : "Designed, checked and photographed by"}</span><strong>Paolo Pastorino</strong><p>${escapeHtml(item.accessibility_notes || (it ? "Controlla sempre accessi e orari prima di partire." : "Always check access and hours before setting out."))}</p></div><div class="article-share"><span>${it ? "Lingua" : "Language"}</span><a href="${alternateRoute}" hreflang="${it ? "en-GB" : "it-IT"}">${it ? "Read in English" : "Leggi in italiano"} →</a></div></aside></div></article>${relatedArticles(item, articles)}<section class="itinerary-journal-link"><span class="journal-kicker">${it ? "Continua a esplorare" : "Keep exploring"}</span><h2>${it ? "Approfondisci un luogo o scopri altre Londre." : "Go deeper on one place or discover another London."}</h2><div class="itinerary-closing-links"><a href="${it ? "/it/journal/" : "/journal/"}">${it ? "Esplora gli articoli del Journal" : "Explore the Journal stories"} →</a><a href="${it ? "/it/the-other-london/" : "/the-other-london/"}">The Other London →</a></div></section></main>${itineraryFooter(item.locale)}<script src="/journal.js"></script><script src="/itineraries.js"></script></body></html>`;
}

function card(item) {
  const it = item.locale === "it";
  const image = item.images?.find(candidate => candidate.role === "hero") || item.images?.[0];
  const route = routeFor(item, item.locale, false);
  const filters = ["theme", "area", "best_day", "environment", "walking_level", "transit_level"].flatMap(field => [item[field], classification(item, field)]).join("|").toLowerCase();
  return `<article class="itinerary-card" data-itinerary-card data-filter="${escapeHtml(filters)}"><a class="itinerary-card-image" href="${route}">${image?.src ? `<img src="${escapeHtml(safeUrl(image.src))}" alt="${escapeHtml(image.alt || "")}" loading="lazy">` : `<span>LA</span>`}</a><div><span class="journal-kicker">${escapeHtml(classification(item, "theme"))} · ${escapeHtml(classification(item, "area"))}</span><h2><a href="${route}">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.dek)}</p><ul><li>${escapeHtml(item.duration)}</li><li>${escapeHtml(`${item.distance_km} km`)}</li><li>${escapeHtml(classification(item, "best_day"))}</li></ul><a href="${route}">${it ? "Apri l’itinerario" : "Open itinerary"} →</a></div></article>`;
}

function collectionSchema(locale, route, items) {
  const it = locale === "it";
  const canonical = `${canonicalOrigin}${route}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${canonical}#collection`, name: it ? "Itinerari di London Advanced" : "London Advanced itineraries", url: canonical, inLanguage: it ? "it-IT" : "en-GB" },
      { "@type": "ItemList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, url: `${canonicalOrigin}${routeFor(item, locale)}`, name: item.title })) }
    ]
  };
}

function renderIndex(items, locale) {
  const it = locale === "it";
  const route = it ? "/it/itinerari/" : "/itineraries/";
  const alternateRoute = it ? "/itineraries/" : "/it/itinerari/";
  const title = it ? "Itinerari di un giorno a Londra | London Advanced" : "One-day London itineraries | London Advanced";
  const description = it ? "Itinerari di un giorno a Londra, verificati e filtrabili per tema, zona, cammino, trasporti e tipo di giornata." : "Checked one-day London itineraries, filterable by theme, area, walking, transport and the kind of day you want.";
  const cards = items.length ? items.map(card).join("") : `<div class="journal-empty"><span>${it ? "In preparazione" : "In preparation"}</span><h2>${it ? "Il primo itinerario è in revisione." : "The first itinerary is under review."}</h2><p>${it ? "Le bozze restano private fino all’approvazione, alla mappa e alla selezione fotografica." : "Drafts stay private until approval, mapping and photo selection are complete."}</p></div>`;
  return `${pageHead({ locale, route, alternateRoute, title, description, schema: collectionSchema(locale, route, items) })}<body class="journal-page itinerary-index-page">${itineraryNavigation(locale, alternateRoute)}<main><section class="itinerary-index-hero"><span class="journal-kicker">London Advanced · ${it ? "Itinerari" : "Itineraries"}</span><h1>${it ? "Una giornata intera,<br><em>senza perdere il filo.</em>" : "A full day out,<br><em>without losing the thread.</em>"}</h1><p>${it ? "Percorsi costruiti intorno a un’idea, non a una lista. Tempi realistici, orari verificati, cammino e trasporti già messi in ordine." : "Routes built around an idea, not a checklist. Realistic timings, checked hours, walking and transport already put in order."}</p></section><section class="itinerary-filters" aria-labelledby="filter-title"><div><span class="journal-kicker">${it ? "Trova il percorso giusto" : "Find the right route"}</span><h2 id="filter-title">${it ? "Filtra per come vuoi vivere la giornata." : "Filter by how you want the day to feel."}</h2></div><label><span>${it ? "Cerca" : "Search"}</span><input type="search" data-itinerary-search placeholder="${it ? "Tema, zona, giorno…" : "Theme, area, day…"}"></label></section><p class="itinerary-result-count" data-itinerary-count aria-live="polite"></p><section class="itinerary-grid" data-itinerary-grid>${cards}</section><section class="itinerary-journal-link"><span class="journal-kicker">Journal</span><h2>${it ? "Gli itinerari collegano luoghi; il Journal li racconta." : "Itineraries connect places; the Journal tells their stories."}</h2><a href="${it ? "/it/journal/" : "/journal/"}">${it ? "Esplora il Journal" : "Explore the Journal"} →</a></section></main>${itineraryFooter(locale)}<script src="/journal.js"></script><script src="/itineraries.js"></script></body></html>`;
}

async function writePage(route, html) {
  const target = path.join(dist, route.replace(/^\//, ""), "index.html");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
}

async function syncAssets() {
  const source = path.join(root, "assets", "itineraries");
  const target = path.join(dist, "assets", "itineraries");
  try {
    await access(source);
  } catch {
    return;
  }
  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true });
}

export async function buildItineraries({ includeDrafts = false } = {}) {
  const pairs = await loadPairs();
  const publishedPairs = pairs.filter(pair => isPublicItineraryPair(pair.en, pair.it));
  const [englishJournal, italianJournal] = await Promise.all([loadJournal("en"), loadJournal("it")]);
  const english = publishedPairs.map(pair => ({ ...pair.en, locale: "en" }));
  const italian = publishedPairs.map(pair => ({ ...pair.it, locale: "it" }));

  await Promise.all([
    writePage("/itineraries/", renderIndex(english, "en")),
    writePage("/it/itinerari/", renderIndex(italian, "it")),
    cp(path.join(root, "itineraries.css"), path.join(dist, "itineraries.css")),
    cp(path.join(root, "itineraries.js"), path.join(dist, "itineraries.js")),
    syncAssets()
  ]);

  for (const pair of publishedPairs) {
    await writePage(routeFor(pair.en, "en"), renderItineraryDetail({ ...pair.en, locale: "en" }, pair.it, englishJournal, false));
    await writePage(routeFor(pair.it, "it"), renderItineraryDetail({ ...pair.it, locale: "it" }, pair.en, italianJournal, false));
  }

  if (includeDrafts) {
    for (const pair of pairs.filter(pair => !isPublicItineraryPair(pair.en, pair.it))) {
      await writePage(routeFor(pair.en, "en", true), renderItineraryDetail({ ...pair.en, locale: "en" }, pair.it, englishJournal, true));
      await writePage(routeFor(pair.it, "it", true), renderItineraryDetail({ ...pair.it, locale: "it" }, pair.en, italianJournal, true));
    }
  } else {
    await rm(path.join(dist, "itineraries", "_preview"), { recursive: true, force: true });
    await rm(path.join(dist, "it", "itinerari", "_preview"), { recursive: true, force: true });
  }

  console.log(`Built Itineraries, ${publishedPairs.length} published pair(s)${includeDrafts ? ` and ${pairs.length - publishedPairs.length} draft preview pair(s)` : ""}.`);
}
