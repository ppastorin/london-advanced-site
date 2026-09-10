import fs from "node:fs";
import vm from "node:vm";

const contentText = fs.readFileSync("dist/content.js", "utf8");
const sandbox = { window: {} };
vm.runInNewContext(contentText, sandbox, { filename: "dist/content.js" });

const tools = sandbox.window.LONDON_ADVANCED?.apps || [];
const failures = [];

for (const tool of tools) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  const started = Date.now();

  try {
    const response = await fetch(tool.embedUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "London-Advanced-endpoint-check/2.0" }
    });
    const elapsed = Date.now() - started;
    if (!response.ok) {
      failures.push(`${tool.name}: HTTP ${response.status} from ${response.url}`);
      console.error(`FAIL ${tool.name}: HTTP ${response.status} (${elapsed} ms)`);
    } else {
      console.log(`OK   ${tool.name}: HTTP ${response.status} (${elapsed} ms)`);
    }
  } catch (error) {
    const reason = error.name === "AbortError" ? "timed out after 25 seconds" : error.message;
    failures.push(`${tool.name}: ${reason}`);
    console.error(`FAIL ${tool.name}: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }
}

if (failures.length) {
  console.error("\nEndpoint health check failed:\n");
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exit(1);
}

console.log(`\nAll ${tools.length} application endpoints are reachable.`);
