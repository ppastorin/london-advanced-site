const IT = document.documentElement.lang.startsWith("it");
const copy = IT ? {
  loading:"Caricamento delle librerie…", finding:"Cerco la tua posizione…", locationError:"La posizione non è disponibile. Cerca una stazione, una strada o un luogo.", enter:"Inserisci una stazione, una strada o un luogo di Londra.", notFound:"Luogo non trovato.", near:"Vicino a", nearYou:"la tua posizione", allTitle:"Tutte le librerie selezionate", results:"risultati", result:"risultato", empty:"Nessuna libreria corrisponde a questa combinazione. Aumenta la distanza o rimuovi un filtro.", directions:"Indicazioni", website:"Sito", source:"Fonte", zone:"Zona", station:"Stazione", heritage:"Storia e carattere", stock:"Stock", verified:"Verificata", active:"filtri attivi", map:"Mappa", list:"Elenco", filters:"Filtri", apply:"Mostra risultati", close:"Chiudi filtri", filterTitle:"Scegli i filtri"
} : {
  loading:"Loading bookshops…", finding:"Finding your location…", locationError:"Location access was not available. Search for a station, street or landmark instead.", enter:"Enter a London station, street or landmark.", notFound:"Place not found.", near:"Near", nearYou:"your location", allTitle:"All researched bookshops", results:"results", result:"result", empty:"No bookshops match this combination. Increase the distance or remove a filter.", directions:"Directions", website:"Website", source:"Source", zone:"Zone", station:"Station", heritage:"Story & character", stock:"Stock", verified:"Verified", active:"active filters", map:"Map", list:"List", filters:"Filters", apply:"Show results", close:"Close filters", filterTitle:"Choose filters"
};
const $ = (selector) => document.querySelector(selector);
const state = { shops:[], origin:null, label:"", radius:2000, type:"all", specialisms:new Set(), features:new Set(), map:null, markers:null, originLayer:null, radiusLayer:null };

