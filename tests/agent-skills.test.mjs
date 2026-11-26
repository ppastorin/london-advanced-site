import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const agents = fs.readFileSync("AGENTS.md", "utf8");
const deployment = fs.readFileSync(".agents/skills/la-safe-deployment/SKILL.md", "utf8");
const ui = fs.readFileSync(".agents/skills/la-ui-validation/SKILL.md", "utf8");
const workflow = fs.readFileSync(".github/workflows/site-checks.yml", "utf8");

test("AGENTS keeps repository-wide safeguards and routes specialist work", () => {
  assert.ok(agents.length < 3500, "AGENTS.md should stay concise");
  assert.match(agents, /la-safe-deployment/);
  assert.match(agents, /la-ui-validation/);
  assert.match(agents, /Never expose or commit credentials/);
  assert.match(agents, /Never deploy directly with Wrangler/);
});

test("safe deployment preserves every release gate", () => {
  assert.match(deployment, /^---\nname: la-safe-deployment\ndescription: .+\n---/);
  assert.match(deployment, /full `npm test`/);
  assert.match(deployment, /exact head SHA/);
  assert.match(deployment, /changed-file manifest/);
  assert.match(deployment, /Workers Builds: london-advanced-site/);
  assert.match(deployment, /Never run `wrangler deploy`/);
  assert.match(deployment, /git hash-object <local-file>/);
  assert.match(deployment, /live readback is\s+incomplete/);
});

test("UI validation requires representative visual evidence", () => {
  assert.match(ui, /^---\nname: la-ui-validation\ndescription: .+\n---/);
  assert.match(ui, /English and Italian variants/);
  assert.match(ui, /390 x 844/);
  assert.match(ui, /1440 x 900/);
  assert.match(ui, /no horizontal overflow, clipping or unsafe text placement/);
  assert.match(ui, /canonical live URL/);
  assert.match(ui, /la-safe-deployment/);
});

test("skill-only changes trigger site safety checks", () => {
  const occurrences = workflow.match(/\.agents\/skills\/\*\*/g) ?? [];
  assert.equal(occurrences.length, 2);
});
