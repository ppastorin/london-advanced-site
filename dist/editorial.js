(() => {
  const menus = [...document.querySelectorAll(".site-nav > .nav-dropdown, .desktop-nav > .nav-dropdown")];

  menus.forEach(menu => {
    menu.addEventListener("toggle", () => {
      if (menu.open) menus.filter(other => other !== menu).forEach(other => other.removeAttribute("open"));
    });
  });

  document.addEventListener("pointerdown", event => {
    menus.filter(menu => menu.open && !menu.contains(event.target)).forEach(menu => menu.removeAttribute("open"));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") menus.filter(menu => menu.open).forEach(menu => menu.removeAttribute("open"));
  });
})();
