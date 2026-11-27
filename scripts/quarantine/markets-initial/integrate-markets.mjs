// QUARANTINED: historical one-off integration of the initial Markets Calendar.
// It must never run against the maintained site integration.
throw new Error('Quarantined one-off market integration. Use current build scripts and tests.');
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const en={id:'markets',name:'Markets calendar',short:'Plan your next market visit',description:'Find London flea markets, car boots, farmers and craft markets by date and area.',href:'/markets/',embedUrl:'/markets/',icon:'calendar'};
for(const file of ['content.js','dist/content.js']) {
 const context={window:{}};vm.createContext(context);vm.runInContext(await readFile(file,'utf8'),context);
 const data=context.window.LONDON_ADVANCED;
 if(!data.apps.some(a=>a.id==='markets')) {
  const source=await readFile(file,'utf8');
  const entry=JSON.stringify(en,null,2).split('\n').map(line=>'    '+line).join('\n');
  await writeFile(file,source.replace('\n  ],\n  stories:',',\n'+entry+'\n  ],\n  stories:'));
 }
}
for(const file of ['app.js','dist/app.js']) {
 let source=await readFile(file,'utf8');
 if(!/const icons = \\{[\\s\\S]*?\\n  calendar:/.test(source))source=source.replace('const icons = {',`const icons = {\n  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4m8-4v4m-9 7h3m4 0h3m-10 4h3"/></svg>',`);
 source=source.replace('${visualMotifs[app.icon]}','${visualMotifs[app.icon] || ""}');
 source=source.replaceAll('8 free tools','9 free tools').replaceAll('Eight focused tools','Nine focused tools');
 await writeFile(file,source);
}
let italian=await readFile('scripts/build-italian.mjs','utf8');
if(!italian.includes('id: "markets"'))italian=italian.replace('\n];\n\nfunction esc',`,\n  { id: "markets", route: "/it/strumenti/mercati/", enRoute: "/markets/", name: "Calendario dei mercati", short: "Scegli il prossimo mercato", icon: "calendar", description: "Trova mercatini delle pulci, usato, produttori e artigianato per data e zona.", embedUrl: "/it/strumenti/mercati/", native: true }\n];\n\nfunction esc`);
// Keep existing translation pairs and add the new English count, avoiding untranslated homepage copy.
if(!italian.includes('["Nine focused tools.'))italian=italian.replace('const pairs=[[','const pairs=[["Independent London guide · 9 free tools","Guida indipendente di Londra · 10 strumenti gratuiti"],["Nine focused tools. No account, no app download and no generic recommendations.","Dieci strumenti mirati. Nessun account, nessuna app da scaricare e nessun consiglio generico."],[');
// Tool native routes are intentionally not added to routes, whose loop reads existing EN HTML before this tool builds.
await writeFile('scripts/build-italian.mjs',italian);
let prerender=await readFile('scripts/prerender.mjs','utf8');
if(!prerender.includes('from "./build-markets.mjs"'))prerender=prerender.replace('import { KOFI_URL }','import { buildMarkets, linkMarkets } from "./build-markets.mjs";\nimport { KOFI_URL }');
prerender=prerender.replace('eight practical tools','nine practical tools');
if(!prerender.includes('  await buildMarkets();'))prerender=prerender.replace('  await buildSearch();','  await buildMarkets();\n  await buildSearch();');
if(!prerender.includes('  await linkMarkets();'))prerender=prerender.replace('  const sitemapEntries = await buildSitemap();','  await linkMarkets();\n  const sitemapEntries = await buildSitemap();');
await writeFile('scripts/prerender.mjs',prerender);
let journal=await readFile('scripts/build-journal.mjs','utf8');
if(!journal.includes('"markets": {'))journal=journal.replace('const TOOL_PATHS = {','const TOOL_PATHS = {\n  "markets": { en: ["Markets calendar", "/markets/", "Find market dates, hours and organiser links."], it: ["Calendario dei mercati", "/it/strumenti/mercati/", "Trova date, orari e link agli organizzatori."] },');
await writeFile('scripts/build-journal.mjs',journal);
const config=JSON.parse(await readFile('content/search-tools.json','utf8'));
if(!config.some(t=>t.id==='markets'))config.push({id:'markets',keywords:{en:['markets','market calendar','flea','vintage','car boot','farmers','craft','Chiswick','Kew','Peckham','Hackney','antiques'],it:['mercati','mercatini','calendario mercati','pulci','usato','artigianato','produttori','antiquariato','Chiswick','Kew','Peckham','Hackney']}});
if(!(await readFile('content/search-tools.json','utf8')).includes('"id": "markets"'))await writeFile('content/search-tools.json',JSON.stringify(config,null,2)+'\n');
let changed=await readFile('scripts/test-changed.mjs','utf8');
if(!changed.includes('"tests/markets.test.mjs"'))changed=changed.replace('const TEST_FILES = [','const TEST_FILES = [\n  "tests/markets.test.mjs",');
await writeFile('scripts/test-changed.mjs',changed);
console.log('Market source integration complete.');
