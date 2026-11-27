import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const agents = fs.readFileSync("AGENTS.md", "utf8");
const deployment = fs.readFileSync(".agents/skills/la-safe-deployment/SKILL.md", "utf8");
const ui = fs.readFileSync(".agents/skills/la-ui-validation/SKILL.md", "utf8");
const events = fs.readFileSync(".agents/skills/la-events-digest/SKILL.md", "utf8");
const digestPrompt = fs.readFileSync("automation/DIGEST_TO_GITHUB_PROMPT.md", "utf8");
const eventsSchema = fs.readFileSync("schema/events.schema.json", "utf8");
const eventsValidator = fs.readFileSync("scripts/validate-events.mjs", "utf8");
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

test("events digest owns the five-day source and publication workflow", () => {
  assert.match(events, /^---\nname: la-events-digest\ndescription: .+\n---/);
  assert.match(events, /rolling last five\s+days/);
  assert.match(events, /every\s+other sender carrying the label/);
  assert.match(events, /actual, trimmed\s+publication names/);
  assert.match(events, /node scripts\/validate-events\.mjs <candidate\.json>/);
  assert.match(events, /dist\/data\/events\.json` only/);
  assert.match(events, /automation\/events-YYYY-MM-DD-HHMM/);
  assert.match(events, /la-safe-deployment/);
  assert.match(events, /live\s+`\/data\/events\.json`/);
});

test("events source model stays schema and validator aligned", () => {
  assert.match(eventsSchema, /"newsletter_sources"/);
  assert.match(eventsSchema, /"pattern": "\^\\\\S\(\?:\.\*\\\\S\)\?\$"/);
  assert.match(eventsValidator, /toLocaleLowerCase\('en-GB'\)/);
  assert.match(eventsValidator, /must be trimmed/);
});

test("scheduled digest prompt delegates instead of duplicating policy", () => {
  assert.ok(digestPrompt.length < 1000, "scheduled prompt should stay concise");
  assert.match(digestPrompt, /\.agents\/skills\/la-events-digest\/SKILL\.md/);
  assert.match(digestPrompt, /Sunday and Thursday 11:00/);
  assert.doesNotMatch(digestPrompt, /non-obviousness/);
  assert.doesNotMatch(digestPrompt, /Ticketmaster affiliate/);
});

test("skill-only changes trigger site safety checks", () => {
  const occurrences = workflow.match(/\.agents\/skills\/\*\*/g) ?? [];
  assert.equal(occurrences.length, 2);
  const automationOccurrences = workflow.match(/automation\/\*\*/g) ?? [];
  assert.equal(automationOccurrences.length, 2);
});
