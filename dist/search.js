const pageLocale = document.documentElement.lang.toLowerCase().startsWith("it") ? "it" : "en";
const copy = pageLocale === "it" ? {
  loading: "Caricamento…",
  empty: "Nessun risultato. Prova un luogo, un argomento o un’esigenza pratica.",
  prompt: "Cerca un luogo, un articolo o ciò che ti serve a Londra.",
  count: count => `${count} ${count === 1 ? "risultato" : "risultati"}`,
  article: "Articolo",
  event: "Evento",
  guide: "Guida",
  tool: "Strumento",
  location: "Luogo",
  open: "Apri",
  error: "La ricerca non è disponibile in questo momento."
} : {
  loading: "Loading…",
  empty: "No results. Try a place, a subject or a practical need.",
  prompt: "Search for a place, an article or something you need in London.",
  count: count => `${count} ${count === 1 ? "result" : "results"}`,
  article: "Article",
  event: "Event",
  guide: "Guide",
  tool: "Tool",
  location: "Place",
  open: "Open",
  error: "Search is unavailable at the moment."
};

const form = document.querySelector("[data-search-form]");
const input = document.querySelector("[data-search-input]");
const summary = document.querySelector("[data-search-summary]");
const results = document.querySelector("[data-search-results]");
let catalogue = [];
let locationRecords = [];
let locationTimer;
let locationRequest = 0;
let locationController;

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase(pageLocale === "it" ? "it-IT" : "en-GB")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreRecord(record, query) {
  const title = normalize(record.title);
  const keywords = normalize((record.keywords || []).join(" "));
  const tags = normalize((record.tags || []).join(" "));
  const summaryText = normalize(record.summary);
  const content = normalize(record.content);
  const tokens = query.split(" ").filter(Boolean);
  let score = 0;

  if (title === query) score += 1200;
  else if (title.startsWith(query)) score += 700;
  else if (title.includes(query)) score += 450;

  if (keywords.split(" ").includes(query)) score += 650;
  else if (keywords.includes(query)) score += 320;
  if (tags.includes(query)) score += 260;
  if (summaryText.includes(query)) score += 120;
  if (content.includes(query)) score += 45;

  for (const token of tokens) {
    if (title.includes(token)) score += 90;
    if (keywords.includes(token)) score += 75;
    if (tags.includes(token)) score += 55;
    if (summaryText.includes(token)) score += 25;
    if (content.includes(token)) score += 8;
  }

  const searchable = `${title} ${keywords} ${tags} ${summaryText} ${content}`;
  if (!tokens.every(token => searchable.includes(token))) return 0;
  return score;
}

function renderResults(query) {
  results.replaceChildren();
  if (query.length < 2) {
    summary.textContent = copy.prompt;
    return;
  }

  const matches = [...catalogue, ...locationRecords]
    .filter(record => !record.expires_at || Date.parse(record.expires_at) > Date.now())
    .map(record => ({ record, score: scoreRecord(record, query) }))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    .slice(0, 20);

  summary.textContent = matches.length ? copy.count(matches.length) : copy.empty;
  for (const { record } of matches) {
    const item = document.createElement("article");
    item.className = "search-result";

    const meta = document.createElement("span");
    meta.className = "search-result-type";
    meta.textContent = record.type === "tool" ? copy.tool : record.type === "guide" ? copy.guide : record.type === "location" ? copy.location : record.type === "event" ? copy.event : copy.article;

    const title = document.createElement("h2");
    const link = document.createElement("a");
    link.href = record.url;
    link.textContent = record.title;
    title.append(link);

    const description = document.createElement("p");
    description.textContent = record.summary;

    item.append(meta, title, description);
    if (Array.isArray(record.links) && record.links.length) {
      item.classList.add("search-result-has-links");
      const actions = document.createElement("div");
      actions.className = "search-result-links";
      for (const destination of record.links) {
        const action = document.createElement("a");
        action.href = destination.url;
        action.textContent = `${destination.title} →`;
        actions.append(action);
      }
      item.append(actions);
    } else {
      const action = document.createElement("a");
      action.className = "search-result-action";
      action.href = record.url;
      action.textContent = `${copy.open} →`;
      item.append(action);
    }
    results.append(item);
  }
}

async function loadLocations(value) {
  const requestNumber = ++locationRequest;
  locationController?.abort();
  locationController = new AbortController();
  try {
    const params = new URLSearchParams({ q: value.trim(), locale: pageLocale });
    const response = await fetch(`/api/search-locations?${params}`, {
      headers: { Accept: "application/json" },
      signal: locationController.signal
    });
    if (!response.ok) throw new Error(`Location search returned ${response.status}`);
    const payload = await response.json();
    if (requestNumber !== locationRequest) return;
    locationRecords = Array.isArray(payload.records) ? payload.records : [];
    renderResults(normalize(value));
  } catch (error) {
    if (error.name !== "AbortError") console.warn("London Advanced location search failed.", error);
  }
}

function scheduleLocations(value, immediate = false) {
  clearTimeout(locationTimer);
  if (normalize(value).length < 2) {
    locationRecords = [];
    locationController?.abort();
    return;
  }
  locationTimer = setTimeout(() => loadLocations(value), immediate ? 0 : 220);
}

function updateSearch(value, pushHistory = false) {
  const query = normalize(value);
  locationRecords = [];
  renderResults(query);
  if (pushHistory) {
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url);
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  updateSearch(input.value, true);
  scheduleLocations(input.value, true);
});

input.addEventListener("input", () => {
  updateSearch(input.value, true);
  scheduleLocations(input.value);
});

async function initialise() {
  summary.textContent = copy.loading;
  try {
    const response = await fetch(`/data/search-index.${pageLocale}.json`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Search catalogue returned ${response.status}`);
    const payload = await response.json();
    catalogue = Array.isArray(payload.records) ? payload.records : [];
    const query = new URL(window.location.href).searchParams.get("q") || "";
    input.value = query;
    updateSearch(query);
    scheduleLocations(query, true);
    input.focus();
  } catch (error) {
    console.warn("London Advanced search failed to load.", error);
    summary.textContent = copy.error;
  }
}

initialise();
