import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file));
    else if (file.endsWith(".html")) files.push(file);
  }
  return files;
}

let eligible = 0;
let failures = 0;
for (const file of await walk("dist")) {
  const relative = path.relative("dist", file).replaceAll(path.sep, "/");
  const html = await readFile(file, "utf8");
  if (relative.startsWith("studio/") || relative === "404.html" ||
      /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html) ||
      /<meta\s+http-equiv="refresh"/i.test(html) || !html.includes("</body>")) continue;
  eligible++;
  if ((html.match(/src="\/analytics\.js"/g) || []).length !== 1) {
    failures++;
    console.error(`Missing or duplicated loader: ${relative}`);
  }
}
console.log(`Analytics coverage: ${eligible - failures}/${eligible} eligible pages; ${failures} failures.`);
if (failures) process.exitCode = 1;
