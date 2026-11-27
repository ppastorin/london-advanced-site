import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const allowedStatuses = new Set(["draft", "review", "approved", "scheduled", "published", "archived"]);
const readyStatuses = new Set(["approved", "scheduled", "published"]);
const hashtagPattern = /^#[A-Za-z0-9_]+$/;
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function words(value) {
  return String(value || "").trim().match(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu)?.length || 0;
}

function validDate(value) {
  return Boolean(value) && Number.isFinite(Date.parse(value));
}

export function validateSocialSettings(settings) {
  const errors = [];
  const expectedCadence = [
    ["Tuesday", "18:30", "place"],
    ["Sunday", "10:00", "journal-or-tool"]
  ];
  const cadence = Array.isArray(settings?.cadence)
    ? settings.cadence.map(({ day, local_time, kind }) => [day, local_time, kind])
    : [];
  if (settings?.account !== "@londonadvanced") errors.push("settings: account must be @londonadvanced.");
  if (settings?.timezone !== "Europe/London") errors.push("settings: timezone must be Europe/London.");
  if (JSON.stringify(cadence) !== JSON.stringify(expectedCadence)) errors.push("settings: cadence must contain only the approved Tuesday and Sunday slots.");
  if (settings?.voice?.caption_words_min !== 40 || settings?.voice?.caption_words_max !== 110) errors.push("settings: caption range must be 40 to 110 words.");
  if (settings?.voice?.hashtags_min !== 0 || settings?.voice?.hashtags_max !== 5) errors.push("settings: hashtag range must be zero to five.");
  if (settings?.image_rules?.carousel_images_min !== 3 || settings?.image_rules?.carousel_images_max !== 6) errors.push("settings: carousel range must be three to six images.");
  if (settings?.automation?.require_human_approval !== false || settings?.automation?.approval_policy !== "standing-authorisation") errors.push("settings: standing authorisation must be active.");
  if (settings?.automation?.standing_authorisation_by !== "Paolo Pastorino" || settings?.automation?.standing_authorisation_date !== "2026-11-20") errors.push("settings: standing authorisation attribution is incomplete.");
  if (settings?.automation?.monthly_post_limit !== 20) errors.push("settings: monthly post limit must be 20.");
  if (settings?.automation?.weekend_event_publishing !== "paused") errors.push("settings: weekend-event publishing must remain paused.");
  return errors;
}

