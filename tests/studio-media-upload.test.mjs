import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTargetPath,
  blobCacheSignature,
  deploymentPaths,
  folderAdjustedPath,
  formatBytes,
  gitBlobSha,
  isSupportedImage,
  normaliseRelativePath,
  prepareBatch,
  shouldRemoveOuterFolder
} from "../studio/media/media.js";

function file(name, webkitRelativePath, size = 1024) {
  return { name, webkitRelativePath, size };
}

test("media paths preserve post folders and reject traversal", () => {
  assert.equal(normaliseRelativePath("Instagram posts\\001-weekend\\cover.jpg"), "Instagram posts/001-weekend/cover.jpg");
  assert.equal(normaliseRelativePath("../cover.jpg"), "");
  assert.equal(buildTargetPath("001-weekend/cover.jpg"), "assets/instagram/001-weekend/cover.jpg");
  assert.deepEqual(deploymentPaths("assets/instagram/001-weekend/cover.jpg"), [
    "assets/instagram/001-weekend/cover.jpg",
    "dist/assets/instagram/001-weekend/cover.jpg"
  ]);
});

test("a common parent is removed while each post folder is retained", () => {
  const paths = [
    "Instagram posts/001-weekend/cover.jpg",
    "Instagram posts/002-journal/detail.webp"
  ];
  assert.equal(shouldRemoveOuterFolder(paths), true);
  assert.equal(folderAdjustedPath(paths[0], true), "001-weekend/cover.jpg");
  assert.equal(shouldRemoveOuterFolder(["001-weekend/cover.jpg"]), false);
});

test("folder batches keep valid images and report unsupported files", () => {
  const batch = prepareBatch([
    file("cover.jpg", "Instagram posts/001-weekend/cover.jpg", 2048),
    file("detail.webp", "Instagram posts/002-journal/detail.webp", 4096),
    file("notes.txt", "Instagram posts/002-journal/notes.txt", 20)
  ]);
  assert.deepEqual(batch.accepted.map(item => item.targetPath), [
    "assets/instagram/001-weekend/cover.jpg",
    "assets/instagram/002-journal/detail.webp"
  ]);
  assert.equal(batch.rejected.length, 1);
  assert.equal(batch.rejected[0].reason, "unsupported image type");
});

test("supported formats and byte labels cover Studio feedback", () => {
  assert.equal(isSupportedImage("post.AVIF"), true);
  assert.equal(isSupportedImage("post.heic"), false);
  assert.equal(formatBytes(2 * 1024 * 1024), "2.0 MB");
});

test("browser recovery calculates the canonical Git blob SHA", async () => {
  const blob = new Blob(["hello\n"]);
  assert.equal(await gitBlobSha(blob), "ce013625030ba8dba906f756967f9e9ca394464a");
  assert.equal(blobCacheSignature({
    targetPath: "assets/instagram/001/cover.jpg",
    file: { size: 6, lastModified: 1234 }
  }), "assets/instagram/001/cover.jpg|6|1234");
});
