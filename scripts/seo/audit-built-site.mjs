import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const origin = "https://www.londonadvanced.com";

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match?.[1] ?? match?.[2] ?? "";
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

function routeFor(file) {
  const relative = path.relative(dist, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  return `/${relative}`;
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) || [];
}

function canonical(html) {
  return tags(html, "link").find(tag => attr(tag, "rel").toLowerCase().split(/\s+/).includes("canonical"))
    ? attr(tags(html, "link").find(tag => attr(tag, "rel").toLowerCase().split(/\s+/).includes("canonical")), "href")
    : "";
}

function robots(html) {
  const tag = tags(html, "meta").find(item => attr(item, "name").toLowerCase() === "robots");
  return tag ? attr(tag, "content").toLowerCase() : "";
}

function hreflang(html) {
  return tags(html, "link")
    .filter(tag => attr(tag, "rel").toLowerCase().split(/\s+/).includes("alternate") && attr(tag, "hreflang"))
    .map(tag => ({ language: attr(tag, "hreflang"), href: attr(tag, "href") }));
}

function htmlLanguage(html) {
  return attr(html.match(/<html\b[^>]*>/i)?.[0] || "", "lang");
}

function links(html, pageUrl) {
  const output = [];
  for (const tag of tags(html, "a")) {
    const href = attr(tag, "href");
    if (!href || /^(?:mailto:|tel:|javascript:)/i.test(href)) continue;
    try {
      const url = new URL(href, `${origin}${pageUrl}`);
      if (url.origin !== origin) continue;
      output.push({ href, target: url.pathname, query: url.search, hash: url.hash });
    } catch {}
  }
  return output;
}

function textWords(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .trim().split(/\s+/).filter(Boolean).length;
}