function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function distance(a,b){const r=6371e3,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lon-a.lon)*Math.PI/180;const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*r*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
function formatDistance(m){return m<1000?`${Math.round(m/10)*10} m`:`${(m/1000).toFixed(1)} km`}
function formatDate(value){try{return new Intl.DateTimeFormat(IT?"it-IT":"en-GB",{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${value}T12:00:00Z`))}catch{return value}}
function labelFor(group,value){return document.querySelector(`[data-filter-group="${group}"][data-value="${CSS.escape(value)}"]`)?.textContent.trim()||value}
function typeLabel(shop){return labelFor("type",shop.type)}
function selectedMatch(values,selected){return !selected.size||values.some(value=>selected.has(value))}
function activeCount(){return (state.type==="all"?0:1)+state.specialisms.size+state.features.size}
function isMobile(){return window.matchMedia("(max-width: 680px)").matches}

function setMobileView(view){
  document.body.classList.toggle("mobile-list-view",view==="list");
  document.body.classList.toggle("mobile-map-view",view==="map");
  document.querySelectorAll("[data-mobile-view]").forEach(button=>{
    const active=button.dataset.mobileView===view;
    button.classList.toggle("active",active);
    button.setAttribute("aria-pressed",String(active));
  });
  if(view==="map"&&state.map)setTimeout(()=>state.map.invalidateSize(),80);
}

function closeMobileFilters(){
  $(".bookshop-controls")?.classList.remove("mobile-open");
  $(".mobile-filter-backdrop")?.setAttribute("hidden","");
  document.body.classList.remove("mobile-filters-open");
  $(".mobile-filter-button")?.focus({preventScroll:true});
}

function openMobileFilters(){
  $(".bookshop-controls")?.classList.add("mobile-open");
  $(".mobile-filter-backdrop")?.removeAttribute("hidden");
  document.body.classList.add("mobile-filters-open");
  $(".mobile-filter-close")?.focus({preventScroll:true});
}

function updateMobileControls(resultCount){
  const count=activeCount();
  const badge=$(".mobile-filter-count");
  if(badge){badge.textContent=String(count);badge.hidden=!count}
  const apply=$(".mobile-filter-apply");
  if(apply)apply.textContent=`${copy.apply} · ${resultCount}`;
  const total=$(".mobile-result-total");
  if(total)total.textContent=`${resultCount}`;
}

function initMobileUI(){
  const workspace=$(".bookshop-workspace");
  const controls=$(".bookshop-controls");
  if(!workspace||!controls||$(".bookshop-mobile-toolbar"))return;
  const toolbar=document.createElement("div");
  toolbar.className="bookshop-mobile-toolbar";
  toolbar.setAttribute("aria-label",IT?"Vista e filtri":"View and filters");
  toolbar.innerHTML=`<button class="mobile-filter-button" type="button" aria-haspopup="dialog"><span aria-hidden="true">☷</span>${copy.filters}<b class="mobile-filter-count" hidden>0</b></button><div class="mobile-view-switch" role="group" aria-label="${IT?"Vista risultati":"Results view"}"><button type="button" class="active" data-mobile-view="map" aria-pressed="true"><span aria-hidden="true">⌖</span>${copy.map}</button><button type="button" data-mobile-view="list" aria-pressed="false"><span aria-hidden="true">≡</span>${copy.list} <b class="mobile-result-total">0</b></button></div>`;
  workspace.before(toolbar);
  const sheetHeader=document.createElement("div");
  sheetHeader.className="mobile-filter-header";
  sheetHeader.innerHTML=`<strong>${copy.filterTitle}</strong><button class="mobile-filter-close" type="button" aria-label="${copy.close}">×</button>`;
  controls.prepend(sheetHeader);
  const apply=document.createElement("button");
  apply.className="mobile-filter-apply";apply.type="button";apply.textContent=copy.apply;
  controls.append(apply);
  const backdrop=document.createElement("button");
  backdrop.className="mobile-filter-backdrop";backdrop.type="button";backdrop.hidden=true;backdrop.setAttribute("aria-label",copy.close);
  document.body.append(backdrop);
  toolbar.querySelector(".mobile-filter-button").addEventListener("click",openMobileFilters);
  sheetHeader.querySelector("button").addEventListener("click",closeMobileFilters);
  apply.addEventListener("click",()=>{closeMobileFilters();setMobileView("list")});
  backdrop.addEventListener("click",closeMobileFilters);
  toolbar.querySelectorAll("[data-mobile-view]").forEach(button=>button.addEventListener("click",()=>setMobileView(button.dataset.mobileView)));
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&controls.classList.contains("mobile-open"))closeMobileFilters()});
  document.body.classList.add("mobile-map-view");
}

function initMap(){
  state.map=L.map("bookshop-map",{preferCanvas:true,zoomControl:true}).setView([51.5074,-.1278],11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:IT?"© collaboratori OpenStreetMap":"© OpenStreetMap contributors"}).addTo(state.map);
  state.markers=window.L.markerClusterGroup?L.markerClusterGroup({disableClusteringAtZoom:15,maxClusterRadius:42,showCoverageOnHover:false}):L.layerGroup();
  state.map.addLayer(state.markers);
}
function marker(shop){
  const icon=L.divIcon({className:"bookshop-div-icon",html:`<span class="bookshop-pin" title="${esc(shop.name)}">⌑</span>`,iconSize:[32,38],iconAnchor:[16,34]});
  return L.marker([shop.lat,shop.lon],{icon}).bindPopup(`<strong>${esc(shop.name)}</strong>${shop.branch?`<br>${esc(shop.branch)}`:""}<br><span>${esc(typeLabel(shop))}</span><br><a href="https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}" target="_blank" rel="noopener">${copy.directions} ↗</a>`);
}
async function load(){
  $("#bookshop-status").textContent=copy.loading;
  const response=await fetch("/api/bookshops?v=20261104-v1",{headers:{Accept:"application/json"}});
  if(!response.ok)throw new Error(IT?"Impossibile caricare i dati.":"Could not load bookshop data.");
  const payload=await response.json();state.shops=payload.shops||[];$("#bookshop-status").textContent="";render(true);
}
function filtered(){
  let shops=state.shops.filter(shop=>(state.type==="all"||shop.type===state.type)&&selectedMatch(shop.specialism_tags||[],state.specialisms)&&selectedMatch(shop.feature_tags||[],state.features));
  if(state.origin)shops=shops.map(shop=>({...shop,distance:distance(state.origin,shop)})).filter(shop=>shop.distance<=state.radius).sort((a,b)=>a.distance-b.distance||a.name.localeCompare(b.name));
  else shops.sort((a,b)=>a.name.localeCompare(b.name));
  return shops;
}
function tagsFor(shop){
  const tags=[...(shop.specialism_tags||[]).slice(0,3).map(value=>labelFor("specialism",value)),...(shop.feature_tags||[]).filter(value=>["cafe-food","bar-wine","music-performance","heritage-story"].includes(value)).slice(0,2).map(value=>labelFor("feature",value))];
  return [...new Set(tags)].slice(0,5);
}
function render(fit=false){
  const shops=filtered();state.markers.clearLayers();for(const shop of shops)state.markers.addLayer(marker(shop));
  if(state.originLayer){state.map.removeLayer(state.originLayer);state.originLayer=null}if(state.radiusLayer){state.map.removeLayer(state.radiusLayer);state.radiusLayer=null}
  if(state.origin){
    state.originLayer=L.circleMarker([state.origin.lat,state.origin.lon],{radius:7,color:"#fff",weight:2,fillColor:"#a44732",fillOpacity:1}).bindPopup(copy.map).addTo(state.map);
    state.radiusLayer=L.circle([state.origin.lat,state.origin.lon],{radius:state.radius,color:"#31594c",weight:1,fillColor:"#31594c",fillOpacity:.06}).addTo(state.map);
    state.map.fitBounds(state.radiusLayer.getBounds(),{padding:[18,18]});
  } else if(fit&&shops.length){
    const bounds=L.latLngBounds(shops.map(shop=>[shop.lat,shop.lon]));state.map.fitBounds(bounds,{padding:[20,20],maxZoom:12});
  }
  $("#result-title").textContent=state.origin?`${copy.near} ${state.label}`:copy.allTitle;
  const countSuffix=activeCount()?` · ${activeCount()} ${copy.active}`:"";
  $("#result-count").textContent=`${shops.length} ${shops.length===1?copy.result:copy.results}${countSuffix}`;
  updateMobileControls(shops.length);
  const list=$("#shop-results");
  if(!shops.length){list.innerHTML=`<div class="empty-state">${esc(copy.empty)}</div>`;return}
  list.innerHTML=shops.map(shop=>{
    const description=IT?(shop.description_it||shop.description):shop.description;
    const heritage=IT?(shop.heritage_it||shop.heritage):shop.heritage;
    const tags=tagsFor(shop).map(tag=>`<span>${esc(tag)}</span>`).join("");
    const destination=encodeURIComponent(`${shop.name}, ${shop.address}, ${shop.postcode}`);
    const stock=IT?(shop.stock_it||shop.stock):shop.stock;
    return `<details class="shop-card"><summary><div class="shop-summary"><p class="shop-org">${esc(typeLabel(shop))}</p><h3>${esc(shop.name)}</h3><p class="shop-branch">${esc(shop.branch)}${shop.station?` · ${copy.station}: ${esc(shop.station)}`:""}</p><div class="shop-tags">${tags}</div></div>${state.origin?`<span class="shop-distance">${formatDistance(shop.distance)}</span>`:""}</summary><div class="shop-details"><p>${esc(description)}</p>${heritage?`<p class="heritage-note"><span aria-hidden="true">✦</span><strong>${copy.heritage}:</strong> ${esc(heritage)}</p>`:""}<p><strong>${copy.stock}:</strong> ${esc((stock||[]).join(" · "))}</p><p class="shop-address">${esc(shop.address)}, ${esc(shop.postcode)} · ${copy.zone} ${esc(shop.zone)}</p><p class="verification-note">${copy.verified}: ${formatDate(shop.last_verified)}</p><div class="shop-links"><a href="https://www.google.com/maps/dir/?api=1&destination=${destination}" target="_blank" rel="noopener">⌖ ${copy.directions} ↗</a>${shop.website?`<a href="${esc(shop.website)}" target="_blank" rel="noopener">${copy.website} ↗</a>`:""}<a href="${esc(shop.source)}" target="_blank" rel="noopener">${copy.source} ↗</a></div></div></details>`;
  }).join("");
}
function setOrigin(origin,label){state.origin=origin;state.label=label;render();if(!isMobile())$("#bookshop-results").scrollIntoView({behavior:"smooth",block:"start"})}
function reset(){
  state.type="all";state.specialisms.clear();state.features.clear();state.origin=null;state.label="";state.radius=2000;
  $("#radius").value="2000";$("#radius-output").textContent="2 km";
  document.querySelectorAll(".filter-chip").forEach(button=>{const active=button.dataset.filterGroup==="type"&&button.dataset.value==="all";button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active))});
  render(true);
}
function bindFilters(){
  document.querySelectorAll("[data-filter-group='type']").forEach(button=>button.addEventListener("click",()=>{state.type=button.dataset.value;document.querySelectorAll("[data-filter-group='type']").forEach(item=>{const active=item===button;item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active))});render()}));
  for(const group of ["specialism","feature"]){document.querySelectorAll(`[data-filter-group='${group}']`).forEach(button=>button.addEventListener("click",()=>{const set=group==="specialism"?state.specialisms:state.features;set.has(button.dataset.value)?set.delete(button.dataset.value):set.add(button.dataset.value);const active=set.has(button.dataset.value);button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));render()}))}
  $("#radius").addEventListener("input",event=>{state.radius=Number(event.target.value);$("#radius-output").textContent=state.radius<1000?`${state.radius} m`:`${(state.radius/1000).toFixed(state.radius%1000?1:0)} km`;if(state.origin)render()});
  $("#reset-filters").addEventListener("click",reset);
}
function initAbout(){const panel=$("#bookshop-about-panel");document.querySelectorAll("[data-bookshop-about]").forEach(button=>button.addEventListener("click",()=>panel.showModal()));panel.querySelector(".panel-close").addEventListener("click",()=>panel.close());panel.addEventListener("click",event=>{const b=panel.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)panel.close()})}
async function start(){
  initMap();initAbout();bindFilters();initMobileUI();
  try{await load()}catch(error){$("#bookshop-status").textContent=error.message;return}
  $("#use-location").addEventListener("click",()=>{if(!navigator.geolocation){$("#bookshop-status").textContent=copy.locationError;return}$("#bookshop-status").textContent=copy.finding;navigator.geolocation.getCurrentPosition(position=>{$("#bookshop-status").textContent="";setOrigin({lat:position.coords.latitude,lon:position.coords.longitude},copy.nearYou)},()=>{$("#bookshop-status").textContent=copy.locationError},{enableHighAccuracy:true,timeout:10000,maximumAge:60000})});
  $("#bookshop-search").addEventListener("submit",async event=>{event.preventDefault();const q=$("#bookshop-where").value.trim();if(q.length<2){$("#bookshop-status").textContent=copy.enter;return}$("#bookshop-status").textContent=`${IT?"Cerco":"Finding"} ${q}…`;try{const response=await fetch(`/api/bookshop-geocode?q=${encodeURIComponent(q)}`,{headers:{Accept:"application/json"}});const payload=await response.json();if(!response.ok||!payload.ok)throw new Error(payload.message||copy.notFound);$("#bookshop-status").textContent="";setOrigin({lat:payload.lat,lon:payload.lon},payload.label)}catch(error){$("#bookshop-status").textContent=error.message||copy.notFound}});
}
start();
