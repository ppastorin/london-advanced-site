import {copyFile,mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {navigation,footer} from './build-journal.mjs';
import {KOFI_URL} from './site-config.mjs';
import {COPY} from '../markets/copy.mjs';
import {esc,marketCard} from '../markets/render.mjs';
import {expandMarkets,validateFeed,dateLabel} from '../markets/engine.mjs';
const origin='https://www.londonadvanced.com';
export const marketRoutes={en:'/markets/',it:'/it/strumenti/mercati/'};
export async function buildMarkets() {
 const feed=JSON.parse(await readFile('content/markets.json','utf8'));
 const errors=validateFeed(feed);if(errors.length)throw new Error(errors.join('\n'));
 const events=expandMarkets(feed),initial=events.filter(m=>m.date>=feed.updated).slice(0,20);
 await mkdir('dist/markets/images',{recursive:true});await mkdir('dist/data',{recursive:true});
 await copyFile('content/markets.json','dist/data/markets.json');
 for(const file of ['engine.mjs','copy.mjs','render.mjs','app.mjs','markets.css'])await copyFile(`markets/${file}`,`dist/markets/${file}`);
 // Original category illustrations, deliberately not labelled as venue photographs.
 const drawings={
 flea:'<path d="M42 105h108v15H42zM48 120v28m96-28v28M55 86h28v19H55zM94 72h30v33H94z"/><circle cx="119" cy="48" r="21"/><path d="m119 34 8 14-8 9-8-9zM34 105h125"/>',
 carboot:'<path d="m38 98 12-34h86l16 34v35H38zM53 64l12-18h51l20 18M38 98h114M62 108h65"/><circle cx="61" cy="134" r="12"/><circle cx="132" cy="134" r="12"/><path d="M62 87V70h17v17m11 0V70h27v17"/>',
 farmers:'<path d="M42 84h109l-12 57H54zM63 82l11-39m41 39-11-39M59 100h76m-70 20h64"/><path d="M81 77c-25-30-7-50 12-24 10-29 32-23 21 5"/><path d="M95 80V48"/>',
 craft:'<path d="M58 79c0 28 8 59 38 59s39-31 39-59zM76 79l-5-31m21 31 6-38m11 38 18-39"/><path d="M138 90h10c22 0 14 31-11 29M69 100h54M83 119h26"/>',
 flowers:'<path d="m65 97 8 46h45l10-46zM96 97V49m-9 42L66 62m39 28 22-28"/><circle cx="96" cy="44" r="15"/><circle cx="63" cy="56" r="12"/><circle cx="131" cy="56" r="12"/><path d="M95 78c-17-17-23-5-9 7m11-12c17-17 23-5 9 7"/>',
 food:'<path d="M51 84h45v56H51zM57 84V70h33v14m18 6 35-21 13 56h-49z"/><path d="M59 103h29M56 118h35"/><circle cx="127" cy="99" r="5"/><circle cx="143" cy="114" r="4"/><path d="M57 60c-11-19 12-26 24-15"/>'
 };
 for(const [category,shape] of Object.entries(drawings))await writeFile(`dist/markets/images/${category}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="160" viewBox="0 0 192 160"><rect width="192" height="160" fill="#eee5d4"/><circle cx="97" cy="81" r="66" fill="#f7efed"/><g fill="none" stroke="#65502a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${shape}</g></svg>`);
 for(const locale of ['en','it']) {
  const it=locale==='it',t=COPY[locale],route=marketRoutes[locale],alternate=marketRoutes[it?'en':'it'];
  const foodArticle=JSON.parse(await readFile(`content/journal/london-neighbourhood-food-markets.${locale}.json`,'utf8'));
  const schema={'@context':'https://schema.org','@graph':[{'@type':'CollectionPage','@id':origin+route+'#webpage',url:origin+route,name:t.title,description:t.description,inLanguage:it?'it-IT':'en-GB',dateModified:feed.updated,isPartOf:{'@id':origin+'/#website'}},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'London Advanced',item:origin+(it?'/it/':'/')},{'@type':'ListItem',position:2,name:t.title,item:origin+route}]}]};
  const html=`<!doctype html>
<html lang="${it?'it-IT':'en-GB'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t.seo)}</title><meta name="description" content="${esc(t.description)}"><meta name="robots" content="index,follow"><meta name="author" content="Paolo Pastorino">
<link rel="canonical" href="${origin+route}"><link rel="alternate" hreflang="en-GB" href="${origin+marketRoutes.en}"><link rel="alternate" hreflang="it-IT" href="${origin+marketRoutes.it}"><link rel="alternate" hreflang="x-default" href="${origin+marketRoutes.en}">
<meta property="og:type" content="website"><meta property="og:site_name" content="London Advanced"><meta property="og:title" content="${esc(t.seo)}"><meta property="og:description" content="${esc(t.description)}"><meta property="og:url" content="${origin+route}"><meta property="og:locale" content="${it?'it_IT':'en_GB'}"><meta property="og:image" content="${origin}/assets/london-map.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(t.seo)}"><meta name="twitter:description" content="${esc(t.description)}"><meta name="twitter:image" content="${origin}/assets/london-map.jpg">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Caslon+Display&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/markets/markets.css">
<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script></head>
<body class="markets-page">${navigation(locale,'markets',alternate)}<main class="markets-main">
<header class="markets-intro"><div><a class="eyebrow" href="${it?'/it/#tools':'/#tools'}">${t.back} / London Advanced</a><h1>${t.title}</h1><p>${t.intro}</p></div><div class="markets-status-block"><span id="market-updated">${t.updated} ${dateLabel(feed.updated,locale,{year:'numeric'})}</span><a href="#market-method">${t.about}</a></div></header>
<p id="markets-status" role="status" aria-live="polite">${t.loading}</p>
<section data-market-app hidden aria-label="${t.title}">
<div class="market-controls"><label class="search"><span class="sr-only">${t.search}</span><input id="market-query" type="search" placeholder="${t.search}" maxlength="150" autocomplete="off"></label><label><span class="sr-only">${t.area}</span><select id="market-area"><option value="all">${t.allLondon}</option>${['North','South','East','West','Central'].map(a=>`<option value="${a}">${t[a]}</option>`).join('')}</select></label><button type="button" id="market-weekend" aria-pressed="false">${t.weekend}</button><label class="date-control"><span>${t.jump}</span><input id="market-date" type="date" aria-label="${t.jump}"></label><div class="market-view-switch" role="group" aria-label="${t.calendar}"><button type="button" data-view="calendar" aria-pressed="true">${t.calendar}</button><button type="button" data-view="list" aria-pressed="false">${t.list}</button></div></div>
<div class="market-filters" role="group" aria-label="${t.all}">${['all','flea','carboot','farmers','craft','flowers','food'].map(c=>`<button type="button" data-category-filter="${c}" aria-pressed="${c==='all'}">${t[c]}</button>`).join('')}<button type="button" id="market-clear">${t.clear}</button></div>
<div class="market-layout"><section class="market-calendar" aria-label="${t.calendar}"><div class="market-month-nav"><button type="button" data-prev aria-label="${t.previous}">‹</button><h2 id="market-month"></h2><button type="button" data-next aria-label="${t.next}">›</button><button type="button" data-today>${t.today}</button></div><div class="market-weekdays">${t.weekdays.map((w,i)=>`<span title="${t.weekdaysLong[i]}">${w}</span>`).join('')}</div><div class="market-grid" id="market-grid" role="group" aria-label="${t.calendar}"></div><div class="market-week-nav"><button type="button" data-prev aria-label="${t.previous}">‹</button><h2 id="market-week-label"></h2><button type="button" data-next aria-label="${t.next}">›</button></div><div class="market-week" id="market-week" role="group" aria-label="${t.selected}"></div><div class="market-footer-note"><p>${t.caution}</p><a href="${KOFI_URL}" target="_blank" rel="noopener noreferrer">${t.support}</a></div></section>
<section class="market-agenda-panel" aria-label="${t.selected}"><div class="market-agenda-heading"><h2 id="market-agenda-title"></h2></div><div id="market-agenda"></div><button type="button" id="market-more" hidden>${t.more}</button></section></div><p id="market-coverage" class="market-footer-note"></p><p class="market-footer-note">${t.holiday}</p></section>
<section data-markets-fallback><noscript><p>${t.nojs}</p></noscript>${initial.map(m=>marketCard(m,locale,feed.updated)).join('')}</section>
<details id="market-method" class="market-method"><summary>${t.method}</summary><p>${t.methodText}</p><a href="${it?'/it/metodologia/':'/methodology/'}">${t.about}</a></details>
<nav class="markets-related" aria-label="${t.related}"><strong>${t.related}</strong><a href="${it?'/it/journal/':'/journal/'}${esc(foodArticle.slug)}/">${t.journal}</a><a href="${it?'/it/strumenti/negozi-di-beneficenza/':'/charity-shops/'}">${t.charity}</a><a href="${it?'/it/strumenti/librerie/':'/bookshops/'}">${t.bookshops}</a><a href="${KOFI_URL}" target="_blank" rel="noopener noreferrer">${t.support}</a></nav>
</main>${footer(locale)}<script type="module" src="/markets/app.mjs"></script><script src="/journal.js"></script></body></html>`;
  const dir=path.join('dist',route);await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'index.html'),html);
 }
 console.log(`Built markets: ${feed.markets.length} series, ${events.length} occurrences, 2 languages.`);
}

