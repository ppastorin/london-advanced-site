document.querySelectorAll("[data-reset-consent]").forEach(button => {
  button.addEventListener("click", () => {
    localStorage.removeItem("la-analytics-consent");
    for (const name of ["_ga", "_gid", "_gat"]) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
    document.querySelectorAll("[data-consent-status]").forEach(status => {
      status.textContent = document.documentElement.lang.startsWith("it")
        ? "Scelta azzerata. Alla prossima visita della homepage potrai scegliere di nuovo."
        : "Choice reset. You can choose again on your next homepage visit.";
    });
  });
});
