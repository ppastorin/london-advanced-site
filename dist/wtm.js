(() => {
  const data = window.LONDON_ADVANCED;
  if (!data) return;

  function loadGoogleAnalytics(id) {
    if (!id || id.includes("XXXX")) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }

  function track(label) {
    if (typeof window.gtag === "function") {
      window.gtag("event", "select_content", { content_type: "link", item_id: label });
    }
  }

  document.querySelectorAll("[data-track]").forEach(link => {
    link.addEventListener("click", () => track(link.dataset.track));
  });

  const cfToken = data.analytics?.cloudflareBeaconToken;
  if (cfToken && !cfToken.includes("REPLACE")) {
    const beacon = document.createElement("script");
    beacon.defer = true;
    beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
    beacon.dataset.cfBeacon = JSON.stringify({ token: cfToken });
    document.head.appendChild(beacon);
  }

  const gaId = data.analytics?.googleAnalyticsId;
  const savedChoice = localStorage.getItem("la-analytics-consent");
  if (savedChoice === "yes") {
    loadGoogleAnalytics(gaId);
  } else if (savedChoice !== "no" && gaId && !gaId.includes("XXXX")) {
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
})();
