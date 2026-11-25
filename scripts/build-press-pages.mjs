import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { navigation, footer } from "./build-journal.mjs";

const root = process.cwd();
const dist = path.join(root, "dist");
const origin = "https://www.londonadvanced.com";
const updated = "2026-11-25";

const pages = {
  en: {
    lang: "en-GB",
    route: "/press/",
    alternate: "/it/stampa/",
    title: "Press and media",
    description: "Press information about London Advanced, its editorial mission, practical tools, published guide, audience, original photography and media contact.",
    eyebrow: "Press and media",
    heading: "London for people who <em>look twice.</em>",
    lede: "London Advanced is an independent, bilingual editorial platform combining field reporting, original photography, practical digital tools and a published guide to the city beyond the standard lists.",
    contactCta: "Send a media enquiry",
    sampleCta: "Download the guide sample",
    factsLabel: "At a glance",
    facts: [["London", "Based and reported"], ["EN + IT", "Bilingual platform"], ["Independent", "Editorial ownership"]],
    missionKicker: "Editorial mission",
    missionTitle: "Make the rest of London easier to notice and easier to explore.",
    missionCopy: [
      "London Advanced is for curious residents, repeat visitors and first-time visitors who want more than the default itinerary. It does not reject famous London. It gives overlooked buildings, local streets, small museums, unusual walks, community places and working parts of the city the attention they deserve.",
      "Every recommendation must offer a worthwhile story, atmosphere, detail or practical reason to go. Personal observation and original photography establish the point of view. Official sources are used to check access, opening arrangements and other facts that can change."
    ],
    quote: "The editorial test is simple: would I tell a curious friend to spend part of their London day here, and can I explain why?",
    innovationKicker: "Platform innovations",
    innovationTitle: "Editorial judgement, turned into useful decisions.",
    innovations: [
      ["Decision-first tools", "Each tool answers one practical question: where to go, how busy it may feel, whether a detour is worthwhile, what the journey will cost, or where to find a usable facility."],
      ["Editorial data products", "More than 1,450 places are structured by mood, character, location and practical constraints so the same research can support discovery, routing and comparison."],
      ["Live context with clear limits", "Weather, transport, events and crowd-pressure signals are combined with editorial evidence. Estimates are labelled as estimates, and time-sensitive details link back to official sources."],
      ["Bilingual publishing", "The English and Italian editions share the same editorial standards while using native copy, routes and practical framing for each audience."]
    ],
    audienceKicker: "Platform scale",
    audienceTitle: "Editorial depth, practical coverage and two languages.",
    audienceNote: "Figures reflect the current published site and guide.",
    stats: [["1,450+", "London places across the platform"], ["9 / 10", "Free tools in English / Italian"], ["110", "Places in the published guide"], ["2", "Languages"]],
    guideKicker: "Published guide",
    guideTitle: "The Other London",
    guideCopy: "The 124-page digital field guide brings together 110 handpicked places in eight themes. Each entry combines concise context, practical access information, original photography, map links and nearby suggestions.",
    guideFacts: ["124 pages", "110 places", "8 themes", "English-language PDF"],
    guidePage: "Explore the guide",
    guideSample: "Download the free sample",
    photographyKicker: "Original photography",
    photographyTitle: "The platform is reported with a camera as well as a notebook.",
    photographyCopy: "Photography is part of the editorial method, not decoration. Paolo photographs the places he visits to record atmosphere, architecture and the details that make a location worth a second look. Publication-quality files and usage licences are available by request.",
    photos: [["/assets/journal/trinity-buoy-wharf-01.webp", "Trinity Buoy Wharf", "Industrial London at the mouth of the Lea"], ["/assets/journal/11-buddhapadipa-temple-01.webp", "Buddhapadipa Temple", "Thai Buddhist architecture in Wimbledon"], ["/assets/journal/21-eel-pie-island-03.webp", "Eel Pie Island", "A Thames island shaped by music and artists"]],
    founderKicker: "Founder and editor",
    founderTitle: "Paolo Pastorino",
    founderCopy: "Paolo is a London-based editor, product leader and street photographer. Since moving to London in 2018, he has explored the city on foot, by bicycle, bus and Tube, building the field notes, photographs and structured place data behind London Advanced.",
    aboutCta: "About Paolo and the project",
    portfolioCta: "Photography portfolio",
    contactKicker: "Media contact",
    contactTitle: "Interviews, background and image requests.",
    contactCopy: "For interviews, expert comment, review access to The Other London, image licensing or factual questions about the platform, contact Paolo Pastorino through the London Advanced form. Include your outlet, deadline and the material you need.",
    contactRole: "Paolo Pastorino, founder, editor and photographer",
    contactButton: "Contact Paolo",
    instagram: "Instagram",
    community: "Facebook community"
  },
  it: {
    lang: "it-IT",
    route: "/it/stampa/",
    alternate: "/press/",
    title: "Stampa e media",
    description: "Informazioni per la stampa su London Advanced: missione editoriale, strumenti digitali, guida pubblicata, pubblico, fotografia originale e contatti per i media.",
    eyebrow: "Stampa e media",
    heading: "Londra per chi preferisce <em>guardare due volte.</em>",
    lede: "London Advanced è una piattaforma editoriale indipendente e bilingue che unisce ricerca sul campo, fotografia originale, strumenti digitali pratici e una guida pubblicata alla Londra oltre le solite liste.",
    contactCta: "Invia una richiesta stampa",
    sampleCta: "Scarica l'anteprima della guida",
    factsLabel: "In breve",
    facts: [["Londra", "Base e ricerca sul campo"], ["EN + IT", "Piattaforma bilingue"], ["Indipendente", "Proprietà editoriale"]],
    missionKicker: "Missione editoriale",
    missionTitle: "Rendere il resto di Londra più facile da notare e da esplorare.",
    missionCopy: [
      "London Advanced è pensato per residenti curiosi, visitatori abituali e chi arriva per la prima volta ma vuole andare oltre l'itinerario predefinito. Non rifiuta la Londra celebre: dedica attenzione agli edifici trascurati, alle strade locali, ai piccoli musei, alle passeggiate insolite, ai luoghi di comunità e alle parti ancora operative della città.",
      "Ogni proposta deve offrire una storia, un'atmosfera, un dettaglio o un motivo pratico per andarci. L'osservazione diretta e la fotografia originale definiscono il punto di vista. Le fonti ufficiali servono a verificare accesso, aperture e altri dati che possono cambiare."
    ],
    quote: "Il criterio editoriale è semplice: consiglierei a una persona curiosa di dedicare una parte della sua giornata londinese a questo luogo, e so spiegare perché?",
    innovationKicker: "Innovazioni della piattaforma",
    innovationTitle: "Il giudizio editoriale trasformato in decisioni utili.",
    innovations: [
      ["Strumenti orientati alla decisione", "Ogni strumento risponde a una domanda pratica: dove andare, quanto potrebbe essere affollato, se una deviazione vale il tempo, quanto costerà il viaggio o dove trovare un servizio utilizzabile."],
      ["Prodotti editoriali basati sui dati", "Oltre 1.450 luoghi sono strutturati per atmosfera, carattere, posizione e limiti pratici, così la stessa ricerca alimenta scoperta, itinerari e confronti."],
      ["Contesto in tempo reale, con limiti chiari", "Meteo, trasporti, eventi e segnali di affollamento si uniscono alle valutazioni editoriali. Le stime sono dichiarate come tali e i dettagli sensibili al tempo rimandano alle fonti ufficiali."],
      ["Pubblicazione bilingue", "Le edizioni inglese e italiana condividono gli stessi standard editoriali, con testi, percorsi e impostazione pratica pensati nativamente per ciascun pubblico."]
    ],
    audienceKicker: "Dimensioni della piattaforma",
    audienceTitle: "Profondità editoriale, copertura pratica e due lingue.",
    audienceNote: "I dati riflettono il sito e la guida attualmente pubblicati.",
    stats: [["1.450+", "Luoghi di Londra nella piattaforma"], ["9 / 10", "Strumenti gratuiti in inglese / italiano"], ["110", "Luoghi nella guida pubblicata"], ["2", "Lingue"]],
    guideKicker: "Guida pubblicata",
    guideTitle: "The Other London",
    guideCopy: "La guida digitale di 124 pagine raccoglie 110 luoghi scelti in otto temi. Ogni scheda combina contesto essenziale, informazioni pratiche sull'accesso, fotografia originale, link alle mappe e suggerimenti nelle vicinanze.",
    guideFacts: ["124 pagine", "110 luoghi", "8 temi", "PDF in lingua inglese"],
    guidePage: "Esplora la guida",
    guideSample: "Scarica l'anteprima gratuita",
    photographyKicker: "Fotografia originale",
    photographyTitle: "La piattaforma nasce con una fotocamera oltre che con un taccuino.",
    photographyCopy: "La fotografia fa parte del metodo editoriale, non è decorazione. Paolo fotografa i luoghi che visita per documentare atmosfera, architettura e dettagli che meritano un secondo sguardo. File ad alta risoluzione e licenze d'uso sono disponibili su richiesta.",
    photos: [["/assets/journal/trinity-buoy-wharf-01.webp", "Trinity Buoy Wharf", "La Londra industriale alla foce del Lea"], ["/assets/journal/11-buddhapadipa-temple-01.webp", "Buddhapadipa Temple", "Architettura buddhista thailandese a Wimbledon"], ["/assets/journal/21-eel-pie-island-03.webp", "Eel Pie Island", "Un'isola del Tamigi segnata dalla musica e dagli artisti"]],
    founderKicker: "Fondatore ed editor",
    founderTitle: "Paolo Pastorino",
    founderCopy: "Paolo è un editor, product leader e fotografo di strada che vive a Londra. Dal suo arrivo nel 2018 ha esplorato la città a piedi, in bicicletta, in autobus e in metropolitana, costruendo gli appunti, le fotografie e i dati strutturati sui luoghi alla base di London Advanced.",
    aboutCta: "Paolo e il progetto",
    portfolioCta: "Portfolio fotografico",
    contactKicker: "Contatti per i media",
    contactTitle: "Interviste, informazioni e richieste di immagini.",
    contactCopy: "Per interviste, commenti, copie stampa di The Other London, licenze fotografiche o domande sulla piattaforma, contatta Paolo Pastorino tramite il modulo di London Advanced. Indica la testata, la scadenza e il materiale necessario.",
    contactRole: "Paolo Pastorino, fondatore, editor e fotografo",
    contactButton: "Contatta Paolo",
    instagram: "Instagram",
    community: "Community Facebook"
  }
};

