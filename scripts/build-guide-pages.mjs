import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const origin = "https://www.londonadvanced.com";
const published = "2026-10-06";

const places = [
  ["areas", "Eel Pie Island", "Twickenham", "Private Thames island with a remarkable music and artists’ history."],
  ["areas", "Parkland Walk", "Haringey", "A nature reserve following the abandoned Northern Heights railway."],
  ["buildings", "Trellick Tower", "North Kensington", "Ernő Goldfinger’s uncompromising landmark of post-war London."],
  ["buildings", "Wilton’s Music Hall", "Shadwell", "The world’s oldest surviving grand music hall, still in use."],
  ["museums", "William Morris Gallery", "Walthamstow", "Art, design and radical ideas in Morris’s former family home."],
  ["museums", "Wimbledon Windmill Museum", "Wimbledon Common", "A small museum inside a working landmark on the Common.", "wimbledon-itinerary"],
  ["oddities", "Brixton Windmill", "Brixton", "A restored 1816 windmill hidden behind a south London street."],
  ["oddities", "Trinity Buoy Wharf", "Leamouth", "Lighthouse, experimental music and working studios at the Lea’s mouth."],
  ["parks", "Crossbones Garden", "Southwark", "A community garden of remembrance shaped by local campaigning."],
  ["parks", "Camley Street Natural Park", "King’s Cross", "A two-acre wildlife reserve beside the Regent’s Canal."],
  ["religious", "Buddhapadipa Temple", "Wimbledon", "Britain’s first purpose-built Thai Buddhist temple.", "buddhapadipa-article"],
  ["religious", "Fitzrovia Chapel", "Fitzrovia", "A richly restored chapel at the heart of the former Middlesex Hospital."],
  ["shopping", "Hurlingham Books", "Fulham", "A second-hand bookshop packed from floor to ceiling."],
  ["shopping", "Hoxton Street Monster Supplies", "Hoxton", "A shop for monsters that funds creative writing for young people."],
  ["views", "Stave Hill", "Rotherhithe", "A man-made summit overlooking docks, towers and urban woodland."],
  ["views", "Caledonian Park Clock Tower", "Islington", "A restored market landmark with extraordinary London panoramas."]
];

