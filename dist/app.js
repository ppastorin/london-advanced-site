const DATA = window.LONDON_ADVANCED;

const icons = {
  pulse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>',
  crowd: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15c3.8-.8 6.1 1 6.8 4.5"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5V5h16v2.5a3 3 0 0 0 0 6V16H4v-2.5a3 3 0 0 0 0-6Z"/><path d="M12 6.5v8"/></svg>',
  route: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></svg>'
};

function icon(name) {
  return `<span class="app-icon">${icons[name]}</span>`;
}

const visualMotifs = {
  pulse: `<div class="signal-chart" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="visual-chip">LIVE</span>`,
  crowd: `<div class="crowd-field" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="visual-chip">NOW +3H</span>`,
  ticket: `<div class="ticket-graphic" aria-hidden="true"><span>ZONE 1–6</span><b>£</b><small>FARE CHECK</small></div>`,
  route: `<svg class="route-map" viewBox="0 0 220 100" aria-hidden="true"><path d="M12 77c28 0 28-49 58-49s26 51 57 51 31-55 78-55"/><circle cx="12" cy="77" r="6"/><circle cx="205" cy="24" r="6"/></svg><span class="route-label route-a">A</span><span class="route-label route-b">B</span>`,
  spark: `<div class="mood-orbit" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span class="mood-word mood-one">QUIET</span><span class="mood-word mood-two">CURIOUS</span>`
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
        <span class="app-action">Open tool <b aria-hidden="true">→</b></span>
      </div>
    </a>`).join("");
}

function storyCards() {
  return DATA.stories.map(story => `
    <article class="story-card">
      <span>${story.category}</span>
      <h3>${story.title}</h3>
      <p>${story.text}</p>
      <a href="${DATA.links.guideStore}" target="_blank" rel="noopener" data-track="story:${story.title}">Find it in the guide <b aria-hidden="true">→</b></a>
    </article>`).join("");
}

function socialLinks() {
  return `<div class="social-links">
    <a href="${DATA.links.facebook}" target="_blank" rel="noopener" data-track="social:facebook">Facebook group ↗</a>
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
      <span>Join the discussion</span>
      <strong>Facebook group ↗</strong>
    </a>
    <a href="${DATA.links.instagram}" target="_blank" rel="noopener" data-track="social:menu-instagram">
      <span>Follow the photography</span>
      <strong>Instagram ↗</strong>
    </a>`;
}

function mobileMenuContent() {
  return `
    <p class="mobile-menu-heading">Tools</p>
    ${toolMenuLinks()}
    <p class="mobile-menu-heading">Explore</p>
    <a href="${DATA.links.guideStore}" target="_blank" rel="noopener noreferrer" data-track="guide:mobile-menu">
      <span>The Other London</span>
      <strong>Guide ↗</strong>
    </a>
    <button class="mobile-section-link" type="button" data-scroll-target="events" data-events-nav hidden>
      <span>Three featured selections</span>
      <strong>Highlights</strong>
    </button>
    <a class="mobile-section-link" href="/events/" data-events-nav hidden>
      <span>The complete weekend edit</span>
      <strong>All events</strong>
    </a>
    <button class="mobile-section-link" type="button" data-scroll-target="journal">
      <span>Places and ideas</span>
      <strong>Journal</strong>
    </button>
    <p class="mobile-menu-heading">Community</p>
    ${communityMenuLinks()}`;
}

function eventsSection() {
  return `
    <section id="events" class="events-section section-wrap" hidden>
      <div class="section-heading horizontal events-heading">
        <div><span>02 / Twice-weekly edit</span><h2>THIS WEEK,<br><em>BEYOND THE OBVIOUS</em></h2></div>
        <p>Three free or unusually good-value London events, selected for access, local character and a story worth following.</p>
      </div>
      <div class="events-grid" data-events-feed aria-live="polite"></div>
      <div class="events-footer">
        <span data-events-updated>Updated Sunday and Thursday</span>
        <div class="events-footer-links">
          <a class="events-all-link" href="/events/" data-events-all data-track="events:all">See the complete edit <span aria-hidden="true">→</span></a>
          <a href="${DATA.links.facebook}" target="_blank" rel="noopener" data-track="events:facebook">Discuss in the Facebook group →</a>
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

function formatEventDate(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London"
  });
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London"
  });
  const dayKey = value => new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/London"
  }).format(value);
  if (dayKey(start) === dayKey(end)) return `${date.format(start)} · ${time.format(start)}–${time.format(end)}`;
  return `${date.format(start)} – ${date.format(end)}`;
}

function bookingLabel(booking) {
  if (booking.required) return "Booking required";
  if (booking.status === "recommended") return "Booking recommended";
  return "Drop in";
}

