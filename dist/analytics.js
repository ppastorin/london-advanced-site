(() => {
  const config = {"googleAnalyticsId":"G-3ZQEZ6R171","cloudflareBeaconToken":"354ac0e9140348778ef0ff51cf476480"};
  const id = config.googleAnalyticsId;
  const key = "la-analytics-consent";
  let loaded = false;

  function choice() {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function loadGoogle() {
    if (loaded || !id || id.includes("XXXX") || choice() !== "yes") return;
    loaded = true;
    window[`ga-disable-${id}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true, send_page_view: true });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }

  window.LAAnalytics = {
    event(name, context = {}) {
      if (choice() === "yes" && typeof window.gtag === "function" && /^[a-z][a-z0-9_]{0,39}$/.test(name)) {
        window.gtag("event", name, context);
      }
    },
    track(label, context = {}) {
      if (choice() === "yes" && typeof window.gtag === "function") {
        window.gtag("event", "select_content", { content_type: "link", item_id: label, ...context });
      }
    },
    revoke() {
      if (id) window[`ga-disable-${id}`] = true;
      try { localStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
    }
  };

  const cfToken = config.cloudflareBeaconToken;
  if (cfToken && !cfToken.includes("REPLACE")) {
    const beacon = document.createElement("script");
    beacon.defer = true;
    beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
    beacon.dataset.cfBeacon = JSON.stringify({ token: cfToken });
    document.head.appendChild(beacon);
  }

  if (choice() === "yes") { loadGoogle(); return; }
  if (choice() === "no" || !id || id.includes("XXXX")) return;
  const it = document.documentElement.lang.toLowerCase().startsWith("it");
  const consent = document.createElement("div");
  consent.className = "la-consent";
  consent.setAttribute("role", "region");
  consent.setAttribute("aria-label", it ? "Scelta sulle statistiche" : "Analytics choice");
  consent.innerHTML = it
    ? `<p><strong>Aiutaci a migliorare London Advanced</strong><span>Consenti Google Analytics. Il sito funziona anche senza. <a href="/it/privacy/">Dettagli sulla privacy</a>.</span></p><div><button type="button" data-consent="no">No, grazie</button><button type="button" data-consent="yes">Consenti</button></div>`
    : `<p><strong>Help improve London Advanced?</strong><span>Allow Google Analytics measurement. The site works without it. <a href="/privacy/">Privacy details</a>.</span></p><div><button type="button" data-consent="no">No thanks</button><button type="button" data-consent="yes">Allow analytics</button></div>`;
  document.body.appendChild(consent);
  consent.querySelectorAll("[data-consent]").forEach(button => button.addEventListener("click", () => {
    try { localStorage.setItem(key, button.dataset.consent); } catch { return; }
    consent.remove();
    if (button.dataset.consent === "yes") loadGoogle();
  }));
})();
