const IT=document.documentElement.lang.startsWith("it");
const copy=IT?{
  loading:"Caricamento dei negozi solidali…",finding:"Cerco la tua posizione…",locationError:"La posizione non è disponibile. Cerca una stazione, una strada o un luogo.",enter:"Inserisci una stazione, una strada o un luogo di Londra.",notFound:"Luogo non trovato.",near:"Vicino a",nearYou:"Vicino a te",prompt:"Scegli una posizione per vedere i negozi entro il raggio selezionato.",results:"risultati",result:"risultato",empty:"Nessun negozio corrisponde a raggio e filtri. Aumenta la distanza o rimuovi un filtro.",directions:"Indicazioni",source:"Fonte",hours:"Orari",feature:"Particolarità",verify:"Controlla i dettagli prima di partire.",all:"Tutte",selected:"organizzazioni selezionate",map:"Punto di ricerca"
}:{
  loading:"Loading charity shops…",finding:"Finding your location…",locationError:"Location access was not available. Search for a station, street or landmark instead.",enter:"Enter a London station, street or landmark.",notFound:"Place not found.",near:"Near",nearYou:"Near you",prompt:"Choose a location to see shops within the selected radius.",results:"results",result:"result",empty:"No shops match this radius and filter combination. Increase the distance or remove a filter.",directions:"Directions",source:"Source",hours:"Hours",feature:"Distinctive feature",verify:"Check the details before travelling.",all:"All",selected:"charities selected",map:"Search point"
};
const $=selector=>document.querySelector(selector);
const state={shops:[],origin:null,label:"",radius:500,subtype:"all",organisations:new Set(),map:null,markers:null,originLayer:null,radiusLayer:null};

