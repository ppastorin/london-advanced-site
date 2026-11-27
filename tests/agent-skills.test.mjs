import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const agents = fs.readFileSync("AGENTS.md", "utf8");
const deployment = fs.readFileSync(".agents/skills/la-safe-deployment/SKILL.md", "utf8");
const ui = fs.readFileSync(".agents/skills/la-ui-validation/SKILL.md", "utf8");
const events = fs.readFileSync(".agents/skills/la-events-digest/SKILL.md", "utf8");
const markets = fs.readFileSync(".agents/skills/la-markets-refresh/SKILL.md", "utf8");
const instagram = fs.readFileSync(".agents/skills/la-instagram/SKILL.md", "utf8");
const growth = fs.readFileSync(".agents/skills/la-growth-intelligence/SKILL.md", "utf8");
const digestPrompt = fs.readFileSync("automation/DIGEST_TO_GITHUB_PROMPT.md", "utf8");
const marketsPrompt = fs.readFileSync("automation/MARKETS_REFRESH_PROMPT.md", "utf8");
const instagramPreparePrompt = fs.readFileSync("automation/INSTAGRAM_PREPARE_PROMPT.md", "utf8");
const instagramSchedulePrompt = fs.readFileSync("automation/INSTAGRAM_SCHEDULE_PROMPT.md", "utf8");
const instagramPausedPrompt = fs.readFileSync("automation/INSTAGRAM_WEEKEND_PAUSED_PROMPT.md", "utf8");
const growthPrompt = fs.readFileSync("automation/GROWTH_INTELLIGENCE_REVIEW_PROMPT.md", "utf8");
const growthProgress = fs.readFileSync("docs/agent/growth-intelligence/PROGRESS.md", "utf8");
const growthReview = fs.readFileSync("docs/agent/growth-intelligence/reviews/2026-12-21-phase-2.md", "utf8");
const studioConfig = fs.readFileSync("studio/config.yml", "utf8");
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
  assert.ok(digestPrompt.length < 450, "scheduled prompt should stay concise");
  assert.match(digestPrompt, /\.agents\/skills\/la-events-digest\/SKILL\.md/);
  assert.doesNotMatch(digestPrompt, /Sunday and Thursday 11:00/);
  assert.doesNotMatch(digestPrompt, /non-obviousness/);
  assert.doesNotMatch(digestPrompt, /Ticketmaster affiliate/);
});

test("markets refresh preserves evidence and excludes bootstrap scripts", () => {
  assert.match(markets, /^---\nname: la-markets-refresh\ndescription: .+\n---/);
  assert.match(markets, /content\/markets\.json` as the source of truth/);
  assert.match(markets, /batches of at most ten series/);
  assert.match(markets, /coming three full calendar months/);
  assert.match(markets, /announced dates separate from calculated recurrence/);
  assert.match(markets, /nothing\s+substantive changed, stop without producing an empty release/);
  assert.match(markets, /la-safe-deployment/);
  assert.equal(fs.existsSync("scripts/agent/seed-markets.mjs"), false);
  assert.equal(fs.existsSync("scripts/agent/integrate-markets.mjs"), false);
  for (const filename of ["seed-markets.mjs", "integrate-markets.mjs"]) {
    const quarantined = fs.readFileSync(`scripts/quarantine/markets-initial/${filename}`, "utf8");
    assert.match(quarantined, /^\/\/ QUARANTINED:/);
    assert.match(quarantined, /throw new Error\('Quarantined one-off market/);
  }
});

test("scheduled markets prompt delegates and blocks the initial scripts", () => {
  assert.ok(marketsPrompt.length < 450, "markets scheduled prompt should stay concise");
  assert.match(marketsPrompt, /\.agents\/skills\/la-markets-refresh\/SKILL\.md/);
  assert.match(marketsPrompt, /scripts\/quarantine\/markets-initial/);
  assert.doesNotMatch(marketsPrompt, /London Car Boot Co/);
});

test("Instagram skill owns preparation, scheduling and media safety", () => {
  assert.match(instagram, /^---\nname: la-instagram\ndescription: .+\n---/);
  assert.match(instagram, /content\/social\/settings\.json` as policy/);
  assert.match(instagram, /three to six\s+distinct images/);
  assert.match(instagram, /zero to the configured maximum/);
  assert.match(instagram, /x=96\.\.850/);
  assert.match(instagram, /stable\s+Metricool UUID/);
  assert.match(instagram, /autoPublish: true/);
  assert.match(instagram, /la-safe-deployment/);
});

