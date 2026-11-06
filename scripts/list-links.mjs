import fs from "node:fs";
import path from "node:path";

const distRoot = path.join(process.cwd(), "dist");
const textExtensions = new Set([".html", ".js", ".css", ".json", ".xml", ".txt"]);
const detailed = process.argv.includes("--details");

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

if (detailed) {
  console.log("External URL inventory\n");
  for (const [url, files] of [...inventory.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    console.log(url);
    console.log(`  ${[...files].sort().join(", ")}`);
  }
}

const referencedFiles = new Set([...inventory.values()].flatMap(files => [...files]));
console.log(`${inventory.size} unique external URLs referenced by ${referencedFiles.size} generated files under dist/.`);
if (!detailed) console.log("Run `npm run links:details` for the complete URL-to-file inventory.");
