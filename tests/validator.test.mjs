import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateDigest } from '../scripts/validate-events.mjs';

const valid = JSON.parse(await readFile(new URL('../dist/data/events.json', import.meta.url), 'utf8'));

test('accepts the supplied full-list feed', () => {
  assert.deepEqual(validateDigest(valid), []);
});

function expandTo(candidate, count) {
  while (candidate.events.length < count) {
    const copy = structuredClone(candidate.events[0]);
    copy.id = `additional-event-${candidate.events.length + 1}`;
    copy.duplicate_key = `additional-venue|2099-01-${String(candidate.events.length + 2).padStart(2, '0')}|event-${candidate.events.length + 1}`;
    candidate.events.push(copy);
  }
  return candidate;
}

test('accepts up to eight approved events while featuring only three', () => {
  const candidate = expandTo(structuredClone(valid), 8);
  assert.deepEqual(validateDigest(candidate), []);
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

test('rejects more than eight events', () => {
  const candidate = expandTo(structuredClone(valid), 9);
  assert.ok(validateDigest(candidate).some((error) => error.includes('between 1 and 8')));
});

test('rejects more than three homepage selections', () => {
  const candidate = expandTo(structuredClone(valid), 4);
  candidate.homepage_event_ids.push(candidate.events[3].id);
  assert.ok(validateDigest(candidate).some((error) => error.includes('homepage_event_ids')));
});

test('rejects a homepage selection that is missing from the feed', () => {
  const candidate = structuredClone(valid);
  candidate.homepage_event_ids[0] = 'missing-event';
  assert.ok(validateDigest(candidate).some((error) => error.includes('references missing event id')));
});

test('accepts the approved Ticketmaster UK affiliate deep link', () => {
  const candidate = structuredClone(valid);
  candidate.events[0].booking.url = 'https://www.ticketmaster.co.uk/fontaines-dc-tickets/artist/5281142';
  candidate.events[0].booking.affiliate_url = 'https://ticketmaster.evyy.net/c/7729619/1965662/24023?u=https%3A%2F%2Fwww.ticketmaster.co.uk%2Ffontaines-dc-tickets%2Fartist%2F5281142';
  assert.deepEqual(validateDigest(candidate), []);
});

test('rejects an affiliate link for a different publisher account', () => {
  const candidate = structuredClone(valid);
  candidate.events[0].booking.url = 'https://www.ticketmaster.co.uk/fontaines-dc-tickets/artist/5281142';
  candidate.events[0].booking.affiliate_url = 'https://ticketmaster.evyy.net/c/9999999/1965662/24023?u=https%3A%2F%2Fwww.ticketmaster.co.uk%2Ffontaines-dc-tickets%2Fartist%2F5281142';
  assert.ok(validateDigest(candidate).some((error) => error.includes('approved Ticketmaster UK affiliate account')));
});

test('rejects an affiliate destination that differs from the direct booking URL', () => {
  const candidate = structuredClone(valid);
  candidate.events[0].booking.url = 'https://www.ticketmaster.co.uk/fontaines-dc-tickets/artist/5281142';
  candidate.events[0].booking.affiliate_url = 'https://ticketmaster.evyy.net/c/7729619/1965662/24023?u=https%3A%2F%2Fwww.ticketmaster.co.uk%2Fanother-artist';
  assert.ok(validateDigest(candidate).some((error) => error.includes('exactly match')));
});
