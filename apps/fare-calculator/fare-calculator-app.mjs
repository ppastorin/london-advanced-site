import { FARE_CONFIG } from "./fare-config.mjs";
import { calculateFarePlan } from "./fare-engine.mjs";
import { COPY } from "./translations.mjs";

const locale = document.body.dataset.locale === "it" ? "it" : "en";
const t = COPY[locale];
const displayLocale = locale === "it" ? "it-IT" : "en-GB";
const fareLastChecked = new Intl.DateTimeFormat(displayLocale, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
}).format(new Date(`${FARE_CONFIG.fareLastChecked}T00:00:00Z`));
const app = document.querySelector("#fare-calculator-app");

document.documentElement.lang = t.lang;
document.title = `${t.title} | London Advanced`;
app.innerHTML = pageTemplate();

const els = Object.fromEntries([
  "adults", "under18", "startDate", "days", "oysterOwned", "agesWrap", "agesGrid", "formError",
  "calculateButton", "results", "mixedTotal", "contactlessTotal", "oysterEffectiveTotal", "mixedCashTotal",
  "mixedCashDetail", "comparisonNote", "planList", "breakdown", "cardSummary"
].map(id => [id, document.getElementById(id)]));

init();

function pageTemplate() {
  return `<main class="app">
    <section class="hero">
      <p class="eyebrow">London Advanced</p>
      <h1>${t.title}</h1>
      <p class="intro">${t.intro}</p>
      <span class="scope-pill">${t.scope}</span>
    </section>
    <section class="panel" aria-labelledby="trip-heading">
      <h2 class="section-title" id="trip-heading">${t.tripTitle}</h2>
      <p class="section-help">${t.tripHelp}</p>
      <div class="form-grid">
        ${stepperField("adults", t.adults, 0, 20, 2)}
        ${stepperField("under18", t.under18, 0, 15, 2)}
        <div class="field"><label for="startDate">${t.startDate}</label><input id="startDate" type="date" required><span class="field-note">${t.dateNote}</span></div>
        ${stepperField("days", t.days, 1, 14, 7)}
        <div class="field"><label for="oysterOwned">${t.oysterOwned}</label>${stepper("oysterOwned", 0, 35, 0)}<span class="field-note">${t.oysterOwnedNote}</span></div>
      </div>
      <div id="agesWrap" class="ages-wrap"><label>${t.ages}</label><div id="agesGrid" class="ages-grid"></div></div>
      <div id="formError" class="message error hidden" role="alert"></div>
      <button id="calculateButton" class="primary-button" type="button">${t.calculate}</button>
    </section>
    <section id="results" class="panel hidden" aria-live="polite">
      <h2 class="section-title">${t.resultsTitle}</h2><p class="section-help">${t.resultsHelp}</p>
      <div class="summary-grid">
        ${metric("mixedTotal", t.metricMixed, t.metricMixedHelp)}
        ${metric("contactlessTotal", t.metricContactless, t.metricContactlessHelp)}
        ${metric("oysterEffectiveTotal", t.metricOyster, t.metricOysterHelp)}
        ${metric("mixedCashTotal", t.metricCash, t.metricCashHelp, "mixedCashDetail")}
      </div>
      <div id="comparisonNote" class="comparison-note"></div>
      <div class="plan-box"><h3>${t.planTitle}</h3><ul id="planList" class="plan-list"></ul></div>
      <div id="breakdown" class="breakdown"></div>
      <div class="how-to-read"><h3>${t.howToRead}</h3><div id="cardSummary" class="info-row"></div>${t.guidance.map(([title, text]) => `<div class="info-row"><strong>${title}:</strong> ${text}</div>`).join("")}<div class="info-row">${t.loadNote}</div></div>
    </section>
    <footer><p>${t.footer}</p><p>${t.checked}: <strong>${fareLastChecked}</strong> · <a href="${FARE_CONFIG.sources.fares}" target="_blank" rel="noopener noreferrer">${t.sourceLink}</a></p></footer>
  </main>`;
}

function stepperField(id, label, min, max, value) {
  return `<div class="field"><label for="${id}">${label}</label>${stepper(id, min, max, value)}</div>`;
}

function stepper(id, min, max, value) {
  return `<div class="stepper"><button type="button" data-target="${id}" data-delta="-1" aria-label="− ${id}">−</button><input id="${id}" type="number" min="${min}" max="${max}" value="${value}" inputmode="numeric"><button type="button" data-target="${id}" data-delta="1" aria-label="+ ${id}">+</button></div>`;
}

