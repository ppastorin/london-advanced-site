import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {addDays,calendarDays,day,expandMarkets,filterMarkets,londonToday,monthEnd,rangeBounds,validateFeed,weekendRange} from '../markets/engine.mjs';
import {marketCard} from '../markets/render.mjs';
const feed=JSON.parse(await readFile('content/markets.json','utf8'));
const all=expandMarkets(feed);
test('market data has valid bilingual records, sources, hours and unique stable occurrences',()=>{
 assert.deepEqual(validateFeed(feed),[]);assert.ok(feed.markets.length>=60);
 assert.equal(new Set(all.map(m=>m.occurrenceId)).size,all.length);
 assert.ok(all.some(m=>m.date>'2027-02-28'&&m.evidence==='announced'));
 assert.ok(all.every(m=>!['hounslow','giant-january','big-south-london'].includes(m.id)));
});
test('December flea audit includes the verified organiser, venue and council listings',()=>{
 const ids=['flea-london-hackney-bridge','go-east-strongroom','adams-antiques','bermondsey-antiques','portobello-green','deptford-bric-a-brac','brick-lane-flea','wanstead-vintage-fair','chiswick-antique-vintage','camden-passage','slc-beckenham','stardust-hampstead','bottle-factory-festive-flea','canada-water-craft-flea','diy-christmas-art','independent-ceramics','satanic-flea','second-life-brick-lane','hampstead-antique-collectors','peckham-vintage-kilo','walthamstow-craft-flea','slc-creekside','peckham-salvage-yard'];
 for(const id of ids)assert.ok(feed.markets.some(m=>m.id===id),`missing ${id}`);
 const december=all.filter(m=>m.category==='flea'&&m.date>='2026-12-01'&&m.date<='2026-12-31');
 assert.ok(new Set(december.map(m=>m.id)).size>=18);
 assert.ok(december.length>=60);
 const frock=all.find(m=>m.id==='frock'&&m.date==='2026-12-06');
 assert.equal(frock.start,'11:00');assert.equal(frock.end,'17:30');
 assert.ok(!all.some(m=>m.id==='bermondsey-antiques'&&m.date>='2026-12-24'&&m.date<='2027-01-03'));
 assert.ok(all.some(m=>m.id==='diy-christmas-art'&&m.date==='2026-12-12'));
 assert.ok(all.some(m=>m.id==='peckham-salvage-yard'&&m.date==='2027-01-17'));
 assert.ok(!all.some(m=>m.id==='peckham-salvage-yard'&&m.date==='2026-12-12'));
 assert.ok(!feed.markets.some(m=>m.id==='go-east-walthamstow-2026-12-12'));
});
test('Columbia Road Flower Market runs every Sunday in the verified coverage',()=>{
 const market=feed.markets.find(m=>m.id==='columbia-road-flower');
 assert.ok(market);assert.equal(market.category,'flowers');assert.deepEqual(market.recurrence.days,[0]);
 const dates=all.filter(m=>m.id===market.id);
 assert.ok(dates.length>=10);assert.ok(dates.every(m=>day(m.date).getUTCDay()===0));
 assert.ok(dates.every(m=>m.start==='08:00'&&m.end==='15:00'));
 assert.ok(!dates.some(m=>m.date>='2026-12-24'&&m.date<='2027-01-03'));
});
test('winter breaks and holiday uncertainty never become invented recurring events',()=>{
 for(const id of ['kew','chiswick-flower'])assert.ok(!all.some(m=>m.id===id&&m.date.startsWith('2027-01')));
 assert.ok(!all.some(m=>m.id==='bootyfull'&&m.date>'2026-12-13'&&m.date<'2027-02-07'));
 assert.ok(all.some(m=>m.id==='bootyfull'&&m.date==='2027-02-07'&&m.evidence==='announced'));
 assert.ok(!all.some(m=>m.evidence==='regular'&&m.date>='2026-12-24'&&m.date<='2027-01-03'));
 assert.ok(all.some(m=>m.id==='duck-chiswick'&&m.date==='2026-12-24'&&m.evidence==='announced'));
 assert.ok(!all.some(m=>m.evidence==='regular'&&m.date>feed.coverageEnd));
});
test('announced hours and venue override the same recurring day',()=>{
 const hall=all.filter(m=>m.id==='hall-sun'&&m.date==='2026-12-06');assert.equal(hall.length,1);assert.match(hall[0].venue,/East Lawn/);assert.equal(hall[0].evidence,'announced');
 const horniman=all.find(m=>m.id==='horniman'&&m.date==='2026-12-06');assert.equal(horniman.start,'10:00');assert.equal(horniman.end,'15:00');
});
test('calendar aligns December 2026 and handles leap months and London summer time',()=>{
 const days=calendarDays('2026-12-06');assert.equal(days[0],'2026-11-30');assert.equal(days[6],'2026-12-06');assert.equal(days.at(-1),'2027-01-03');assert.equal(new Set(days).size,days.length);
 assert.equal(monthEnd('2028-02-01'),'2028-02-29');assert.equal(addDays('2027-03-28',1),'2027-03-29');
 assert.equal(londonToday(new Date('2027-06-01T23:30:00Z')),'2027-06-02');
 assert.deepEqual(weekendRange('2026-11-22'),['2026-11-21','2026-11-22']);
});
test('category, area, multilingual query and date filters combine and hide past days',()=>{
 const result=filterMarkets(all,{query:'Chiswick',category:'carboot',area:'West',from:'2026-12-01',until:'2026-12-31',today:'2026-11-20'});
 assert.deepEqual(result.map(m=>m.id),['chiswick-boot']);
 assert.equal(filterMarkets(all,{query:'Chiswick',category:'carboot',area:'East'}).length,0);
 assert.ok(filterMarkets(all,{query:'produttori',category:'farmers',today:'2027-02-01'}).length);
});
test('date ranges are inclusive, accept one bound and safely reorder reversed bounds',()=>{
 assert.deepEqual(rangeBounds('2026-12-01','2026-12-07'),['2026-12-01','2026-12-07']);
 assert.deepEqual(rangeBounds('2026-12-07','2026-12-01'),['2026-12-01','2026-12-07']);
 assert.deepEqual(rangeBounds('2026-12-03',''),['2026-12-03','2026-12-03']);
 assert.equal(rangeBounds('bad',''),null);
 const result=filterMarkets(all,{from:'2026-12-01',until:'2026-12-07'});
 assert.ok(result.some(m=>m.date==='2026-12-01'));assert.ok(result.some(m=>m.date==='2026-12-07'));
 assert.ok(result.every(m=>m.date>='2026-12-01'&&m.date<='2026-12-07'));
});
test('cards escape untrusted fields and distinguish missing hours and category graphics',()=>{
 const m={...all.find(m=>m.id==='growing'),name:'<img onerror=alert(1)>',description:{en:'<script>bad</script>',it:'Test'}};
 const html=marketCard(m,'en','2026-11-20');assert.ok(!html.includes('<script>'));assert.match(html,/&lt;img/);assert.match(html,/Check organiser for hours/);assert.match(html,/Category illustration/);assert.match(html,/Regular schedule/);assert.doesNotMatch(html,/undefined/);
});
test('bilingual pages are paired, indexable and linked to real related routes',async()=>{
 for(const [locale,route,other] of [['en','markets','it/strumenti/mercati'],['it','it/strumenti/mercati','markets']]) {
  const html=await readFile(`dist/${route}/index.html`,'utf8');
  assert.match(html,new RegExp(`<html lang="${locale==='it'?'it-IT':'en-GB'}"`));
  assert.ok(html.includes(`rel="canonical" href="https://www.londonadvanced.com/${route}/"`));
  assert.ok(html.includes(`class="language-switch" href="/${other}/"`));
  assert.match(html,/application\/ld\+json/);assert.match(html,/og:description/);assert.match(html,/twitter:image/);assert.match(html,/hreflang="x-default"/);
  assert.match(html,/data-market-app/);assert.match(html,/data-markets-fallback/);
  assert.match(html,/id="market-date-from"/);assert.match(html,/id="market-date-until"/);
  assert.doesNotMatch(html,/id="market-date"/);
  const journal=locale==='it'?'mercati-gastronomici-londra-oltre-borough':'london-food-markets-beyond-borough';
  assert.ok(html.includes(`/journal/${journal}/`));
  assert.ok(!html.includes('undefined'));
 }
});
test('support request is prominent, bilingual and not duplicated near the bottom',async()=>{
 const expected={
  en:['markets','If you want to support these tools','Buy me a flat white'],
  it:['it/strumenti/mercati','Se vuoi sostenere questi strumenti','Offrimi un flat white']
 };
 for(const [locale,[route,message,action]] of Object.entries(expected)) {
  const html=await readFile(`dist/${route}/index.html`,'utf8');
  const introEnd=html.indexOf('</header>');
  const controls=html.indexOf('<section data-market-app');
  const support=html.indexOf('class="markets-support"');
  assert.ok(support>introEnd&&support<controls,`${locale} support block must precede the tool controls`);
  assert.ok(html.includes(message));assert.ok(html.includes(`>${action}</a>`));
  assert.equal(html.match(/class="markets-support"/g)?.length,1);
  assert.equal(html.match(/href="https:\/\/ko-fi\.com\/paolopastorino"/g)?.length,2,`${locale} should retain only the prominent CTA and footer link`);
 }
});
test('both homepages, search indexes, menus, article pathways and sitemap include the tool',async()=>{
 for(const [locale,home,route] of [['en','dist/index.html','/markets/'],['it','dist/it/index.html','/it/strumenti/mercati/']]) {
  const html=await readFile(home,'utf8');assert.ok(html.includes(`href="${route}" data-track="app:`));
  const search=JSON.parse(await readFile(`dist/data/search-index.${locale}.json`,'utf8'));
  assert.ok(JSON.stringify(search).includes(route));
  const sitemap=await readFile('dist/sitemap.xml','utf8');assert.ok(sitemap.includes('https://www.londonadvanced.com'+route));
 }
 const article=await readFile('dist/journal/london-food-markets-beyond-borough/index.html','utf8');assert.match(article,/class="markets-article-link"/);
 const itHome=await readFile('dist/it/index.html','utf8');assert.doesNotMatch(itHome,/Nine focused tools|Independent London guide/);assert.match(itHome,/10 strumenti gratuiti/);
});
