import fs from 'node:fs';
const required = ['content/markets.json', 'markets/engine.mjs', 'markets/app.mjs', 'markets/markets.css', 'scripts/build-markets.mjs', 'dist/markets/index.html', 'dist/it/strumenti/mercati/index.html'];
const missing = required.filter(file => !fs.existsSync(file));
for (const file of missing) console.error(`Missing ${file}`);
const failures=[];
if(!missing.length) {
 const feed=JSON.parse(fs.readFileSync('content/markets.json','utf8'));
 const columbia=feed.markets.find(m=>m.id==='columbia-road-flower');
 if(!columbia||columbia.category!=='flowers'||columbia.recurrence?.days?.join()!=='0')failures.push('Columbia Road weekly schedule');
 const fleaIds=['flea-london-hackney-bridge','go-east-strongroom','adams-antiques','bermondsey-antiques','portobello-green','deptford-bric-a-brac','brick-lane-flea','wanstead-vintage-fair','chiswick-antique-vintage','camden-passage','slc-beckenham','stardust-hampstead','bottle-factory-festive-flea'];
 for(const id of fleaIds)if(!feed.markets.some(m=>m.id===id))failures.push(`missing ${id}`);
 for(const file of ['dist/markets/index.html','dist/it/strumenti/mercati/index.html']) {
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('id="market-date-from"')||!html.includes('id="market-date-until"'))failures.push(`${file} date range`);
 }
 const app=fs.readFileSync('dist/markets/app.mjs','utf8');
 if(!app.includes('from:state.from')||!app.includes('until:state.until'))failures.push('date range URL state');
}
for(const failure of failures)console.error(`Invalid ${failure}`);
console.log(`Markets acceptance: ${missing.length} missing files, ${failures.length} feature failures.`);
process.exitCode = missing.length||failures.length ? 1 : 0;
