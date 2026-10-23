(() => {
  const suggestions = {
    quiet: {
      label: "Your quiet hotel edit",
      walk: "About 12 min walk",
      title: "St George’s Gardens",
      copy: "A small historic garden where former burial grounds, mature trees and surviving memorials create a calm pause close to Bloomsbury.",
      note: "Enough time for the walk, a proper pause and an unhurried return.",
      map: "https://www.google.com/maps/search/?api=1&query=St+George%27s+Gardens+London"
    },
    unexpected: {
      label: "Your unexpected hotel edit",
      walk: "About 12 min walk",
      title: "Grant Museum of Zoology",
      copy: "A compact university museum of zoological specimens: unusual, visually memorable and close enough to fit between other plans.",
      note: "A distinctive stop that fits the available time without crossing the city.",
      map: "https://www.google.com/maps/search/?api=1&query=Grant+Museum+of+Zoology+London"
    },
    green: {
      label: "Your green hotel edit",
      walk: "About 25 min walk",
      title: "Camley Street Natural Park",
      copy: "A compact urban nature reserve beside the Regent’s Canal, turning a short walk north into a surprising change of pace.",
      note: "The longer walk still leaves time to explore before returning or continuing to King’s Cross.",
      map: "https://www.google.com/maps/search/?api=1&query=Camley+Street+Natural+Park+London"
    },
    local: {
      label: "Your local hotel edit",
      walk: "About 10 min walk",
      title: "Lamb’s Conduit Street",
      copy: "An independent-minded Bloomsbury street with small shops, places to eat and a more neighbourhood-scale view of central London.",
      note: "Close, flexible and easy to combine with coffee, browsing or an early meal.",
      map: "https://www.google.com/maps/search/?api=1&query=Lamb%27s+Conduit+Street+London"
    }
  };

  let mood = "quiet";
  let minutes = 90;
  const $ = selector => document.querySelector(selector);

  function send(event) {
    if (window.parent !== window) window.parent.postMessage({ type: "wtm-hotel-demo", event }, window.location.origin);
  }

  function render() {
    const item = suggestions[mood];
    $("[data-result-label]").textContent = item.label;
    $("[data-result-walk]").textContent = item.walk;
    $("[data-result-title]").textContent = item.title;
    $("[data-result-copy]").textContent = item.copy;
    $("[data-result-fit]").textContent = `${mood[0].toUpperCase()}${mood.slice(1)} · ${minutes} minutes · from your hotel`;
    $("[data-result-note]").textContent = item.note;
    $("[data-map-link]").href = item.map;
    $("[data-feedback]").className = "feedback";
    $("[data-feedback]").innerHTML = '<span>Would this be useful?</span><button type="button" data-feedback-value="yes">Yes</button><button type="button" data-feedback-value="no">Not for me</button>';
    bindFeedback();
  }

  function bindFeedback() {
    document.querySelectorAll("[data-feedback-value]").forEach(button => button.addEventListener("click", () => {
      const value = button.dataset.feedbackValue;
      $("[data-feedback]").className = "feedback feedback-message";
      $("[data-feedback]").innerHTML = value === "yes"
        ? "Thanks—this would count as a positive usefulness signal in the pilot."
        : "Thanks—production would record this anonymously and offer another idea.";
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
  document.querySelector("[data-map-link]").addEventListener("click", () => send("directions-opened"));
  document.querySelectorAll("[data-demo-action]").forEach(link => link.addEventListener("click", () => send(`${link.dataset.demoAction}-opened`)));
  bindFeedback();
  send("experience-started");
})();
