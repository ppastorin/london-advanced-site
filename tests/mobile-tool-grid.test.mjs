import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(new URL("../dist/styles.css", import.meta.url), "utf8");

function mediaBlock(maxWidth) {
  const start = styles.indexOf(`@media (max-width: ${maxWidth}px)`);
  assert.notEqual(start, -1, `missing ${maxWidth}px media query`);

  let depth = 0;
  for (let index = styles.indexOf("{", start); index < styles.length; index += 1) {
    if (styles[index] === "{") depth += 1;
    if (styles[index] === "}") depth -= 1;
    if (depth === 0) return styles.slice(start, index + 1);
  }

  throw new Error(`unterminated ${maxWidth}px media query`);
}

test("tool cards cannot create implicit columns on tablet or mobile", () => {
  const tablet = mediaBlock(900);
  const mobile = mediaBlock(600);

  assert.match(tablet, /\.app-grid\s*>\s*\.app-card\s*{[^}]*grid-column:\s*span 1;/s);
  assert.match(mobile, /\.app-grid\s*>\s*\.app-card\s*{[^}]*grid-column:\s*span 1;/s);
  assert.match(mobile, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});
