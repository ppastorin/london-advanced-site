import { readFile, writeFile } from "node:fs/promises";

// One-time source migration: retain WTM event handling while moving setup to analytics.js.
for (const filename of ["wtm.js", "wtm-operator.js"]) {
  let source = await readFile(filename, "utf8");
  const start = source.indexOf("  function loadGoogleAnalytics(id) {");
  const end = source.indexOf("  function track(label", start);
  if (start < 0 || end < 0) throw new Error(`Missing loader in ${filename}`);
  source = source.slice(0, start) + source.slice(end);
  source = source.replace(/if \(typeof window\.gtag === "function"\) \{\s*window\.gtag\("event", "select_content", \{([\s\S]*?)\}\);\s*\}/, (_match, params) =>
    `window.LAAnalytics?.track(label, {${params}});`);
  const cf = source.indexOf("  const cfToken = data.analytics?.cloudflareBeaconToken;");
  if (cf < 0) throw new Error(`Missing beacon in ${filename}`);
  source = source.slice(0, cf) + "})();\n";
  await writeFile(filename, source);
}
