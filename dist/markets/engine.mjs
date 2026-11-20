// Date-only arithmetic is UTC. Public display and the clock use Europe/London.
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function day(value) { return new Date(`${value}T12:00:00Z`); }
export function addDays(value, amount) { const d=day(value); d.setUTCDate(d.getUTCDate()+amount); return d.toISOString().slice(0,10); }
export function londonToday(now=new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function monthStart(value) { return value.slice(0,7)+'-01'; }
export function monthEnd(value) { const d=day(monthStart(value)); d.setUTCMonth(d.getUTCMonth()+1,0); return d.toISOString().slice(0,10); }
export function shiftMonth(value, amount) { const d=day(monthStart(value)); d.setUTCMonth(d.getUTCMonth()+amount); return d.toISOString().slice(0,10); }
export function weekStart(value) { return addDays(value,-((day(value).getUTCDay()+6)%7)); }
export function calendarDays(value) {
  const first=weekStart(monthStart(value)), end=monthEnd(value);
  const count=Math.ceil((Math.round((day(end)-day(first))/86400000)+1)/7)*7;
  return Array.from({length:count},(_,i)=>addDays(first,i));
}
export function weekendRange(today) {
  const weekday=day(today).getUTCDay();
  const saturday=weekday===0?addDays(today,-1):addDays(today,(6-weekday+7)%7);
  return [saturday,addDays(saturday,1)];
}
export function validDate(value) { return ISO_DATE.test(value||'') && !Number.isNaN(day(value).valueOf()) && day(value).toISOString().slice(0,10)===value; }
export function validateFeed(feed) {
  const errors=[], ids=new Set(), categories=['farmers','craft','flea','carboot','flowers','food'];
  if(feed.timezone!=='Europe/London'||!validDate(feed.updated)||!validDate(feed.coverageEnd)) errors.push('Invalid feed dates or timezone');
  for(const m of feed.markets||[]) {
    if(!m.id||ids.has(m.id)) errors.push(`Duplicate/missing ID: ${m.id}`); ids.add(m.id);
    if(!categories.includes(m.category)||!m.name||!m.venue||!m.area||!m.description?.en||!m.description?.it) errors.push(`Incomplete market: ${m.id}`);
    if(!/^https:\/\//.test(m.source)||!validDate(m.checked)) errors.push(`Invalid evidence: ${m.id}`);
    for(const event of [...(m.dates||[]),...(m.recurrences||[]),...(m.recurrence?[m.recurrence]:[])]) {
      if(event.date&&!validDate(event.date)) errors.push(`Invalid occurrence date: ${m.id}`);
      if(event.from&&(!validDate(event.from)||!validDate(event.until)||event.from>event.until)) errors.push(`Invalid recurrence range: ${m.id}`);
      if(event.days&&(!event.days.length||event.days.some(d=>!Number.isInteger(d)||d<0||d>6))) errors.push(`Invalid weekdays: ${m.id}`);
      if(event.nth&&event.nth.some(n=>!Number.isInteger(n)||n<1||n>5)) errors.push(`Invalid monthly rule: ${m.id}`);
      const time=/^([01]\d|2[0-3]):[0-5]\d$/;
      if((event.start&&!time.test(event.start))||(event.end&&!time.test(event.end))||(event.start&&event.end&&event.start>=event.end)) errors.push(`Invalid hours: ${m.id}`);
    }
  }
  return errors;
}
export function expandMarkets(feed) {
  const occurrences=[];
  for(const market of feed.markets) {
    const byDate=new Map();
    for(const r of [...(market.recurrences||[]),...(market.recurrence?[market.recurrence]:[])]) {
      // Bounded expansion, never extrapolate beyond the checked research horizon.
      const until=r.until<feed.coverageEnd?r.until:feed.coverageEnd;
      for(let date=r.from;date<=until;date=addDays(date,1)) {
        const d=day(date), nth=Math.floor((d.getUTCDate()-1)/7)+1;
        if(!r.days.includes(d.getUTCDay()) || (r.nth&&!r.nth.includes(nth)) || r.excludeMonths?.includes(d.getUTCMonth()+1) || r.excludeDates?.includes(date)) continue;
        if(feed.holidayHold && date>=feed.holidayHold.from && date<=feed.holidayHold.until) continue;
        byDate.set(date,{...market,date,start:r.start,end:r.end,evidence:'regular'});
      }
    }
    // Announced occurrences override recurring hours/venue on the same date.
    for(const event of market.dates||[]) byDate.set(event.date,{...market,...event,evidence:'announced'});
    for(const o of byDate.values()) occurrences.push({...o,occurrenceId:`${market.id}:${o.date}`});
  }
  return occurrences.sort((a,b)=>a.date.localeCompare(b.date)||(a.start||'99:99').localeCompare(b.start||'99:99')||a.name.localeCompare(b.name));
}
export function normalize(value='') { return String(value).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase(); }
export function filterMarkets(items,{query='',category='all',area='all',from='',until='',today=''}={}) {
  const words=normalize(query).trim().split(/\s+/).filter(Boolean);
  return items.filter(m=>(category==='all'||m.category===category)&&(area==='all'||m.area===area)&&(!from||m.date>=from)&&(!until||m.date<=until)&&(!today||m.date>=today)&&words.every(w=>normalize(`${m.name} ${m.venue} ${m.description.en} ${m.description.it}`).includes(w)));
}
export function dateLabel(value,locale='en',options={}) {
  return new Intl.DateTimeFormat(locale==='it'?'it-IT':'en-GB',{timeZone:'UTC',day:'numeric',month:'long',...options}).format(day(value));
}
export function isStale(checked,today=londonToday()) { return Math.round((day(today)-day(checked))/86400000)>14; }
