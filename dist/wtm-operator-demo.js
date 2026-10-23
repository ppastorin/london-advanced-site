(() => {
  const attribution = Object.freeze({
    poc_id: "OP-DEMO",
    product_id: "LON-CITY-4D",
    departure_id: "DEP-03NOV",
    property_id: "BLOOM-01",
    channel_id: "LEADER-WA"
  });

  const moods = {
    quiet: { label: "Con calma", resultLabel: "La tua Londra con calma", walk: "Circa 12 minuti a piedi", title: "St George’s Gardens", copy: "Un piccolo giardino storico dove alberi maturi e antichi monumenti funerari creano una pausa tranquilla vicino a Bloomsbury.", note: "Hai tempo per la passeggiata, una vera pausa e un rientro senza fretta.", map: "https://www.google.com/maps/search/?api=1&query=St+George%27s+Gardens+London" },
    unexpected: { label: "Insolita", resultLabel: "La tua Londra insolita", walk: "Circa 12 minuti a piedi", title: "Grant Museum of Zoology", copy: "Un piccolo museo universitario pieno di reperti zoologici: insolito, memorabile e abbastanza vicino da inserirsi tra gli altri impegni.", note: "Una tappa particolare che entra nel tempo disponibile senza attraversare tutta la città.", map: "https://www.google.com/maps/search/?api=1&query=Grant+Museum+of+Zoology+London" },
    green: { label: "Verde", resultLabel: "La tua Londra verde", walk: "Circa 25 minuti a piedi", title: "Camley Street Natural Park", copy: "Una riserva naturale urbana accanto al Regent’s Canal, dove una breve passeggiata verso nord cambia completamente il ritmo della giornata.", note: "La camminata più lunga lascia comunque tempo per esplorare prima di rientrare o proseguire verso King’s Cross.", map: "https://www.google.com/maps/search/?api=1&query=Camley+Street+Natural+Park+London" },
    local: { label: "Locale", resultLabel: "La tua Londra locale", walk: "Circa 10 minuti a piedi", title: "Lamb’s Conduit Street", copy: "Una strada indipendente di Bloomsbury, con piccoli negozi e locali che raccontano una Londra più quotidiana e di quartiere.", note: "Vicina, flessibile e facile da combinare con un caffè, qualche acquisto o una cena anticipata.", map: "https://www.google.com/maps/search/?api=1&query=Lamb%27s+Conduit+Street+London" }
  };

  let mood = "quiet";
  let minutes = 120;
  const $ = selector => document.querySelector(selector);

  function timeLabel(value) {
    if (value === 120) return "2 ore";
    if (value === 180) return "3 ore";
    return `${value} minuti`;
  }

  function context() {
    return { ...attribution, mood, minutes };
  }

  function send(event) {
    $("[data-signal-event]").textContent = event.replaceAll("-", "_");
    if (window.parent !== window) {
      window.parent.postMessage({ type: "wtm-operator-demo", event, context: context() }, window.location.origin);
    }
  }

  function render() {
    const item = moods[mood];
    $("[data-result-label]").textContent = item.resultLabel;
    $("[data-result-walk]").textContent = item.walk;
    $("[data-result-title]").textContent = item.title;
    $("[data-result-copy]").textContent = item.copy;
    $("[data-result-fit]").textContent = `${item.label} · ${timeLabel(minutes)} · dal tuo hotel`;
    $("[data-result-note]").textContent = item.note;
    $("[data-map-link]").href = item.map;
    $("[data-feedback]").className = "feedback";
    $("[data-feedback]").innerHTML = '<span>Ti sarebbe utile?</span><button type="button" data-feedback-value="yes">Sì</button><button type="button" data-feedback-value="no">Non per me</button>';
    bindFeedback();
  }

  function bindFeedback() {
    document.querySelectorAll("[data-feedback-value]").forEach(button => button.addEventListener("click", () => {
      const value = button.dataset.feedbackValue;
      $("[data-feedback]").className = "feedback feedback-message";
      $("[data-feedback]").textContent = value === "yes"
        ? "Grazie. Nel pilot questo contribuisce al segnale di utilità positiva."
        : "Grazie. Nel pilot la risposta è registrata in forma anonima e può attivare un’altra proposta.";
      send(`feedback-${value}`);
    }));
  }

  document.querySelectorAll("[data-time]").forEach(button => button.addEventListener("click", () => {
    minutes = Number(button.dataset.time);
    document.querySelectorAll("[data-time]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    render();
    send("time-selected");
  }));
  document.querySelectorAll("[data-mood]").forEach(button => button.addEventListener("click", () => {
    mood = button.dataset.mood;
    document.querySelectorAll("[data-mood]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    render();
    send("recommendation-completed");
  }));
  $("[data-map-link]").addEventListener("click", () => send("directions-opened"));
  document.querySelectorAll("[data-demo-action]").forEach(link => link.addEventListener("click", () => send(`${link.dataset.demoAction}-opened`)));
  bindFeedback();
  send("experience-started");
})();
