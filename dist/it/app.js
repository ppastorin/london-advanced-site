const DATA = window.LONDON_ADVANCED;

const icons = {
  pulse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>',
  crowd: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15c3.8-.8 6.1 1 6.8 4.5"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5V5h16v2.5a3 3 0 0 0 0 6V16H4v-2.5a3 3 0 0 0 0-6Z"/><path d="M12 6.5v8"/></svg>',
  route: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></svg>',
  loo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8M9 4v5a3 3 0 0 0 6 0V4M7 20h10M9 13v7M15 13v7"/><circle cx="12" cy="9" r="5"/></svg>'
};

function icon(name) {
  return `<span class="app-icon">${icons[name]}</span>`;
}

const visualMotifs = {
  pulse: `<div class="signal-chart" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="visual-chip">LIVE</span>`,
  crowd: `<div class="crowd-field" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="visual-chip">NOW +3H</span>`,
  ticket: `<div class="ticket-graphic" aria-hidden="true"><span>ZONE 1–6</span><b>£</b><small>FARE CHECK</small></div>`,
  route: `<svg class="route-map" viewBox="0 0 220 100" aria-hidden="true"><path d="M12 77c28 0 28-49 58-49s26 51 57 51 31-55 78-55"/><circle cx="12" cy="77" r="6"/><circle cx="205" cy="24" r="6"/></svg><span class="route-label route-a">A</span><span class="route-label route-b">B</span>`,
  spark: `<div class="mood-orbit" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span class="mood-word mood-one">QUIET</span><span class="mood-word mood-two">CURIOUS</span>`,
  loo: `<svg class="loo-route-graphic" viewBox="0 0 184 88" aria-hidden="true"><path class="loo-route-line" d="M10 70C34 64 35 39 59 39s29 28 54 21 16-10 27-12"/><circle class="loo-route-start" cx="10" cy="70" r="5"/><path class="loo-route-pin" d="M151 12c-12.2 0-22 9.8-22 22 0 16.5 22 38 22 38s22-21.5 22-38c0-12.2-9.8-22-22-22Z"/><circle class="loo-route-core" cx="151" cy="34" r="7"/></svg>`
};

function appCards() {
  return DATA.apps.map((app, index) => `
    <a class="app-card app-${index + 1}" href="${app.href}" data-track="app:${app.name}">
      <div class="app-visual visual-${app.icon}">
        ${icon(app.icon)}
        <span class="app-number">0${index + 1}</span>
        ${visualMotifs[app.icon]}
      </div>
      <div class="app-copy">
        <span class="app-short">${app.short}</span>
        <h3>${app.name}</h3>
        <p>${app.description}</p>
        <span class="app-action">Apri strumento <b aria-hidden="true">→</b></span>
      </div>
    </a>`).join("");
}

function storyCards() {
  return DATA.stories.map(story => `
    <article class="story-card">
      <span>${story.category}</span>
      <h3>${story.title}</h3>
      <p>${story.text}</p>
      <a href="${DATA.links.guideStore}" target="_blank" rel="noopener" data-track="story:${story.title}">Scoprilo nella guida <b aria-hidden="true">→</b></a>
    </article>`).join("");
}

function socialLinks() {
  return `<div class="social-links">
    <a href="${DATA.links.facebook}" target="_blank" rel="noopener" data-track="social:facebook">Gruppo Facebook ↗</a>
    <a href="${DATA.links.instagram}" target="_blank" rel="noopener" data-track="social:instagram">Instagram ↗</a>
  </div>`;
}

function toolMenuLinks() {
  return DATA.apps.map(app => `
    <a href="${app.href}" data-track="app-menu:${app.name}">
      <span>${app.short}</span>
      <strong>${app.name}</strong>
    </a>`).join("");
}

