import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("the English calendar campaign is complete and excluded from Italian", async () => {
  const [homepage, italianHomepage, page, css, sitemap] = await Promise.all([
    readFile("dist/index.html", "utf8"),
    readFile("dist/it/index.html", "utf8"),
    readFile("dist/calendars/index.html", "utf8"),
    readFile("dist/calendars/calendars.css", "utf8"),
    readFile("dist/sitemap.xml", "utf8")
  ]);

  for (const marker of ['class="calendar-promo"', 'href="/calendars/"', "Explore the 2027 calendars"]) {
    assert.ok(homepage.includes(marker), `homepage is missing ${marker}`);
  }
  assert.equal(italianHomepage.includes("calendar-promo"), false);
  assert.equal(italianHomepage.includes('href="/calendars/"'), false);

  for (const marker of [
    '<link rel="canonical" href="https://www.londonadvanced.com/calendars/">',
    'https://photo-portal.shop/share/NvHSGu3/',
    'https://photo-portal.shop/share/mzK2pwK/',
    'https://photo-portal.shop/share/4nks44v/',
    'https://photo-portal.shop/share/5u73sGi/',
    'delivery to UK addresses only',
    'bank holidays for England',
    'Italian edition'
  ]) assert.ok(page.includes(marker), `calendar page is missing ${marker}`);

  assert.equal(page.includes('class="calendar-note"'), false);
  assert.equal(page.includes("Before you order"), false);

  assert.ok(css.includes(".calendar-hero"));
  assert.ok(css.includes(".calendar-secondary-link"));
  assert.equal(css.includes(".calendar-note"), false);
  assert.ok(css.includes("@media (max-width: 600px)"));
  assert.ok(sitemap.includes("https://www.londonadvanced.com/calendars/"));

  for (const file of [
    "dist/assets/calendars/calendar-overview.jpg",
    "dist/assets/calendars/calendar-january.jpg",
    "dist/assets/calendars/calendar-february-square.jpg"
  ]) await access(file);
});
