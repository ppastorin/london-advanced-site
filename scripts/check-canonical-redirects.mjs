const targets = [
  "http://londonadvanced.com/",
  "https://londonadvanced.com/",
  "http://www.londonadvanced.com/",
  "https://www.londonadvanced.com/"
];

async function trace(startUrl) {
  const hops = [];
  const seen = new Set();
  let current = startUrl;

  for (let index = 0; index < 10; index += 1) {
    if (seen.has(current)) {
      hops.push({ url: current, error: "redirect loop" });
      return { startUrl, hops, ok: false };
    }
    seen.add(current);

    const response = await fetch(current, {
      redirect: "manual",
      headers: {
        "User-Agent": "London-Advanced-canonical-check/1.0",
        "Cache-Control": "no-cache"
      }
    });
    const location = response.headers.get("location");
    hops.push({
      url: current,
      status: response.status,
      location,
      server: response.headers.get("server"),
      cfRay: response.headers.get("cf-ray")
    });
    await response.body?.cancel();

    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current).href;
      continue;
    }

    const ok = response.status === 200 && current === "https://www.londonadvanced.com/";
    return { startUrl, hops, ok };
  }

  hops.push({ url: current, error: "more than 10 redirects" });
  return { startUrl, hops, ok: false };
}

const results = [];
for (const target of targets) {
  try {
    results.push(await trace(target));
  } catch (error) {
    results.push({ startUrl: target, hops: [], ok: false, error: error.message });
  }
}

console.log(JSON.stringify(results, null, 2));

if (results.some(result => !result.ok)) {
  console.error("\nCanonical-host check failed. Every variant must terminate at https://www.londonadvanced.com/ with HTTP 200.");
  process.exit(1);
}