const copy = {
  en: {
    lang: "en-GB", route: "/the-other-london/", alternate: "/it/the-other-london/", home: "/", search: "/search/",
    title: "The Other London: 110 unusual places beyond the obvious",
    description: "Explore The Other London, Paolo Pastorino’s independent field guide to 110 unusual places across London, with original photography, practical details and a free sampler.",
    eyebrow: "An independent field guide", headline: "The London you notice when you <em>look twice.</em>",
    lede: "110 handpicked places, practical details and original photography for people who want to go beyond the standard London lists.",
    sample: "Download the free sampler", buy: "Buy the complete guide", sampleNote: "PDF · selected pages · no email required",
    stats: [["110", "Places"], ["8", "Themes"], ["124", "Pages"], ["100%", "Independent"]],
    introKicker: "Why this guide exists", introTitle: "A field guide, not a checklist.",
    quote: "London rewards <em>attention</em> more than speed.",
    intro: ["The Other London began as years of walks, photographs and notes: places with a story, a particular atmosphere or a reason to stop. It is for visitors who want more than highlights and for Londoners who suspect the city still has something to show them.", "Each entry gives you enough context to understand the place and enough practical detail to visit it. The selection is personal, independent and deliberately spread across the city."],
    aboutLink: "Meet the author and the project",
    mapKicker: "Across the city", mapTitle: "Not another central-London list.", mapText: "The guide moves through outer boroughs, river edges, industrial ground, residential streets and fragments of countryside. The map is an orientation, not a route: choose a cluster and leave room to wander.", mapAlt: "Map of Greater London showing places included in The Other London", mapCaption: "A broad spread of the 110 guide entries", mapHint: "Exact map links are included in the complete guide.",
    placesKicker: "A first look", placesTitle: "Sixteen places to start.", placesText: "Filter this small cross-section of the guide. The complete edition contains 110 entries in eight themes.", all: "All", categories: {areas:"Areas",buildings:"Buildings",museums:"Museums",oddities:"Oddities",parks:"Parks",religious:"Religious",shopping:"Shopping",views:"Views"},
    photosKicker: "Original fieldwork", photosTitle: "Seen, walked and photographed.", photosText: "The guide is rooted in direct observation. These are not stock recommendations assembled from a desk.",
    photoCaptions: ["Trinity Buoy Wharf", "The Wandle Trail", "Hogarth’s House", "Buddhapadipa Temple"],
    ctaKicker: "Take it with you", ctaTitle: "Start with the sampler.", ctaText: "The free PDF includes selected entries from across the book. If the approach fits the way you explore, the complete 124-page guide is ready for your next London day.",
    faqKicker: "Useful details", faqTitle: "Before you set out.", faqs: [
      ["What format is the guide?", "The complete guide is a downloadable PDF designed to work on a phone, tablet or computer. You can also print the pages you need."],
      ["Are the places free to visit?", "Many are free, while some charge admission or only open at certain times. The guide flags practical details, but always check the venue’s current information before travelling."],
      ["Is it suitable for a first visit to London?", "Yes—if you want to mix famous London with places that reveal more of the city. It complements a conventional guide rather than replacing essential trip planning."],
      ["How were the places chosen?", "Paolo selected places for their story, atmosphere, design, landscape or local significance. London Advanced is independent; inclusion is not paid placement."]
    ],
    journal: "Read the field notes", tools: "Use the free London tools", next: "Keep exploring", navGuide: "Guide", language: "Italiano", footer: "Independent tools and field notes for a less obvious London."
  },
  it: {
    lang: "it-IT", route: "/it/the-other-london/", alternate: "/the-other-london/", home: "/it/", search: "/it/cerca/",
    title: "The Other London: 110 luoghi insoliti oltre l’ovvio",
    description: "Scopri The Other London, la guida indipendente di Paolo Pastorino a 110 luoghi insoliti di Londra, con fotografie originali, dettagli pratici e un’anteprima gratuita.",
    eyebrow: "Una guida indipendente", headline: "La Londra che si scopre <em>guardando due volte.</em>",
    lede: "110 luoghi selezionati, dettagli pratici e fotografie originali per chi vuole andare oltre le solite liste su Londra.",
    sample: "Scarica l’anteprima gratuita", buy: "Acquista la guida completa", sampleNote: "PDF in inglese · pagine selezionate · nessuna email richiesta",
    stats: [["110", "Luoghi"], ["8", "Temi"], ["124", "Pagine"], ["100%", "Indipendente"]],
    introKicker: "Perché esiste questa guida", introTitle: "Una guida sul campo, non una checklist.",
    quote: "Londra premia <em>l’attenzione</em> più della fretta.",
    intro: ["The Other London nasce da anni di passeggiate, fotografie e appunti: luoghi con una storia, un’atmosfera particolare o un motivo per fermarsi. È per chi visita Londra e vuole più delle attrazioni principali, e per chi ci vive ma sospetta che la città abbia ancora qualcosa da mostrare.", "Ogni scheda offre il contesto necessario per capire il luogo e le informazioni pratiche per visitarlo. La selezione è personale, indipendente e volutamente distribuita in tutta la città."],
    aboutLink: "Conosci l’autore e il progetto",
    mapKicker: "In tutta la città", mapTitle: "Non la solita lista del centro.", mapText: "La guida attraversa quartieri esterni, rive, aree industriali, strade residenziali e frammenti di campagna. La mappa serve a orientarsi, non è un itinerario: scegli una zona e lascia spazio alle deviazioni.", mapAlt: "Mappa della Greater London con i luoghi inclusi in The Other London", mapCaption: "La distribuzione dei 110 luoghi della guida", mapHint: "I link esatti alle mappe sono nella guida completa.",
    placesKicker: "Un primo sguardo", placesTitle: "Sedici luoghi da cui iniziare.", placesText: "Filtra questa piccola selezione. L’edizione completa contiene 110 schede divise in otto temi.", all: "Tutti", categories: {areas:"Zone",buildings:"Edifici",museums:"Musei",oddities:"Curiosità",parks:"Parchi",religious:"Luoghi religiosi",shopping:"Shopping",views:"Panorami"},
    photosKicker: "Ricerca sul campo", photosTitle: "Visti, percorsi e fotografati.", photosText: "La guida nasce dall’osservazione diretta. Non è una raccolta di consigli generici costruita a tavolino.",
    photoCaptions: ["Trinity Buoy Wharf", "Il Wandle Trail", "Hogarth’s House", "Buddhapadipa Temple"],
    ctaKicker: "Portala con te", ctaTitle: "Inizia dall’anteprima.", ctaText: "Il PDF gratuito include schede scelte da diverse sezioni del libro. Se è il tuo modo di esplorare, la guida completa di 124 pagine è pronta per la tua prossima giornata londinese.",
    faqKicker: "Dettagli utili", faqTitle: "Prima di partire.", faqs: [
      ["In quale formato è disponibile?", "La guida completa è un PDF scaricabile, pensato per telefono, tablet e computer. Puoi anche stampare solo le pagine che ti servono."],
      ["I luoghi sono gratuiti?", "Molti sono gratuiti; altri richiedono un biglietto o hanno aperture limitate. La guida segnala le informazioni pratiche, ma controlla sempre il sito ufficiale prima di partire."],
      ["È adatta a una prima visita a Londra?", "Sì, se vuoi affiancare ai luoghi celebri posti che raccontano meglio la città. Completa una guida tradizionale senza sostituire la pianificazione essenziale del viaggio."],
      ["Come sono stati scelti i luoghi?", "Paolo li ha selezionati per storia, atmosfera, architettura, paesaggio o importanza locale. London Advanced è indipendente: l’inclusione non è a pagamento."]
    ],
    journal: "Leggi gli appunti sul campo", tools: "Usa gli strumenti gratuiti", next: "Continua a esplorare", navGuide: "Guida", language: "English", footer: "Strumenti indipendenti e appunti sul campo per una Londra meno ovvia."
  }
};