function communityMenuLinks() {
  return `
    <a href="${DATA.links.facebook}" target="_blank" rel="noopener" data-track="social:menu-facebook">
      <span>Partecipa alla conversazione</span>
      <strong>Gruppo Facebook ↗</strong>
    </a>
    <a href="${DATA.links.instagram}" target="_blank" rel="noopener" data-track="social:menu-instagram">
      <span>Segui le fotografie</span>
      <strong>Instagram ↗</strong>
    </a>`;
}

function projectMenuLinks() {
  return `<a href="/it/chi-sono/" data-track="project:about">
      <span>La persona e lo scopo</span>
      <strong>Chi sono</strong>
    </a>
    <a href="/it/metodologia/" data-track="project:methodology">
      <span>Fonti, decisioni e limiti</span>
      <strong>Metodologia</strong>
    </a>`;
}

function mobileMenuContent() {
  return `
    <p class="mobile-menu-heading">Strumenti</p>
    ${toolMenuLinks()}
    <p class="mobile-menu-heading">Esplora</p>
    <a href="${DATA.links.guideStore}" target="_blank" rel="noopener noreferrer" data-track="guide:mobile-menu">
      <span>The Other London</span>
      <strong>Guide ↗</strong>
    </a>
    <details class="mobile-week-menu" data-events-nav hidden>
      <summary><span>Selezione del weekend</span><strong>Questa settimana</strong></summary>
      <div>
        <a href="#eventi" data-track="events:mobile-highlights">
          <span>Tre proposte in evidenza</span>
          <strong>Highlights</strong>
        </a>
        <a href="/it/eventi/" data-track="events:mobile-all">
          <span>La selezione completa</span>
          <strong>Tutti gli eventi</strong>
        </a>
      </div>
    </details>
    <button class="mobile-section-link" type="button" data-scroll-target="journal">
      <span>Luoghi e idee</span>
      <strong>Journal</strong>
    </button>
    <a href="/it/#newsletter" data-track="newsletter:mobile-menu">
      <span>Londra utile, ogni tanto</span>
      <strong>Newsletter</strong>
    </a>
    <button class="mobile-section-link" type="button" data-scroll-target="contatti">
      <span>Domande e suggerimenti</span>
      <strong>Contatti</strong>
    </button>
    <p class="mobile-menu-heading">Il Progetto</p>
    ${projectMenuLinks()}
    <p class="mobile-menu-heading">Social</p>
    ${communityMenuLinks()}`;
}