test("Instagram prompts delegate without repeating standing policy", () => {
  for (const prompt of [instagramPreparePrompt, instagramSchedulePrompt, instagramPausedPrompt]) {
    assert.ok(prompt.length < 450, "Instagram automation prompt should stay concise");
    assert.match(prompt, /la-instagram\/SKILL\.md/);
    assert.doesNotMatch(prompt, /Día de los Muertos/);
    assert.doesNotMatch(prompt, /x=96\.\.850/);
  }
});

test("Studio settings cannot default back to obsolete Instagram rules", () => {
  const settingsSection = studioConfig.slice(studioConfig.indexOf("- name: social_settings"), studioConfig.indexOf("- name: social_posts"));
  assert.doesNotMatch(settingsSection, /weekend-events/);
  assert.match(settingsSection, /caption_words_min[^\n]+default: 40/);
  assert.match(settingsSection, /caption_words_max[^\n]+default: 110/);
  assert.match(settingsSection, /require_human_approval[^\n]+default: false/);
  assert.match(settingsSection, /monthly_post_limit[^\n]+default: 20/);
  assert.match(settingsSection, /weekend_event_publishing[^\n]+default: paused/);
});

test("growth intelligence separates durable methodology from operational state", () => {
  assert.match(growth, /^---\nname: la-growth-intelligence\ndescription: .+\n---/);
  assert.match(growth, /Pull page totals, query totals and query-to-page rows separately/);
  assert.match(growth, /consented subset, not total usage/);
  assert.match(growth, /never add or merge their totals/);
  assert.match(growth, /thresholds in the dated review input/);
  assert.match(growth, /A review does not authorise production changes/);
  assert.match(growth, /la-safe-deployment/);
  assert.doesNotMatch(growth, /23 November to 20 December 2026/);
  assert.doesNotMatch(growth, /property `387640180`/);

  assert.match(growthProgress, /Phase 2A consent-aware tool events: deployed/);
  assert.match(growthProgress, /reviews\/2026-12-21-phase-2\.md/);
  assert.doesNotMatch(growthProgress, /1,348 Search Console/);
  assert.doesNotMatch(growthProgress, /Window: 2026-10-24/);
});

test("dated growth review owns its inputs and no-change boundary", () => {
  assert.match(growthReview, /Baseline window: 24 October to 20 November 2026/);
  assert.match(growthReview, /Post-release window: 23 November to 20 December 2026/);
  assert.match(growthReview, /Minimum decision volume: 200 page impressions/);
  assert.match(growthReview, /deterioration of more than 1\.0 average-position point/);
  assert.match(growthReview, /Highgate Cemetery/);
  assert.match(growthReview, /Parkland Walk/);
  assert.match(growthReview, /property `387640180`/);
  assert.match(growthReview, /fare_calculation_completed/);
  assert.match(growthReview, /Do not implement or deploy/);
});

test("scheduled growth prompt delegates without copying dated evidence", () => {
  assert.ok(growthPrompt.length < 450, "growth review prompt should stay concise");
  assert.match(growthPrompt, /la-growth-intelligence\/SKILL\.md/);
  assert.match(growthPrompt, /reviews\/2026-12-21-phase-2\.md/);
  assert.doesNotMatch(growthPrompt, /Highgate Cemetery/);
  assert.doesNotMatch(growthPrompt, /24 October to 20 November/);
  assert.doesNotMatch(growthPrompt, /fare_calculation_completed/);
});

test("agent, automation and schema changes trigger site safety checks", () => {
  for (const path of [".agents/**", "automation/**", "schema/**"]) {
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const occurrences = workflow.match(new RegExp(escaped, "g")) ?? [];
    assert.equal(occurrences.length, 2, `${path} must cover pull requests and pushes`);
  }
});
