import test from "node:test";
import assert from "node:assert/strict";
import { handleSubscribe } from "../worker/index.mjs";

function subscriptionRequest(overrides = {}, headers = {}) {
  const body = new FormData();
  const values = {
    email: "reader@example.com",
    source: "homepage",
    started_at: String(Date.now() - 3_000),
    _honey: "",
    ...overrides
  };
  Object.entries(values).forEach(([key, value]) => body.set(key, value));
  return new Request("https://www.londonadvanced.com/api/subscribe", {
    method: "POST",
    headers: { Origin: "https://www.londonadvanced.com", Accept: "application/json", ...headers },
    body
  });
}

const configuredEnv = {
  EMAILOCTOPUS_API_KEY: "test-api-key",
  EMAILOCTOPUS_LIST_ID: "list-123"
};

test("submits a valid address to EmailOctopus without bypassing double opt-in", async () => {
  let outbound;
  const response = await handleSubscribe(subscriptionRequest(), configuredEnv, async (url, options) => {
    outbound = { url, options };
    return Response.json({ id: "contact-1", status: "PENDING" });
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "confirmation_requested");
  assert.equal(outbound.url, "https://emailoctopus.com/api/1.6/lists/list-123/contacts");
  const payload = JSON.parse(outbound.options.body);
  assert.equal(payload.api_key, "test-api-key");
  assert.equal(payload.email_address, "reader@example.com");
  assert.equal("status" in payload, false);
});

test("passes a validated signup source only when a source field is configured", async () => {
  let payload;
  const response = await handleSubscribe(
    subscriptionRequest({ source: "newsletter-page" }),
    { ...configuredEnv, EMAILOCTOPUS_SOURCE_FIELD: "SOURCE" },
    async (_url, options) => {
      payload = JSON.parse(options.body);
      return Response.json({ id: "contact-2", status: "PENDING" });
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(payload.fields, { SOURCE: "newsletter-page" });
});

test("does not disclose whether an address already exists", async () => {
  const response = await handleSubscribe(subscriptionRequest(), configuredEnv, async () =>
    Response.json({ code: "MEMBER_EXISTS_WITH_EMAIL_ADDRESS" }, { status: 409 })
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test("rejects invalid addresses before calling the provider", async () => {
  let called = false;
  const response = await handleSubscribe(subscriptionRequest({ email: "not-an-email" }), configuredEnv, async () => {
    called = true;
    return Response.json({});
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, "invalid_email");
  assert.equal(called, false);
});

test("silently accepts honeypot submissions without calling the provider", async () => {
  let called = false;
  const response = await handleSubscribe(subscriptionRequest({ _honey: "spam" }), configuredEnv, async () => {
    called = true;
    return Response.json({});
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(called, false);
});

test("reports unavailable subscription when secrets have not been configured", async () => {
  const response = await handleSubscribe(subscriptionRequest(), {}, async () => Response.json({}));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "subscription_unavailable");
});

test("rejects submissions from an unapproved origin", async () => {
  const response = await handleSubscribe(subscriptionRequest({}, { Origin: "https://example.com" }), configuredEnv, async () => Response.json({}));
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, "origin_not_allowed");
});
