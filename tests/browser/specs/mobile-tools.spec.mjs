import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { charityShops, bookshops } from "../fixtures/shops.mjs";

const leafletStub = await readFile(new URL("../fixtures/leaflet-stub.js", import.meta.url), "utf8");

const tools = [
  {
    name: "Charity Shops",
    routes: { en: "/charity-shops/", it: "/it/strumenti/negozi-di-beneficenza/" },
    api: "**/api/charity-shops*",
    payload: { count: charityShops.length, shops: charityShops },
    map: "#charity-map",
    controls: ".charity-controls",
    workspace: ".charity-workspace",
    results: ".charity-results",
    search: ".charity-search",
    filter: "button[data-subtype='books_music']",
    expectedFiltered: 2
  },
  {
    name: "Bookshops",
    routes: { en: "/bookshops/", it: "/it/strumenti/librerie/" },
    api: "**/api/bookshops*",
    payload: { count: bookshops.length, shops: bookshops },
    map: "#bookshop-map",
    controls: ".bookshop-controls",
    workspace: ".bookshop-workspace",
    results: ".bookshop-results",
    search: ".bookshop-search",
    filter: "button[data-filter-group='type'][data-value='second-hand']",
    expectedFiltered: 2
  }
];

async function prepare(page, tool) {
  await page.addInitScript({ content: leafletStub });
  await page.route("https://unpkg.com/**", route => route.fulfill({ status: 200, contentType: route.request().resourceType() === "stylesheet" ? "text/css" : "text/javascript", body: "" }));
  await page.route(tool.api, route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tool.payload) }));
  await page.route("**/api/*geocode*", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, lat: 51.51, lon: -0.11, label: "Fixture London" }) }));
}

function intersectionArea(a, b) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

async function expectNoOverlap(first, second, label) {
  const [a, b] = await Promise.all([first.boundingBox(), second.boundingBox()]);
  expect(a, `${label}: first element has no box`).not.toBeNull();
  expect(b, `${label}: second element has no box`).not.toBeNull();
  expect(intersectionArea(a, b), label).toBe(0);
}

for (const tool of tools) {
  for (const width of [375, 390]) {
    test(`${tool.name} mobile UI is usable at ${width}px in EN and IT`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await prepare(page, tool);

      for (const [locale, route] of Object.entries(tool.routes)) {
        await page.goto(route);
        await expect(page.locator("html")).toHaveAttribute("lang", locale === "en" ? "en-GB" : "it-IT");
        await expect(page.locator(tool.map)).toHaveAttribute("data-marker-count", String(tool.payload.shops.length));

        const searchInput = page.locator(`${tool.search} input`).first();
        const searchSubmit = page.locator(`${tool.search} button[type='submit']`);
        const locationButton = page.locator(`${tool.search} .location-button`);
        await expect(searchInput).toBeVisible();
        await expect(searchSubmit).toBeVisible();
        await expect(locationButton).toBeVisible();
        const boxes = await Promise.all([searchInput.boundingBox(), searchSubmit.boundingBox(), locationButton.boundingBox()]);
        expect(boxes.every(Boolean)).toBe(true);
        expect(Math.max(...boxes.map(box => box.y)) - Math.min(...boxes.map(box => box.y))).toBeLessThanOrEqual(3);
        expect(boxes.every(box => box.height >= 44 && box.x >= 0 && box.x + box.width <= width)).toBe(true);
        await expectNoOverlap(searchInput, searchSubmit, `${tool.name} search input/submit overlap at ${width}px`);
        await expectNoOverlap(searchSubmit, locationButton, `${tool.name} search actions overlap at ${width}px`);

        const toolbar = page.locator(".bookshop-mobile-toolbar, .charity-mobile-toolbar");
        await expect(toolbar).toBeVisible();
        await expectNoOverlap(toolbar, page.locator(tool.map), `${tool.name} toolbar/map overlap at ${width}px`);

        await toolbar.locator(".mobile-filter-button").click();
        await expect(page.locator(tool.controls)).toHaveClass(/mobile-open/);
        await expect(page.locator(".mobile-filter-scroll")).toBeVisible();
        await expect(page.locator(".mobile-filter-footer")).toBeVisible();
        await page.locator(tool.filter).click();
        await expect(page.locator(tool.map)).toHaveAttribute("data-marker-count", String(tool.expectedFiltered));
        await expectNoOverlap(page.locator(".mobile-filter-scroll"), page.locator(".mobile-filter-footer"), `${tool.name} filter scroll/footer overlap at ${width}px`);

        await page.locator(".mobile-filter-apply").click();
        await toolbar.locator("[data-mobile-view='list']").click();
        await expect(page.locator(tool.results)).toBeVisible();
        await expect(page.locator(tool.map)).toBeHidden();
        await toolbar.locator("[data-mobile-view='map']").click();
        await expect(page.locator(tool.map)).toBeVisible();
        await expect(page.locator(tool.results)).toBeHidden();
        await expect(page.locator(tool.workspace)).toBeVisible();
      }
    });
  }
}
