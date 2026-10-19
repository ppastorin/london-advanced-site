import test from "node:test";
import assert from "node:assert/strict";
import { validateSocialPost } from "../scripts/validate-social.mjs";

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

test("blocks approval when the human approval record is incomplete", () => {
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
  assert.ok(errors.some(error => error.includes("one and five hashtags")));
  assert.ok(errors.some(error => error.includes("order 1 is duplicated")));
});
