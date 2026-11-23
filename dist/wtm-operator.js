(() => {
  const data = window.LONDON_ADVANCED;
  if (!data) return;

  function track(label, context = {}) {
    window.LAAnalytics?.track(label, {
        content_type: "wtm_operator",
        item_id: label,
        ...context
      });
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
    if (event.origin !== window.location.origin || event.data?.type !== "wtm-operator-demo") return;
    if (!demoEvents.has(event.data.event)) return;
    track(`wtm-operator:demo:${event.data.event}`, event.data.context || {});
  });

})();
