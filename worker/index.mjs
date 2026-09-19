const PROVIDER_ENDPOINT = atob("aHR0cHM6Ly9mb3Jtc3VibWl0LmNvL2FqYXgvcGFvbG8ucGFzdG9yaW5vQGdtYWlsLmNvbQ==");
const MAX_BODY_BYTES = 12_000;
const MIN_COMPLETION_MS = 2_000;
const MAX_COMPLETION_MS = 2 * 60 * 60 * 1_000;
const ALLOWED_ORIGINS = new Set([
  "https://www.londonadvanced.com",
  "https://londonadvanced.com",
  "https://london-advanced-site.ppastorin.workers.dev"
]);

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function redirectResponse(request, pathname, status = 303, extraHeaders = {}) {
  return new Response(null, {
    status,
    headers: {
      Location: new URL(pathname, request.url).href,
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function wantsJson(request) {
  return request.headers.get("Accept")?.includes("application/json") ?? false;
}

function clean(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function reject(request, status, code) {
  return wantsJson(request)
    ? jsonResponse({ ok: false, code }, status)
    : redirectResponse(request, "/?contact=error#contact");
}

export async function handleContact(request, providerFetch = fetch) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (!origin || (!ALLOWED_ORIGINS.has(origin) && origin !== requestUrl.origin)) {
    return reject(request, 403, "origin_not_allowed");
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_BYTES) return reject(request, 413, "request_too_large");
  if (request.headers.get("Cookie")?.includes("la_contact_recent=1")) {
    return reject(request, 429, "please_wait");
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return reject(request, 400, "invalid_form");
  }

  if (clean(form.get("_honey"), 200)) {
    return wantsJson(request)
      ? jsonResponse({ ok: true, status: "accepted" })
      : redirectResponse(request, "/thank-you/");
  }

  const name = clean(form.get("name"), 100);
  const email = clean(form.get("email"), 254);
  const message = clean(form.get("message"), 5_000);
  const humanAnswer = clean(form.get("human_answer"), 30).toLowerCase();
  const startedAt = Number(form.get("started_at"));
  const completionTime = Date.now() - startedAt;

  if (name.length < 2 || !isValidEmail(email) || message.length < 10) {
    return reject(request, 400, "invalid_fields");
  }
  if (humanAnswer !== "london") return reject(request, 400, "human_check_failed");
  if (!Number.isFinite(startedAt) || completionTime < MIN_COMPLETION_MS || completionTime > MAX_COMPLETION_MS) {
    return reject(request, 400, "timing_check_failed");
  }

  let providerResponse;
  let providerPayload;
  try {
    providerResponse = await providerFetch(PROVIDER_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        message,
        _replyto: email,
        _subject: "New message from London Advanced",
        _template: "table",
        _captcha: "false",
        _url: "https://www.londonadvanced.com/#contact"
      })
    });
    providerPayload = await providerResponse.json();
  } catch (error) {
    console.error(JSON.stringify({ event: "contact_delivery_error", reason: "provider_unavailable" }));
    return reject(request, 502, "delivery_failed");
  }

  const providerAccepted = providerResponse.ok &&
    (providerPayload?.success === true || providerPayload?.success === "true");
  if (!providerAccepted) {
    console.warn(JSON.stringify({
      event: "contact_delivery_rejected",
      providerStatus: providerResponse.status
    }));
    return reject(request, 502, "delivery_failed");
  }

  console.log(JSON.stringify({ event: "contact_delivery_accepted", providerStatus: providerResponse.status }));
  const cookie = "la_contact_recent=1; Max-Age=60; Path=/; Secure; HttpOnly; SameSite=Lax";
  return wantsJson(request)
    ? jsonResponse({ ok: true, status: "accepted" }, 200, { "Set-Cookie": cookie })
    : redirectResponse(request, "/thank-you/", 303, { "Set-Cookie": cookie });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") return handleContact(request);
    return env.ASSETS.fetch(request);
  }
};