function eventsSection() {
  return `
    <section id="eventi" class="events-section section-wrap" hidden>
      <div class="section-heading horizontal events-heading">
        <div><span>02 / Selezione bisettimanale</span><h2>QUESTA SETTIMANA,<br><em>OLTRE L’OVVIO</em></h2></div>
        <p>Tre eventi gratuiti o dal valore insolito, scelti per accessibilità, carattere locale e una storia che merita di essere seguita.</p>
      </div>
      <div class="events-grid" data-events-feed aria-live="polite"></div>
      <div class="events-footer">
        <span data-events-updated>Aggiornato domenica e giovedì</span>
        <div class="events-footer-links">
          <a class="events-all-link" href="/it/eventi/" data-events-all data-track="events:all">Vedi la selezione completa <span aria-hidden="true">→</span></a>
          <a href="${DATA.links.facebook}" target="_blank" rel="noopener" data-track="events:facebook">Discuss in the Gruppo Facebook →</a>
        </div>
      </div>
    </section>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function safeTicketmasterAffiliateUrl(value) {
  const safeUrl = safeHttpsUrl(value);
  if (!safeUrl) return null;
  const url = new URL(safeUrl);
  if (url.hostname !== "ticketmaster.evyy.net" || url.pathname !== "/c/7729619/1965662/24023") return null;
  const destination = safeHttpsUrl(url.searchParams.get("u"));
  if (!destination) return null;
  const destinationHost = new URL(destination).hostname;
  return ["ticketmaster.co.uk", "www.ticketmaster.co.uk"].includes(destinationHost) ? safeUrl : null;
}

function formatEventDate(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const date = new Intl.DateTimeFormat("it-IT", {
    weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London"
  });
  const time = new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London"
  });
  const dayKey = value => new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/London"
  }).format(value);
  if (dayKey(start) === dayKey(end)) return `${date.format(start)} · ${time.format(start)}–${time.format(end)}`;
  return `${date.format(start)} – ${date.format(end)}`;
}

function bookingLabel(booking) {
  if (booking.required) return "Prenotazione obbligatoria";
  if (booking.status === "recommended") return "Prenotazione consigliata";
  return "Ingresso libero";
}

function renderEventCard(event, index) {
  const officialUrl = safeHttpsUrl(event.official_url);
  if (!officialUrl) return "";
  const bookingUrl = safeHttpsUrl(event.booking?.url);
  const affiliateUrl = safeTicketmasterAffiliateUrl(event.booking?.affiliate_url);
  const actionUrl = affiliateUrl || bookingUrl || officialUrl;
  const actionLabel = affiliateUrl ? "Pubblicità · Prenota su Ticketmaster" : "Controlla i dettagli";
  const actionRel = affiliateUrl ? "sponsored noopener noreferrer" : "noopener noreferrer";
  const affiliateNote = affiliateUrl
    ? '<p class="affiliate-note">Potremmo ricevere una commissione senza costi aggiuntivi per te.</p>'
    : "";
  return `
    <article class="event-card">
      <div class="event-card-top">
        <span class="event-index">0${index + 1}</span>
        <span class="event-price">${escapeHtml(event.price.display)}</span>
      </div>
      <p class="event-date">${escapeHtml(formatEventDate(event))}</p>
      <h3>${escapeHtml(event.title_it)}</h3>
      <p class="event-summary">${escapeHtml(event.summary_it)}</p>
      <dl class="event-details">
        <div><dt>Dove</dt><dd>${escapeHtml(event.venue.name)}, ${escapeHtml(event.venue.borough)}</dd></div>
        <div><dt>Accesso</dt><dd>${escapeHtml(bookingLabel(event.booking))}</dd></div>
      </dl>
      <div class="event-action-group">
        <a class="event-action" href="${escapeHtml(actionUrl)}" target="_blank" rel="${actionRel}" data-track="event:${escapeHtml(event.id)}">${actionLabel} <span aria-hidden="true">↗</span></a>
        ${affiliateNote}
      </div>
    </article>`;
}

function activeDigest(data, now = new Date()) {
  if (!data || data.schema_version !== "1.1" || !Array.isArray(data.events) || !Array.isArray(data.homepage_event_ids)) return [];
  const londonDate = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/London"
  }).format(now);
  if (londonDate < data.valid_from || londonDate > data.valid_until) return [];
  const activeEvents = data.events.filter(event =>
    event.publication_status === "approved" &&
    Number.isInteger(event.advanced?.score) && event.advanced.score >= 7 &&
    Date.parse(event.publish_at) <= now.getTime() &&
    Date.parse(event.expire_at) > now.getTime()
  );
  const byId = new Map(activeEvents.map(event => [event.id, event]));
  return data.homepage_event_ids.map(id => byId.get(id)).filter(Boolean).slice(0, 3);
}

async function loadEvents() {
  const section = document.querySelector("#eventi");
  const feed = section?.querySelector("[data-events-feed]");
  if (!section || !feed) return;
  try {
    const response = await fetch("/data/events.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Events feed returned ${response.status}`);
    const data = await response.json();
    const hostname = window.location.hostname;
    const localPreview = ["localhost", "127.0.0.1"].includes(hostname);
    const cloudflarePreview = hostname.endsWith(".workers.dev") &&
      hostname.includes("-london-advanced-site.") &&
      hostname !== "london-advanced-site.ppastorin.workers.dev";
    const demoRequested = new URLSearchParams(window.location.search).get("events-demo") === "1";
    const previewTime = demoRequested && (localPreview || cloudflarePreview)
      ? new Date(`${data.valid_from}T12:00:00Z`)
      : new Date();
    const events = activeDigest(data, previewTime);
    if (!events.length) {
      feed.innerHTML = "";
      section.hidden = true;
      document.querySelectorAll("[data-events-nav]").forEach(control => { control.hidden = true; });
      return;
    }
    feed.innerHTML = events.map(renderEventCard).join("");
    const updated = new Date(data.generated_at);
    section.querySelector("[data-events-updated]").textContent = `Ultimo aggiornamento ${new Intl.DateTimeFormat("it-IT", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London"
    }).format(updated)} · ora di Londra`;
    const allLink = section.querySelector("[data-events-all]");
    const activeCount = data.events.filter(event =>
      event.publication_status === "approved" &&
      Date.parse(event.publish_at) <= previewTime.getTime() &&
      Date.parse(event.expire_at) > previewTime.getTime()
    ).length;
    allLink.innerHTML = `Vedi tutte le ${activeCount} proposte del weekend${activeCount === 1 ? "" : "s"} <span aria-hidden="true">→</span>`;
    if (demoRequested && (localPreview || cloudflarePreview)) allLink.href = "/it/eventi/?events-demo=1";
    section.hidden = false;
    document.querySelectorAll("[data-events-nav]").forEach(control => { control.hidden = false; });
    bindTracking(feed);
  } catch (error) {
    console.warn("London Advanced events feed is unavailable.", error);
  }
}

