import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PURE_TESTS = new Set([
  "tests/contact.test.mjs",
  "tests/fare-calculator.test.mjs",
  "tests/newsletter.test.mjs",
  "tests/search-locations.test.mjs",
  "tests/social.test.mjs",
  "tests/studio-media-upload.test.mjs",
  "tests/studio-preview.test.mjs"
]);

const HIGH_RISK = [
  /^AGENTS\.md$/,
  /^package(?:-lock)?\.json$/,
  /^wrangler\.jsonc$/,
  /^\.github\/workflows\/(?:site-checks|auto-merge-studio-media)\.yml$/,
  /^scripts\/(?:prerender|validate-site|build-italian|build-search|build-sitemap|test-changed|run-node-tests-compact)\.mjs$/,
  /^worker\/index\.mjs$/,
  /^(?:app\.js|index\.html|styles\.css|journal\.css|journal\.js)$/,
  /^dist\/(?:app\.js|index\.html|styles\.css|it\/index\.html)$/
];

const RULES = [
  [/^(?:apps\/fare-calculator\/|scripts\/build-fare-calculator\.mjs|dist\/home\/travel-fare-calculator\/)/, ["tests/fare-calculator.test.mjs"]],
  [/^(?:dist\/bookshops\/|dist\/it\/(?:bookshops|strumenti\/librerie)\/|dist\/data\/bookshops\.json$)/, ["tests/bookshops.test.mjs"]],
  [/^(?:dist\/charity-shops\/|dist\/it\/(?:charity-shops|strumenti\/negozi-di-beneficenza)\/|dist\/data\/charity-shops\.json$)/, ["tests/charity-shops.test.mjs"]],
  [/^(?:dist\/loo\/|dist\/it\/(?:loo|strumenti\/trova-un-bagno)\/|dist\/data\/loos\.json$)/, ["tests/loo-finder.test.mjs", "tests/park-loos.test.mjs", "tests/cultural-loos.test.mjs", "tests/shopping-centre-loos.test.mjs"]],
  [/^(?:worker\/meteo-dress-|dist\/meteo-dress\/)/, ["tests/meteo-dress.test.mjs"]],
  [/^(?:content\/itineraries\/|assets\/itineraries\/|dist\/assets\/itineraries\/|scripts\/build-itineraries\.mjs|dist\/(?:itineraries|it\/itinerari)\/|dist\/itineraries\.js$)/, ["tests/itineraries.test.mjs", "tests/itinerary-navigation.test.mjs", "tests/sitemap-coverage.test.mjs"]],
  [/^(?:content\/journal\/|assets\/journal\/|dist\/assets\/journal\/|scripts\/build-journal\.mjs|dist\/(?:journal|it\/journal)\/|dist\/journal\.(?:css|js)$)/, ["tests/journal.test.mjs", "tests/seo-positioning.test.mjs", "tests/sitemap-coverage.test.mjs"]],
  [/^(?:content\/social\/|scripts\/validate-social\.mjs)/, ["tests/social.test.mjs", "tests/studio-preview.test.mjs"]],
  [/^(?:studio\/media\/|tests\/fixtures\/studio\/)/, ["tests/studio-media-upload.test.mjs"]],
  [/^studio\//, ["tests/studio-preview.test.mjs", "tests/studio-media-upload.test.mjs"]],
  [/^(?:search\/|content\/search-tools\.json$)/, ["tests/search-locations.test.mjs"]],
  [/^(?:dist\/events\/|dist\/it\/eventi\/|dist\/data\/events\.json$|scripts\/(?:stage-events|validate-events)\.mjs)/, ["tests/search-events.test.mjs", "tests/validator.test.mjs", "tests/affiliate-rendering.test.mjs"]],
  [/^(?:scripts\/build-legal\.mjs|dist\/(?:privacy|copyright|it\/privacy|it\/copyright)\/)/, ["tests/legal-pages.test.mjs", "tests/sitemap-coverage.test.mjs"]],
  [/^(?:wtm|dist\/wtm)/, ["tests/wtm-page.test.mjs", "tests/wtm-operator-page.test.mjs"]],
  [/^scripts\/build-guide-pages\.mjs$|^dist\/(?:guide|it\/guida)\//, ["tests/guide-navigation.test.mjs", "tests/sitemap-coverage.test.mjs"]],
  [/^scripts\/validate-events\.mjs$/, ["tests/validator.test.mjs"]],
  [/^scripts\/list-links\.mjs$/, []],
  [/^\.github\/workflows\/endpoint-health\.yml$/, []]
];

const NO_TEST = [
  /^(?!AGENTS\.md$).*\.md$/,
  /^assets\/instagram\//,
  /^dist\/assets\/instagram\//,
  /^\.gitignore$/
];

export function selectTests(changedFiles) {
  const tests = new Set();
  const unmapped = [];
  const highRisk = [];

  for (const file of [...new Set(changedFiles)].sort()) {
    if (HIGH_RISK.some(pattern => pattern.test(file))) {
      highRisk.push(file);
      continue;
    }
    if (/^tests\/[^/]+\.test\.mjs$/.test(file)) {
      tests.add(file);
      continue;
    }
    if (NO_TEST.some(pattern => pattern.test(file))) continue;
    const rule = RULES.find(([pattern]) => pattern.test(file));
    if (!rule) {
      unmapped.push(file);
      continue;
    }
    for (const test of rule[1]) tests.add(test);
  }

  if (highRisk.length || unmapped.length) {
    return { mode: "full", tests: [], needsBuild: true, highRisk, unmapped };
  }
  const selected = [...tests].sort();
  return {
    mode: selected.length ? "targeted" : "none",
    tests: selected,
    needsBuild: selected.some(test => !PURE_TESTS.has(test)),
    highRisk: [],
    unmapped: []
  };
}

function gitLines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function changedFiles(args) {
  const baseIndex = args.indexOf("--base");
  const headIndex = args.indexOf("--head");
  const base = baseIndex >= 0 ? args[baseIndex + 1] : "origin/main";
  const head = headIndex >= 0 ? args[headIndex + 1] : "HEAD";
  const committed = gitLines(["diff", "--name-only", "--diff-filter=ACMR", `${base}...${head}`]);
  const working = head === "HEAD" ? [
    ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"])
  ] : [];
  return [...new Set([...committed, ...working])].filter(file => !file.startsWith("node_modules/"));
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: process.cwd(), stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function main() {
  const files = changedFiles(process.argv.slice(2));
  if (files.length === 0) {
    console.log("No changed files detected; no tests selected.");
    return;
  }
  const selection = selectTests(files);
  if (selection.mode === "full") {
    const reasons = [...selection.highRisk, ...selection.unmapped].join(", ");
    console.log(`Full regression selected (shared, high-risk or unmapped: ${reasons}).`);
    run("npm", ["test"]);
    return;
  }
  if (selection.mode === "none") {
    console.log(`No Node tests required for ${files.length} recognised documentation/media-only change(s).`);
    return;
  }
  console.log(`Selected ${selection.tests.length} test file(s): ${selection.tests.join(", ")}`);
  if (selection.needsBuild) run("npm", ["run", "prerender:preview"]);
  run(process.execPath, ["scripts/run-node-tests-compact.mjs", ...selection.tests]);
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) main();