function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function distance(a,b){const r=6371e3,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lon-a.lon)*Math.PI/180;const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*r*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
function formatDistance(m){return m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(1)} km`}
function local(shop,key){return shop[`${key}_${IT?"it":"en"}`]||shop[`${key}_en`]||""}
function initials(name){return name.split(/\s+/).map(word=>word[0]).join("").slice(0,3).toUpperCase()}

async function load(){
  if(state.shops.length)return;
  $("#charity-status").textContent=copy.loading;
  const response=await fetch("/api/charity-shops?v=20261029",{headers:{Accept:"application/json"}});
  if(!response.ok)throw new Error(IT?"Impossibile caricare i dati.":"Could not load charity-shop data.");
  const payload=await response.json();state.shops=payload.shops||[];state.organisations=new Set(state.shops.map(shop=>shop.organization));
  buildOrganisationOptions();showAllMarkers();$("#charity-status").textContent="";
}

function initMap(){
  state.map=L.map("charity-map",{preferCanvas:true}).setView([51.5074,-.1278],11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:IT?"© collaboratori OpenStreetMap":"© OpenStreetMap contributors"}).addTo(state.map);
  state.markers=window.L.markerClusterGroup?L.markerClusterGroup({disableClusteringAtZoom:15,maxClusterRadius:42,showCoverageOnHover:false}):L.layerGroup();
  state.map.addLayer(state.markers);
}

function marker(shop){
  const icon=L.divIcon({className:"charity-div-icon",html:`<span class="charity-pin">${esc(initials(shop.organization))}</span>`,iconSize:[30,30],iconAnchor:[15,15]});
  return L.marker([shop.lat,shop.lon],{icon}).bindPopup(`<strong>${esc(shop.name)}</strong><br>${esc(local(shop,"subtype_label"))}<br>${esc(shop.address)}`);
}

function showAllMarkers(){state.markers.clearLayers();for(const shop of state.shops)state.markers.addLayer(marker(shop))}

function filtered(){
  const shops=state.shops.filter(shop=>(state.subtype==="all"||shop.subtype===state.subtype)&&state.organisations.has(shop.organization));
  if(!state.origin)return shops.sort((a,b)=>a.name.localeCompare(b.name));
  return shops.map(shop=>({...shop,distance:distance(state.origin,shop)})).filter(shop=>shop.distance<=state.radius).sort((a,b)=>a.distance-b.distance||a.name.localeCompare(b.name));
}

function render(){
  const shops=filtered();state.markers.clearLayers();for(const shop of shops)state.markers.addLayer(marker(shop));
  if(!state.origin){$("#result-title").textContent=IT?"Negozi nelle vicinanze":"Nearby shops";$("#result-count").textContent=copy.prompt;return}
  if(state.originLayer)state.map.removeLayer(state.originLayer);if(state.radiusLayer)state.map.removeLayer(state.radiusLayer);
  state.originLayer=L.circleMarker([state.origin.lat,state.origin.lon],{radius:7,color:"#fff",weight:2,fillColor:"#a44732",fillOpacity:1}).bindPopup(copy.map).addTo(state.map);
  state.radiusLayer=L.circle([state.origin.lat,state.origin.lon],{radius:state.radius,color:"#275e4a",weight:1,fillColor:"#275e4a",fillOpacity:.07}).addTo(state.map);
  state.map.fitBounds(state.radiusLayer.getBounds(),{padding:[18,18]});
  $("#result-title").textContent=`${copy.near} ${state.label}`;$("#result-count").textContent=`${shops.length} ${shops.length===1?copy.result:copy.results}`;
  const list=$("#shop-results");if(!shops.length){list.innerHTML=`<div class="empty-state">${esc(copy.empty)}</div>`;return}
  list.innerHTML=shops.map(shop=>`<details class="shop-card"><summary><div><p class="shop-org">${esc(shop.organization)}</p><h3>${esc(shop.branch)}</h3><div class="shop-meta"><span>${esc(local(shop,"subtype_label"))}</span>${shop.tfl_zone?`<span>${IT?"Zona":"Zone"} ${esc(shop.tfl_zone)}</span>`:""}</div></div><span class="shop-distance">${formatDistance(shop.distance)}</span></summary><div class="shop-details"><p>${esc(local(shop,"description"))}</p>${local(shop,"specialism")?`<p><strong>${copy.feature}:</strong> ${esc(local(shop,"specialism"))}</p>`:""}<p class="shop-address">${esc(shop.address)}${shop.postcode?`, ${esc(shop.postcode)}`:""}</p><p><strong>${copy.hours}:</strong> ${esc(local(shop,"opening_hours"))}</p>${shop.data_status!=="verified_inventory"?`<p class="shop-warning">${copy.verify}</p>`:""}<div class="shop-links"><a href="https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}" target="_blank" rel="noopener">${copy.directions} ↗</a><a href="${esc(shop.source_url)}" target="_blank" rel="noopener">${copy.source} ↗</a></div></div></details>`).join("");
}

function setOrigin(origin,label){state.origin=origin;state.label=label;render();$("#charity-results").scrollIntoView({behavior:"smooth",block:"start"})}

function buildOrganisationOptions(){
  const counts=new Map;for(const shop of state.shops)counts.set(shop.organization,(counts.get(shop.organization)||0)+1);
  $("#charity-options").innerHTML=[...counts].sort((a,b)=>a[0].localeCompare(b[0])).map(([name,count])=>`<label class="charity-option"><input type="checkbox" value="${esc(name)}" checked><span>${esc(name)} (${count})</span></label>`).join("");
  updateOrganisationLabel();
}
function updateOrganisationLabel(){$("#charity-picker-label").textContent=state.organisations.size===new Set(state.shops.map(shop=>shop.organization)).size?copy.all:`${state.organisations.size} ${copy.selected}`}
function syncOrganisations(){state.organisations=new Set([...document.querySelectorAll("#charity-options input:checked")].map(input=>input.value));updateOrganisationLabel();render()}

function initAbout(){const panel=$("#charity-about-panel");document.querySelectorAll("[data-charity-about]").forEach(button=>button.addEventListener("click",()=>panel.showModal()));panel.querySelector(".panel-close").addEventListener("click",()=>panel.close());panel.addEventListener("click",event=>{const b=panel.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)panel.close()})}

async function start(){
  initMap();initAbout();
  try{await load()}catch(error){$("#charity-status").textContent=error.message;return}
  $("#radius").addEventListener("input",event=>{$("#radius-output").textContent=`${event.target.value} m`;state.radius=Number(event.target.value);render()});
  document.querySelectorAll(".category-chip").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".category-chip").forEach(item=>item.classList.remove("active"));button.classList.add("active");state.subtype=button.dataset.subtype;render()}));
  $("#charity-options").addEventListener("change",syncOrganisations);
  $("#organisation-search").addEventListener("input",event=>{const q=event.target.value.trim().toLowerCase();document.querySelectorAll(".charity-option").forEach(option=>option.hidden=!option.textContent.toLowerCase().includes(q))});
  $("#select-all-charities").addEventListener("click",()=>{document.querySelectorAll("#charity-options input").forEach(input=>input.checked=true);syncOrganisations()});
  $("#clear-charities").addEventListener("click",()=>{document.querySelectorAll("#charity-options input").forEach(input=>input.checked=false);syncOrganisations()});
  $("#use-location").addEventListener("click",()=>{if(!navigator.geolocation){$("#charity-status").textContent=copy.locationError;return}$("#charity-status").textContent=copy.finding;navigator.geolocation.getCurrentPosition(position=>{$("#charity-status").textContent="";setOrigin({lat:position.coords.latitude,lon:position.coords.longitude},copy.nearYou)},()=>{$("#charity-status").textContent=copy.locationError},{enableHighAccuracy:true,timeout:10000,maximumAge:60000})});
  $("#charity-search").addEventListener("submit",async event=>{event.preventDefault();const q=$("#charity-where").value.trim();if(q.length<2){$("#charity-status").textContent=copy.enter;return}$("#charity-status").textContent=`${IT?"Cerco":"Finding"} ${q}…`;try{const response=await fetch(`/api/charity-geocode?q=${encodeURIComponent(q)}`,{headers:{Accept:"application/json"}});const payload=await response.json();if(!response.ok||!payload.ok)throw new Error(payload.message||copy.notFound);$("#charity-status").textContent="";setOrigin({lat:payload.lat,lon:payload.lon},payload.label)}catch(error){$("#charity-status").textContent=error.message||copy.notFound}});
}
start();
