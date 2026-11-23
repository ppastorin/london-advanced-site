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
  const aboutTrigger = document.querySelector(".about-trigger");
  const aboutPanel = document.querySelector(".about-panel");
  const aboutClose = document.querySelector(".panel-close");

  frame.title = tool.name;
  frame.src = tool.embedUrl;
  if (directLink) {
    directLink.href = tool.embedUrl;
    directLink.setAttribute("aria-label", `Open ${tool.name} directly in a new tab`);
  }

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

  if (aboutTrigger && aboutPanel && aboutClose) {
    aboutTrigger.addEventListener("click", () => aboutPanel.showModal());
    aboutClose.addEventListener("click", () => aboutPanel.close());
    aboutPanel.addEventListener("click", event => {
      const bounds = aboutPanel.getBoundingClientRect();
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (!inside) aboutPanel.close();
    });
  }

  if (directLink) directLink.addEventListener("click", () => track(`tool-direct:${tool.name}`));
  document.querySelector(".guide-strip").addEventListener("click", () => track(`guide:tool-${tool.id}`));

  function track(label) {
    window.LAAnalytics?.track(label, { content_type: "link" });
  }
})();