function escape(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
}

function head(locale, page) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${origin}${page.route}#webpage`, url: `${origin}${page.route}`, name: page.title, description: page.description, inLanguage: page.lang, dateModified: updated, isPartOf: { "@id": `${origin}/#website` }, about: { "@id": `${origin}/#organization` } },
      { "@type": "Organization", "@id": `${origin}/#organization`, name: "London Advanced", url: origin, founder: { "@type": "Person", name: "Paolo Pastorino", url: `${origin}/about/` }, sameAs: ["https://www.instagram.com/londonadvanced", "https://www.facebook.com/groups/223988130303794/"] },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "London Advanced", item: `${origin}${locale === "it" ? "/it/" : "/"}` }, { "@type": "ListItem", position: 2, name: page.title, item: `${origin}${page.route}` }] }
    ]
  };
  return `<!doctype html><html lang="${page.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)} | London Advanced</title><meta name="description" content="${escape(page.description)}"><meta name="author" content="Paolo Pastorino"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}${page.route}"><link rel="alternate" hreflang="en-GB" href="${origin}${locale === "en" ? page.route : page.alternate}"><link rel="alternate" hreflang="it-IT" href="${origin}${locale === "it" ? page.route : page.alternate}"><link rel="alternate" hreflang="x-default" href="${origin}/press/"><meta property="og:type" content="website"><meta property="og:site_name" content="London Advanced"><meta property="og:title" content="${escape(page.title)} | London Advanced"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${origin}${page.route}"><meta property="og:image" content="${origin}/assets/london-map.jpg"><meta property="og:image:alt" content="${locale === "it" ? "Mappa dei luoghi di London Advanced a Londra" : "Map of London Advanced places across London"}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Libre+Caslon+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/press.css"><script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script></head>`;
}