function render() {
  const site = document.querySelector("#site");
  if (!site) return;
  if (!site.innerHTML.trim()) site.innerHTML = `<main id="top">
    <header class="site-nav">
      <a class="wordmark" href="#top" aria-label="London Advanced home — back to top">
        <svg class="brand-mark" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15.5"/>
          <path class="brand-needle" d="m23.7 10.3-3.2 10.2-10.2 3.2 3.2-10.2 10.2-3.2Z"/>
          <circle class="brand-centre" cx="18" cy="18" r="2.2"/>
        </svg>
        <span class="brand-name">London Advanced</span>
      </a>
      <nav class="desktop-nav" aria-label="Main navigation">
        <details class="nav-dropdown tools-menu">
          <summary>Strumenti</summary>
          <div class="nav-menu-panel tools-menu-panel">${toolMenuLinks()}</div>
        </details>
        <a href="${DATA.links.guideStore}" target="_blank" rel="noopener" data-track="guide:menu">Guida</a>
        <details class="nav-dropdown week-menu" data-events-nav hidden>
          <summary>Questa settimana</summary>
          <div class="nav-menu-panel week-menu-panel">
            <a href="#eventi" data-track="events:menu-highlights">
              <span>Tre proposte in evidenza</span>
              <strong>Highlights</strong>
            </a>
            <a href="/it/eventi/" data-track="events:menu-all">
              <span>La selezione completa</span>
              <strong>Tutti gli eventi</strong>
            </a>
          </div>
        </details>
        <button class="nav-section-button" type="button" data-scroll-target="journal">Journal</button>
        <a class="newsletter-nav" href="/it/#newsletter" data-track="newsletter:menu">Newsletter</a>
        <button class="nav-section-button contact-nav" type="button" data-scroll-target="contatti">Contatti</button>
        <details class="nav-dropdown project-menu">
          <summary>Il Progetto</summary>
          <div class="nav-menu-panel project-menu-panel">${projectMenuLinks()}</div>
        </details>
        <details class="nav-dropdown community-menu">
          <summary>Social</summary>
          <div class="nav-menu-panel community-menu-panel">${communityMenuLinks()}</div>
        </details>
        <a class="language-switch" href="${DATA.links.home === '/it/' ? '/' : '/it/'}" lang="${DATA.links.home === '/it/' ? 'en' : 'it'}" hreflang="${DATA.links.home === '/it/' ? 'en-GB' : 'it-IT'}" aria-label="${DATA.links.home === '/it/' ? 'Passa alla versione inglese' : 'Switch to the Italian version'}"><span aria-hidden="true">🌐</span>${DATA.links.home === '/it/' ? 'English' : 'Italiano'}</a>
      </nav>
      <a class="mobile-language-switch" href="${DATA.links.home === '/it/' ? '/' : '/it/'}" lang="${DATA.links.home === '/it/' ? 'en' : 'it'}" hreflang="${DATA.links.home === '/it/' ? 'en-GB' : 'it-IT'}" aria-label="${DATA.links.home === '/it/' ? 'Passa alla versione inglese' : 'Switch to the Italian version'}"><span aria-hidden="true">🌐</span>${DATA.links.home === '/it/' ? 'English' : 'Italiano'}</a>
      <details class="nav-dropdown mobile-menu">
        <summary aria-label="Open navigation menu"><span>Menu</span></summary>
        <div class="nav-menu-panel mobile-menu-panel">${mobileMenuContent()}</div>
      </details>
    </header>

    <section class="hero">
      <div class="hero-intro">
        <span class="eyebrow">Guida indipendente di Londra · 6 strumenti gratuiti</span>
        <h1>La città oltre<br><em>l’ovvio.</em></h1>
        <p>Trova luoghi insoliti, organizza spostamenti più intelligenti e scopri l’atmosfera di Londra prima di partire.</p>
        <div class="hero-actions"><button class="button primary" type="button" data-scroll-target="tools">Esplora gli strumenti</button><a class="text-link" href="${DATA.links.guide}" target="_blank" rel="noopener" data-track="guide:hero">Scopri la guida →</a></div>
      </div>
      <figure class="map-window"><img src="/assets/london-map.jpg" alt="Mappa di Londra con i luoghi inclusi in London Advanced"><figcaption><b>1,100+</b> luoghi oltre le solite liste</figcaption></figure>
    </section>

    <section id="tools" class="tools section-wrap">
      <div class="section-heading tool-heading"><div><span>01 / Londra pratica</span><h2>Scegli ciò che ti serve adesso.</h2></div><p>Sei strumenti mirati. Nessun account, nessuna app da scaricare e nessun consiglio generico.</p></div>
      <div class="app-grid">${appCards()}</div>
    </section>

    ${eventsSection()}

    <section id="guide" class="guide-split section-wrap">
      <div class="guide-cover-wrap"><img src="/assets/guide-cover.jpg" alt="Cover of The Other London guide"><span>124 pages</span></div>
      <div class="guide-copy"><span class="eyebrow">The Other London</span><h2>Una guida sul campo per chi preferisce guardare due volte.</h2><p>Luoghi selezionati, dettagli pratici, fotografie originali e mappe per trovare la Londra che le guide standard trascurano.</p><div class="hero-actions"><a class="button dark" href="${DATA.links.guide}" target="_blank" rel="noopener" data-track="guide:buy">Acquista la guida completa</a><a class="text-link" href="${DATA.links.guideStore}" target="_blank" rel="noopener" data-track="guide:sample">Guarda l’anteprima gratuita →</a></div></div>
    </section>

    <section id="journal" class="journal section-wrap">
      <div class="section-heading horizontal"><div><span>03 / Appunti sul campo</span><h2>Tre luoghi da cui iniziare.</h2></div><p>Angoli insoliti, percorsi tranquilli e dettagli trascurati scelti da The Other London.</p></div>
      <div class="story-grid">${storyCards()}</div>
    </section>

    <section id="newsletter" class="newsletter-section section-wrap">
      <div class="newsletter-copy">
        <span class="eyebrow">04 / La lettera da Londra</span>
        <h2>Londra utile, solo quando vale la pena scrivere.</h2>
        <p>Non esiste una quota settimanale. Invio una nota occasionale e curata quando ho luoghi, percorsi o eventi davvero utili da condividere: mai più di due o tre volte al mese.</p>
        <div class="newsletter-promises" aria-label="Newsletter promise">
          <p><strong>Niente spam</strong><span>Niente riempitivi e nessun calendario che intasa la posta.</span></p>
          <p><strong>Curata davvero</strong><span>Selezionata, verificata e scritta da Paolo.</span></p>
          <p><strong>Utile per scelta</strong><span>Luoghi, percorsi ed eventi che meritano un’azione.</span></p>
        </div>
      </div>
      <form class="newsletter-form" action="/api/subscribe" method="POST" data-newsletter-form>
        <input type="hidden" name="started_at" value="">
        <input type="hidden" name="source" value="homepage">
        <label class="contact-honeypot" aria-hidden="true">Leave this field empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>
        <label>Indirizzo email<input type="email" name="email" autocomplete="email" inputmode="email" maxlength="254" placeholder="you@example.com" required></label>
        <button class="button dark" type="submit">Iscriviti alla newsletter</button>
        <p class="newsletter-consent">By subscribing, you agree to receive occasional emails from London Advanced. Niente spam. Unsubscribe at any time.</p>
        <p class="newsletter-error" data-newsletter-error hidden role="alert">Subscription is temporarily unavailable. Please try again.</p>
      </form>
    </section>

    <section id="contatti" class="contact-section section-wrap">
      <div class="contact-intro">
        <span class="eyebrow">05 / Contatti</span>
        <h2>Hai visto qualcosa che vale la pena condividere?</h2>
        <p>Invia una domanda, una correzione o un suggerimento su Londra. Leggo ogni messaggio autentico.</p>
      </div>
      <form class="contact-form" action="/api/contact" method="POST" data-contact-form>
        <input type="hidden" name="started_at" value="">
        <label class="contact-honeypot" aria-hidden="true">Leave this field empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>
        <div class="contact-fields">
          <label>Nome<input type="text" name="name" autocomplete="name" minlength="2" maxlength="100" required></label>
          <label>Email<input type="email" name="email" autocomplete="email" maxlength="254" required></label>
        </div>
        <label>Messaggio<textarea name="message" rows="6" minlength="10" maxlength="5000" required></textarea></label>
        <div class="contact-submit">
          <button class="button dark" type="submit">Invia messaggio</button>
          <p>Protetto da controlli antispam invisibili. Nessun CAPTCHA.</p>
        </div>
        <p class="contact-error" data-contact-error hidden role="alert">The message could not be sent. Please check the form and try again.</p>
      </form>
    </section>

    <section class="community-band"><p>Londra è migliore quando la conoscenza viene condivisa.</p>${socialLinks()}</section>

    <footer id="community">
      <div><strong>London Advanced</strong><span>Strumenti indipendenti e appunti sul campo per una Londra meno ovvia.</span></div>
      <div class="footer-meta"><a href="/it/eventi/">Questa settimana</a><a href="/it/#newsletter">Newsletter</a><a href="/it/chi-sono/">Chi sono</a><a href="/it/metodologia/">Metodologia</a><a href="#contact">Contatti</a><small>© ${new Date().getFullYear()} Paolo Pastorino</small></div>
    </footer>
  </main>`;
  bindSectionScrolling();
  bindDropdownMenus();
  bindTracking();
  bindContactForm();
  showContactStatus();
  loadEvents();
}

function bindContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const startedAt = form?.querySelector('[name="started_at"]');
  if (startedAt) startedAt.value = String(Date.now());

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    const errorMessage = form.querySelector("[data-contact-error]");
    const originalLabel = submitButton?.textContent;

    if (errorMessage) errorMessage.hidden = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending…";
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.code || "delivery_failed");
      window.location.assign("/thank-you/");
    } catch (error) {
      if (errorMessage) {
        errorMessage.textContent = error.message === "please_wait"
          ? "Please wait a minute before sending another message."
          : "The message could not be sent. Your text has been kept, so you can try again.";
        errorMessage.hidden = false;
      }
      if (startedAt) startedAt.value = String(Date.now());
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
}

function showContactStatus() {
  if (new URLSearchParams(window.location.search).get("contact") !== "error") return;
  const message = document.querySelector("[data-contact-error]");
  if (message) message.hidden = false;
}

function bindNewsletterForms() {
  document.querySelectorAll("[data-newsletter-form]").forEach(form => {
    const startedAt = form.querySelector('[name="started_at"]');
    if (startedAt) startedAt.value = String(Date.now());

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const submitButton = form.querySelector('[type="submit"]');
      const errorMessage = form.querySelector("[data-newsletter-error]");
      const originalLabel = submitButton?.textContent;

      if (errorMessage) errorMessage.hidden = true;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Joining…";
      }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form)
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.code || "subscription_failed");
        window.location.assign("/it/#newsletterthanks/");
      } catch (error) {
        if (errorMessage) {
          errorMessage.textContent = error.message === "please_wait"
            ? "Please wait a minute before trying again."
            : error.message === "invalid_email"
              ? "Enter a valid email address."
              : "Subscription is temporarily unavailable. Please try again.";
          errorMessage.hidden = false;
        }
        if (startedAt) startedAt.value = String(Date.now());
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
    });
  });
}