export function validateSocialPost(post, options = {}) {
  const errors = [];
  const label = post?.post_id || "unnamed post";
  const status = post?.editorial_status;
  const hashtags = Array.isArray(post?.hashtags) ? post.hashtags : [];
  const images = Array.isArray(post?.images) ? post.images : [];

  if (!idPattern.test(post?.post_id || "")) errors.push(`${label}: post_id must use lowercase words separated by hyphens.`);
  if (!post?.internal_title?.trim()) errors.push(`${label}: internal_title is required.`);
  if (!allowedStatuses.has(status)) errors.push(`${label}: editorial_status is not recognised.`);
  if (!post?.caption_it?.trim()) errors.push(`${label}: caption_it is required.`);
  if (words(post?.caption_it) > 220) errors.push(`${label}: caption_it exceeds 220 words.`);
  if (["italian-plus-english-summary", "bilingual"].includes(post?.language_mode) && !post?.caption_en?.trim()) {
    errors.push(`${label}: caption_en is required for ${post.language_mode}.`);
  }
  if (hashtags.length > 5) errors.push(`${label}: use no more than five hashtags.`);
  if (new Set(hashtags.map(tag => String(tag).toLowerCase())).size !== hashtags.length) errors.push(`${label}: hashtags must be unique.`);
  hashtags.forEach((tag, index) => {
    if (!hashtagPattern.test(tag)) errors.push(`${label}: hashtag ${index + 1} is invalid.`);
  });
  if (images.length > 10) errors.push(`${label}: Instagram carousel media is limited to ten files in this workflow.`);

  const imageOrders = new Set();
  const imagePaths = new Set();
  images.forEach((image, index) => {
    if (!Number.isInteger(image.order) || image.order < 1 || image.order > 10) errors.push(`${label}: image ${index + 1} has an invalid order.`);
    if (imageOrders.has(image.order)) errors.push(`${label}: image order ${image.order} is duplicated.`);
    imageOrders.add(image.order);
    if (!String(image.src || "").startsWith("/assets/instagram/") && !String(image.src || "").startsWith("/assets/social/")) {
      errors.push(`${label}: image ${index + 1} must use /assets/instagram/ or /assets/social/.`);
    }
    if (imagePaths.has(image.src)) errors.push(`${label}: image ${index + 1} is duplicated.`);
    imagePaths.add(image.src);
    if (!image.alt?.trim()) errors.push(`${label}: image ${index + 1} needs alternative text.`);
    if (options.projectRoot && image.src) {
      const absolutePath = path.join(options.projectRoot, image.src.replace(/^\//, ""));
      if (!fs.existsSync(absolutePath)) errors.push(`${label}: missing image ${image.src}.`);
    }
  });

  if (post?.scheduled_for && !validDate(post.scheduled_for)) errors.push(`${label}: scheduled_for is not a valid date and time.`);
  if (readyStatuses.has(status)) {
    if (post?.approval?.status !== "approved" || !post?.approval?.approved_by || !validDate(post?.approval?.approved_at)) {
      errors.push(`${label}: approved, scheduled and published posts require a complete approval record.`);
    }
    if (!validDate(post?.scheduled_for)) errors.push(`${label}: a publishable post requires scheduled_for.`);
    if (!images.length) errors.push(`${label}: a publishable post requires at least one image.`);
    if (!post?.source?.reference || !post?.source?.checked_at) errors.push(`${label}: a publishable post requires a checked editorial source.`);
    if (post?.overlay?.enabled && !post?.overlay?.rendered_src) errors.push(`${label}: an enabled overlay must be rendered before hand-off.`);
  }
  if (["scheduled", "published"].includes(status) && !post?.metricool?.planner_id) {
    errors.push(`${label}: scheduled and published posts require a Metricool planner ID.`);
  }
  if (status === "scheduled" && !validDate(post?.metricool?.scheduled_at)) errors.push(`${label}: scheduled posts require metricool.scheduled_at.`);
  if (status === "published" && !post?.metricool?.published_url) errors.push(`${label}: published posts require the Instagram URL.`);

  return errors;
}

export function validateSocialDirectory(directory, options = {}) {
  const errors = [];
  const seen = new Set();
  const files = fs.readdirSync(directory).filter(name => name.endsWith(".json")).sort();
  for (const filename of files) {
    let post;
    try {
      post = JSON.parse(fs.readFileSync(path.join(directory, filename), "utf8"));
    } catch (error) {
      errors.push(`${filename}: invalid JSON (${error.message}).`);
      continue;
    }
    if (seen.has(post.post_id)) errors.push(`${post.post_id}: duplicate post_id.`);
    seen.add(post.post_id);
    if (`${post.post_id}.json` !== filename) errors.push(`${filename}: filename must match post_id.`);
    errors.push(...validateSocialPost(post, options));
  }
  return { files, errors };
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirect) {
  const directory = path.resolve(process.argv[2] || "content/social/posts");
  if (!fs.existsSync(directory)) {
    console.error(`Social queue directory not found: ${directory}`);
    process.exit(1);
  }
  const projectRoot = path.resolve(directory, "../../..");
  const { files, errors } = validateSocialDirectory(directory, { projectRoot });
  const settingsPath = path.join(projectRoot, "content/social/settings.json");
  try {
    errors.unshift(...validateSocialSettings(JSON.parse(fs.readFileSync(settingsPath, "utf8"))));
  } catch (error) {
    errors.unshift(`settings: cannot read content/social/settings.json (${error.message}).`);
  }
  if (errors.length) {
    console.error(`Instagram queue validation failed:\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`Instagram queue validation passed for ${files.length} posts.`);
}
