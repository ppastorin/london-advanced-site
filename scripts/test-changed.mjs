import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_FILES = [
  "tests/affiliate-rendering.test.mjs",
  "tests/bookshops.test.mjs",
  "tests/charity-shops.test.mjs",
  "tests/contact.test.mjs",
  "tests/cultural-loos.test.mjs",
  "tests/deployment-pipeline.test.mjs",
  "tests/fare-calculator.test.mjs",
  "tests/guide-navigation.test.mjs",
  "tests/italian-homepage-language.test.mjs",
  "tests/itineraries.test.mjs",
  "tests/itinerary-navigation.test.mjs",
  "tests/journal.test.mjs",
  "tests/kofi-phase1.test.mjs",
  "tests/kofi-phase2.test.mjs",
  "tests/kofi-phase3.test.mjs",
  "tests/legal-pages.test.mjs",
  "tests/loo-finder.test.mjs",
  "tests/meteo-dress.test.mjs",
  "tests/mobile-tool-grid.test.mjs",
  "tests/newsletter.test.mjs",
  "tests/park-loos.test.mjs",
  "tests/search-events.test.mjs",
  "tests/search-locations.test.mjs",
  "tests/seo-positioning.test.mjs",
  "tests/shopping-centre-loos.test.mjs",
  "tests/sitemap-coverage.test.mjs",
  "tests/social.test.mjs",
  "tests/studio-media-upload.test.mjs",
  "tests/studio-preview.test.mjs",
  "tests/validator.test.mjs",
  "tests/wtm-operator-page.test.mjs",
  "tests/wtm-page.test.mjs"
];

const FULL_SCOPE = [
  /^\.github\//,
  /^package(?:-lock)?\.json$/,
  /^wrangler\.jsonc$/,
  /^worker\//,
  /^db\//,
  /^schema\//,
  /^dist\//,
  /^scripts\//,
  /^(?:app|content)\.js$/,
  /^(?:index\.html|styles\.css|guide\.(?:css|js)|journal\.(?:css|js)|legal\.(?:css|js)|itineraries\.(?:css|js)|tool-page\.(?:css|js))$/,
  /^_headers$/
];

const DOCS_ONLY = /^(?:AGENTS\.md|README(?:\.txt|\.md)?|INSTALL(?:ATION_GUIDE|_AND_TEST)?\.md|JOURNAL_STUDIO\.md|VALIDATION\.md|.*\.md)$/i;

