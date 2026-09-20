import assert from "node:assert/strict";
import test from "node:test";
import { handleContact } from "../worker/index.mjs";

function contactRequest(overrides = {}, headers = {}) {
  const body = new URLSearchParams({
    name: "Delivery Test",
    email: "visitor@example.com",
    message: "This is a valid London Advanced contact form test.",
    started_at: String(Date.now() - 5_000),
    _honey: "",
    ...overrides
  });
  return new Request("https://www.londonadvanced.com/api/contact", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Origin: "https://www.londonadvanced.com",
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers
    },
    body
  });
}

test("accepts a valid contact submission only after the delivery provider accepts it", async () => {
  let deliveryUrl;
  let deliveredPayload;
  let deliveryHeaders;
  const response = await handleContact(contactRequest(), async (url, options) => {
    deliveryUrl = url;
    deliveredPayload = JSON.parse(options.body);
    deliveryHeaders = options.headers;
    return Response.json({ success: "true", message: "submitted" });
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, status: "accepted" });
  assert.equal(deliveredPayload.name, "Delivery Test");
  assert.equal(deliveredPayload.email, "visitor@example.com");
  assert.equal(deliveredPayload._captcha, "false");
  assert.equal(deliveryUrl, "https://formsubmit.co/ajax/ppastorin@gmail.com");
  assert.equal(deliveryHeaders.Origin, "https://www.londonadvanced.com");
  assert.equal(deliveryHeaders.Referer, "https://www.londonadvanced.com/");
});

test("redirects a successful browser submission to the local thank-you page", async () => {
  const response = await handleContact(contactRequest({}, { Accept: "text/html" }), async () =>
    Response.json({ success: true })
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("Location"), "https://www.londonadvanced.com/thank-you/");
});

test("rejects a submission completed too quickly without contacting the delivery provider", async () => {
  let providerCalled = false;
  const response = await handleContact(contactRequest({ started_at: String(Date.now()) }), async () => {
    providerCalled = true;
    return Response.json({ success: true });
  });

  assert.equal(response.status, 400);
  assert.equal(providerCalled, false);
  assert.equal((await response.json()).code, "timing_check_failed");
});

test("silently accepts honeypot spam without forwarding it", async () => {
  let providerCalled = false;
  const response = await handleContact(contactRequest({ _honey: "spam" }), async () => {
    providerCalled = true;
    return Response.json({ success: true });
  });

  assert.equal(response.status, 200);
  assert.equal(providerCalled, false);
  assert.deepEqual(await response.json(), { ok: true, status: "accepted" });
});

test("reports delivery failure when the provider rejects the submission", async () => {
  const response = await handleContact(contactRequest(), async () =>
    Response.json({ success: false }, { status: 500 })
  );

  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, "delivery_failed");
});