function render(locale, page) {
  const it = locale === "it";
  const contact = it ? "/it/#contatti" : "/#contact";
  const about = it ? "/it/chi-sono/" : "/about/";
  const guide = it ? "/it/the-other-london/" : "/the-other-london/";
  const facts = page.facts.map(([value, label]) => `<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join("");
  const innovations = page.innovations.map(([title, copy]) => `<article><h3>${escape(title)}</h3><p>${escape(copy)}</p></article>`).join("");
  const stats = page.stats.map(([value, label]) => `<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join("");
  const guideFacts = page.guideFacts.map(fact => `<li>${escape(fact)}</li>`).join("");
  const photos = page.photos.map(([src, title, caption]) => `<figure><img src="${src}" alt="${escape(title)}" loading="lazy"><figcaption><strong>${escape(title)}</strong><span>${escape(caption)}</span></figcaption></figure>`).join("");

  return `${head(locale, page)}<body class="press-page">${navigation(locale, "press", page.alternate)}<main><section class="press-hero"><div class="press-shell press-hero-grid"><div><span class="press-kicker">${escape(page.eyebrow)}</span><h1>${page.heading}</h1><p>${escape(page.lede)}</p><div class="press-actions"><a class="press-button" href="${contact}">${escape(page.contactCta)}</a><a class="press-text-link" href="/assets/the-other-london-sampler.pdf" download>${escape(page.sampleCta)}</a></div></div><aside aria-label="${escape(page.factsLabel)}"><span>${escape(page.factsLabel)}</span>${facts}</aside></div></section><section class="press-section"><div class="press-shell press-section-head"><span class="press-kicker">${escape(page.missionKicker)}</span><div><h2>${escape(page.missionTitle)}</h2>${page.missionCopy.map(text => `<p>${escape(text)}</p>`).join("")}<blockquote>${escape(page.quote)}</blockquote></div></div></section><section class="press-section press-innovation"><div class="press-shell"><div class="press-section-head"><span class="press-kicker">${escape(page.innovationKicker)}</span><div><h2>${escape(page.innovationTitle)}</h2></div></div><div class="press-card-grid">${innovations}</div></div></section><section class="press-stats"><div class="press-shell"><div class="press-section-head"><span class="press-kicker">${escape(page.audienceKicker)}</span><div><h2>${escape(page.audienceTitle)}</h2></div></div><div class="press-stat-grid">${stats}</div><p class="press-source-note">${escape(page.audienceNote)}</p></div></section><section class="press-section"><div class="press-shell press-guide-grid"><div class="press-guide-cover"><img src="/assets/guide-cover.jpg" alt="The Other London by Paolo Pastorino" loading="lazy"></div><div><span class="press-kicker">${escape(page.guideKicker)}</span><h2>${escape(page.guideTitle)}</h2><p>${escape(page.guideCopy)}</p><ul>${guideFacts}</ul><div class="press-actions"><a class="press-button" href="${guide}">${escape(page.guidePage)}</a><a class="press-text-link" href="/assets/the-other-london-sampler.pdf" download>${escape(page.guideSample)}</a></div></div></div></section><section class="press-section press-photography"><div class="press-shell"><div class="press-section-head"><span class="press-kicker">${escape(page.photographyKicker)}</span><div><h2>${escape(page.photographyTitle)}</h2><p>${escape(page.photographyCopy)}</p></div></div><div class="press-photo-grid">${photos}</div></div></section><section class="press-section"><div class="press-shell press-founder-grid"><div><span class="press-kicker">${escape(page.founderKicker)}</span><h2>${escape(page.founderTitle)}</h2></div><div><p>${escape(page.founderCopy)}</p><div class="press-actions"><a class="press-text-link" href="${about}">${escape(page.aboutCta)}</a><a class="press-text-link" href="https://photoswithout.com" target="_blank" rel="noopener">${escape(page.portfolioCta)}</a></div></div></div></section><section class="press-contact"><div class="press-shell press-contact-grid"><div><span class="press-kicker">${escape(page.contactKicker)}</span><h2>${escape(page.contactTitle)}</h2><p>${escape(page.contactCopy)}</p></div><aside><strong>${escape(page.contactRole)}</strong><a class="press-button" href="${contact}">${escape(page.contactButton)}</a><a href="https://www.instagram.com/londonadvanced" target="_blank" rel="noopener">${escape(page.instagram)}</a><a href="https://www.facebook.com/groups/223988130303794/" target="_blank" rel="noopener">${escape(page.community)}</a></aside></div></section></main>${footer(locale)}</body></html>`;
}

export async function buildPressPages() {
  const targets = [["en", pages.en, path.join(dist, "press", "index.html")], ["it", pages.it, path.join(dist, "it", "stampa", "index.html")]];
  for (const [locale, page, target] of targets) {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, render(locale, page), "utf8");
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  await buildPressPages();
}
