const filters = [...document.querySelectorAll("[data-guide-filter]")];
const places = [...document.querySelectorAll("[data-guide-place]")];

for (const filter of filters) {
  filter.addEventListener("click", () => {
    const category = filter.dataset.guideFilter;
    for (const button of filters) button.setAttribute("aria-pressed", String(button === filter));
    for (const place of places) place.hidden = category !== "all" && place.dataset.guidePlace !== category;
  });
}
