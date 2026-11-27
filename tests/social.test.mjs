import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateSocialPost, validateSocialSettings } from "../scripts/validate-social.mjs";

const settings = JSON.parse(fs.readFileSync("content/social/settings.json", "utf8"));

const approvedPost = {
  post_id: "2026-11-10-test-post",
  internal_title: "Test post",
  editorial_status: "approved",
  approval: {
    status: "approved",
    approved_by: "Paolo Pastorino",
    approved_at: "2026-11-09T18:00:00Z"
  },
  scheduled_for: "2026-11-10T18:30:00Z",
  language_mode: "italian",
  caption_it: "Un testo italiano concreto e verificato per una prova della coda editoriale.",
  caption_en: "",
  hashtags: ["#LondonAdvanced", "#LondraInsolita"],
  images: [{ order: 1, src: "/assets/instagram/test/test - 1.jpg", alt: "Una fotografia di prova." }],
  overlay: { enabled: false },
  source: { type: "media-library", reference: "test", checked_at: "2026-11-09" },
  metricool: {}
};

test("allows a completely approved post to enter the Metricool hand-off queue", () => {
  assert.deepEqual(validateSocialPost(approvedPost), []);
});

test("social settings match the current standing policy", () => {
  assert.deepEqual(validateSocialSettings(settings), []);
  assert.deepEqual(settings.cadence.map(({ day, local_time, kind }) => [day, local_time, kind]), [
    ["Tuesday", "18:30", "place"],
    ["Sunday", "10:00", "journal-or-tool"]
  ]);
  assert.equal(settings.voice.caption_words_min, 40);
  assert.equal(settings.voice.caption_words_max, 110);
  assert.equal(settings.voice.hashtags_min, 0);
  assert.equal(settings.voice.hashtags_max, 5);
  assert.equal(settings.automation.require_human_approval, false);
  assert.equal(settings.automation.approval_policy, "standing-authorisation");
  assert.equal(settings.automation.standing_authorisation_date, "2026-11-20");
  assert.equal(settings.automation.monthly_post_limit, 20);
  assert.equal(settings.automation.weekend_event_publishing, "paused");
  assert.equal(settings.image_rules.carousel_images_min, 3);
  assert.equal(settings.image_rules.carousel_images_max, 6);
  assert.match(settings.image_rules.overlay_policy, /immagini pulite/);
});

test("rejects settings that revive obsolete Instagram policy", () => {
  const candidate = structuredClone(settings);
  candidate.cadence.push({ day: "Friday", local_time: "10:00", kind: "weekend-events" });
  candidate.automation.require_human_approval = true;
  candidate.automation.weekend_event_publishing = "enabled";
  const errors = validateSocialSettings(candidate);
  assert.ok(errors.some(error => error.includes("cadence")));
  assert.ok(errors.some(error => error.includes("standing authorisation")));
  assert.ok(errors.some(error => error.includes("weekend-event")));
});

test("allows an approved post with no hashtags", () => {
  assert.deepEqual(validateSocialPost({ ...approvedPost, hashtags: [] }), []);
});

test("blocks approval when the approval record is incomplete", () => {
  const post = { ...approvedPost, approval: { status: "pending" } };
  assert.ok(validateSocialPost(post).some(error => error.includes("complete approval record")));
});

test("blocks an overlay that has not been rendered into a publishable image", () => {
  const post = { ...approvedPost, overlay: { enabled: true, headline: "Test", rendered_src: "" } };
  assert.ok(validateSocialPost(post).some(error => error.includes("must be rendered")));
});

test("blocks hashtag clouds and duplicate carousel ordering", () => {
  const post = {
    ...approvedPost,
    hashtags: ["#One", "#Two", "#Three", "#Four", "#Five", "#Six"],
    images: [approvedPost.images[0], { ...approvedPost.images[0], src: "/assets/instagram/test/test - 2.jpg" }]
  };
  const errors = validateSocialPost(post);
  assert.ok(errors.some(error => error.includes("no more than five hashtags")));
  assert.ok(errors.some(error => error.includes("order 1 is duplicated")));
});
