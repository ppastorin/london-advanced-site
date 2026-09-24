import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const script = await readFile(new URL('../dist/loo/loo.js', import.meta.url), 'utf8');
const sample = {
  active: true, name: 'Test shopping toilet', category: 'shopping_centre',
  lat: 51.50, lon: -0.12, fee_pence: 150, accessible: true, baby_change: true,
  source_url: 'https://example.org',
  source_name: 'Council', last_verified: '2026-09-24'
};
const venues = [sample,
  { ...sample, name: 'Liberty London', lat: 51.51436, lon: -0.14063 },
  { ...sample, name: 'Selfridges London', lat: 51.51445, lon: -0.15291 },
  ...Array.from({ length: 12 }, (_, i) => ({ ...sample, name: `Further toilet ${i + 1}`, lat: 51.6 + i / 100 }))
];

for (const [language, page] of [
  ['en-GB', '../dist/loo/index.html'],
  ['it-IT', '../dist/it/loo/index.html']
]) {
  test(`${language} search form handles button and Enter submissions`, async () => {
    const html = await readFile(new URL(page, import.meta.url), 'utf8');
    assert.match(html, /<form id="search">[\s\S]*?<input id="where"[\s\S]*?<button type="submit">/);
    assert.match(html, /id="result-count"[\s\S]*?id="show-more"/);

    const elements = new Map(['#search', '#where', '#status', '#results-section',
      '#result-title', '#results', '#result-count', '#show-more', '#map-toggle', '#map-wrap', '#nearby']
      .map(id => [id, { hidden: id === '#results-section' || id === '#map-wrap',
        value: id === '#where' ? 'Trafalgar Square' : '',
        offsetTop: 0, setAttribute() {} }]));
    const requests = [];
    const context = {
      document: { documentElement: { lang: language }, querySelector: id => elements.get(id) },
      window: { scrollTo() {} },
      fetch: async url => {
        requests.push(url);
        return { ok: true, json: async () => url === '/api/loos'
          ? { loos: venues }
          : { ok: true, lat: 51.51, lon: -0.12, label: 'Trafalgar Square' } };
      },
      setTimeout, encodeURIComponent, Intl, Date
    };
    vm.runInNewContext(script, context, { filename: 'loo.js' });
    for (const action of ['button', 'Enter']) {
      let prevented = false;
      await elements.get('#search').onsubmit({ preventDefault() { prevented = true; } });
      assert.equal(prevented, true, `${action} must prevent navigation`);
      assert.equal(elements.get('#where').value, 'Trafalgar Square');
      assert.equal(elements.get('#results-section').hidden, false);
      const card = elements.get('#results').innerHTML;
      assert.match(card, /Test shopping toilet/);
      assert.match(card, /£1\.50/);
      assert.match(card, new RegExp(language === 'it-IT' ? 'Accessibile' : 'Accessible'));
      assert.match(card, new RegExp(language === 'it-IT' ? 'Fasciatoio' : 'Baby change'));
      assert.doesNotMatch(card, /\$\{IT\?|no charge stated|nessun costo indicato/);
    }
    assert.ok(requests.some(url => url.startsWith('/api/loo-geocode?q=')));
    assert.match(elements.get('#result-count').textContent, /10.*15/);
    assert.equal(elements.get('#show-more').hidden, false);
    elements.get('#show-more').onclick();
    assert.match(elements.get('#results').innerHTML, /Further toilet 12/);
    assert.match(elements.get('#result-count').textContent, /15.*15/);
    assert.equal(elements.get('#show-more').hidden, true);

    for (const venue of ['Liberty', 'Selfridges']) {
      elements.get('#where').value = venue;
      const geocodes = requests.filter(url => url.startsWith('/api/loo-geocode?')).length;
      await elements.get('#search').onsubmit({ preventDefault() {} });
      assert.match(elements.get('#result-title').textContent, new RegExp(venue));
      assert.match(elements.get('#results').innerHTML, new RegExp(`<h3>${venue} London</h3>`));
      assert.equal(requests.filter(url => url.startsWith('/api/loo-geocode?')).length, geocodes);
    }
    elements.get('#map-toggle').onclick();
    assert.equal(elements.get('#map-wrap').hidden, false);
    assert.equal(elements.get('#map-toggle').textContent,
      language === 'it-IT' ? 'Nascondi mappa' : 'Hide map');
  });
}