function parseRedirects(source) {
  return source.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#")).map(line => {
    const [from, to, status = "302"] = line.split(/\s+/);
    return { from, to, status: Number(status) };
  });
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => {
    const block = match[1];
    const value = tag => block.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`))?.[1] || "";
    return {
      loc: value("loc"),
      lastmod: value("lastmod"),
      alternates: (block.match(/<xhtml:link\b[^>]*>/gi) || []).map(tag => ({ language: attr(tag, "hreflang"), href: attr(tag, "href") }))
    };
  });
}

const allFiles = await walk(dist);
const htmlFiles = allFiles.filter(file => file.endsWith(".html"));
const pages = new Map();
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const route = routeFor(file);
  pages.set(route, {
    route,
    file: path.relative(root, file).split(path.sep).join("/"),
    canonical: canonical(html),
    robots: robots(html),
    noindex: robots(html).split(/[\s,]+/).includes("noindex"),
    language: htmlLanguage(html),
    hreflang: hreflang(html),
    links: links(html, route),
    words: textWords(html)
  });
}

const redirects = parseRedirects(await readFile(path.join(dist, "_redirects"), "utf8"));
const redirectBySource = new Map(redirects.map(rule => [rule.from, rule]));
const sitemap = parseSitemap(await readFile(path.join(dist, "sitemap.xml"), "utf8"));
const sitemapUrls = new Set(sitemap.map(entry => entry.loc));
const allCanonicalPhysicalPages = [...pages.values()].filter(page => !page.noindex && page.canonical);
const canonicalPageByUrl = new Map();
for (const page of allCanonicalPhysicalPages) {
  const current = canonicalPageByUrl.get(page.canonical);
  const canonicalRoute = new URL(page.canonical).pathname;
  if (!current || page.route === canonicalRoute) canonicalPageByUrl.set(page.canonical, page);
}
const canonicalPages = [...canonicalPageByUrl.values()];
const canonicalUrls = new Set(canonicalPages.map(page => page.canonical));
const canonicalRoutes = new Set([...canonicalUrls].map(url => new URL(url).pathname));
const builtFiles = new Set(allFiles.map(file => `/${path.relative(dist, file).split(path.sep).join("/")}`));
const targetExists = target => builtFiles.has(target) || builtFiles.has(`${target.replace(/\/$/, "")}/index.html`);

const graph = new Map([...canonicalRoutes].map(route => [route, new Set()]));
const inbound = new Map([...canonicalRoutes].map(route => [route, 0]));
const internalRedirectLinks = [];
const brokenInternalLinks = [];
for (const page of canonicalPages) {
  const source = new URL(page.canonical).pathname;
  for (const link of page.links) {
    if (link.hash && link.target === source) continue;
    const redirect = redirectBySource.get(link.target) || redirectBySource.get(`${link.target}${link.query}`);
    if (redirect) internalRedirectLinks.push({ source, href: link.href, redirect });
    if (canonicalRoutes.has(link.target)) {
      if (!graph.get(source)?.has(link.target)) {
        graph.get(source)?.add(link.target);
        inbound.set(link.target, (inbound.get(link.target) || 0) + 1);
      }
    } else if (!targetExists(link.target) && !redirect && !link.hash) {
      brokenInternalLinks.push({ source, href: link.href, target: link.target });
    }
  }
}

const depth = new Map([["/", 0]]);
const queue = ["/"];
while (queue.length) {
  const source = queue.shift();
  for (const target of graph.get(source) || []) {
    if (depth.has(target)) continue;
    depth.set(target, depth.get(source) + 1);
    queue.push(target);
  }
}

const hreflangProblems = [];
const canonicalByRoute = new Map(canonicalPages.map(page => [new URL(page.canonical).pathname, page]));
for (const page of canonicalPages) {
  const source = new URL(page.canonical).pathname;
  for (const alternate of page.hreflang) {
    if (!alternate.href.startsWith(origin)) hreflangProblems.push({ source, problem: "non-absolute-or-wrong-host", alternate });
    let target;
    try { target = new URL(alternate.href).pathname; } catch { continue; }
    const targetPage = canonicalByRoute.get(target);
    if (!targetPage) hreflangProblems.push({ source, problem: "alternate-not-indexable", alternate });
    else if (alternate.language !== "x-default" && !targetPage.hreflang.some(item => item.href === page.canonical)) {
      hreflangProblems.push({ source, problem: "not-reciprocal", alternate });
    }
  }
}

const redirectChains = [];
const redirectLoops = [];
for (const rule of redirects) {
  const seen = new Set([rule.from]);
  const chain = [rule];
  let current = rule;
  while (current.to.startsWith("/") && redirectBySource.has(current.to)) {
    current = redirectBySource.get(current.to);
    chain.push(current);
    if (seen.has(current.from)) { redirectLoops.push(chain); break; }
    seen.add(current.from);
  }
  if (chain.length > 1) redirectChains.push(chain);
}

const report = {
  totals: {
    physicalHtml: pages.size,
    indexablePhysicalHtmlWithCanonical: allCanonicalPhysicalPages.length,
    uniqueIndexableCanonicals: canonicalUrls.size,
    noindex: [...pages.values()].filter(page => page.noindex).length,
    missingCanonicalWithoutNoindex: [...pages.values()].filter(page => !page.noindex && !page.canonical).length,
    sitemap: sitemap.length
  },
  indexableMissingFromSitemap: [...canonicalUrls].filter(url => !sitemapUrls.has(url)).sort(),
  sitemapNotIndexable: [...sitemapUrls].filter(url => !canonicalUrls.has(url)).sort(),
  pagesMissingCanonicalWithoutNoindex: [...pages.values()].filter(page => !page.noindex && !page.canonical).map(page => page.route).sort(),
  duplicateCanonicalPhysicalRoutes: Object.entries(allCanonicalPhysicalPages.reduce((acc, page) => {
    (acc[page.canonical] ||= []).push(page.route); return acc;
  }, {})).filter(([, routes]) => routes.length > 1).map(([url, routes]) => ({ url, routes })),
  sitemap,
  linkGraph: [...canonicalRoutes].sort().map(route => ({ route, inbound: inbound.get(route) || 0, depth: depth.get(route) ?? null, sitemapOnly: sitemapUrls.has(`${origin}${route}`) && !depth.has(route) })),
  orphans: [...canonicalRoutes].filter(route => route !== "/" && (inbound.get(route) || 0) === 0).sort(),
  unreachableFromHomepage: [...canonicalRoutes].filter(route => !depth.has(route)).sort(),
  internalRedirectLinks,
  brokenInternalLinks,
  redirects,
  redirectChains,
  redirectLoops,
  hreflangProblems,
  metadataProblems: canonicalPages.flatMap(page => {
    const problems = [];
    const route = new URL(page.canonical).pathname;
    if (page.canonical !== `${origin}${route}`) problems.push("canonical-not-normalized");
    if (page.route !== route && !redirectBySource.has(page.route)) problems.push("physical-route-differs-from-canonical-without-redirect");
    if (!page.robots) problems.push("missing-meta-robots");
    if (!page.language) problems.push("missing-html-lang");
    return problems.length ? { route: page.route, canonical: page.canonical, problems } : null;
  }).filter(Boolean),
  tools: [
    "/home/london-dashboard/", "/home/escape-the-crowds/", "/home/travel-fare-calculator/", "/home/smart-navigation/", "/home/london-by-mood/", "/loo/", "/charity-shops/", "/bookshops/", "/meteo-dress/",
    "/it/strumenti/dashboard-londra/", "/it/strumenti/evita-la-folla/", "/it/strumenti/calcolatore-tariffe-trasporti/", "/it/strumenti/navigazione-intelligente/", "/it/strumenti/londra-per-umore/", "/it/strumenti/trova-un-bagno/", "/it/strumenti/negozi-di-beneficenza/", "/it/strumenti/librerie/"
  ].map(route => ({ route, ...(pages.get(route) || {}), inbound: inbound.get(route) || 0, depth: depth.get(route) ?? null, inSitemap: sitemapUrls.has(`${origin}${route}`) }))
};

console.log(JSON.stringify(report, null, 2));
