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

test("accepts a valid contact submission only after Cloudflare Email accepts it", async () => {
  let deliveredMessage;
  const response = await handleContact(contactRequest(), { async send(message) {
    deliveredMessage = message;
    return { messageId: "test-message-id" };
  }});

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, status: "accepted" });
  assert.equal(deliveredMessage.to, "ppastorin@gmail.com");
  assert.equal(deliveredMessage.from.email, "website@londonadvanced.com");
  assert.equal(deliveredMessage.replyTo.email, "visitor@example.com");
  assert.match(deliveredMessage.text, /Delivery Test/);
  assert.match(deliveredMessage.text, /valid London Advanced contact form test/);
});

test("redirects a successful browser submission to the local thank-you page", async () => {
  const response = await handleContact(contactRequest({}, { Accept: "text/html" }), {
    async send() { return { messageId: "test-message-id" }; }
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("Location"), "https://www.londonadvanced.com/thank-you/");
});

test("rejects a submission completed too quickly without sending email", async () => {
  let emailSent = false;
  const response = await handleContact(contactRequest({ started_at: String(Date.now()) }), {
    async send() { emailSent = true; }
  });

  assert.equal(response.status, 400);
  assert.equal(emailSent, false);
  assert.equal((await response.json()).code, "timing_check_failed");
});

test("silently accepts honeypot spam without forwarding it", async () => {
  let emailSent = false;
  const response = await handleContact(contactRequest({ _honey: "spam" }), {
    async send() { emailSent = true; }
  });

  assert.equal(response.status, 200);
  assert.equal(emailSent, false);
  assert.deepEqual(await response.json(), { ok: true, status: "accepted" });
});

test("reports delivery failure when Cloudflare Email rejects the submission", async () => {
  const response = await handleContact(contactRequest(), {
    async send() { throw Object.assign(new Error("rejected"), { code: "E_TEST_REJECTED" }); }
  });

  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, "delivery_failed");
});

test("reports unavailable delivery when the email binding is missing", async () => {
  const response = await handleContact(contactRequest(), undefined);

  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "delivery_unavailable");
});
