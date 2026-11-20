import {COPY} from './copy.mjs';
import {esc,marketCard} from './render.mjs';
import {addDays,calendarDays,dateLabel,day,expandMarkets,filterMarkets,isStale,londonToday,monthEnd,monthStart,shiftMonth,validDate,weekendRange,weekStart} from './engine.mjs';
const root=document.querySelector('[data-market-app]');
const locale=document.documentElement.lang.startsWith('it')?'it':'en',t=COPY[locale];
const today=londonToday(),params=new URLSearchParams(location.search);
const categories=['all','flea','carboot','farmers','craft','flowers','food'];
const state={date:validDate(params.get('date'))?params.get('date'):today,query:params.get('q')||'',category:categories.includes(params.get('category'))?params.get('category'):'all',area:['North','South','East','West','Central'].includes(params.get('area'))?params.get('area'):'all',view:params.get('view')==='list'?'list':'calendar',weekend:params.get('weekend')==='1',limit:20};
let feed,events=[];
const $=id=>document.getElementById(id);
const mobile=()=>window.matchMedia('(max-width: 760px)').matches;
function syncUrl() {
 const p=new URLSearchParams();
 for(const [key,val] of Object.entries({date:state.date,q:state.query,category:state.category==='all'?'':state.category,area:state.area==='all'?'':state.area,view:state.view==='list'?'list':'',weekend:state.weekend?'1':''})) if(val)p.set(key,val);
 history.replaceState(null,'',location.pathname+(p.size?'?'+p:''));
 const language=document.querySelectorAll('.language-switch,.mobile-language-switch');
 for(const link of language)link.search=p.toString();
}
function matches() { return filterMarkets(events,{query:state.query,category:state.category,area:state.area,today}); }
function status(count) { $('markets-status').textContent=`${count} ${t.results}`; }
function render() {
 const filtered=matches(),days=calendarDays(state.date),dateCounts=new Map();
 for(const m of filtered) { if(!dateCounts.has(m.date))dateCounts.set(m.date,[]); dateCounts.get(m.date).push(m); }
 root.dataset.view=state.view;
 $('market-query').value=state.query; $('market-area').value=state.area;
 $('market-weekend').setAttribute('aria-pressed',String(state.weekend));
 $('market-date').value=state.date;
 $('market-date').min=today; $('market-date').max=events.at(-1)?.date||feed.coverageEnd;
 for(const button of root.querySelectorAll('[data-category-filter]'))button.setAttribute('aria-pressed',String(button.dataset.categoryFilter===state.category));
 for(const button of root.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===state.view));
 $('market-month').textContent=dateLabel(state.date,locale,{day:undefined,month:'long',year:'numeric'});
 $('market-week-label').textContent=`${dateLabel(weekStart(state.date),locale,{month:'short'})} - ${dateLabel(addDays(weekStart(state.date),6),locale,{month:'short',year:'numeric'})}`;
 $('market-grid').innerHTML=days.map(date=>{
  const items=dateCounts.get(date)||[],cats=[...new Set(items.map(m=>m.category))];
  return `<button type="button" class="market-day${date.slice(0,7)!==state.date.slice(0,7)?' outside':''}${date===state.date?' selected':''}" data-day="${date}" aria-label="${esc(dateLabel(date,locale,{weekday:'long',year:'numeric'}))}, ${items.length} ${esc(t.results)}" aria-pressed="${date===state.date}" tabindex="${date===state.date?0:-1}"><span class="day-number">${day(date).getUTCDate()}</span>${cats.slice(0,2).map(cat=>`<span class="day-category" data-category="${cat}"><i aria-hidden="true"></i>${esc(t[cat])}</span>`).join('')}${items.length?`<span class="day-count">${items.length} ${esc(t.results)}</span>`:''}</button>`;
 }).join('');
 $('market-week').innerHTML=Array.from({length:7},(_,i)=>{
  const date=addDays(weekStart(state.date),i),n=(dateCounts.get(date)||[]).length;
  return `<button type="button" data-day="${date}" aria-pressed="${date===state.date}" aria-label="${esc(dateLabel(date,locale,{weekday:'long'}))}, ${n} ${esc(t.results)}"><span>${t.weekdays[i]}</span><b>${day(date).getUTCDate()}</b><small>${n||'·'}</small></button>`;
 }).join('');
 const range=state.weekend?weekendRange(today):[monthStart(state.date),monthEnd(state.date)];
 const selected=state.weekend||state.view==='list'?filterMarkets(filtered,{from:range[0],until:range[1]}):filtered.filter(m=>m.date===state.date);
 $('market-agenda-title').textContent=state.weekend?t.weekend:state.view==='list'?dateLabel(state.date,locale,{day:undefined,month:'long',year:'numeric'}):dateLabel(state.date,locale,{weekday:'long'});
 $('market-agenda').innerHTML=selected.length?selected.slice(0,state.limit).map(m=>marketCard(m,locale,today)).join(''):`<div class="market-empty"><h3>${t.none}</h3><p>${t.empty}</p><button type="button" data-next-available>${t.nextAvailable}</button></div>`;
 $('market-more').hidden=selected.length<=state.limit;
 $('market-coverage').textContent=today>feed.coverageEnd?t.expired:`${t.coverage} ${dateLabel(feed.coverageEnd,locale,{year:'numeric'})}. ${t.later}`;
 $('market-updated').textContent=`${t.updated} ${dateLabel(feed.updated,locale,{year:'numeric'})}${isStale(feed.updated,today)?' · '+t.stale:''}`;
 status(selected.length); syncUrl();
}
function changeDate(date,focus=false) { state.date=date;state.limit=20;state.weekend=false;render();if(focus)root.querySelector(`[data-day="${date}"]`)?.focus(); }
function navigate(amount) { changeDate(mobile()&&state.view==='calendar'?addDays(state.date,amount*7):shiftMonth(state.date,amount)); }
root.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.day)changeDate(button.dataset.day);
 if(button.hasAttribute('data-category-filter')){state.category=button.dataset.categoryFilter;state.limit=20;render();}
 if(button.dataset.view){state.view=button.dataset.view;state.limit=20;render();}
 if(button.hasAttribute('data-prev'))navigate(-1);
 if(button.hasAttribute('data-next'))navigate(1);
 if(button.hasAttribute('data-today'))changeDate(today);
 if(button.id==='market-weekend'){state.weekend=!state.weekend;if(state.weekend)state.date=weekendRange(today)[0];state.limit=20;render();}
 if(button.id==='market-clear'){Object.assign(state,{query:'',category:'all',area:'all',weekend:false,limit:20});render();}
 if(button.id==='market-more'){state.limit+=20;render();}
 if(button.hasAttribute('data-next-available')) { const next=matches().find(m=>m.date>state.date)||matches()[0];if(next)changeDate(next.date); }
});
root.addEventListener('keydown',event=>{
 if(!event.target.matches('.market-day'))return;
 const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
 if(event.key in offsets){event.preventDefault();changeDate(addDays(state.date,offsets[event.key]),true);}
 if(event.key==='Home'||event.key==='End'){event.preventDefault();changeDate(addDays(weekStart(state.date),event.key==='End'?6:0),true);}
});
$('market-query').addEventListener('input',event=>{state.query=event.target.value;state.limit=20;render();});
$('market-area').addEventListener('change',event=>{state.area=event.target.value;state.limit=20;render();});
$('market-date').addEventListener('change',event=>{if(validDate(event.target.value))changeDate(event.target.value);});
try {
 const response=await fetch('/data/markets.json');if(!response.ok)throw new Error('HTTP '+response.status);
 feed=await response.json();events=expandMarkets(feed).filter(m=>m.date>=today);
 if(!params.has('date'))state.date=events[0]?.date||today;
 root.hidden=false;document.querySelector('[data-markets-fallback]').hidden=true;render();
 window.matchMedia('(max-width: 760px)').addEventListener('change',render);
} catch { $('markets-status').textContent=t.error; }
