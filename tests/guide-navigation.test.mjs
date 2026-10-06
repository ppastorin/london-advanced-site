import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pages = [
  ["English", "dist/the-other-london/index.html", "/the-other-london/", "/it/the-other-london/"],
  ["Italian", "dist/it/the-other-london/index.html", "/it/the-other-london/", "/the-other-london/"]
];

for (const [label, file, guideHref, alternateHref] of pages) {
  test(`${label} guide uses the complete canonical navigation`, async () => {
    const html = await readFile(file, "utf8");
    const header = html.match(/<header class="site-nav">[\s\S]*?<\/header>/)?.[0] || "";

    for (const marker of [
      'class="nav-dropdown tools-menu"',
      'class="nav-dropdown week-menu"',
      'class="newsletter-nav"',
      'class="contact-nav"',
      'class="nav-dropdown project-menu"',
      'class="nav-dropdown community-menu"',
      'class="language-switch"',
      'class="site-search-link"',
      'class="mobile-search-link"',
      'class="mobile-language-switch"',
      'class="nav-dropdown mobile-menu"'
    ]) assert.ok(header.includes(marker), `${label} guide navigation is missing ${marker}`);

    assert.ok(header.includes(`href="${guideHref}" aria-current="page"`));
    assert.ok(header.includes(`class="language-switch" href="${alternateHref}"`));
    assert.ok(header.includes(`class="mobile-language-switch" href="${alternateHref}"`));
    assert.equal(header.includes('class="nav-actions"'), false);
  });
}
