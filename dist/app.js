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

function appCards() {
  return DATA.apps.map((app, index) => `
    <a class="app-card app-${index + 1}" href="${app.href}" target="_top" data-track="app:${app.name}">
      ${icon(app.icon)}
      <span class="app-number">0${index + 1}</span>
      <div>
        <span class="app-short">${app.short}</span>
        <h3>${app.name}</h3>
        <p>${app.description}</p>
      </div>
      <span class="arrow" aria-hidden="true">↗</span>
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

function render() {
  document.querySelector("#site").innerHTML = `<main id="top">
    <header class="site-nav">
      <a class="wordmark" href="#top" aria-label="London Advanced home">LA<span>•</span></a>
      <nav aria-label="Main navigation">
        <a href="#tools">Tools</a><a href="#guide">Guide</a><a href="#journal">Journal</a><a href="#community">Community</a>
      </nav>
      <a class="nav-cta" href="${DATA.links.guide}" target="_blank" rel="noopener" data-track="guide:nav">Get the guide</a>
    </header>

    <section class="hero">
      <div class="hero-intro">
        <span class="eyebrow">Independent London guide · 5 free tools</span>
        <h1>The city beyond<br><em>the obvious.</em></h1>
        <p>Find unusual places, make smarter journeys and see what London feels like before you set out.</p>
        <div class="hero-actions"><a class="button primary" href="#tools">Explore the tools</a><a class="text-link" href="${DATA.links.guide}" target="_blank" rel="noopener" data-track="guide:hero">Discover the guide →</a></div>
      </div>
      <figure class="map-window"><img src="assets/london-map.jpg" alt="Map of London showing places included in London Advanced"><figcaption><b>1,100+</b> places beyond the standard lists</figcaption></figure>
    </section>

    <section id="tools" class="tools section-wrap">
      <div class="section-heading"><span>01 / Practical London</span><h2>Choose what you need now.</h2><p>Five focused tools. No account, no app download and no generic recommendations.</p></div>
      <div class="app-grid">${appCards()}</div>
    </section>

    <section id="guide" class="guide-split section-wrap">
      <div class="guide-cover-wrap"><img src="assets/guide-cover.jpg" alt="Cover of The Other London guide"><span>124 pages</span></div>
      <div class="guide-copy"><span class="eyebrow">The Other London</span><h2>A field guide for people who would rather look twice.</h2><p>Handpicked places, practical details, original photography and map links—designed to help you find the London that standard guides miss.</p><div class="hero-actions"><a class="button dark" href="${DATA.links.guide}" target="_blank" rel="noopener" data-track="guide:buy">Buy the full guide</a><a class="text-link" href="${DATA.links.guideStore}" target="_blank" rel="noopener" data-track="guide:sample">See the free sample →</a></div></div>
    </section>

    <section id="journal" class="journal section-wrap">
      <div class="section-heading horizontal"><div><span>02 / Field notes</span><h2>Three places to start.</h2></div><p>Unusual corners, quiet routes and overlooked details selected from The Other London.</p></div>
      <div class="story-grid">${storyCards()}</div>
    </section>

    <section class="community-band"><p>London is better when knowledge is shared.</p>${socialLinks()}</section>

    <footer id="community">
      <div><strong>London Advanced</strong><span>Independent tools and field notes for a less obvious London.</span></div>
      ${socialLinks()}
      <small>© ${new Date().getFullYear()} Paolo Pastorino</small>
    </footer>
  </main>`;
  bindTracking();
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

function bindTracking() {
  document.querySelectorAll("[data-track]").forEach(link => link.addEventListener("click", () => track(link.dataset.track)));
}

render();
initAnalytics();
