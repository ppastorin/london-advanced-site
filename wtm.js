(() => {
  const data = window.LONDON_ADVANCED;
  if (!data) return;

  function track(label) {
    window.LAAnalytics?.track(label, { content_type: "link", item_id: label });
  }

  document.querySelectorAll("[data-track]").forEach(link => {
    link.addEventListener("click", () => track(link.dataset.track));
  });

  const demoEvents = new Set([
    "experience-started", "time-selected", "recommendation-completed",
    "directions-opened", "crowd-opened", "route-opened",
    "feedback-yes", "feedback-no"
  ]);
  window.addEventListener("message", event => {
    if (event.origin !== window.location.origin || event.data?.type !== "wtm-hotel-demo") return;
    if (demoEvents.has(event.data.event)) track(`wtm:hotel-demo:${event.data.event}`);
  });

})();
