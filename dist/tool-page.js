(() => {
  const DATA = window.LONDON_ADVANCED;
  const toolId = document.body.dataset.toolId;
  const tool = DATA?.apps?.find(item => item.id === toolId);

  if (!tool) {
    document.querySelector(".frame-status").textContent = "This tool could not be configured.";
    return;
  }

  const frame = document.querySelector("#tool-frame");
  const stage = document.querySelector(".tool-stage");
  const directLink = document.querySelector("#direct-link");
  const switcher = document.querySelector("#tool-switcher");

  frame.title = tool.name;
  frame.src = tool.embedUrl;
  directLink.href = tool.embedUrl;
  directLink.setAttribute("aria-label", `Open ${tool.name} directly in a new tab`);

  DATA.apps.forEach(item => {
    const option = document.createElement("option");
    option.value = item.href;
    option.textContent = item.name;
    option.selected = item.id === toolId;
    switcher.appendChild(option);
  });

  switcher.addEventListener("change", event => {
    window.location.assign(event.target.value);
  });

  frame.addEventListener("load", () => {
    stage.classList.add("is-loaded");
  });

  directLink.addEventListener("click", () => track(`tool-direct:${tool.name}`));
  document.querySelector(".guide-strip").addEventListener("click", () => track(`guide:tool-${tool.id}`));

  function loadGoogleAnalytics(id) {
    if (!id || id.includes("XXXX")) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }

  function initAnalytics() {
    const cfToken = DATA.analytics?.cloudflareBeaconToken;
    if (cfToken && !cfToken.includes("REPLACE")) {
      const beacon = document.createElement("script");
      beacon.defer = true;
      beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
      beacon.dataset.cfBeacon = JSON.stringify({ token: cfToken });
      document.head.appendChild(beacon);
    }

    const gaId = DATA.analytics?.googleAnalyticsId;
    const storedChoice = localStorage.getItem("la-analytics-consent");
    if (storedChoice === "yes") {
      loadGoogleAnalytics(gaId);
      return;
    }
    if (storedChoice === "no" || !gaId || gaId.includes("XXXX")) return;

    const consent = document.createElement("div");
    consent.className = "consent";
    consent.innerHTML = `<p><strong>Help improve London Advanced?</strong><span>Allow anonymous Google Analytics measurement. The tool works without it.</span></p><div><button data-consent="no">No thanks</button><button data-consent="yes">Allow analytics</button></div>`;
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

  initAnalytics();
})();