function showNewsletterStatus() {
  if (new URLSearchParams(window.location.search).get("subscribe") !== "error") return;
  const message = document.querySelector("[data-newsletter-error]");
  if (message) message.hidden = false;
}

function bindSectionScrolling() {
  document.querySelectorAll("[data-scroll-target]").forEach(button => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth" });
      button.closest("details")?.removeAttribute("open");
    });
  });
}

function bindDropdownMenus() {
  const menus = [...document.querySelectorAll(".nav-dropdown")];
  if (!menus.length) return;
  menus.forEach(menu => {
    menu.addEventListener("toggle", () => {
      if (menu.open) menus.filter(other => other !== menu).forEach(other => other.removeAttribute("open"));
    });
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => menu.removeAttribute("open")));
  });
  document.addEventListener("click", event => {
    menus.forEach(menu => {
      if (!menu.contains(event.target)) menu.removeAttribute("open");
    });
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") menus.forEach(menu => menu.removeAttribute("open"));
  });
}

function loadGoogleAnalytics(id) {
  if (!id || id.includes("XXXX")) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
 window.gtag("config", id, {
  anonymize_ip: true,
  send_page_view: false
});
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

function initAnalytics() {
  const cfToken = DATA.analytics.cloudflareBeaconToken;
  if (cfToken && !cfToken.includes("REPLACE")) {
    const beacon = document.createElement("script");
    beacon.defer = true;
    beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
    beacon.dataset.cfBeacon = JSON.stringify({ token: cfToken });
    document.head.appendChild(beacon);
  }
  const gaId = DATA.analytics.googleAnalyticsId;
  if (!gaId || gaId.includes("XXXX")) return;
  if (localStorage.getItem("la-analytics-consent") === "yes") {
    loadGoogleAnalytics(gaId);
    return;
  }
  if (localStorage.getItem("la-analytics-consent") === "no") return;
  const consent = document.createElement("div");
  consent.className = "consent";
  consent.innerHTML = `<p><strong>Help improve London Advanced?</strong><span>Allow anonymous Google Analytics measurement. The site works without it.</span></p><div><button data-consent="no">No thanks</button><button data-consent="yes">Allow analytics</button></div>`;
  document.body.appendChild(consent);
  consent.querySelectorAll("[data-consent]").forEach(button => button.addEventListener("click", () => {
    const choice = button.dataset.consent;
    localStorage.setItem("la-analytics-consent", choice);
    consent.remove();
    if (choice === "yes") loadGoogleAnalytics(gaId);
  }));
}

function track(label) {
  if (typeof window.gtag === "function") {
    window.gtag("event", "select_content", { content_type: "link", item_id: label });
  }
}

function bindTracking(root = document) {
  root.querySelectorAll("[data-track]").forEach(link => link.addEventListener("click", () => track(link.dataset.track)));
}

render();
bindNewsletterForms();
showNewsletterStatus();
initAnalytics();
