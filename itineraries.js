(() => {
  const input = document.querySelector("[data-itinerary-search]");
  const cards = [...document.querySelectorAll("[data-itinerary-card]")];
  const count = document.querySelector("[data-itinerary-count]");
  if (!input || !cards.length) return;

  const update = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const matches = !query || `${card.dataset.filter || ""} ${card.textContent}`.toLocaleLowerCase().includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    if (count) count.textContent = `${visible} ${visible === 1 ? "itinerary" : "itineraries"}`;
  };

  input.addEventListener("input", update);
  update();
})();
