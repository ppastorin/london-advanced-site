import { readFile } from "node:fs/promises";
import path from "node:path";
import { sitewideSupportRoutes } from "../support-cta.mjs";

const dist = path.resolve("dist");
const failures = [];

for (const route of sitewideSupportRoutes) {
  const html = await readFile(path.join(dist, route), "utf8");
  const markers = html.match(/data-sitewide-support="true"/g) || [];
  if (markers.length !== 1) failures.push(`${route}: expected one prominent CTA, found ${markers.length}`);
  if (!html.includes('href="/support-cta.css"')) failures.push(`${route}: support stylesheet missing`);
  const marker = html.indexOf('data-sitewide-support="true"');
  const footer = html.indexOf("<footer");
  if (footer >= 0 && marker > footer) failures.push(`${route}: CTA appears after the footer`);
}

for (const failure of failures) console.error(failure);
console.log(`Support CTA audit: ${sitewideSupportRoutes.size} routes checked, ${failures.length} failures.`);
if (failures.length) process.exitCode = 1;
