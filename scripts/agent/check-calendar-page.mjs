import { existsSync, readFileSync } from "node:fs";

const failures = [];
const fail = message => failures.push(message);
const read = file => existsSync(file) ? readFileSync(file, "utf8") : (fail(`Missing ${file}`), "");

const homepage = read("dist/index.html");
const italianHomepage = read("dist/it/index.html");
const page = read("dist/calendars/index.html");
const css = read("dist/calendars/calendars.css");

for (const file of [
  "dist/assets/calendars/calendar-overview.jpg",
  "dist/assets/calendars/calendar-january.jpg",
  "dist/assets/calendars/calendar-february-square.jpg"
]) if (!existsSync(file)) fail(`Missing ${file}`);

for (const marker of [
  'href="/calendars/"',
  'class="calendar-promo"',
  'Explore the 2027 calendars'
]) if (!homepage.includes(marker)) fail(`English homepage is missing ${marker}`);

if (italianHomepage.includes("calendar-promo") || italianHomepage.includes('href="/calendars/"')) {
  fail("Italian homepage contains the English-only calendar promotion");
}

for (const marker of [
  '<link rel="canonical" href="https://www.londonadvanced.com/calendars/">',
  'https://photo-portal.shop/share/NvHSGu3/',
  'https://photo-portal.shop/share/mzK2pwK/',
  'https://photo-portal.shop/share/4nks44v/',
  'https://photo-portal.shop/share/5u73sGi/',
  'delivery to UK addresses only',
  'bank holidays for England',
  'Italian edition',
  '/assets/calendars/calendar-overview.jpg',
  '/assets/calendars/calendar-january.jpg',
  '/assets/calendars/calendar-february-square.jpg'
]) if (!page.includes(marker)) fail(`Calendar page is missing ${marker}`);

if (page.includes('class="calendar-note"') || page.includes("Before you order")) {
  fail("Calendar page still contains the red order-information banner");
}

if (!css.includes(".calendar-hero") || !css.includes(".calendar-secondary-link") || !css.includes("@media (max-width: 600px)")) {
  fail("Calendar page styles are incomplete");
}
if (css.includes(".calendar-note")) fail("Calendar CSS still contains the removed red banner styles");

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  console.error(`${failures.length} calendar page check(s) failed.`);
  process.exit(1);
}

console.log("Calendar page checks passed.");