function renderEventCard(event, index) {
  const officialUrl = safeHttpsUrl(event.official_url);
  if (!officialUrl) return "";
  const bookingUrl = safeHttpsUrl(event.booking?.url);
  const actionUrl = bookingUrl || officialUrl;
  return `
    <article class="event-card">
      <div class="event-card-top">
        <span class="event-index">0${index + 1}</span>
        <span class="event-price">${escapeHtml(event.price.display)}</span>
      </div>
      <p class="event-date">${escapeHtml(formatEventDate(event))}</p>
      <h3>${escapeHtml(event.title_en)}</h3>
      <p class="event-summary">${escapeHtml(event.summary_en)}</p>
      <dl class="event-details">
        <div><dt>Where</dt><dd>${escapeHtml(event.venue.name)}, ${escapeHtml(event.venue.borough)}</dd></div>
        <div><dt>Access</dt><dd>${escapeHtml(bookingLabel(event.booking))}</dd></div>
      </dl>
      <a class="event-action" href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener" data-track="event:${escapeHtml(event.id)}">Check details <span aria-hidden="true">↗</span></a>
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
  const section = document.querySelector("#events");
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
    if (!events.length) return;
    feed.innerHTML = events.map(renderEventCard).join("");
    const updated = new Date(data.generated_at);
    section.querySelector("[data-events-updated]").textContent = `Last edited ${new Intl.DateTimeFormat("en-GB", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London"
    }).format(updated)} · London time`;
    const allLink = section.querySelector("[data-events-all]");
    const activeCount = data.events.filter(event =>
      event.publication_status === "approved" &&
      Date.parse(event.publish_at) <= previewTime.getTime() &&
      Date.parse(event.expire_at) > previewTime.getTime()
    ).length;
    allLink.innerHTML = `See all ${activeCount} weekend pick${activeCount === 1 ? "" : "s"} <span aria-hidden="true">→</span>`;
    if (demoRequested && (localPreview || cloudflarePreview)) allLink.href = "/events/?events-demo=1";
    section.hidden = false;
    document.querySelectorAll("[data-events-nav]").forEach(control => { control.hidden = false; });
    bindTracking(feed);
  } catch (error) {
    console.warn("London Advanced events feed is unavailable.", error);
  }
}

function render() {
  document.querySelector("#site").innerHTML = `<main id="top">
    <header class="site-nav">
      <div class="wordmark" aria-label="London Advanced">
        <svg class="brand-mark" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15.5"/>
          <path class="brand-needle" d="m23.7 10.3-3.2 10.2-10.2 3.2 3.2-10.2 10.2-3.2Z"/>
          <circle class="brand-centre" cx="18" cy="18" r="2.2"/>
        </svg>
        <span class="brand-name">London Advanced</span>
      </div>
      <nav class="desktop-nav" aria-label="Main navigation">
        <details class="nav-dropdown tools-menu">
          <summary>Tools</summary>
          <div class="nav-menu-panel tools-menu-panel">${toolMenuLinks()}</div>
        </details>
        <a href="${DATA.links.guideStore}" target="_blank" rel="noopener" data-track="guide:menu">Guide</a>
        <button class="nav-section-button" type="button" data-scroll-target="events" data-events-nav hidden>Highlights</button>
        <a href="/events/" data-events-nav hidden>All events</a>
        <button class="nav-section-button" type="button" data-scroll-target="journal">Journal</button>
        <details class="nav-dropdown community-menu">
          <summary>Community</summary>
          <div class="nav-menu-panel community-menu-panel">${communityMenuLinks()}</div>
        </details>
      </nav>
      <details class="nav-dropdown mobile-menu">
        <summary aria-label="Open navigation menu"><span>Menu</span></summary>
        <div class="nav-menu-panel mobile-menu-panel">${mobileMenuContent()}</div>
      </details>
    </header>

    <section class="hero">
      <div class="hero-intro">
        <span class="eyebrow">Independent London guide · 5 free tools</span>
        <h1>The city beyond<br><em>the obvious.</em></h1>
        <p>Find unusual places, make smarter journeys and see what London feels like before you set out.</p>
        <div class="hero-actions"><button class="button primary" type="button" data-scroll-target="tools">Explore the tools</button><a class="text-link" href="${DATA.links.guide}" target="_blank" rel="noopener" data-track="guide:hero">Discover the guide →</a></div>
      </div>
      <figure class="map-window"><img src="assets/london-map.jpg" alt="Map of London showing places included in London Advanced"><figcaption><b>1,100+</b> places beyond the standard lists</figcaption></figure>
    </section>

    <section id="tools" class="tools section-wrap">
      <div class="section-heading tool-heading"><div><span>01 / Practical London</span><h2>Choose what you need now.</h2></div><p>Five focused tools. No account, no app download and no generic recommendations.</p></div>
      <div class="app-grid">${appCards()}</div>
    </section>

    ${eventsSection()}

    <section id="guide" class="guide-split section-wrap">
      <div class="guide-cover-wrap"><img src="assets/guide-cover.jpg" alt="Cover of The Other London guide"><span>124 pages</span></div>
      <div class="guide-copy"><span class="eyebrow">The Other London</span><h2>A field guide for people who would rather look twice.</h2><p>Handpicked places, practical details, original photography and map links—designed to help you find the London that standard guides miss.</p><div class="hero-actions"><a class="button dark" href="${DATA.links.guide}" target="_blank" rel="noopener" data-track="guide:buy">Buy the full guide</a><a class="text-link" href="${DATA.links.guideStore}" target="_blank" rel="noopener" data-track="guide:sample">See the free sample →</a></div></div>
    </section>

    <section id="journal" class="journal section-wrap">
      <div class="section-heading horizontal"><div><span>03 / Field notes</span><h2>Three places to start.</h2></div><p>Unusual corners, quiet routes and overlooked details selected from The Other London.</p></div>
      <div class="story-grid">${storyCards()}</div>
    </section>

    <section class="community-band"><p>London is better when knowledge is shared.</p>${socialLinks()}</section>

    <footer id="community">
      <div><strong>London Advanced</strong><span>Independent tools and field notes for a less obvious London.</span></div>
      ${socialLinks()}
      <small>© ${new Date().getFullYear()} Paolo Pastorino</small>
    </footer>
  </main>`;
  bindSectionScrolling();
  bindDropdownMenus();
  bindTracking();
  loadEvents();
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
initAnalytics();
