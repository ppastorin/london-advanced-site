import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultDist = path.join(root, "dist");
const itineraryDirectory = path.join(root, "content", "itineraries");
const canonicalOrigin = "https://www.londonadvanced.com";

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match?.[1] ?? match?.[2] ?? "";
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function htmlFiles(directory) {
  const files = [];
  const walk = async current => {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile() && entry.name.endsWith(".html")) files.push(target);
    }
  };
  await walk(directory);
  return files;
}

function pageCanonical(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    if (attribute(tag, "rel").toLowerCase().split(/\s+/).includes("canonical")) {
      return attribute(tag, "href");
    }
  }
  return "";
}

function pageIsNoindex(html) {
  return (html.match(/<meta\b[^>]*>/gi) || []).some(tag =>
    attribute(tag, "name").toLowerCase() === "robots" &&
    attribute(tag, "content").toLowerCase().split(/[\s,]+/).includes("noindex")
  );
}

export async function collectIndexableCanonicalUrls(dist = defaultDist) {
  const urls = new Set();
  for (const file of await htmlFiles(dist)) {
    const html = await readFile(file, "utf8");
    if (pageIsNoindex(html)) continue;

    const canonical = pageCanonical(html);
    if (!canonical) {
      throw new Error(`Indexable HTML is missing a canonical URL: ${path.relative(root, file)}`);
    }

    let url;
    try {
      url = new URL(canonical);
    } catch {
      throw new Error(`Invalid canonical URL in ${path.relative(root, file)}: ${canonical}`);
    }
    if (url.origin !== canonicalOrigin || url.search || url.hash) {
      throw new Error(`Non-canonical sitemap target in ${path.relative(root, file)}: ${canonical}`);
    }
    urls.add(url.href);
  }
  return urls;
}

export function parseSitemap(xml) {
  const entries = [];
  for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = match[1];
    const read = name => decodeXml(block.match(new RegExp(`<${name}>([^<]*)<\\/${name}>`))?.[1] || "");
    const loc = read("loc");
    if (!loc) continue;
    entries.push({
      loc,
      lastmod: read("lastmod"),
      changefreq: read("changefreq"),
      priority: read("priority")
    });
  }
  return entries;
}

function renderEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}${changefreq ? `<changefreq>${escapeXml(changefreq)}</changefreq>` : ""}${priority ? `<priority>${escapeXml(priority)}</priority>` : ""}</url>`;
}

async function itineraryMetadata() {
  const metadata = new Map();
  const published = [];
  for (const file of await readdir(itineraryDirectory)) {
    if (!/\.(en|it)\.json$/.test(file)) continue;
    const item = JSON.parse(await readFile(path.join(itineraryDirectory, file), "utf8"));
    if (item.editorial_status !== "published" || item.approval?.status !== "approved" || !item.published_at) continue;
    const date = new Date(item.updated_at || item.published_at);
    if (Number.isNaN(date.getTime())) continue;
    const locale = file.endsWith(".it.json") ? "it" : "en";
    const route = locale === "it" ? `/it/itinerari/${item.slug}/` : `/itineraries/${item.slug}/`;
    const lastmod = date.toISOString();
    metadata.set(`${canonicalOrigin}${route}`, { loc: `${canonicalOrigin}${route}`, lastmod });
    published.push(lastmod);
  }
  const latest = published.sort().at(-1);
  if (latest) {
    for (const route of ["/itineraries/", "/it/itinerari/"]) {
      metadata.set(`${canonicalOrigin}${route}`, { loc: `${canonicalOrigin}${route}`, lastmod: latest });
    }
  }
  return metadata;
}

export async function buildSitemap({ dist = defaultDist } = {}) {
  const file = path.join(dist, "sitemap.xml");
  const currentEntries = parseSitemap(await readFile(file, "utf8"));
  const canonicalUrls = await collectIndexableCanonicalUrls(dist);
  const metadata = new Map(currentEntries.map(entry => [entry.loc, entry]));
  const itineraryEntries = await itineraryMetadata();
  const ordered = [];
  const seen = new Set();

  for (const entry of currentEntries) {
    if (canonicalUrls.has(entry.loc) && !seen.has(entry.loc)) {
      ordered.push(itineraryEntries.get(entry.loc) || entry);
      seen.add(entry.loc);
    }
  }
  for (const loc of [...canonicalUrls].sort()) {
    if (!seen.has(loc)) ordered.push(itineraryEntries.get(loc) || metadata.get(loc) || { loc });
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <!-- Generated from every public, indexable canonical HTML page. -->',
    ...ordered.map(renderEntry),
    '</urlset>',
    ''
  ].join("\n");
  await writeFile(file, xml, "utf8");
  return ordered;
}

const directRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (directRun) {
  const entries = await buildSitemap();
  console.log(`Generated sitemap.xml with ${entries.length} canonical URLs.`);
}
