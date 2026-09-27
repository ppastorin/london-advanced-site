document.querySelectorAll(".journal-page .nav-dropdown").forEach(dropdown => {
  dropdown.addEventListener("toggle", () => {
    if (!dropdown.open) return;
    document.querySelectorAll(".journal-page .nav-dropdown[open]").forEach(other => {
      if (other !== dropdown && !other.contains(dropdown)) other.open = false;
    });
  });
});

document.addEventListener("click", event => {
  if (event.target.closest(".nav-dropdown")) return;
  document.querySelectorAll(".journal-page .nav-dropdown[open]").forEach(dropdown => {
    dropdown.open = false;
  });
});
