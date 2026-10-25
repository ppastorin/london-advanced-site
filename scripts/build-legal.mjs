import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const origin = "https://www.londonadvanced.com";
const updatedIso = "2026-10-25";

const pages = {
  privacyEn: {
    locale: "en-GB",
    route: "/privacy/",
    alternate: "/it/privacy/",
    title: "Privacy notice",
    description: "How London Advanced handles tool inputs, analytics, contact messages, newsletter subscriptions, cookies and privacy rights.",
    eyebrow: "Privacy · clear by design",
    heading: "Privacy without the fog.",
    intro: "The public tools do not require an account, and London Advanced does not retain the locations, preferences or answers you enter into them. A small amount of personal data is processed only when you subscribe, contact Paolo, consent to analytics, or when technical providers deliver and secure the site.",
    updated: "Last updated 25 October 2026",
    sections: [
      ["01", "Who is responsible", "Paolo Pastorino is the controller for personal data handled through London Advanced. For a privacy request, use the <a href=\"/#contact\">contact form</a> and write “Privacy request” at the start of the message."],
      ["02", "What is processed", `<div class="legal-table-wrap"><table><thead><tr><th>Activity</th><th>Data and purpose</th><th>Basis and retention</th></tr></thead><tbody>
        <tr><td><strong>Public tools</strong></td><td>Locations, dates, preferences and answers are used to calculate or display the requested result. Where location permission is used, the browser shares coordinates only after you allow it.</td><td>London Advanced does not create an account, profile or history from these inputs and does not retain them in its own database after the request. Hosting and external data providers may keep limited technical logs under their own policies.</td></tr>
        <tr><td><strong>Contact form</strong></td><td>Name, email address and message are sent by email so Paolo can read and answer the enquiry. The website does not store a second database copy.</td><td>Legitimate interests in answering genuine enquiries. Correspondence is normally deleted within 12 months after the last relevant exchange, unless it is needed longer for a legal, security or ongoing business reason.</td></tr>
        <tr><td><strong>Newsletter</strong></td><td>Email address and, where configured, the signup source are sent to EmailOctopus to deliver the requested newsletter and keep evidence of subscription preferences.</td><td>Consent. The record is kept until you unsubscribe or ask for deletion; a minimal suppression record may be retained to honour an unsubscribe request.</td></tr>
        <tr><td><strong>Optional Google Analytics</strong></td><td>Usage and device information helps understand which pages and links are useful. Google Analytics loads only after an affirmative choice.</td><td>Consent. London Advanced limits analytics data retention to no more than 14 months. Google may process data outside the UK under its safeguards.</td></tr>
        <tr><td><strong>Site delivery and security</strong></td><td>Cloudflare may process IP address, request time, browser/device data, requested URL and security signals to deliver, protect and monitor the site. Cloudflare Web Analytics provides aggregated measurement without placing its own cookies or using local storage.</td><td>Legitimate interests in operating a secure and reliable service. Provider security and diagnostic logs are kept for the periods set by the relevant service and account configuration.</td></tr>
      </tbody></table></div>`],
      ["03", "Cookies and local storage", `<ul>
        <li><strong>Analytics choice:</strong> <code>la-analytics-consent</code> stores “yes” or “no” in the browser so the site remembers the choice. It remains until cleared.</li>
        <li><strong>Anti-spam:</strong> <code>la_contact_recent</code> and <code>la_subscribe_recent</code> are strictly necessary cookies lasting 60 seconds after a successful form submission.</li>
        <li><strong>Google Analytics:</strong> if you consent, Google may set analytics cookies. Refusing does not restrict the site or its public tools.</li>
      </ul><button class="legal-action" type="button" data-reset-consent>Reset my analytics choice</button><p class="legal-action-status" data-consent-status aria-live="polite"></p>`],
      ["04", "Providers and links", `London Advanced uses Cloudflare for hosting, security and aggregated analytics; Google Analytics only with consent; EmailOctopus for newsletters; and Google Fonts for typography. Individual tools may call map, transport, weather or venue data services to answer a request. Following an external link—such as Payhip, an organiser, a map or a social network—takes you to that provider’s service and privacy terms. Read the <a href="https://www.cloudflare.com/privacypolicy/" rel="external">Cloudflare privacy policy</a>, <a href="https://policies.google.com/privacy?hl=en-GB" rel="external">Google privacy policy</a> and <a href="https://emailoctopus.com/legal/privacy" rel="external">EmailOctopus privacy policy</a>.`],
      ["05", "Your choices and rights", `You may ask for access, correction, deletion, restriction or a copy of personal data, object where legitimate interests are relied on, and withdraw consent at any time. These rights are subject to legal limits. Newsletter consent can also be withdrawn through the unsubscribe link in every email. London Advanced does not sell personal data and does not use contact or newsletter details for third-party advertising. If a concern is not resolved, you may complain to the <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/" rel="external">UK Information Commissioner’s Office</a>.`],
      ["06", "Security, children and changes", `Reasonable technical and organisational safeguards are used, but no internet service can promise absolute security. Do not send sensitive personal information through the contact form. London Advanced is a general travel and culture service, not a service directed at children, and does not knowingly collect children’s data. This notice may be updated when the site, providers or law changes; the date at the top will change.`]
    ]
  },
  privacyIt: {
    locale: "it-IT",
    route: "/it/privacy/",
    alternate: "/privacy/",
    title: "Informativa sulla privacy",
    description: "Come London Advanced gestisce dati inseriti negli strumenti, analisi, messaggi, newsletter, cookie e diritti sulla privacy.",
    eyebrow: "Privacy · chiarezza prima di tutto",
    heading: "Privacy, senza nebbia.",
    intro: "Gli strumenti pubblici non richiedono un account e London Advanced non conserva luoghi, preferenze o risposte inseriti al loro interno. Una quantità limitata di dati personali viene trattata solo quando ti iscrivi, contatti Paolo, acconsenti alle statistiche oppure quando i fornitori tecnici erogano e proteggono il sito.",
    updated: "Ultimo aggiornamento: 25 ottobre 2026",
    sections: [
      ["01", "Chi è responsabile", "Paolo Pastorino è il titolare del trattamento dei dati personali gestiti attraverso London Advanced. Per una richiesta sulla privacy usa il <a href=\"/it/#contatti\">modulo di contatto</a> e scrivi “Richiesta privacy” all’inizio del messaggio."],
      ["02", "Quali dati vengono trattati", `<div class="legal-table-wrap"><table><thead><tr><th>Attività</th><th>Dati e finalità</th><th>Base giuridica e conservazione</th></tr></thead><tbody>
        <tr><td><strong>Strumenti pubblici</strong></td><td>Luoghi, date, preferenze e risposte sono usati per calcolare o mostrare il risultato richiesto. Quando viene usata la posizione, il browser condivide le coordinate solo dopo il consenso.</td><td>London Advanced non crea account, profili o cronologie con questi dati e non li conserva nel proprio database al termine della richiesta. I fornitori di hosting e dati esterni possono conservare registri tecnici limitati secondo le proprie informative.</td></tr>
        <tr><td><strong>Modulo di contatto</strong></td><td>Nome, indirizzo email e messaggio vengono inviati via email affinché Paolo possa leggere e rispondere. Il sito non ne conserva una seconda copia in un database.</td><td>Legittimo interesse a rispondere alle richieste autentiche. La corrispondenza viene normalmente eliminata entro 12 mesi dall’ultimo scambio rilevante, salvo necessità legali, di sicurezza o attività ancora in corso.</td></tr>
        <tr><td><strong>Newsletter</strong></td><td>L’indirizzo email e, se configurata, la provenienza dell’iscrizione vengono inviati a EmailOctopus per spedire la newsletter richiesta e conservare prova delle preferenze.</td><td>Consenso. Il dato resta fino alla disiscrizione o alla richiesta di cancellazione; può rimanere un record minimo per rispettare la volontà di non ricevere altre email.</td></tr>
        <tr><td><strong>Google Analytics facoltativo</strong></td><td>Informazioni sull’uso e sul dispositivo aiutano a capire quali pagine e collegamenti sono utili. Google Analytics viene caricato solo dopo una scelta positiva.</td><td>Consenso. London Advanced limita la conservazione dei dati di analisi a non oltre 14 mesi. Google può trattare dati fuori dal Regno Unito con le proprie garanzie.</td></tr>
        <tr><td><strong>Erogazione e sicurezza</strong></td><td>Cloudflare può trattare indirizzo IP, orario, dati del browser/dispositivo, URL richiesto e segnali di sicurezza per erogare, proteggere e monitorare il sito. Cloudflare Web Analytics fornisce statistiche aggregate senza propri cookie o uso di archiviazione locale.</td><td>Legittimo interesse a gestire un servizio sicuro e affidabile. I registri tecnici e di sicurezza sono conservati per i periodi previsti dal servizio e dalla configurazione dell’account.</td></tr>
      </tbody></table></div>`],
      ["03", "Cookie e archiviazione locale", `<ul>
        <li><strong>Scelta sulle statistiche:</strong> <code>la-analytics-consent</code> memorizza “yes” o “no” nel browser. Rimane finché non viene cancellato.</li>
        <li><strong>Antispam:</strong> <code>la_contact_recent</code> e <code>la_subscribe_recent</code> sono cookie strettamente necessari che durano 60 secondi dopo l’invio riuscito di un modulo.</li>
        <li><strong>Google Analytics:</strong> se acconsenti, Google può impostare cookie di analisi. Il rifiuto non limita il sito o gli strumenti pubblici.</li>
      </ul><button class="legal-action" type="button" data-reset-consent>Azzera la mia scelta sulle statistiche</button><p class="legal-action-status" data-consent-status aria-live="polite"></p>`],
      ["04", "Fornitori e collegamenti esterni", `London Advanced usa Cloudflare per hosting, sicurezza e statistiche aggregate; Google Analytics solo con il consenso; EmailOctopus per la newsletter; e Google Fonts per i caratteri tipografici. I singoli strumenti possono interrogare servizi di mappe, trasporti, meteo o luoghi per rispondere a una richiesta. Aprendo un collegamento esterno—per esempio Payhip, un organizzatore, una mappa o un social network—si passa al servizio e alle condizioni privacy del relativo fornitore. Consulta le informative di <a href="https://www.cloudflare.com/privacypolicy/" rel="external">Cloudflare</a>, <a href="https://policies.google.com/privacy?hl=it" rel="external">Google</a> ed <a href="https://emailoctopus.com/legal/privacy" rel="external">EmailOctopus</a>.`],
      ["05", "Scelte e diritti", `Puoi chiedere accesso, rettifica, cancellazione, limitazione o copia dei dati personali; opporti quando il trattamento si basa sul legittimo interesse; e revocare il consenso in ogni momento. Questi diritti sono soggetti ai limiti di legge. Il consenso alla newsletter può essere revocato anche tramite il collegamento presente in ogni email. London Advanced non vende dati personali e non usa i dati di contatto o newsletter per pubblicità di terzi. Se un problema non viene risolto, puoi presentare reclamo all’<a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/" rel="external">Information Commissioner’s Office del Regno Unito</a> o all’autorità competente del tuo paese.`],
      ["06", "Sicurezza, minori e modifiche", `Vengono usate misure tecniche e organizzative ragionevoli, ma nessun servizio internet può promettere sicurezza assoluta. Non inviare dati personali sensibili tramite il modulo di contatto. London Advanced è un servizio generale di viaggio e cultura, non è rivolto ai minori e non raccoglie consapevolmente dati di minori. L’informativa può essere aggiornata quando cambiano il sito, i fornitori o la legge; cambierà la data indicata in alto.`]
    ]
  },
  copyrightEn: {
    locale: "en-GB",
    route: "/copyright/",
    alternate: "/it/copyright/",
    title: "Copyright, database rights and terms of use",
    description: "Ownership, permitted use, data and tool protections, disclaimers and copyright reporting for London Advanced.",
    eyebrow: "Copyright · database rights · use",
    heading: "Original work. Clear boundaries.",
    intro: "London Advanced is shared for people to use, not for others to copy, scrape, repackage or train systems on. These terms protect the original photography, writing, visual identity, code, curated data and tool experiences while preserving lawful quotation, linking and other rights granted by law.",
    updated: "Effective 25 October 2026",
    sections: [
      ["01", "Ownership", `<p>Unless a page says otherwise, the original photographs, writing, editing, maps and graphics created for the project, page layouts, visual look and feel, interface copy, source code, tool interfaces, original taxonomies, and the selection and arrangement of the London Advanced databases are © 2026 Paolo Pastorino. All rights are reserved.</p><p>Copyright protects the expression of the work, including code and design. Database right and/or database copyright may protect a substantial investment in obtaining, verifying and presenting the collections. An abstract idea, method or mathematical concept is not owned merely by stating copyright; protection instead applies to the original code, specifications, interfaces, content, datasets and their selection or arrangement, together with these contractual conditions of access.</p>`],
      ["02", "What you may do", `<ul><li>Browse and use the public site and tools for personal, non-commercial planning.</li><li>Link to a public page and share its URL.</li><li>Quote a short passage for criticism, review, reporting or academic work where the law permits, with clear attribution to Paolo Pastorino and a link to the source.</li><li>Use anything else only with prior written permission or under a separate written licence.</li></ul>`],
      ["03", "What is not licensed", `<p>Except where the law expressly permits it, you may not:</p><ul><li>copy, republish, sell, sublicense, mirror or create a substitute service from the photographs, text, design, code or tool output;</li><li>scrape, crawl, harvest, download or extract the databases or results in bulk, including through repeated queries;</li><li>reproduce the site’s distinctive interface, editorial structure, taxonomies or presentation in a confusingly similar product;</li><li>reverse engineer, circumvent access controls or rate limits, interfere with the service, or use undocumented automated access;</li><li>remove copyright, credit, source or rights notices;</li><li>use the content, photographs, code, data or tool output to train, fine-tune, evaluate or ground a generative-AI or machine-learning system, build a retrieval corpus, or create a commercial dataset without prior written permission.</li></ul><p>No licence is granted merely because source material or a public URL can be viewed. Any legally non-excludable exception remains unaffected.</p>`],
      ["04", "Data, algorithms and external material", `<p>London Advanced’s editorial ratings, descriptions, tags, location curation, verification work, scoring configurations and compiled records form part of its protected content and databases. Public results are for the visitor’s immediate use; they are not an API or a licence to reconstruct the underlying data or logic.</p><p>Transport, weather, map, venue and other third-party data remain subject to the rights and terms of their respective owners. Names, logos and trade marks belonging to venues, providers or platforms remain theirs. Inclusion does not imply affiliation or endorsement. “London Advanced” and its identifying graphics may not be used in a way that suggests sponsorship, approval or origin.</p>`],
      ["05", "Accuracy, availability and responsibility", `<p>The site and tools provide independent editorial and planning information, not safety, legal, medical, financial, accessibility or official travel advice. Live conditions, opening hours, prices, routes and external data can change. Check the relevant official source before relying on a result.</p><p>The service is provided without a promise that it will always be available, error-free or suitable for a particular purpose. Nothing in these terms excludes liability that cannot lawfully be excluded, or affects mandatory consumer rights.</p>`],
      ["06", "Copyright concerns and corrections", `<p>Paolo wants to correct genuine errors and rights issues. If you believe material on the site infringes your copyright or another right, use the <a href="/#contact">contact form</a> and provide: your name and contact details; the work concerned; the exact London Advanced URL; the basis of your claim; and the amendment, credit or removal requested.</p><p>A credible notice will be reviewed promptly. Content may be restricted temporarily while the facts are checked, then corrected, credited, removed or restored as appropriate. Deliberately false or misleading notices may cause harm, so submit claims in good faith.</p>`],
      ["07", "Permissions, changes and law", `For republication, commercial use, research access, a data licence, syndication, photography use or tool integration, contact Paolo before use. These terms may change as the project develops; continued use after publication of revised terms applies from the revised effective date. The terms are governed by the law of England and Wales, without depriving consumers of mandatory protections available where they live.`]
    ]
  },
  copyrightIt: {
    locale: "it-IT",
    route: "/it/copyright/",
    alternate: "/copyright/",
    title: "Copyright, diritti sulle banche dati e condizioni d’uso",
    description: "Titolarità, usi consentiti, tutela di dati e strumenti, limitazioni e segnalazioni di copyright per London Advanced.",
    eyebrow: "Copyright · banche dati · utilizzo",
    heading: "Lavoro originale. Confini chiari.",
    intro: "London Advanced viene condiviso perché le persone lo usino, non perché altri lo copino, estraggano, riconfezionino o impieghino per addestrare sistemi. Queste condizioni proteggono fotografie, testi, identità visiva, codice, dati curati e strumenti originali, senza limitare citazioni, collegamenti e altri usi consentiti dalla legge.",
    updated: "In vigore dal 25 ottobre 2026",
    sections: [
      ["01", "Titolarità", `<p>Salvo diversa indicazione nella pagina, le fotografie originali, i testi, il lavoro editoriale, le mappe e la grafica creati per il progetto, l’impaginazione e l’aspetto visivo, i testi delle interfacce, il codice sorgente, le interfacce degli strumenti, le tassonomie originali e la selezione e disposizione delle banche dati di London Advanced sono © 2026 Paolo Pastorino. Tutti i diritti sono riservati.</p><p>Il copyright protegge l’espressione dell’opera, compresi codice e design. Il diritto sulle banche dati e/o il copyright sulle banche dati possono proteggere l’investimento sostanziale nella raccolta, verifica e presentazione dei contenuti. Un’idea astratta, un metodo o un concetto matematico non diventano proprietà esclusiva per il solo fatto di dichiararne il copyright; la tutela riguarda invece codice, specifiche, interfacce, contenuti, dati e relativa selezione o disposizione, insieme alle presenti condizioni contrattuali di accesso.</p>`],
      ["02", "Cosa puoi fare", `<ul><li>Consultare e usare il sito e gli strumenti pubblici per pianificazione personale e non commerciale.</li><li>Collegare una pagina pubblica e condividerne l’URL.</li><li>Citare un breve passaggio per critica, recensione, cronaca o attività accademica quando consentito dalla legge, indicando chiaramente Paolo Pastorino e collegando la fonte.</li><li>Usare altro materiale solo previa autorizzazione scritta o con una licenza separata.</li></ul>`],
      ["03", "Cosa non viene concesso in licenza", `<p>Salvo quanto espressamente consentito dalla legge, non puoi:</p><ul><li>copiare, ripubblicare, vendere, concedere in sublicenza, duplicare o creare un servizio sostitutivo usando fotografie, testi, design, codice o risultati degli strumenti;</li><li>eseguire scraping, crawling, raccolta, download o estrazione massiva delle banche dati o dei risultati, anche tramite interrogazioni ripetute;</li><li>riprodurre interfaccia, struttura editoriale, tassonomie o presentazione distintive del sito in un prodotto tale da creare confusione;</li><li>compiere reverse engineering, aggirare controlli di accesso o limiti di frequenza, interferire con il servizio o usare accessi automatizzati non documentati;</li><li>rimuovere indicazioni di copyright, crediti, fonti o diritti;</li><li>usare contenuti, fotografie, codice, dati o risultati per addestrare, perfezionare, valutare o alimentare un sistema di IA generativa o machine learning, costruire un corpus di recupero o creare un dataset commerciale senza previa autorizzazione scritta.</li></ul><p>La semplice visibilità di materiale sorgente o di un URL pubblico non concede una licenza. Restano salve le eccezioni di legge che non possono essere escluse.</p>`],
      ["04", "Dati, algoritmi e materiale esterno", `<p>Valutazioni editoriali, descrizioni, tag, selezione dei luoghi, verifiche, configurazioni dei punteggi e record compilati da London Advanced fanno parte dei contenuti e delle banche dati tutelati. I risultati pubblici sono destinati all’uso immediato del visitatore: non costituiscono un’API né una licenza per ricostruire dati o logica sottostanti.</p><p>Dati di trasporto, meteo, mappe, sedi e altre informazioni di terzi restano soggetti ai diritti e alle condizioni dei rispettivi titolari. Nomi, loghi e marchi di sedi, fornitori o piattaforme appartengono ai loro titolari. L’inclusione non implica affiliazione o approvazione. “London Advanced” e i suoi elementi identificativi non possono essere usati in modo da suggerire sponsorizzazione, approvazione o provenienza.</p>`],
      ["05", "Accuratezza, disponibilità e responsabilità", `<p>Il sito e gli strumenti offrono informazioni editoriali e di pianificazione indipendenti, non consigli ufficiali, di sicurezza, legali, medici, finanziari o sull’accessibilità. Condizioni in tempo reale, orari, prezzi, percorsi e dati esterni possono cambiare. Prima di fare affidamento su un risultato, verifica la fonte ufficiale pertinente.</p><p>Il servizio viene fornito senza promettere disponibilità continua, assenza di errori o idoneità a uno scopo particolare. Nulla in queste condizioni esclude responsabilità che non possono essere escluse per legge né limita diritti inderogabili dei consumatori.</p>`],
      ["06", "Segnalazioni di copyright e correzioni", `<p>Paolo intende correggere errori reali e problemi relativi ai diritti. Se ritieni che materiale presente nel sito violi il tuo copyright o un altro diritto, usa il <a href="/it/#contatti">modulo di contatto</a> indicando: nome e recapiti; opera interessata; URL esatto su London Advanced; motivo della richiesta; e modifica, credito o rimozione desiderata.</p><p>Una segnalazione credibile verrà esaminata tempestivamente. Il contenuto può essere limitato temporaneamente durante le verifiche e poi corretto, accreditato, rimosso o ripristinato secondo il caso. Segnalazioni deliberatamente false o ingannevoli possono causare danni: invia richieste in buona fede.</p>`],
      ["07", "Autorizzazioni, modifiche e legge applicabile", `Per ripubblicazione, uso commerciale, accesso per ricerca, licenza dei dati, syndication, uso di fotografie o integrazione degli strumenti, contatta Paolo prima dell’utilizzo. Le condizioni possono cambiare con l’evoluzione del progetto; l’uso successivo alla pubblicazione delle modifiche è disciplinato dalla nuova data di entrata in vigore. Si applica la legge di Inghilterra e Galles, senza privare i consumatori delle tutele inderogabili disponibili nel luogo in cui vivono.`]
    ]
  }
};