function escape(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
}

let siteNavigation = {};

function guideNavigation(page, locale) {
  const header = page.match(/<header class="site-nav">[\s\S]*?<\/header>/)?.[0];
  if (!header) throw new Error(`Could not extract the ${locale} site navigation for The Other London.`);

  const it = locale === "it";
  const guideHref = it ? "/it/the-other-london/" : "/the-other-london/";
  const alternateHref = it ? "/the-other-london/" : "/it/the-other-london/";

  return header
    .replaceAll(' aria-current="page"', "")
    .replaceAll(`href="${guideHref}"`, `href="${guideHref}" aria-current="page"`)
    .replace(/(<a class="language-switch" href=")[^"]+("[^>]*>)/, `$1${alternateHref}$2`)
    .replace(/(<a class="mobile-language-switch" href=")[^"]+("[^>]*>)/, `$1${alternateHref}$2`);
}

function nav(locale) {
  if (!siteNavigation[locale]) throw new Error(`The ${locale} site navigation has not been initialised.`);
  return siteNavigation[locale];
}

function head(locale, c) {
  const schema = {"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","@id":`${origin}${c.route}#webpage`,url:`${origin}${c.route}`,name:c.title,description:c.description,inLanguage:c.lang,datePublished:published,dateModified:published,isPartOf:{"@id":`${origin}/#website`},mainEntity:{"@id":`${origin}${c.route}#book`}},
    {"@type":"Book","@id":`${origin}${c.route}#book`,name:"The Other London",subtitle:locale === "it" ? "110 luoghi insoliti oltre l’ovvio" : "110 unusual places beyond the obvious",author:{"@type":"Person",name:"Paolo Pastorino",url:`${origin}/about/`},inLanguage:"en-GB",numberOfPages:124,genre:["Travel guide","London","Local history"],image:`${origin}/assets/guide-cover.jpg`,url:`${origin}${c.route}`,offers:{"@type":"Offer",url:"https://payhip.com/b/DrBE5",availability:"https://schema.org/InStock"}},
    {"@type":"BreadcrumbList","@id":`${origin}${c.route}#breadcrumb`,itemListElement:[{"@type":"ListItem",position:1,name:"London Advanced",item:`${origin}${c.home}`},{"@type":"ListItem",position:2,name:"The Other London",item:`${origin}${c.route}`}]}
  ]};
  return `<!doctype html><html lang="${c.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(c.title)} | London Advanced</title><meta name="description" content="${escape(c.description)}"><meta name="author" content="Paolo Pastorino"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}${c.route}"><link rel="alternate" hreflang="en-GB" href="${origin}${locale === "en" ? c.route : c.alternate}"><link rel="alternate" hreflang="it-IT" href="${origin}${locale === "it" ? c.route : c.alternate}"><link rel="alternate" hreflang="x-default" href="${origin}/the-other-london/"><meta property="og:type" content="book"><meta property="og:site_name" content="London Advanced"><meta property="og:title" content="${escape(c.title)}"><meta property="og:description" content="${escape(c.description)}"><meta property="og:url" content="${origin}${c.route}"><meta property="og:image" content="${origin}/assets/guide-cover.jpg"><meta property="og:image:alt" content="Cover of The Other London guide"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(c.title)}"><meta name="twitter:description" content="${escape(c.description)}"><meta name="twitter:image" content="${origin}/assets/guide-cover.jpg"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Libre+Caslon+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/guide.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head>`;
}

function render(locale) {
  const c = copy[locale];
  const it = locale === "it";
  const filterButtons = [["all",c.all], ...Object.entries(c.categories)].map(([key,label], index) => `<button class="guide-filter" type="button" data-guide-filter="${key}" aria-pressed="${index === 0}">${escape(label)}</button>`).join("");
  const linkedPlace = target => ({
    "wimbledon-itinerary": it ? "/it/itinerari/wimbledon-senza-tennis/" : "/itineraries/wimbledon-without-tennis/",
    "buddhapadipa-article": it ? "/it/journal/buddhapadipa-temple-wimbledon-visita/" : "/journal/buddhapadipa-temple-wimbledon-visit/"
  })[target];
  const cards = places.map(([category,name,area,description,target]) => {
    const link = target ? `<p><a href="${linkedPlace(target)}">${target === "wimbledon-itinerary" ? (it ? "Apri l’itinerario" : "Open the itinerary") : (it ? "Leggi l’articolo" : "Read the story")} →</a></p>` : "";
    return `<article class="guide-place" data-guide-place="${category}"><span class="guide-place-category">${escape(c.categories[category])} · ${escape(area)}</span><h3>${escape(name)}</h3><p>${escape(description)}</p>${link}</article>`;
  }).join("");
  const photos = ["trinity-buoy-wharf-01.webp","07-wandle-trail-01.webp","10-chiswick-hogarth-house-gardens-01.webp","11-buddhapadipa-temple-02.webp"].map((file,index) => `<figure><img src="/assets/journal/${file}" alt="${escape(c.photoCaptions[index])}" loading="lazy" width="900" height="1200"><figcaption>${escape(c.photoCaptions[index])}</figcaption></figure>`).join("");
  const faqs = c.faqs.map(([question,answer]) => `<details><summary>${escape(question)}</summary><p>${escape(answer)}</p></details>`).join("");
  return `${head(locale,c)}<body class="guide-page">${nav(locale)}<main class="guide-main"><section class="guide-hero"><div class="guide-shell guide-hero-grid"><div><span class="guide-eyebrow">${escape(c.eyebrow)}</span><h1>${c.headline}</h1><p class="guide-lede">${escape(c.lede)}</p><div class="guide-actions"><a class="guide-button" href="/assets/the-other-london-sampler.pdf" download data-track="guide:sample">${escape(c.sample)}</a><a class="guide-button secondary" href="https://payhip.com/b/DrBE5" target="_blank" rel="noopener" data-track="guide:buy">${escape(c.buy)} ↗</a></div><p class="guide-note">${escape(c.sampleNote)}</p></div><div class="guide-cover-wrap"><img class="guide-cover" src="/assets/guide-cover.jpg" alt="The Other London guide by Paolo Pastorino" width="1049" height="1489"></div></div></section><section class="guide-stats" aria-label="Guide facts"><div class="guide-shell guide-stats-grid">${c.stats.map(([number,label]) => `<div class="guide-stat"><strong>${number}</strong><span>${escape(label)}</span></div>`).join("")}</div></section><section class="guide-section"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.introKicker)}</span><div><h2>${escape(c.introTitle)}</h2></div></div><div class="guide-manifesto"><blockquote>${c.quote}</blockquote><div class="guide-manifesto-copy">${c.intro.map(text => `<p>${escape(text)}</p>`).join("")}<p><a href="${it ? "/it/chi-sono/" : "/about/"}">${escape(c.aboutLink)} →</a></p></div></div></div></section><section class="guide-map-section"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.mapKicker)}</span><div><h2>${escape(c.mapTitle)}</h2><p>${escape(c.mapText)}</p></div></div><figure class="guide-map-frame"><img src="/assets/london-map.jpg" alt="${escape(c.mapAlt)}" width="1560" height="1140" loading="lazy"><figcaption class="guide-map-caption">${escape(c.mapCaption)}<span>${escape(c.mapHint)}</span></figcaption></figure></div></section><section class="guide-section guide-places"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.placesKicker)}</span><div><h2>${escape(c.placesTitle)}</h2><p>${escape(c.placesText)}</p></div></div><div class="guide-filters" aria-label="${it ? "Filtra per tema" : "Filter by theme"}">${filterButtons}</div><div class="guide-place-grid">${cards}</div></div></section><section class="guide-section"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.photosKicker)}</span><div><h2>${escape(c.photosTitle)}</h2><p>${escape(c.photosText)}</p></div></div><div class="guide-photo-grid">${photos}</div></div></section><section class="guide-cta"><div class="guide-shell guide-cta-grid"><div><span class="guide-kicker">${escape(c.ctaKicker)}</span><h2>${escape(c.ctaTitle)}</h2><p>${escape(c.ctaText)}</p></div><div class="guide-actions"><a class="guide-button" href="/assets/the-other-london-sampler.pdf" download>${escape(c.sample)}</a><a class="guide-button secondary" href="https://payhip.com/b/DrBE5" target="_blank" rel="noopener">${escape(c.buy)} ↗</a></div></div></section><section class="guide-section guide-faq"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.faqKicker)}</span><div><h2>${escape(c.faqTitle)}</h2></div></div><div class="guide-faq-list">${faqs}</div><div class="guide-next"><a href="${it ? "/it/journal/" : "/journal/"}"><span>${escape(c.next)}</span><strong>${escape(c.journal)} →</strong></a><a href="${it ? "/it/#strumenti" : "/#tools"}"><span>${escape(c.next)}</span><strong>${escape(c.tools)} →</strong></a></div></div></section></main><footer class="site-footer"><div><strong>London Advanced</strong><p>${escape(c.footer)}</p></div><nav><a href="${it ? "/it/chi-sono/" : "/about/"}">${it ? "Chi sono" : "About"}</a><a href="${it ? "/it/metodologia/" : "/methodology/"}">${it ? "Metodologia" : "Methodology"}</a><a href="${c.search}">${it ? "Cerca" : "Search"}</a></nav><p>© ${new Date().getUTCFullYear()} Paolo Pastorino</p></footer><script src="/guide.js" defer></script></body></html>`;
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

async function integrateNavigation() {
  const files = (await walk(dist)).filter(file => file.endsWith(".html"));
  for (const file of files) {
    let html = await readFile(file, "utf8");
    const it = /<html lang="it(?:-IT)?"/i.test(html) || file.includes(`${path.sep}it${path.sep}`);
    html = html
      .replaceAll('<a href="https://payhip.com/TheOtherLondon" target="_blank" rel="noopener">Guide</a>', '<a href="/the-other-london/">Guide</a>')
      .replaceAll('<a href="https://payhip.com/TheOtherLondon" target="_blank" rel="noopener">Guida</a>', '<a href="/it/the-other-london/">Guida</a>')
      .replaceAll('<a href="https://payhip.com/TheOtherLondon" target="_blank" rel="noopener"><span>The Other London</span><strong>Guide ↗</strong></a>', `<a href="${it ? "/it/the-other-london/" : "/the-other-london/"}"><span>The Other London</span><strong>${it ? "Guida" : "Guide"}</strong></a>`)
      .replaceAll('<a href="https://payhip.com/TheOtherLondon" target="_blank" rel="noopener"><span>The Other London</span><strong>Guida ↗</strong></a>', '<a href="/it/the-other-london/"><span>The Other London</span><strong>Guida</strong></a>');
    await writeFile(file, html, "utf8");
  }
}

async function updateSitemap() {
  const target = path.join(dist, "sitemap.xml");
  let xml = await readFile(target, "utf8");
  xml = xml.replace(/\s*<url><loc>https:\/\/www\.londonadvanced\.com\/(?:it\/)?the-other-london\/<\/loc>[\s\S]*?<\/url>/g, "");
  const entries = [`  <url><loc>${origin}/the-other-london/</loc><lastmod>${published}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>`, `  <url><loc>${origin}/it/the-other-london/</loc><lastmod>${published}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`].join("\n");
  xml = xml.replace("</urlset>", `${entries}\n</urlset>`);
  await writeFile(target, xml, "utf8");
}

export async function buildGuidePages() {
  const [englishEventsPage, italianEventsPage] = await Promise.all([
    readFile(path.join(dist, "events", "index.html"), "utf8"),
    readFile(path.join(dist, "it", "eventi", "index.html"), "utf8")
  ]);
  siteNavigation = {
    en: guideNavigation(englishEventsPage, "en"),
    it: guideNavigation(italianEventsPage, "it")
  };

  await Promise.all([
    mkdir(path.join(dist, "the-other-london"), { recursive: true }),
    mkdir(path.join(dist, "it", "the-other-london"), { recursive: true })
  ]);
  await Promise.all([
    writeFile(path.join(dist, "the-other-london", "index.html"), render("en"), "utf8"),
    writeFile(path.join(dist, "it", "the-other-london", "index.html"), render("it"), "utf8"),
    copyFile(path.join(root, "guide.css"), path.join(dist, "guide.css")),
    copyFile(path.join(root, "guide.js"), path.join(dist, "guide.js")),
    copyFile(path.join(root, "assets", "the-other-london-sampler.pdf"), path.join(dist, "assets", "the-other-london-sampler.pdf"))
  ]);
  await integrateNavigation();
  await updateSitemap();
}