function metric(id, label, help, detailId = "") {
  return `<div class="metric"><div class="metric-label">${label}</div><div id="${id}" class="metric-value">${money(0)}</div><div${detailId ? ` id="${detailId}"` : ""} class="metric-detail">${help}</div></div>`;
}

function init() {
  els.startDate.value = localDateValue(new Date());
  document.querySelectorAll(".stepper button").forEach(button => button.addEventListener("click", handleStep));
  [els.adults, els.under18, els.days, els.oysterOwned].forEach(input => input.addEventListener("change", normalizeNumberInput));
  els.under18.addEventListener("input", () => { renderAgeFields(); updateOwnedLimit(); });
  els.adults.addEventListener("input", updateOwnedLimit);
  els.oysterOwned.addEventListener("input", updateOwnedLimit);
  els.agesGrid.addEventListener("change", updateOwnedLimit);
  els.calculateButton.addEventListener("click", calculate);
  renderAgeFields([10, 13]);
  updateOwnedLimit();
  calculate(false);
}

function handleStep(event) {
  const target = document.getElementById(event.currentTarget.dataset.target);
  const next = clamp(Number(target.value || target.min || 0) + Number(event.currentTarget.dataset.delta), Number(target.min), Number(target.max));
  target.value = String(next);
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(new Event("change", { bubbles: true }));
}

function normalizeNumberInput(event) {
  const input = event.currentTarget;
  input.value = String(clamp(Math.round(Number(input.value || input.min)), Number(input.min), Number(input.max)));
  if (input === els.under18) renderAgeFields();
  updateOwnedLimit();
}

function renderAgeFields(seedAges) {
  const count = clamp(Number(els.under18.value || 0), 0, 15);
  const previous = Array.from(els.agesGrid.querySelectorAll("select")).map(select => Number(select.value));
  els.agesGrid.innerHTML = "";
  els.agesWrap.classList.toggle("hidden", count === 0);
  for (let index = 0; index < count; index += 1) {
    const selected = previous[index] ?? seedAges?.[index] ?? 10;
    const options = Array.from({ length: 18 }, (_, age) => `<option value="${age}"${age === selected ? " selected" : ""}>${age === 0 ? t.underOne : age}</option>`).join("");
    els.agesGrid.insertAdjacentHTML("beforeend", `<div class="age-card"><strong>${t.traveller} ${index + 1}</strong><select aria-label="${t.traveller} ${index + 1}">${options}</select></div>`);
  }
}

function getAges() {
  return Array.from(els.agesGrid.querySelectorAll("select")).map(select => Number(select.value));
}

function updateOwnedLimit() {
  const maximum = Number(els.adults.value || 0) + getAges().filter(age => age >= 11).length;
  els.oysterOwned.max = String(maximum);
  if (Number(els.oysterOwned.value) > maximum) els.oysterOwned.value = String(maximum);
}

function readInputs() {
  return {
    adults: Number(els.adults.value),
    ages: getAges(),
    startDate: els.startDate.value,
    days: Number(els.days.value),
    oysterOwned: Number(els.oysterOwned.value)
  };
}

