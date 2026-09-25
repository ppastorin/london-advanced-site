import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const PRODUCTION_BASE_URL = "https://www.londonadvanced.com/";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

const contentText = fs.readFileSync("dist/content.js", "utf8");
const sandbox = { window: {} };
vm.runInNewContext(contentText, sandbox, { filename: "dist/content.js" });

const tools = sandbox.window.LONDON_ADVANCED?.apps || [];
const failures = [];
const warnings = [];

function browserHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 LondonAdvancedHealth/4.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Upgrade-Insecure-Requests": "1"
  };
}

function internalAssetPath(urlString) {
  const url = new URL(urlString, PRODUCTION_BASE_URL);
  if (url.origin !== new URL(PRODUCTION_BASE_URL).origin) return null;

  const pathname = decodeURIComponent(url.pathname);
  const clean = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!clean) return path.join("dist", "index.html");

  const direct = path.join("dist", clean);
  const html = `${direct}.html`;
  const index = path.join(direct, "index.html");

  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  if (fs.existsSync(html)) return html;
  if (fs.existsSync(index)) return index;
  return null;
}

async function fetchWithRetries(url, signal) {
  let lastResponse;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal,
        headers: browserHeaders()
      });
      lastResponse = response;

      if (!RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) {
        return { response, attempt };
      }

      await response.body?.cancel();
      await new Promise(resolve => setTimeout(resolve, attempt * 750));
    } catch (error) {
      lastError = error;
      if (error.name === "AbortError" || attempt === MAX_ATTEMPTS) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 750));
    }
  }

  if (lastResponse) return { response: lastResponse, attempt: MAX_ATTEMPTS };
  throw lastError || new Error("request failed");
}

for (const tool of tools) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  const started = Date.now();

  try {
    if (!tool.embedUrl) throw new Error("missing embedUrl");

    const endpointUrl = new URL(tool.embedUrl, PRODUCTION_BASE_URL).href;
    const localAsset = internalAssetPath(endpointUrl);

    // For native routes, make sure the deploy package actually contains the page.
    if (new URL(endpointUrl).origin === new URL(PRODUCTION_BASE_URL).origin && !localAsset) {
      throw new Error(`native route is missing from dist: ${new URL(endpointUrl).pathname}`);
    }

    const { response, attempt } = await fetchWithRetries(endpointUrl, controller.signal);
    const elapsed = Date.now() - started;
    const cfMitigated = response.headers.get("cf-mitigated");
    const server = response.headers.get("server");

    if (response.ok) {
      console.log(
        `OK   ${tool.name}: HTTP ${response.status} (${elapsed} ms, attempt ${attempt}) -> ${endpointUrl}`
      );
      await response.body?.cancel();
      continue;
    }

    // Cloudflare may challenge GitHub-hosted runner IPs even when the route works
    // normally in a browser. A challenge is not an application outage. Only
    // downgrade it when the route is native and its deployed asset exists.
    if (
      response.status === 403 &&
      server?.toLowerCase().includes("cloudflare") &&
      cfMitigated?.toLowerCase() === "challenge" &&
      localAsset
    ) {
      const warning =
        `${tool.name}: Cloudflare challenged the GitHub runner (HTTP 403), ` +
        `but native asset exists at ${localAsset}; treating as edge-bot warning, not outage.`;
      warnings.push(warning);
      console.warn(`WARN ${warning}`);
      await response.body?.cancel();
      continue;
    }

    const detail =
      `${tool.name}: HTTP ${response.status} from ${response.url}` +
      (cfMitigated ? ` (cf-mitigated=${cfMitigated})` : "");
    failures.push(detail);
    console.error(`FAIL ${detail} (${elapsed} ms, attempt ${attempt})`);
    await response.body?.cancel();
  } catch (error) {
    const reason =
      error.name === "AbortError" ? "timed out after 25 seconds" : error.message;
    failures.push(`${tool.name}: ${reason}`);
    console.error(`FAIL ${tool.name}: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }
}

if (warnings.length) {
  console.warn(`\n${warnings.length} non-fatal edge warning(s):`);
  warnings.forEach((warning, index) => console.warn(`${index + 1}. ${warning}`));
}

if (failures.length) {
  console.error("\nEndpoint health check failed:\n");
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exit(1);
}

console.log(`\nAll ${tools.length} application endpoints are healthy.`);