function escape(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function alternateLinks(page) {
  const en = page.locale === "en-GB" ? page.route : page.alternate;
  const it = page.locale === "it-IT" ? page.route : page.alternate;
  return `<link rel="alternate" hreflang="en-GB" href="${origin}${en}"><link rel="alternate" hreflang="it-IT" href="${origin}${it}"><link rel="alternate" hreflang="x-default" href="${origin}${en}">`;
}

function navigation(page) {
  const it = page.locale === "it-IT";
  return `<header class="site-nav legal-nav"><a class="wordmark" href="${it ? "/it/" : "/"}" aria-label="${it ? "Homepage London Advanced" : "London Advanced homepage"}">LA<span>•</span></a><nav aria-label="${it ? "Navigazione principale" : "Main navigation"}"><a href="${it ? "/it/" : "/"}">${it ? "Home" : "Home"}</a><a href="${it ? "/it/journal/" : "/journal/"}">Journal</a><a href="${it ? "/it/metodologia/" : "/methodology/"}">${it ? "Metodologia" : "Methodology"}</a><a href="${it ? "/it/chi-sono/" : "/about/"}">${it ? "Chi sono" : "About"}</a></nav><a class="nav-cta" href="${page.alternate}" lang="${it ? "en" : "it"}" hreflang="${it ? "en-GB" : "it-IT"}">${it ? "English" : "Italiano"}</a></header>`;
}

function footer(page) {
  const it = page.locale === "it-IT";
  return `<footer><div><strong>London Advanced</strong><span>${it ? "Strumenti indipendenti e appunti sul campo per una Londra meno ovvia." : "Independent tools and field notes for a less obvious London."}</span></div><div class="footer-meta"><a href="${it ? "/it/privacy/" : "/privacy/"}">${it ? "Privacy" : "Privacy"}</a><a href="${it ? "/it/copyright/" : "/copyright/"}">${it ? "Copyright e uso" : "Copyright &amp; use"}</a><a href="${it ? "/it/#contatti" : "/#contact"}">${it ? "Contatti" : "Contact"}</a><small>© 2026 Paolo Pastorino. ${it ? "Tutti i diritti riservati." : "All rights reserved."}</small></div></footer>`;
}

function render(page) {
  const sections = page.sections.map(([number, title, content]) => `<section class="legal-section"><div class="legal-section-label"><span>${number}</span><strong>${escape(title)}</strong></div><div class="legal-section-copy">${content.startsWith("<") ? content : `<p>${content}</p>`}</div></section>`).join("");
  const schema = { "@context": "https://schema.org", "@type": "WebPage", name: page.title, url: `${origin}${page.route}`, description: page.description, inLanguage: page.locale, dateModified: updatedIso, author: { "@type": "Person", name: "Paolo Pastorino" }, isPartOf: { "@type": "WebSite", name: "London Advanced", url: `${origin}/` } };
  return `<!doctype html><html lang="${page.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)} | London Advanced</title><meta name="description" content="${escape(page.description)}"><meta name="author" content="Paolo Pastorino"><meta name="robots" content="index,follow"><link rel="canonical" href="${origin}${page.route}">${alternateLinks(page)}<meta property="og:type" content="website"><meta property="og:site_name" content="London Advanced"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${origin}${page.route}"><meta property="og:image" content="${origin}/assets/london-map.jpg"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Caslon+Display&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css?v=20261020-2"><link rel="stylesheet" href="/legal.css"><script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script></head><body class="legal-page">${navigation(page)}<main><header class="legal-hero"><span class="eyebrow">${escape(page.eyebrow)}</span><h1>${escape(page.heading)}</h1><p>${escape(page.intro)}</p><small>${escape(page.updated)}</small></header><div class="legal-content">${sections}</div><aside class="legal-note"><strong>${page.locale === "it-IT" ? "Una nota pratica" : "A practical note"}</strong><p>${page.locale === "it-IT" ? "Queste pagine descrivono il funzionamento attuale del sito e possono essere aggiornate quando cambiano servizi o obblighi. Per richieste specifiche usa il modulo di contatto." : "These pages describe how the site currently works and may be updated when services or duties change. Use the contact form for a specific request."}</p></aside></main>${footer(page)}<script src="/legal.js" defer></script></body></html>`;
}

export async function buildLegalPages() {
  const outputs = [
    ["privacy/index.html", render(pages.privacyEn)],
    ["it/privacy/index.html", render(pages.privacyIt)],
    ["copyright/index.html", render(pages.copyrightEn)],
    ["it/copyright/index.html", render(pages.copyrightIt)]
  ];
  for (const [relative, html] of outputs) {
    const target = path.join(dist, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, "utf8");
  }
  await Promise.all([
    copyFile(path.join(root, "legal.css"), path.join(dist, "legal.css")),
    copyFile(path.join(root, "legal.js"), path.join(dist, "legal.js"))
  ]);
  console.log("Built four bilingual privacy and copyright pages.");
}

const directRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (directRun) await buildLegalPages();
