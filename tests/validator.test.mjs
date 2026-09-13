import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateDigest } from '../scripts/validate-events.mjs';

const valid = JSON.parse(await readFile(new URL('../dist/data/events.json', import.meta.url), 'utf8'));

test('accepts the supplied Phase 1 feed', () => {
  assert.deepEqual(validateDigest(valid), []);
});

test('rejects an event below the editorial threshold', () => {
  const candidate = structuredClone(valid);
  candidate.events[0].advanced.score = 6;
  assert.ok(validateDigest(candidate).some((error) => error.includes('score')));
});

test('rejects an unverified event', () => {
  const candidate = structuredClone(valid);
  candidate.events[0].verification.confidence = 'medium';
  assert.ok(validateDigest(candidate).some((error) => error.includes('confidence')));
});

test('rejects a price above £15', () => {
  const candidate = structuredClone(valid);
  candidate.events[0].price = { amount_gbp: 18, display: '£18', classification: 'exceptional' };
  assert.ok(validateDigest(candidate).some((error) => error.includes('amount_gbp')));
});

test('rejects duplicate events', () => {
  const candidate = structuredClone(valid);
  candidate.events[1].duplicate_key = candidate.events[0].duplicate_key;
  assert.ok(validateDigest(candidate).some((error) => error.includes('duplicate_key is duplicated')));
});

test('rejects more than three homepage cards', () => {
  const candidate = structuredClone(valid);
  candidate.events.push(structuredClone(candidate.events[0]));
  assert.ok(validateDigest(candidate).some((error) => error.includes('between 1 and 3')));
});