// Shared generated navigation includes the tool even on older standalone pages.
export async function linkMarkets() {
 const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(p.endsWith('.html'))files.push(p);}}await walk('dist');
 let changed=0;
 for(const file of files) {
  const before=await readFile(file,'utf8'),it=/<html[^>]*lang="it/.test(before),route=marketRoutes[it?'it':'en'],t=COPY[it?'it':'en'];
  const link=`<a href="${route}" data-market-crosslink><span>${it?'Scegli il prossimo mercato':'Plan your next market visit'}</span><strong>${t.title}</strong></a>`;
  const missingShopLinks = body => [
   [it?'/it/strumenti/negozi-di-beneficenza/':'/charity-shops/',it?'Negozi solidali':'Charity Shops'],
   [it?'/it/strumenti/librerie/':'/bookshops/',it?'Librerie':'Bookshops']
  ].filter(([href])=>!body.includes(`href="${href}"`)).map(([href,label])=>`<a href="${href}"><strong>${label}</strong></a>`).join('');
  let after=before.replace(/<header class="site-nav">[\s\S]*?<\/header>/,header=>{
   header=header.replace(/(<div class="[^"]*tools-menu-panel[^"]*">)([\s\S]*?)(<\/div>)/,(_,a,b,c)=>a+b+(b.includes(`href="${route}"`)?'':link)+missingShopLinks(b)+c);
   header=header.replace(/(<div class="[^"]*mobile-menu-panel[^"]*">)([\s\S]*?)(<\/div>)/,(_,a,b,c)=>{
    const additions=(b.includes(`href="${route}"`)?'':link)+missingShopLinks(b);
    return a+b.replace(/(<p class="mobile-menu-heading">(?:Explore|Esplora)<\/p>)/,additions+'$1')+c;
   });
   return header;
  });
  // Add a practical crosslink inside the relevant articles, without changing editorial content.
  if(/\/journal\/(?:london-food-markets-beyond-borough|mercati-gastronomici-londra-oltre-borough|camden-passage-angel-islington-(?:guide|guida))\/index\.html$/.test(file)&&!after.includes('class="markets-article-link"'))after=after.replace('</article>',`</article><section class="markets-article-link" style="padding:20px clamp(18px,5vw,80px)"><p>${it?'Prima di partire, controlla date e orari nel':'Before setting out, check dates and hours in the'} <a style="text-decoration:underline" href="${route}">${t.title}</a>.</p></section>`);
  after=after.replaceAll('8 free tools','9 free tools').replaceAll('Eight focused tools','Nine focused tools').replaceAll('eight practical tools','nine practical tools').replaceAll('8 focused tools','9 focused tools').replaceAll('9 strumenti gratuiti','10 strumenti gratuiti').replaceAll('Nove strumenti mirati','Dieci strumenti mirati').replaceAll('nove strumenti gratuiti','dieci strumenti gratuiti').replaceAll('website’s eight free tools','website’s nine free tools').replaceAll('Eight practical ways to plan','Nine practical ways to plan');
  if(file==='dist/about/index.html'&&!after.includes('data-market-about'))after=after.replace('The website’s nine free tools answer more immediate questions:',`The website’s nine free tools answer more immediate questions: <a data-market-about href="/markets/">find the next market to visit</a>,`);
  if(file==='dist/it/chi-sono/index.html'&&!after.includes('data-market-about'))after=after.replace('I suoi dieci strumenti gratuiti rispondono a domande più immediate:',`I suoi dieci strumenti gratuiti rispondono a domande più immediate: <a data-market-about href="/it/strumenti/mercati/">scegli il prossimo mercato</a>,`);
  if(after!==before){await writeFile(file,after);changed++;}
 }
 console.log(`Markets crosslinks updated ${changed} pages.`);
}
