import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const script = await readFile(new URL('../dist/loo/loo.js', import.meta.url), 'utf8');
const sample = {
  active: true, name: 'Test public toilet', category: 'public_toilet',
  lat: 51.50, lon: -0.12, fee_pence: 0, source_url: 'https://example.org',
  source_name: 'Council', last_verified: '2026-09-24'
};

for (const [language, page] of [
  ['en-GB', '../dist/loo/index.html'],
  ['it-IT', '../dist/it/loo/index.html']
]) {
  test(`${language} search form handles button and Enter submissions`, async () => {
    const html = await readFile(new URL(page, import.meta.url), 'utf8');
    assert.match(html, /<form id="search">[\s\S]*?<input id="where"[\s\S]*?<button type="submit">/);

    const elements = new Map(['#search', '#where', '#status', '#results-section',
      '#result-title', '#results', '#map-toggle', '#map-wrap', '#nearby']
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
          ? { loos: [sample] }
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
      assert.match(elements.get('#results').innerHTML, /Test public toilet/);
    }
    assert.ok(requests.some(url => url.startsWith('/api/loo-geocode?q=')));
    elements.get('#map-toggle').onclick();
    assert.equal(elements.get('#map-wrap').hidden, false);
    assert.equal(elements.get('#map-toggle').textContent,
      language === 'it-IT' ? 'Nascondi mappa' : 'Hide map');
  });
}