function calculate(scroll = true) {
  hideError();
  const result = calculateFarePlan(readInputs());
  if (!result.ok) {
    const error = t.errors[result.error.code];
    showError(typeof error === "function" ? error(result.error.limit) : error);
    els.results.classList.add("hidden");
    return;
  }
  renderResults(result);
  if (scroll) els.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderResults(result) {
  els.mixedTotal.textContent = money(result.mixed.effective);
  els.contactlessTotal.textContent = money(result.allContactless);
  els.oysterEffectiveTotal.textContent = money(result.allOyster.effective);
  els.mixedCashTotal.textContent = money(result.mixed.cash);
  els.mixedCashDetail.textContent = t.unusedSummary(money(result.mixed.unused));
  const saving = Math.min(result.allContactless, result.allOyster.effective) - result.mixed.effective;
  els.comparisonNote.textContent = saving > 0.009 ? t.saves(money(saving)) : t.sameCost;
  els.planList.innerHTML = buildPlanLines(result.recommendations).map(line => `<li>${line}</li>`).join("");
  els.cardSummary.innerHTML = t.cardSummary({ users: result.mixed.oysterCount, owned: result.mixed.ownedUsed, newCards: result.mixed.newCards, cardPrice: money(FARE_CONFIG.oysterCardCost), cardCost: money(result.mixed.cardCost), allNew: result.allOyster.newCards });
  els.breakdown.innerHTML = result.recommendations.slice().sort((a, b) => Number(Boolean(a.free)) - Number(Boolean(b.free))).map(renderTravellerCard).join("");
  els.results.classList.remove("hidden");
}

function travellerLabel(row) {
  if (row.kind === "adult") return t.adultLabel(row.index + 1);
  return t.childLabel(row.index + 1);
}

function travellerAge(row) {
  return row.kind === "adult" ? t.age("18+") : t.age(row.age);
}

function strategy(code) {
  return t.strategies[code] || code;
}

function buildPlanLines(recommendations) {
  const lines = [];
  const adultsContactless = recommendations.filter(row => row.kind === "adult" && row.recommended === "contactless");
  const adultsOyster = recommendations.filter(row => row.kind === "adult" && row.recommended === "oyster");
  if (adultsContactless.length) lines.push(t.planAdultContactless(adultsContactless.length));
  if (adultsOyster.length) lines.push(t.planAdultOyster(adultsOyster.length, strategy(adultsOyster[0].oyster.strategyCode)));
  recommendations.filter(row => row.kind !== "adult").forEach(row => {
    const label = travellerLabel(row);
    const age = travellerAge(row);
    if (row.free) return lines.push(t.planFree(label, age));
    if (row.recommended === "contactless") return lines.push(t.planContactless(label, age, money(row.contactless.fare)));
    const cardAction = row.usesExistingOyster ? t.useExisting : t.buyNew(money(FARE_CONFIG.oysterCardCost));
    const detail = row.age >= 11 && row.age <= 15 ? t.youngDetail(cardAction, money(row.oyster.cash)) : t.oysterDetail(cardAction, strategy(row.oyster.strategyCode));
    lines.push(t.planOyster(label, age, detail));
  });
  return lines;
}

function renderTravellerCard(row) {
  const label = travellerLabel(row);
  const age = travellerAge(row);
  if (row.free) return `<article class="traveller-card"><div class="traveller-head"><div class="traveller-title">${label}</div><div class="traveller-subtitle">${age}</div></div><div class="method free-method"><div class="method-price">${money(0)}</div><span class="free-badge">${t.freeBadge}</span></div><div class="traveller-note">${t.notes.free}</div></article>`;
  const contactlessRecommended = row.recommended === "contactless";
  const oysterRecommended = row.recommended === "oyster";
  const oysterCardLine = oysterRecommended ? (row.usesExistingOyster ? t.existingCard : t.newCard(money(FARE_CONFIG.oysterCardCost))) : t.newCardAdds(money(FARE_CONFIG.oysterCardCost));
  const note = row.kind === "adult" ? t.notes.adult : row.age <= 15 ? t.notes.young : t.notes.sixteen;
  return `<article class="traveller-card">
    <div class="traveller-head"><div class="traveller-title">${label}</div><div class="traveller-subtitle">${age}</div></div>
    <div class="method-grid">
      <div class="method${contactlessRecommended ? " recommended" : ""}">${contactlessRecommended ? `<span class="choice-badge">${t.useThis}</span>` : ""}<div class="method-name">${t.contactless}</div><div class="method-price">${money(row.contactless.fare)}</div><div class="method-strategy">${strategy(row.contactless.strategyCode)}</div><div class="method-details">${t.ownMethod}</div>${contactlessRecommended ? `<div class="effective-line">${t.effectiveCost}: ${money(row.effectiveCost)}</div>` : ""}</div>
      <div class="method${oysterRecommended ? " recommended" : ""}">${oysterRecommended ? `<span class="choice-badge">${t.useThis}</span>` : ""}<div class="method-name">${t.oyster}</div><div class="method-price">${money(row.oyster.fare)} ${t.fare}</div><div class="method-strategy">${strategy(row.oyster.strategyCode)}</div><div class="method-details">${oysterCardLine}<br>${t.cashBeforeCard}: ${money(row.oyster.cash)}<br>${t.unusedCredit}: ${money(row.oyster.unused)}</div>${oysterRecommended ? `<div class="effective-line">${t.effectiveWithCard}: ${money(row.effectiveCost)}</div>` : ""}</div>
    </div><div class="traveller-note">${note}</div>
  </article>`;
}

function money(value) {
  return new Intl.NumberFormat(t.lang, { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function localDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function showError(message) {
  els.formError.textContent = message || "";
  els.formError.classList.remove("hidden");
}

function hideError() {
  els.formError.textContent = "";
  els.formError.classList.add("hidden");
}
