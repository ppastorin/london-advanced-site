import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const homepage = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
const eventsPage = await readFile(new URL('../dist/events/events.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');

for (const [surface, source] of [['homepage', homepage], ['events page', eventsPage]]) {
  test(`${surface} renders approved affiliate links with disclosure and sponsored rel`, () => {
    assert.match(source, /ticketmaster\.evyy\.net/);
    assert.match(source, /\/c\/7729619\/1965662\/24023/);
    assert.match(source, /Ad · Book on Ticketmaster/);
    assert.match(source, /sponsored noopener noreferrer/);
    assert.match(source, /We may earn a commission at no extra cost to you\./);
  });
}

test('affiliate disclosure has dedicated styling', () => {
  assert.match(styles, /\.affiliate-note\s*\{/);
});
