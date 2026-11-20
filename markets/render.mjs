import { COPY } from './copy.mjs';
import { dateLabel, isStale } from './engine.mjs';
export const esc=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function marketCard(m,locale,today) {
  const t=COPY[locale],image=m.image?.src||`/markets/images/${m.category}.svg`;
  const alt=m.image?.alt?.[locale]||t[m.category];
  const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(`${m.venue}, London`);
  return `<article class="market-card" data-category="${esc(m.category)}">
    <figure><img src="${esc(image)}" alt="${esc(alt)}" width="192" height="144" loading="lazy"><figcaption>${esc(m.image?`${t.photo}: ${m.image.credit}`:t.illustration)}</figcaption></figure>
    <div class="market-card-copy"><h3>${esc(m.name)}</h3><div class="market-meta"><span class="category-label"><i aria-hidden="true"></i>${esc(t[m.category])}</span><span>${esc(t[m.evidence])}</span></div>
    <p class="market-time"><time datetime="${esc(m.date)}">${esc(dateLabel(m.date,locale,{weekday:'short'}))}</time> <b>${m.start?`${m.start}${m.end?' - '+m.end:''}`:esc(t.check)}</b></p>
    <p class="market-venue">${esc(m.venue)}</p><p class="market-summary">${esc(m.description[locale])}</p>${m.note?`<p class="market-note">${esc(m.note[locale])}</p>`:''}
    <div class="market-links"><a href="${esc(m.source)}" target="_blank" rel="noopener noreferrer">${esc(t.details)}<span class="sr-only">: ${esc(m.name)}</span></a><a href="${esc(maps)}" target="_blank" rel="noopener noreferrer">${esc(t.directions)}</a></div>
    <small class="market-checked">${esc(t.source)} ${esc(dateLabel(m.checked,locale))}${isStale(m.checked,today)?` · ${esc(t.stale)}`:''}</small></div></article>`;
}
