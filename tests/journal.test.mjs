import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isPublicPair } from "../scripts/build-journal.mjs";

const approved = {
  article_id: "test-article",
  editorial_status: "published",
  published_at: "2026-09-27T09:00:00+01:00",
  approval: {
    status: "approved",
    approved_by: "Paolo Pastorino",
    approved_at: "2026-09-27T08:55:00+01:00"
  }
};

test("publication gate requires two fully approved language records", () => {
  assert.equal(isPublicPair(approved, approved), true);
  assert.equal(isPublicPair({ ...approved, editorial_status: "review" }, approved), false);
  assert.equal(isPublicPair({ ...approved, approval: { ...approved.approval, approved_by: "" } }, approved), false);
  assert.equal(isPublicPair(approved, null), false);
});

test("the seed article remains unpublished", async () => {
  const [english, italian] = await Promise.all([
    readFile(new URL("../content/journal/va-east-storehouse.en.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../content/journal/va-east-storehouse.it.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  assert.equal(english.article_id, italian.article_id);
  assert.equal(isPublicPair(english, italian), false);
  assert.equal(english.editorial_status, "draft");
  assert.equal(italian.editorial_status, "draft");
});
