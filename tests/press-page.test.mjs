import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [english, italian, homepage, italianHomepage, sitemap] = await Promise.all([
  readFile("dist/press/index.html", "utf8"),
  readFile("dist/it/stampa/index.html", "utf8"),
  readFile("dist/index.html", "utf8"),
  readFile("dist/it/index.html", "utf8"),
  readFile("dist/sitemap.xml", "utf8")
]);

test("press pages publish complete bilingual media information", () => {
  for (const marker of ["Editorial mission", "Platform innovations", "Audience and scale", "The Other London", "Original photography", "Media contact", "2,500+"]) {
    assert.match(english, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const marker of ["Missione editoriale", "Innovazioni della piattaforma", "Pubblico e dimensioni", "The Other London", "Fotografia originale", "Contatti per i media", "2.500+"]) {
    assert.match(italian, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("press pages have canonical and reciprocal language links", () => {
  assert.match(english, /rel="canonical" href="https:\/\/www\.londonadvanced\.com\/press\/"/);
  assert.match(english, /hreflang="it-IT" href="https:\/\/www\.londonadvanced\.com\/it\/stampa\/"/);
  assert.match(italian, /rel="canonical" href="https:\/\/www\.londonadvanced\.com\/it\/stampa\/"/);
  assert.match(italian, /hreflang="en-GB" href="https:\/\/www\.londonadvanced\.com\/press\/"/);
});

test("main menus link to press pages and Contact uses real anchors", () => {
  assert.match(homepage, /href="\/press\/"/);
  assert.match(italianHomepage, /href="\/it\/stampa\/"/);
  assert.match(homepage, /class="contact-nav" href="#contact"/);
  assert.match(italianHomepage, /class="contact-nav" href="#contatti"/);
  assert.doesNotMatch(homepage, /contact-nav" type="button"/);
});

test("press pages are discoverable in the sitemap", () => {
  assert.match(sitemap, /https:\/\/www\.londonadvanced\.com\/press\//);
  assert.match(sitemap, /https:\/\/www\.londonadvanced\.com\/it\/stampa\//);
});
