const CONTACT_DESTINATION = "ppastorin@gmail.com";
const CONTACT_SENDER = "website@londonadvanced.com";
const MAX_BODY_BYTES = 12_000;
const MIN_COMPLETION_MS = 2_000;
const MAX_COMPLETION_MS = 2 * 60 * 60 * 1_000;
const EMAILOCTOPUS_API_ORIGIN = "https://emailoctopus.com";
const SUBSCRIBE_SOURCES = new Set(["homepage", "newsletter-page", "events-page", "footer", "unknown"]);
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

function rejectSubscription(request, status, code) {
  return wantsJson(request)
    ? jsonResponse({ ok: false, code }, status)
    : redirectResponse(request, "/newsletter/?subscribe=error#signup");
}

function acceptSubscription(request, status = "confirmation_requested") {
  const cookie = "la_subscribe_recent=1; Max-Age=60; Path=/; Secure; HttpOnly; SameSite=Lax";
  return wantsJson(request)
    ? jsonResponse({ ok: true, status }, 200, { "Set-Cookie": cookie })
    : redirectResponse(request, "/newsletter/thanks/", 303, { "Set-Cookie": cookie });
}

export async function handleContact(request, emailBinding) {
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
  const startedAt = Number(form.get("started_at"));
  const completionTime = Date.now() - startedAt;

  if (name.length < 2 || !isValidEmail(email) || message.length < 10) {
    return reject(request, 400, "invalid_fields");
  }
  if (!Number.isFinite(startedAt) || completionTime < MIN_COMPLETION_MS || completionTime > MAX_COMPLETION_MS) {
    return reject(request, 400, "timing_check_failed");
  }

  if (!emailBinding || typeof emailBinding.send !== "function") {
    console.error(JSON.stringify({ event: "contact_delivery_error", reason: "binding_unavailable" }));
    return reject(request, 503, "delivery_unavailable");
  }

  try {
    const delivery = await emailBinding.send({
      to: CONTACT_DESTINATION,
      from: { email: CONTACT_SENDER, name: "London Advanced" },
      replyTo: { email, name },
      subject: "New message from London Advanced",
      text: [
        "New message from the London Advanced website",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        "Message:",
        message
      ].join("\n")
    });
    console.log(JSON.stringify({ event: "contact_delivery_accepted", messageId: delivery?.messageId ?? null }));
  } catch (error) {
    console.error(JSON.stringify({
      event: "contact_delivery_error",
      reason: "cloudflare_email_failed",
      code: error?.code ?? "unknown"
    }));
    return reject(request, 502, "delivery_failed");
  }
  const cookie = "la_contact_recent=1; Max-Age=60; Path=/; Secure; HttpOnly; SameSite=Lax";
  return wantsJson(request)
    ? jsonResponse({ ok: true, status: "accepted" }, 200, { "Set-Cookie": cookie })
    : redirectResponse(request, "/thank-you/", 303, { "Set-Cookie": cookie });
}

export async function handleSubscribe(request, env, fetchImpl = fetch) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (!origin || (!ALLOWED_ORIGINS.has(origin) && origin !== requestUrl.origin)) {
    return rejectSubscription(request, 403, "origin_not_allowed");
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_BYTES) return rejectSubscription(request, 413, "request_too_large");
  if (request.headers.get("Cookie")?.includes("la_subscribe_recent=1")) {
    return rejectSubscription(request, 429, "please_wait");
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return rejectSubscription(request, 400, "invalid_form");
  }

  if (clean(form.get("_honey"), 200)) return acceptSubscription(request);

  const email = clean(form.get("email"), 254).toLowerCase();
  const requestedSource = clean(form.get("source"), 40);
  const source = SUBSCRIBE_SOURCES.has(requestedSource) ? requestedSource : "unknown";
  if (!isValidEmail(email)) return rejectSubscription(request, 400, "invalid_email");

  const apiKey = clean(env.EMAILOCTOPUS_API_KEY, 500);
  const listId = clean(env.EMAILOCTOPUS_LIST_ID, 100);
  if (!apiKey || !listId) {
    console.error(JSON.stringify({ event: "newsletter_subscription_error", reason: "configuration_missing" }));
    return rejectSubscription(request, 503, "subscription_unavailable");
  }

  const payload = {
    api_key: apiKey,
    email_address: email
  };
  const sourceField = clean(env.EMAILOCTOPUS_SOURCE_FIELD, 50);
  if (sourceField) payload.fields = { [sourceField]: source };

  let response;
  let result = {};
  try {
    response = await fetchImpl(`${EMAILOCTOPUS_API_ORIGIN}/api/1.6/lists/${encodeURIComponent(listId)}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    result = await response.json().catch(() => ({}));
  } catch {
    console.error(JSON.stringify({ event: "newsletter_subscription_error", reason: "provider_unreachable" }));
    return rejectSubscription(request, 502, "subscription_failed");
  }

  if (response.ok) {
    console.log(JSON.stringify({ event: "newsletter_subscription_accepted", source }));
    return acceptSubscription(request);
  }

  const providerCode = clean(
    result?.code ?? result?.error?.code ?? result?.errors?.[0]?.code,
    80
  );

  if (response.status === 409 || providerCode === "MEMBER_EXISTS_WITH_EMAIL_ADDRESS") {
    console.log(JSON.stringify({ event: "newsletter_subscription_existing", source }));
    return acceptSubscription(request, "already_registered");
  }

  console.error(JSON.stringify({
    event: "newsletter_subscription_error",
    reason: "provider_rejected",
    code: providerCode || `http_${response.status}`
  }));
  return rejectSubscription(request, 502, "subscription_failed");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") return handleContact(request, env.CONTACT_EMAIL);
    if (url.pathname === "/api/subscribe") return handleSubscribe(request, env);
    return env.ASSETS.fetch(request);
  }
};
