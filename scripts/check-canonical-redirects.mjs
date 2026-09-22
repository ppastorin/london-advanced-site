const cases = [
  {
    startUrl: "http://londonadvanced.com/",
    expectedUrl: "https://www.londonadvanced.com/"
  },
  {
    startUrl: "https://londonadvanced.com/",
    expectedUrl: "https://www.londonadvanced.com/"
  },
  {
    startUrl: "http://www.londonadvanced.com/",
    expectedUrl: "https://www.londonadvanced.com/"
  },
  {
    startUrl: "https://www.londonadvanced.com/",
    expectedUrl: "https://www.londonadvanced.com/"
  },
  {
    startUrl: "http://londonadvanced.com/events/?redirect_probe=1",
    expectedUrl: "https://www.londonadvanced.com/events/?redirect_probe=1"
  },
  {
    startUrl: "https://londonadvanced.com/events/?redirect_probe=1",
    expectedUrl: "https://www.londonadvanced.com/events/?redirect_probe=1"
  }
];

const RETRYABLE_STATUSES = new Set([403, 408, 425, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function requestWithRetry(url) {
  let lastResponse;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": "London-Advanced-canonical-check/1.1",
        "Cache-Control": "no-cache",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    lastResponse = response;

    if (!RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) {
      return { response, attempt };
    }

    await response.body?.cancel();
    await sleep(attempt * 750);
  }

  return { response: lastResponse, attempt: MAX_ATTEMPTS };
}

async function trace({ startUrl, expectedUrl }) {
  const hops = [];
  const seen = new Set();
  let current = startUrl;

  for (let index = 0; index < 10; index += 1) {
    if (seen.has(current)) {
      hops.push({ url: current, error: "redirect loop" });
      return { startUrl, expectedUrl, hops, ok: false };
    }
    seen.add(current);

    const { response, attempt } = await requestWithRetry(current);
    const location = response.headers.get("location");

    hops.push({
      url: current,
      status: response.status,
      location,
      server: response.headers.get("server"),
      cfRay: response.headers.get("cf-ray"),
      attempts: attempt
    });

    await response.body?.cancel();

    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current).href;
      continue;
    }

    return {
      startUrl,
      expectedUrl,
      hops,
      ok: response.status === 200 && current === expectedUrl
    };
  }

  hops.push({ url: current, error: "more than 10 redirects" });
  return { startUrl, expectedUrl, hops, ok: false };
}

const results = [];
for (const testCase of cases) {
  try {
    results.push(await trace(testCase));
  } catch (error) {
    results.push({ ...testCase, hops: [], ok: false, error: error.message });
  }
}

console.log(JSON.stringify(results, null, 2));

if (results.some(result => !result.ok)) {
  console.error("\nCanonical-host check failed. Every variant must terminate at the expected HTTPS www URL with HTTP 200 after transient-response retries.");
  process.exit(1);
}