function normalise(file) {
  return file.replaceAll("\\", "/").replace(/^\.\//, "");
}

function add(set, ...files) {
  files.forEach(file => set.add(file));
}

export function planForFiles(inputFiles) {
  const files = [...new Set(inputFiles.map(normalise).filter(Boolean))].sort();
  if (!files.length) {
    return { mode: "full", tests: [...TEST_FILES], reasons: ["no changed files were supplied"] };
  }

  const selected = new Set();
  const reasons = [];
  let full = false;
  let applicationChange = false;

  for (const file of files) {
    if (TEST_FILES.includes(file)) {
      applicationChange = true;
      add(selected, file);
      reasons.push(`test file changed: ${file}`);
      continue;
    }

    if (DOCS_ONLY.test(file)) {
      reasons.push(`documentation-only change: ${file}`);
      continue;
    }

    applicationChange = true;

    if (FULL_SCOPE.some(pattern => pattern.test(file))) {
      full = true;
      reasons.push(`shared or high-risk path: ${file}`);
      continue;
    }

    if (/^(?:content\/itineraries\/|assets\/itineraries\/)/.test(file)) {
      add(selected,
        "tests/itineraries.test.mjs",
        "tests/itinerary-navigation.test.mjs",
        "tests/sitemap-coverage.test.mjs",
        "tests/studio-preview.test.mjs"
      );
      reasons.push(`itinerary content or asset: ${file}`);
      continue;
    }

    if (/^(?:content\/journal\/|assets\/journal\/)/.test(file)) {
      add(selected,
        "tests/journal.test.mjs",
        "tests/seo-positioning.test.mjs",
        "tests/sitemap-coverage.test.mjs"
      );
      reasons.push(`Journal content or asset: ${file}`);
      continue;
    }

    if (/^(?:content\/social\/|assets\/(?:instagram|social)\/)/.test(file)) {
      add(selected,
        "tests/social.test.mjs",
        "tests/studio-media-upload.test.mjs"
      );
      reasons.push(`social content or asset: ${file}`);
      continue;
    }

    if (/^content\/search-tools\.json$|^search\//.test(file)) {
      add(selected,
        "tests/search-events.test.mjs",
        "tests/search-locations.test.mjs"
      );
      reasons.push(`search source: ${file}`);
      continue;
    }

    if (/^content\/site-config\.json$/.test(file)) {
      add(selected,
        "tests/affiliate-rendering.test.mjs",
        "tests/kofi-phase1.test.mjs",
        "tests/kofi-phase2.test.mjs",
        "tests/kofi-phase3.test.mjs",
        "tests/legal-pages.test.mjs"
      );
      reasons.push(`shared site configuration: ${file}`);
      continue;
    }

    if (/^apps\/fare-calculator\//.test(file)) {
      add(selected,
        "tests/fare-calculator.test.mjs",
        "tests/kofi-phase3.test.mjs"
      );
      reasons.push(`fare calculator source: ${file}`);
      continue;
    }

    if (/^(?:wtm\/|wtm(?:-|\.)|.*\/wtm\/)/.test(file)) {
      add(selected,
        "tests/wtm-page.test.mjs",
        "tests/wtm-operator-page.test.mjs"
      );
      reasons.push(`WTM page or demo: ${file}`);
      continue;
    }

    if (/^(?:studio\/|.*\/studio\/)/.test(file)) {
      add(selected,
        "tests/journal.test.mjs",
        "tests/studio-media-upload.test.mjs",
        "tests/studio-preview.test.mjs"
      );
      reasons.push(`Studio source: ${file}`);
      continue;
    }

    if (/^(?:guide\.|.*\/guide\/)/.test(file)) {
      add(selected,
        "tests/guide-navigation.test.mjs",
        "tests/seo-positioning.test.mjs",
        "tests/affiliate-rendering.test.mjs"
      );
      reasons.push(`guide source: ${file}`);
      continue;
    }

    if (/^(?:legal\.|.*\/legal\/)/.test(file)) {
      add(selected,
        "tests/legal-pages.test.mjs",
        "tests/kofi-phase1.test.mjs"
      );
      reasons.push(`legal source: ${file}`);
      continue;
    }

    if (/^assets\//.test(file)) {
      full = true;
      reasons.push(`unclassified deployment asset: ${file}`);
      continue;
    }

    full = true;
    reasons.push(`unrecognised application path: ${file}`);
  }

  if (full) return { mode: "full", tests: [...TEST_FILES], files, reasons };
  if (!applicationChange) return { mode: "none", tests: [], files, reasons };
  return { mode: "targeted", tests: [...selected].sort(), files, reasons };
}

function gitFiles(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function changedFilesFromWorktree() {
  return [...new Set([
    ...gitFiles(["diff", "--name-only"]),
    ...gitFiles(["diff", "--cached", "--name-only"]),
    ...gitFiles(["ls-files", "--others", "--exclude-standard"])
  ])];
}

function changedFilesFromBase(base) {
  try {
    return gitFiles(["diff", "--name-only", `${base}...HEAD`]);
  } catch {
    return [];
  }
}

function readInputFiles(args) {
  const filesIndex = args.indexOf("--files");
  if (filesIndex !== -1) {
    return args.slice(filesIndex + 1).flatMap(value => value.split(/[\\n,]+/)).filter(Boolean);
  }

  const baseIndex = args.indexOf("--base");
  if (baseIndex !== -1 && args[baseIndex + 1]) {
    const files = changedFilesFromBase(args[baseIndex + 1]);
    if (files.length) return files;
  }

  if (process.env.CHANGED_FILES?.trim()) {
    return process.env.CHANGED_FILES.split(/[\\n,]+/).filter(Boolean);
  }

  return changedFilesFromWorktree();
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    ...options
  });
}

function printPlan(plan) {
  console.log(`test:changed mode: ${plan.mode}`);
  console.log(`changed paths: ${plan.files?.length ?? 0}`);
  if (plan.mode === "targeted") console.log(`selected test modules: ${plan.tests.length}`);
  if (plan.reasons?.length) {
    console.log(`reason: ${plan.reasons[0]}`);
    if (plan.reasons.length > 1) console.log(`additional reasons: ${plan.reasons.length - 1}`);
  }
}

function execute(plan) {
  printPlan(plan);

  if (plan.mode === "none") {
    console.log("No application tests required for documentation-only changes.");
    return 0;
  }

  if (plan.mode === "full") {
    const result = run(process.platform === "win32" ? "npm.cmd" : "npm", ["test"], { stdio: "inherit" });
    return result.status ?? 1;
  }

  const build = run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "prerender:preview"], { stdio: "inherit" });
  if (build.status !== 0) return build.status ?? 1;

  const result = run(process.execPath, ["--test-reporter=dot", ...plan.tests]);
  if (result.status !== 0) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    return result.status ?? 1;
  }

  console.log(`Targeted tests passed: ${plan.tests.length} modules.`);
  return 0;
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirect) {
  const plan = planForFiles(readInputFiles(process.argv.slice(2)));
  process.exitCode = execute(plan);
}
