import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workflow = fs.readFileSync(".github/workflows/site-checks.yml", "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));

test("the validation workflow cannot create deployment-amplifying commits", () => {
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /git\s+push/);
  assert.doesNotMatch(workflow, /Sync generated pages/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /concurrency:/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
});

test("production builds regenerate assets and use the locked Wrangler version", () => {
  assert.equal(packageJson.scripts.build, "npm run prerender");
  assert.equal(packageJson.scripts.test, "npm run build && npm run test:generated");
  assert.equal(packageJson.devDependencies.wrangler, "4.129.0");
  assert.equal(packageLock.packages["node_modules/wrangler"].version, "4.129.0");
  assert.match(workflow, /run:\s*npm ci/);
  assert.match(workflow, /run:\s*npx wrangler deploy --dry-run/);
});
