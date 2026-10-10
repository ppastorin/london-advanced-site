import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const origin = "https://www.londonadvanced.com";
const published = "2026-10-06";
const modified = "2026-10-10";

const places = [
  ["areas", "Eel Pie Island", "Twickenham", "Private Thames island with a remarkable music and artists’ history."],
  ["areas", "Parkland Walk", "Haringey", "A nature reserve following the abandoned Northern Heights railway."],
  ["buildings", "Trellick Tower", "North Kensington", "Ernő Goldfinger’s uncompromising landmark of post-war London."],
  ["buildings", "Wilton’s Music Hall", "Shadwell", "The world’s oldest surviving grand music hall, still in use."],
  ["museums", "William Morris Gallery", "Walthamstow", "Art, design and radical ideas in Morris’s former family home."],
  ["museums", "Wimbledon Windmill Museum", "Wimbledon Common", "A small museum inside a working landmark on the Common.", "wimbledon-itinerary"],
  ["oddities", "Brixton Windmill", "Brixton", "A restored 1816 windmill hidden behind a south London street."],
  ["oddities", "Trinity Buoy Wharf", "Leamouth", "Lighthouse, experimental music and working studios at the Lea’s mouth.", "trinity-article"],
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
    title: "Unusual things to do in London: 110 places",
    description: "Discover 110 unusual things to do and places to see in London, with original photography, practical details, off-the-beaten-track ideas and a free sampler.",
    eyebrow: "The Other London · independent field guide", headline: "Unusual things to do in London, <em>beyond the standard lists.</em>",
    lede: "110 handpicked places for curious Londoners and repeat visitors: overlooked buildings, small museums, unusual walks, local markets, quiet gardens and viewpoints.",
    sample: "Download the free sampler", buy: "Buy the complete guide", sampleNote: "PDF · selected pages · no email required",
    stats: [["110", "Places"], ["8", "Themes"], ["124", "Pages"], ["100%", "Independent"]],
    introKicker: "Why this guide exists", introTitle: "A field guide to a less touristy London.",
    quote: "London rewards <em>attention</em> more than speed.",
    intro: ["The Other London began as years of walks, photographs and notes: places with a story, a particular atmosphere or a reason to stop. It is for visitors who want more than highlights and for Londoners who suspect the city still has something to show them.", "This is London off the beaten track without the usual promise of ‘secret’ places. The locations are real, visitable and often documented; what makes them unusual is that standard itineraries repeatedly pass them by. Each entry gives you enough context to understand the place and enough practical detail to visit it."],
    aboutLink: "Meet the author and the project",
    pathsKicker: "Choose an experience", pathsTitle: "Four ways to get off the beaten track.", pathsText: "Start with the kind of London day you want, then follow a field note or a complete route.", paths: [
      ["Walk London differently", "Follow the Wandle from chalk stream and mills to its working river mouth.", "/journal/wandle-trail-london-river-walk/", "Walk the Wandle Trail"],
      ["Read overlooked architecture", "Use dinosaurs, sphinxes and a tiled subway to reconstruct the lost Crystal Palace.", "/journal/crystal-palace-park-dinosaurs-sphinxes-subway/", "Explore Crystal Palace Park"],
      ["Find a quieter cultural place", "Visit Britain’s first purpose-built Thai Buddhist temple in Wimbledon.", "/journal/buddhapadipa-temple-wimbledon-visit/", "Plan a Buddhapadipa Temple visit"],
      ["Use a ready-made day out", "Link village history, Buddhist architecture, the Common and Cannizaro Park.", "/itineraries/wimbledon-without-tennis/", "Follow Wimbledon without tennis"]
    ],
    mapKicker: "Across the city", mapTitle: "Go beyond central London’s usual attractions.", mapText: "The guide moves through outer boroughs, river edges, industrial ground, residential streets and fragments of countryside. The map is an orientation, not a route: choose a cluster and leave room to wander.", mapAlt: "Map of Greater London showing 110 unusual places and things to do", mapCaption: "A broad spread of the 110 guide entries", mapHint: "Exact map links are included in the complete guide.",
    placesKicker: "A first look", placesTitle: "16 unusual London places to start with.", placesText: "Explore this cross-section of off-the-beaten-track walks, small museums, oddities, gardens, local shops and viewpoints. The complete edition contains 110 entries in eight themes.", all: "All", categories: {areas:"Areas",buildings:"Buildings",museums:"Museums",oddities:"Oddities",parks:"Parks",religious:"Religious",shopping:"Shopping",views:"Views"},
    photosKicker: "Original fieldwork", photosTitle: "Seen, walked and photographed.", photosText: "The guide is rooted in direct observation. These are not stock recommendations assembled from a desk.",
    photoCaptions: ["Trinity Buoy Wharf", "The Wandle Trail", "Hogarth’s House", "Buddhapadipa Temple"],
    ctaKicker: "Take it with you", ctaTitle: "Start with the sampler.", ctaText: "The free PDF includes selected entries from across the book. If the approach fits the way you explore, the complete 124-page guide is ready for your next London day.",
    faqKicker: "Useful details", faqTitle: "Questions about unusual London.", faqs: [
      ["What unusual things can I do in London?", "Try a disused railway walk, a small specialist museum, an industrial riverside site, a quiet sacred space, a local market or a viewpoint outside the familiar skyline circuit. The guide groups 110 ideas into eight themes so you can choose by interest rather than fame."],
      ["Where can I go in London off the beaten track?", "Start beyond the standard Zone 1 circuit: the guide covers outer boroughs, river edges, working industrial areas, residential streets and fragments of countryside as well as overlooked central places."],
      ["Are these ‘hidden gems’ or secret places?", "Not in the exaggerated sense. Most are documented and publicly accessible. They are included because they are easy to overlook, locally distinctive or absent from standard London itineraries."],
      ["What format is the guide?", "The complete guide is a downloadable PDF designed to work on a phone, tablet or computer. You can also print the pages you need."],
      ["Are the places free to visit?", "Many are free, while some charge admission or only open at certain times. The guide flags practical details, but always check the venue’s current information before travelling."],
      ["Is it suitable for a first visit to London?", "Yes—if you want to mix famous London with places that reveal more of the city. It complements a conventional guide rather than replacing essential trip planning."],
      ["Is it useful for Londoners?", "Yes. The citywide spread, practical links and nearby-place references are designed for residents looking for a different walk, museum, market, garden or view without repeating the standard attractions."],
      ["How were the places chosen?", "Paolo selected places for their story, atmosphere, design, landscape or local significance. London Advanced is independent; inclusion is not paid placement."]
    ],
    journal: "Read the field notes", tools: "Use the free London tools", next: "Keep exploring", navGuide: "Guide", language: "Italiano", footer: "Independent tools and field notes for a less obvious London."
  },
  it: {
    lang: "it-IT", route: "/it/the-other-london/", alternate: "/the-other-london/", home: "/it/", search: "/it/cerca/",
    title: "Londra insolita: 110 luoghi da scoprire",
    description: "Scopri 110 luoghi insoliti e cose diverse da fare a Londra, con fotografie originali, dettagli pratici, idee fuori dai soliti itinerari e anteprima gratuita.",
    eyebrow: "The Other London · guida indipendente", headline: "La Londra insolita, <em>fuori dai soliti itinerari.</em>",
    lede: "110 luoghi scelti per chi vive a Londra o torna a visitarla: edifici trascurati, piccoli musei, passeggiate insolite, mercati locali, giardini tranquilli e panorami.",
    sample: "Scarica l’anteprima gratuita", buy: "Acquista la guida completa", sampleNote: "PDF in inglese · pagine selezionate · nessuna email richiesta",
    stats: [["110", "Luoghi"], ["8", "Temi"], ["124", "Pagine"], ["100%", "Indipendente"]],
    introKicker: "Perché esiste questa guida", introTitle: "Una guida sul campo per una Londra meno turistica.",
    quote: "Londra premia <em>l’attenzione</em> più della fretta.",
    intro: ["The Other London nasce da anni di passeggiate, fotografie e appunti: luoghi con una storia, un’atmosfera particolare o un motivo per fermarsi. È per chi visita Londra e vuole più delle attrazioni principali, e per chi ci vive ma sospetta che la città abbia ancora qualcosa da mostrare.", "È una Londra fuori dai soliti itinerari, senza la promessa artificiale di luoghi ‘segreti’. Le destinazioni sono reali e visitabili; sono insolite perché gli itinerari standard continuano a ignorarle. Ogni scheda offre il contesto necessario e le informazioni pratiche per organizzare la visita."],
    aboutLink: "Conosci l’autore e il progetto",
    pathsKicker: "Scegli un’esperienza", pathsTitle: "Quattro modi per uscire dai soliti itinerari.", pathsText: "Parti dal tipo di giornata che vuoi vivere, poi segui un articolo sul campo o un percorso completo.", paths: [
      ["Cammina in una Londra diversa", "Segui il Wandle dal chalk stream e dai mulini fino alla foce ancora industriale.", "/it/journal/wandle-trail-fiume-londra/", "Percorri il Wandle Trail"],
      ["Leggi l’architettura trascurata", "Ricostruisci il Crystal Palace perduto attraverso dinosauri, sfingi e un sottopasso rivestito di piastrelle.", "/it/journal/crystal-palace-park-dinosauri-sfingi-subway/", "Esplora Crystal Palace Park"],
      ["Trova un luogo culturale più quieto", "Visita a Wimbledon il primo tempio buddhista thailandese costruito appositamente nel Regno Unito.", "/it/journal/buddhapadipa-temple-wimbledon-visita/", "Organizza la visita al Buddhapadipa Temple"],
      ["Segui un itinerario già pronto", "Collega il villaggio, il tempio, il Common e Cannizaro Park in una giornata.", "/it/itinerari/wimbledon-senza-tennis/", "Segui Wimbledon senza tennis"]
    ],
    mapKicker: "In tutta la città", mapTitle: "Oltre le solite attrazioni del centro.", mapText: "La guida attraversa quartieri esterni, rive, aree industriali, strade residenziali e frammenti di campagna. La mappa serve a orientarsi, non è un itinerario: scegli una zona e lascia spazio alle deviazioni.", mapAlt: "Mappa della Greater London con 110 luoghi insoliti e cose da fare", mapCaption: "La distribuzione dei 110 luoghi della guida", mapHint: "I link esatti alle mappe sono nella guida completa.",
    placesKicker: "Un primo sguardo", placesTitle: "16 luoghi insoliti di Londra da cui iniziare.", placesText: "Esplora questa selezione di passeggiate fuori dai soliti itinerari, piccoli musei, curiosità, giardini, negozi locali e panorami. L’edizione completa contiene 110 schede divise in otto temi.", all: "Tutti", categories: {areas:"Zone",buildings:"Edifici",museums:"Musei",oddities:"Curiosità",parks:"Parchi",religious:"Luoghi religiosi",shopping:"Shopping",views:"Panorami"},
    photosKicker: "Ricerca sul campo", photosTitle: "Visti, percorsi e fotografati.", photosText: "La guida nasce dall’osservazione diretta. Non è una raccolta di consigli generici costruita a tavolino.",
    photoCaptions: ["Trinity Buoy Wharf", "Il Wandle Trail", "Hogarth’s House", "Buddhapadipa Temple"],
    ctaKicker: "Portala con te", ctaTitle: "Inizia dall’anteprima.", ctaText: "Il PDF gratuito include schede scelte da diverse sezioni del libro. Se è il tuo modo di esplorare, la guida completa di 124 pagine è pronta per la tua prossima giornata londinese.",
    faqKicker: "Dettagli utili", faqTitle: "Domande sulla Londra insolita.", faqs: [
      ["Quali cose insolite posso fare a Londra?", "Prova una passeggiata su una ferrovia dismessa, un piccolo museo specialistico, un sito industriale sul fiume, un luogo sacro tranquillo, un mercato locale o un panorama fuori dal solito circuito. La guida organizza 110 idee in otto temi."],
      ["Dove posso andare a Londra fuori dai soliti itinerari?", "Inizia oltre il circuito standard della Zona 1: la guida include quartieri esterni, rive, aree industriali ancora attive, strade residenziali e frammenti di campagna, oltre a luoghi centrali facili da ignorare."],
      ["Sono davvero luoghi segreti?", "No, e non fingono di esserlo. La maggior parte è documentata e accessibile al pubblico. Sono inclusi perché facili da trascurare, distintivi a livello locale o assenti dagli itinerari standard."],
      ["In quale formato è disponibile?", "La guida completa è un PDF scaricabile, pensato per telefono, tablet e computer. Puoi anche stampare solo le pagine che ti servono."],
      ["I luoghi sono gratuiti?", "Molti sono gratuiti; altri richiedono un biglietto o hanno aperture limitate. La guida segnala le informazioni pratiche, ma controlla sempre il sito ufficiale prima di partire."],
      ["È adatta a una prima visita a Londra?", "Sì, se vuoi affiancare ai luoghi celebri posti che raccontano meglio la città. Completa una guida tradizionale senza sostituire la pianificazione essenziale del viaggio."],
      ["È utile per chi vive a Londra?", "Sì. La distribuzione in tutta la città, i link pratici e i riferimenti ai luoghi vicini sono pensati per chi cerca una passeggiata, un museo, un mercato, un giardino o un panorama diverso."],
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
  const placeItems = places.map(([category, name, area, description], index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Place",
      name,
      description,
      containedInPlace: { "@type": "City", name: "London" },
      additionalType: c.categories[category],
      address: { "@type": "PostalAddress", addressLocality: area, addressRegion: "London", addressCountry: "GB" }
    }
  }));
  const schema = {"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","@id":`${origin}${c.route}#webpage`,url:`${origin}${c.route}`,name:c.title,description:c.description,inLanguage:c.lang,datePublished:published,dateModified:modified,isPartOf:{"@id":`${origin}/#website`},about:locale === "it" ? ["Londra insolita","Londra fuori dai soliti itinerari","Guida indipendente di Londra"] : ["Unusual things to do in London","Off-the-beaten-track London","Independent London travel guide"],mainEntity:[{"@id":`${origin}${c.route}#places`},{"@id":`${origin}${c.route}#book`}]},
    {"@type":"ItemList","@id":`${origin}${c.route}#places`,name:locale === "it" ? "16 luoghi insoliti di Londra" : "16 unusual places in London",numberOfItems:placeItems.length,itemListElement:placeItems},
    {"@type":"Book","@id":`${origin}${c.route}#book`,name:"The Other London",subtitle:locale === "it" ? "110 luoghi insoliti fuori dai soliti itinerari" : "110 unusual places beyond the obvious",author:{"@type":"Person",name:"Paolo Pastorino",url:`${origin}/about/`},inLanguage:"en-GB",numberOfPages:124,genre:["Travel guide","London","Local history"],keywords:locale === "it" ? "Londra insolita, luoghi insoliti a Londra, Londra fuori dai soliti itinerari" : "unusual things to do in London, off the beaten track London, unusual London places",image:`${origin}/assets/guide-cover.jpg`,url:`${origin}${c.route}`,offers:{"@type":"Offer",url:"https://payhip.com/b/DrBE5",availability:"https://schema.org/InStock"}},
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
    "buddhapadipa-article": it ? "/it/journal/buddhapadipa-temple-wimbledon-visita/" : "/journal/buddhapadipa-temple-wimbledon-visit/",
    "trinity-article": it ? "/it/journal/trinity-buoy-wharf-faro-londra/" : "/journal/trinity-buoy-wharf-lighthouse/"
  })[target];
  const cards = places.map(([category,name,area,description,target]) => {
    const link = target ? `<p><a href="${linkedPlace(target)}">${target === "wimbledon-itinerary" ? (it ? "Apri l’itinerario" : "Open the itinerary") : (it ? `Leggi di ${name}` : `Read about ${name}`)} →</a></p>` : "";
    return `<article class="guide-place" data-guide-place="${category}"><span class="guide-place-category">${escape(c.categories[category])} · ${escape(area)}</span><h3>${escape(name)}</h3><p>${escape(description)}</p>${link}</article>`;
  }).join("");
  const paths = c.paths.map(([title,text,href,label]) => `<article class="guide-place"><h3>${escape(title)}</h3><p>${escape(text)}</p><p><a href="${href}">${escape(label)} →</a></p></article>`).join("");
  const photos = ["trinity-buoy-wharf-01.webp","07-wandle-trail-01.webp","10-chiswick-hogarth-house-gardens-01.webp","11-buddhapadipa-temple-02.webp"].map((file,index) => `<figure><img src="/assets/journal/${file}" alt="${escape(c.photoCaptions[index])}" loading="lazy" width="900" height="1200"><figcaption>${escape(c.photoCaptions[index])}</figcaption></figure>`).join("");
  const faqs = c.faqs.map(([question,answer]) => `<details><summary>${escape(question)}</summary><p>${escape(answer)}</p></details>`).join("");
  return `${head(locale,c)}<body class="guide-page">${nav(locale)}<main class="guide-main"><section class="guide-hero"><div class="guide-shell guide-hero-grid"><div><span class="guide-eyebrow">${escape(c.eyebrow)}</span><h1>${c.headline}</h1><p class="guide-lede">${escape(c.lede)}</p><div class="guide-actions"><a class="guide-button" href="/assets/the-other-london-sampler.pdf" download data-track="guide:sample">${escape(c.sample)}</a><a class="guide-button secondary" href="https://payhip.com/b/DrBE5" target="_blank" rel="noopener" data-track="guide:buy">${escape(c.buy)} ↗</a></div><p class="guide-note">${escape(c.sampleNote)}</p></div><div class="guide-cover-wrap"><img class="guide-cover" src="/assets/guide-cover.jpg" alt="The Other London guide by Paolo Pastorino" width="1049" height="1489"></div></div></section><section class="guide-stats" aria-label="Guide facts"><div class="guide-shell guide-stats-grid">${c.stats.map(([number,label]) => `<div class="guide-stat"><strong>${number}</strong><span>${escape(label)}</span></div>`).join("")}</div></section><section class="guide-section"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.introKicker)}</span><div><h2>${escape(c.introTitle)}</h2></div></div><div class="guide-manifesto"><blockquote>${c.quote}</blockquote><div class="guide-manifesto-copy">${c.intro.map(text => `<p>${escape(text)}</p>`).join("")}<p><a href="${it ? "/it/chi-sono/" : "/about/"}">${escape(c.aboutLink)} →</a></p></div></div></div></section><section class="guide-section"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.pathsKicker)}</span><div><h2>${escape(c.pathsTitle)}</h2><p>${escape(c.pathsText)}</p></div></div><div class="guide-place-grid">${paths}</div></div></section><section class="guide-map-section"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.mapKicker)}</span><div><h2>${escape(c.mapTitle)}</h2><p>${escape(c.mapText)}</p></div></div><figure class="guide-map-frame"><img src="/assets/london-map.jpg" alt="${escape(c.mapAlt)}" width="1560" height="1140" loading="lazy"><figcaption class="guide-map-caption">${escape(c.mapCaption)}<span>${escape(c.mapHint)}</span></figcaption></figure></div></section><section class="guide-section guide-places"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.placesKicker)}</span><div><h2>${escape(c.placesTitle)}</h2><p>${escape(c.placesText)}</p></div></div><div class="guide-filters" aria-label="${it ? "Filtra per tema" : "Filter by theme"}">${filterButtons}</div><div class="guide-place-grid">${cards}</div></div></section><section class="guide-section"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.photosKicker)}</span><div><h2>${escape(c.photosTitle)}</h2><p>${escape(c.photosText)}</p></div></div><div class="guide-photo-grid">${photos}</div></div></section><section class="guide-cta"><div class="guide-shell guide-cta-grid"><div><span class="guide-kicker">${escape(c.ctaKicker)}</span><h2>${escape(c.ctaTitle)}</h2><p>${escape(c.ctaText)}</p></div><div class="guide-actions"><a class="guide-button" href="/assets/the-other-london-sampler.pdf" download>${escape(c.sample)}</a><a class="guide-button secondary" href="https://payhip.com/b/DrBE5" target="_blank" rel="noopener">${escape(c.buy)} ↗</a></div></div></section><section class="guide-section guide-faq"><div class="guide-shell"><div class="guide-section-head"><span class="guide-kicker">${escape(c.faqKicker)}</span><div><h2>${escape(c.faqTitle)}</h2></div></div><div class="guide-faq-list">${faqs}</div><div class="guide-next"><a href="${it ? "/it/journal/" : "/journal/"}"><span>${escape(c.next)}</span><strong>${escape(c.journal)} →</strong></a><a href="${it ? "/it/#strumenti" : "/#tools"}"><span>${escape(c.next)}</span><strong>${escape(c.tools)} →</strong></a></div></div></section></main><footer class="site-footer"><div><strong>London Advanced</strong><p>${escape(c.footer)}</p></div><nav><a href="${it ? "/it/chi-sono/" : "/about/"}">${it ? "Chi sono" : "About"}</a><a href="${it ? "/it/metodologia/" : "/methodology/"}">${it ? "Metodologia" : "Methodology"}</a><a href="${c.search}">${it ? "Cerca" : "Search"}</a></nav><p>© ${new Date().getUTCFullYear()} Paolo Pastorino</p></footer><script src="/guide.js" defer></script></body></html>`;
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
  const entries = [`  <url><loc>${origin}/the-other-london/</loc><lastmod>${modified}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>`, `  <url><loc>${origin}/it/the-other-london/</loc><lastmod>${modified}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`].join("\n");
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
