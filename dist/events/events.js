const DATA = window.LONDON_ADVANCED;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function londonDayKey(value) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/London"
  }).format(value);
}

function formatDay(value) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London"
  }).format(value);
}

function formatTimeRange(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London"
  });
  if (londonDayKey(start) === londonDayKey(end)) return `${time.format(start)}–${time.format(end)}`;
  return `${formatDay(start)}, ${time.format(start)} – ${formatDay(end)}, ${time.format(end)}`;
}

function bookingLabel(booking) {
  if (booking.required) return "Booking required";
  if (booking.status === "recommended") return "Booking recommended";
  return "Drop in";
}

function categoryLabel(value) {
  return ({
    "architecture": "Architecture",
    "art-design": "Art & design",
    "community": "Community",
    "heritage-history": "Heritage & history",
    "local-culture": "Local culture",
    "nature": "Nature",
    "talk": "Talk",
    "urban-exploration": "Urban exploration"
  })[value] || value;
}

function renderEvent(event) {
  const officialUrl = safeHttpsUrl(event.official_url);
  if (!officialUrl) return "";
  const bookingUrl = safeHttpsUrl(event.booking?.url);
  const actionUrl = bookingUrl || officialUrl;
  return `
    <article class="events-list-card">
      <div class="events-list-meta">
        <span>${escapeHtml(categoryLabel(event.category))}</span>
        <strong>${escapeHtml(event.price.display)}</strong>
      </div>
      <div class="events-list-copy">
        <p class="events-list-time">${escapeHtml(formatTimeRange(event))}</p>
        <h3>${escapeHtml(event.title_en)}</h3>
        <p>${escapeHtml(event.summary_en)}</p>
      </div>
      <dl class="events-list-details">
        <div><dt>Venue</dt><dd>${escapeHtml(event.venue.name)}</dd></div>
        <div><dt>Address</dt><dd>${escapeHtml(event.venue.address)}, ${escapeHtml(event.venue.postcode)}</dd></div>
        <div><dt>Access</dt><dd>${escapeHtml(bookingLabel(event.booking))}</dd></div>
      </dl>
      <a class="events-list-action" href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener" data-event-id="${escapeHtml(event.id)}">Check official details <span aria-hidden="true">↗</span></a>
    </article>`;
}

function activeEvents(data, now) {
  if (!data || data.schema_version !== "1.1" || !Array.isArray(data.events)) return [];
  const today = londonDayKey(now);
  if (today < data.valid_from || today > data.valid_until) return [];
  return data.events.filter(event =>
    event.publication_status === "approved" &&
    Number.isInteger(event.advanced?.score) && event.advanced.score >= 7 &&
    Date.parse(event.publish_at) <= now.getTime() &&
    Date.parse(event.expire_at) > now.getTime() &&
    safeHttpsUrl(event.official_url)
  ).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

function renderGroups(events) {
  const groups = new Map();
  for (const event of events) {
    const start = new Date(event.start);
    const key = londonDayKey(start);
    if (!groups.has(key)) groups.set(key, { label: formatDay(start), events: [] });
    groups.get(key).events.push(event);
  }
  return [...groups.values()].map(group => `
    <section class="events-day">
      <div class="events-day-heading"><span>${escapeHtml(group.label)}</span><small>${group.events.length} event${group.events.length === 1 ? "" : "s"}</small></div>
      <div class="events-day-grid">${group.events.map(renderEvent).join("")}</div>
    </section>`).join("");
}

async function loadEvents() {
  const list = document.querySelector("[data-events-list]");
  const empty = document.querySelector("[data-events-empty]");
  const count = document.querySelector("[data-events-count]");
  try {
    const response = await fetch("/data/events.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Events feed returned ${response.status}`);
    const data = await response.json();
    const hostname = window.location.hostname;
    const localPreview = ["localhost", "127.0.0.1"].includes(hostname);
    const cloudflarePreview = hostname.endsWith(".workers.dev") &&
      hostname.includes("-london-advanced-site.") &&
      hostname !== "london-advanced-site.ppastorin.workers.dev";
    const demoRequested = new URLSearchParams(window.location.search).get("events-demo") === "1";
    const now = demoRequested && (localPreview || cloudflarePreview)
      ? new Date(`${data.valid_from}T12:00:00Z`)
      : new Date();
    const events = activeEvents(data, now);
    if (!events.length) {
      count.textContent = "No current events";
      empty.hidden = false;
      return;
    }
    list.innerHTML = renderGroups(events);
    count.textContent = `${events.length} verified event${events.length === 1 ? "" : "s"}`;
    const from = new Date(Math.min(...events.map(event => Date.parse(event.start))));
    const until = new Date(Math.max(...events.map(event => Date.parse(event.end))));
    document.querySelector("[data-events-range]").textContent = `${formatDay(from)} – ${formatDay(until)} · Last edited ${new Intl.DateTimeFormat("en-GB", {
      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London"
    }).format(new Date(data.generated_at))}`;
  } catch (error) {
    count.textContent = "Events temporarily unavailable";
    empty.hidden = false;
    console.warn("London Advanced events feed is unavailable.", error);
  }
}

document.querySelector("[data-facebook-link]").href = DATA.links.facebook;
document.querySelector("[data-year]").textContent = new Date().getFullYear();
loadEvents();
