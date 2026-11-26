import { KOFI_URL } from "./site-config.mjs";

const mainAnchors = new Map([
  ["events/index.html", "events-page-hero"],
  ["it/eventi/index.html", "events-page-hero"],
  ["journal/index.html", "journal-index-hero"],
  ["it/journal/index.html", "journal-index-hero"],
  ["itineraries/index.html", "itinerary-index-hero"],
  ["it/itinerari/index.html", "itinerary-index-hero"],
  ["about/index.html", "editorial-hero"],
  ["it/chi-sono/index.html", "editorial-hero"],
  ["methodology/index.html", "editorial-hero"],
  ["it/metodologia/index.html", "editorial-hero"],
  ["press/index.html", "press-hero"],
  ["it/stampa/index.html", "press-hero"],
  ["the-other-london/index.html", "guide-hero"],
  ["it/the-other-london/index.html", "guide-hero"]
]);

const toolAnchors = new Map([
  ["loo/index.html", "loo-hero"],
  ["it/strumenti/trova-un-bagno/index.html", "loo-hero"],
  ["charity-shops/index.html", "charity-hero"],
  ["it/strumenti/negozi-di-beneficenza/index.html", "charity-hero"],
  ["bookshops/index.html", "bookshop-hero"],
  ["it/strumenti/librerie/index.html", "bookshop-hero"],
  ["meteo-dress/index.html", "hero"]
]);

const shellTools = new Set([
  "home/london-dashboard/index.html",
  "home/escape-the-crowds/index.html",
  "home/travel-fare-calculator/index.html",
  "home/smart-navigation/index.html",
  "home/london-by-mood/index.html",
  "it/strumenti/dashboard-londra/index.html",
  "it/strumenti/evita-la-folla/index.html",
  "it/strumenti/calcolatore-tariffe-trasporti/index.html",
  "it/strumenti/navigazione-intelligente/index.html",
  "it/strumenti/londra-per-umore/index.html"
]);

const homepages = new Set(["index.html", "it/index.html"]);
const markets = new Set(["markets/index.html", "it/strumenti/mercati/index.html"]);

export const sitewideSupportRoutes = new Set([
  ...homepages,
  ...mainAnchors.keys(),
  ...toolAnchors.keys(),
  ...shellTools,
  ...markets
]);

function isItalian(relativePath) {
  return relativePath.startsWith("it/") || relativePath === "meteo-dress/index.html";
}

export function renderSitewideSupport(locale, variant = "main") {
  const it = locale === "it";
  return `<aside class="sitewide-support sitewide-support--${variant}" data-sitewide-support="true" aria-label="${it ? "Sostieni London Advanced" : "Support London Advanced"}"><div class="sitewide-support__copy"><span>${it ? "Sostieni l’esplorazione indipendente di Londra" : "Support independent London exploration"}</span><strong>${it ? "Hai trovato qualcosa di utile?" : "Found something useful?"}</strong><p>${it ? "Un flat white aiuta a coprire ricerca, dati e manutenzione, per mantenere London Advanced gratuito e aggiornato." : "A flat white helps cover the research, data and maintenance that keep London Advanced free and up to date."}</p></div><a class="sitewide-support__action" href="${KOFI_URL}" target="_blank" rel="noopener noreferrer">${it ? "Offrimi un flat white" : "Buy me a flat white"}</a></aside>`;
}

function addStylesheet(html) {
  if (html.includes('href="/support-cta.css"')) return html;
  return html.replace("</head>", '<link rel="stylesheet" href="/support-cta.css"></head>');
}

function markExisting(html, className) {
  return html.replace(`class="${className}`, `data-sitewide-support="true" class="${className}`);
}

function insertAfterSection(html, className, cta, relativePath) {
  const pattern = new RegExp(`(<section\\s+class="[^"]*\\b${className}\\b[^"]*"[\\s\\S]*?<\\/section>)`);
  if (!pattern.test(html)) throw new Error(`Could not place the support CTA after ${className} in ${relativePath}.`);
  return html.replace(pattern, `$1${cta}`);
}

export function addSitewideSupport(html, relativePath) {
  if (!sitewideSupportRoutes.has(relativePath)) return html;
  if (html.includes('data-sitewide-support="true"')) {
    const normalized = html.replace(
      'class="tool-shell enriched-tool-page has-sitewide-support"',
      'class="tool-shell enriched-tool-page" data-has-sitewide-support="true"'
    );
    return addStylesheet(normalized);
  }

  const locale = isItalian(relativePath) ? "it" : "en";
  let updated = html;

  if (homepages.has(relativePath)) {
    if (!updated.includes('class="home-support')) throw new Error(`Homepage support block missing in ${relativePath}.`);
    updated = markExisting(updated, "home-support");
  } else if (markets.has(relativePath)) {
    if (!updated.includes('class="markets-support')) throw new Error(`Markets support block missing in ${relativePath}.`);
    updated = markExisting(updated, "markets-support");
  } else if (shellTools.has(relativePath)) {
    const cta = renderSitewideSupport(locale, "tool-shell");
    const shellAnchor = /<\/header>\s*<main class="tool-stage">/;
    if (!shellAnchor.test(updated)) throw new Error(`Tool shell anchor missing in ${relativePath}.`);
    updated = updated
      .replace('class="tool-shell enriched-tool-page"', 'class="tool-shell enriched-tool-page" data-has-sitewide-support="true"')
      .replace(shellAnchor, `</header>${cta}<main class="tool-stage">`);
  } else {
    const anchor = mainAnchors.get(relativePath) || toolAnchors.get(relativePath);
    const variant = toolAnchors.has(relativePath) ? "tool" : "main";
    updated = insertAfterSection(updated, anchor, renderSitewideSupport(locale, variant), relativePath);
  }

  return addStylesheet(updated);
}
