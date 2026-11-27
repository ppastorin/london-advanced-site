import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const skillsRoot = ".agents/skills";
const stopWords = new Set([
  "and", "any", "for", "from", "into", "london", "advanced", "other", "the", "through",
  "throughout", "use", "when", "with"
]);

const triggerCases = {
  "la-events-digest": {
    positive: "Refresh the weekend events digest from Gmail messages labelled LA-Events and update the homepage event highlights.",
    nearMiss: "Recommend a few expensive arena concerts in Manchester next month.",
    explicit: "@la-events-digest run the approved manual digest workflow."
  },
  "la-growth-intelligence": {
    positive: "Review Search Console and GA4 after the release, validate the analytics and prioritise the growth backlog.",
    nearMiss: "Calculate a twelve-month revenue forecast for a retail product.",
    explicit: "@la-growth-intelligence assess the supplied measurement evidence."
  },
  "la-instagram": {
    positive: "Prepare and schedule an Instagram carousel through Studio and Metricool, then reconcile the planner.",
    nearMiss: "Resize one photograph for a private offline portfolio.",
    explicit: "@la-instagram validate this approved social queue item."
  },
  "la-markets-refresh": {
    positive: "Correct recurrence dates and holiday exceptions in the Markets Calendar, validate them and publish the refresh.",
    nearMiss: "Compare supermarket grocery prices across the United Kingdom.",
    explicit: "@la-markets-refresh recheck the saved organiser sources."
  },
  "la-safe-deployment": {
    positive: "Merge this release through GitHub and verify the Cloudflare production rollout.",
    nearMiss: "Explain edge computing concepts without changing any repository.",
    explicit: "@la-safe-deployment merge this approved pull request safely."
  },
  "la-ui-validation": {
    positive: "Validate the responsive navigation, forms and accessibility across the English and Italian interface.",
    nearMiss: "Proofread an internal Markdown note for spelling only.",
    explicit: "@la-ui-validation check the mobile and desktop layouts."
  }
};

function readDescriptions() {
  return Object.fromEntries(fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const skill = fs.readFileSync(path.join(skillsRoot, entry.name, "SKILL.md"), "utf8");
      const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/);
      assert.ok(frontmatter, `${entry.name} must have YAML frontmatter`);
      const name = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
      const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
      assert.equal(name, entry.name, `${entry.name} folder and frontmatter name must match`);
      assert.ok(description, `${entry.name} must have a trigger description`);
      return [name, description];
    }));
}

function tokens(value) {
  return new Set(value.toLocaleLowerCase("en-GB")
    .replaceAll(/[^a-z0-9@-]+/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 2 && !stopWords.has(token)));
}

function triggerCandidates(prompt, descriptions) {
  const explicit = Object.keys(descriptions).filter(name =>
    new RegExp(`(?:^|\\s)@${name}(?=\\s|$)`, "i").test(prompt)
  );
  if (explicit.length) return explicit;

  const promptTokens = tokens(prompt);
  const descriptionTokens = Object.fromEntries(Object.entries(descriptions)
    .map(([name, description]) => [name, tokens(description)]));
  const frequency = new Map();
  for (const skillTokens of Object.values(descriptionTokens)) {
    for (const token of skillTokens) frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }

  const scores = Object.fromEntries(Object.entries(descriptionTokens).map(([name, skillTokens]) => {
    let score = 0;
    for (const token of promptTokens) {
      if (skillTokens.has(token)) score += frequency.get(token) === 1 ? 2 : 1;
    }
    return [name, score];
  }));
  const best = Math.max(...Object.values(scores));
  if (best < 3) return [];
  return Object.keys(scores).filter(name => scores[name] === best).sort();
}

const descriptions = readDescriptions();

test("every repository skill has one positive, near-miss and explicit trigger case", () => {
  assert.deepEqual(Object.keys(triggerCases).sort(), Object.keys(descriptions).sort());
  for (const [name, cases] of Object.entries(triggerCases)) {
    assert.deepEqual(Object.keys(cases).sort(), ["explicit", "nearMiss", "positive"]);
    for (const [kind, prompt] of Object.entries(cases)) {
      assert.ok(prompt.trim().length > 20, `${name} ${kind} prompt must be realistic`);
    }
  }
});

for (const [name, cases] of Object.entries(triggerCases)) {
  test(`${name} triggers for a positive prompt`, () => {
    assert.deepEqual(triggerCandidates(cases.positive, descriptions), [name]);
  });

  test(`${name} does not trigger for a near-miss prompt`, () => {
    assert.deepEqual(triggerCandidates(cases.nearMiss, descriptions), []);
  });

  test(`${name} triggers when invoked explicitly`, () => {
    assert.deepEqual(triggerCandidates(cases.explicit, descriptions), [name]);
  });
}
