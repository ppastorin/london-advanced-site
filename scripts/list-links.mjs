import fs from "node:fs";
import path from "node:path";

const distRoot = path.join(process.cwd(), "dist");
const textExtensions = new Set([".html", ".js", ".css", ".json", ".xml", ".txt"]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

const inventory = new Map();
for (const file of walk(distRoot)) {
  if (!textExtensions.has(path.extname(file)) && !["_headers", "_redirects"].includes(path.basename(file))) continue;
  const relativeFile = path.relative(process.cwd(), file);
  const text = fs.readFileSync(file, "utf8");
  for (const rawUrl of text.match(/https:\/\/[^\s"'<>`]+/g) || []) {
    const url = rawUrl.replace(/[),;]+$/, "");
    if (!inventory.has(url)) inventory.set(url, new Set());
    inventory.get(url).add(relativeFile);
  }
}

console.log("External URL inventory\n");
for (const [url, files] of [...inventory.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  console.log(url);
  console.log(`  ${[...files].sort().join(", ")}`);
}

console.log(`\n${inventory.size} unique external URLs found under dist/.`);
