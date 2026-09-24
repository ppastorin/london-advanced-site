const IT=document.documentElement.lang.toLowerCase().startsWith("it");
const state={loos:[],map:null,markers:null,ordered:[],origin:null,shown:10};const $=s=>document.querySelector(s);const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));const rad=d=>d*Math.PI/180;function dist(a,b){const R=6371,dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon),x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}function dl(k){return k<1?Math.round(k*1000)+" m":k.toFixed(k<10?1:0)+" km"}function cat(c){const en={tfl_toilet:"TfL toilet",rail_station:"Station toilet",public_toilet:"Public toilet",free_entry_venue:"Free-entry venue",department_store:"Department store",shopping_centre:"Shopping centre",cultural_venue:"Cultural venue",church:"Church"};const it={tfl_toilet:"Bagno TfL",rail_station:"Bagno in stazione",public_toilet:"Bagno pubblico",free_entry_venue:"Sede a ingresso gratuito",department_store:"Grande magazzino",shopping_centre:"Centro commerciale",cultural_venue:"Sede culturale",church:"Chiesa"};return(IT?it:en)[c]||(IT?"Bagno":"Toilet")}function access(x){
  if(x.category==="church")return{cls:"public",text:IT?"Chiesa · accesso talvolta limitato":"Church · access may be limited"};
  if(x.category==="cultural_venue")return{cls:"public",text:IT?"Ingresso variabile":"Entry varies by exhibition"};
  const retail=x.category==="department_store"||x.category==="shopping_centre";
  if(x.fee_pence>0){
    const pounds=x.fee_pence/100;
    const charge="£"+(Number.isInteger(pounds)?pounds.toFixed(0):pounds.toFixed(2));
    return{cls:"paid",text:(retail?(IT?"All’interno · ":"Inside venue · "):(IT?"A pagamento · ":"Charge · "))+charge};
  }
  if(retail)return{cls:"public",text:IT?"All’interno · nessun costo indicato":"Inside venue · no charge stated"};
  if(x.fee_pence===0)return{cls:"free",text:IT?"Gratuito verificato":"Free confirmed"};
  return{cls:"public",text:IT?"Pubblico · costo non confermato":"Public · fee not confirmed"};
}
function opening(x){if(!x.opening_hours)return null;const d=["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()],h=x.opening_hours[d];if(!h)return"Closed today";const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date()),now=parts.filter(p=>p.type==="hour"||p.type==="minute").map(p=>p.value).join(":");return now>=h[0]&&now<h[1]?(IT?"Aperto ora · fino alle ":"Open now · until ")+h[1]:(IT?"Orari oggi · ":"Hours today · ")+h[0]+"–"+h[1]}function showResults(){
  const rows=state.ordered.slice(0,state.shown);
  $("#results").innerHTML=rows.map(x=>{const a=access(x),o=opening(x),dir="https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(x.lat+","+x.lon);return `<article class="card"><div class="cardtop"><div><span class="kind">${esc(cat(x.category))}</span><h3>${esc(x.name)}</h3></div><span class="distance">${dl(x.km)}</span></div><div class="badges"><span class="badge ${a.cls}">${a.text}</span>${x.accessible===true?'<span class="badge">'+(IT?"Accessibile":"Accessible")+'</span>':""}${x.baby_change===true?'<span class="badge">'+(IT?"Fasciatoio":"Baby change")+'</span>':""}${x.changing_places===true?'<span class="badge">Changing Places</span>':""}</div>${o?'<p class="detail"><strong>'+esc(o)+'</strong></p>':""}<p class="detail">${esc(x.hours_note||"")}</p><p class="detail">${esc(x.location_note||"")}</p><p class="detail">${esc(x.fee_note||"")}</p><div class="links"><a href="${dir}" target="_blank" rel="noopener">${IT?"Indicazioni":"Directions"} ↗</a><a href="${esc(x.source_url)}" target="_blank" rel="noopener">${IT?"Fonte":"Official source"} ↗</a></div><p class="source">${IT?"Verificato ":"Checked "}${esc(x.last_verified)} · ${esc(x.source_name)}</p></article>` }).join("");
  const remaining=state.ordered.length-rows.length;
  $("#result-count").textContent=(IT?"Visualizzati ":"Showing ")+rows.length+(IT?" di ":" of ")+state.ordered.length+(IT?" bagni, ordinati per distanza":" loos, ordered by distance");
  $("#show-more").hidden=remaining<=0;
  if(remaining>0)$("#show-more").textContent=(IT?"Mostra altri ":"Show ")+Math.min(10,remaining)+(IT?" bagni":" more loos");
  map(rows,state.origin);
}
function render(origin,label){
  state.origin=origin;
  state.shown=10;
  state.ordered=state.loos.filter(x=>x.active).map(x=>({...x,km:dist(origin,x)}))
    .sort((a,b)=>{const penalty=x=>x.fee_pence>0?1.22:(x.fee_pence===0?1:1.08);return a.km*penalty(a)-b.km*penalty(b)});
  $("#result-title").textContent=label;
  $("#results-section").hidden=false;
  showResults();
  window.scrollTo({top:$("#results-section").offsetTop-12,behavior:"smooth"});
}
function map(rows,o){if(!window.L)return;if(!state.map){state.map=L.map("map");L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors"}).addTo(state.map);state.markers=L.layerGroup().addTo(state.map)}state.markers.clearLayers();const p=[[o.lat,o.lon]];L.circleMarker([o.lat,o.lon],{radius:7}).bindPopup("Search point").addTo(state.markers);rows.forEach(x=>{L.marker([x.lat,x.lon]).bindPopup("<strong>"+esc(x.name)+"</strong><br>"+dl(x.km)).addTo(state.markers);p.push([x.lat,x.lon])});state.map.fitBounds(p,{padding:[25,25],maxZoom:14});setTimeout(()=>state.map.invalidateSize(),20)}async function load(){const r=await fetch("/api/loos",{headers:{Accept:"application/json"}});if(!r.ok)throw Error("Could not load loo data");state.loos=(await r.json()).loos||[]}$("#nearby").onclick=async()=>{try{$("#status").textContent=IT?"Cerco la tua posizione…":"Finding your location…";await load();navigator.geolocation.getCurrentPosition(p=>{$("#status").textContent="";render({lat:p.coords.latitude,lon:p.coords.longitude},IT?"Più vicini a te":"Closest to you")},()=>{$("#status").textContent=IT?"La posizione non è disponibile. Prova a cercare un luogo.":"Location access was not available. Try searching for a place instead."},{enableHighAccuracy:true,timeout:10000,maximumAge:60000})}catch(e){$("#status").textContent=e.message}};$("#search").onsubmit=async e=>{
  e.preventDefault();
  const q=$("#where").value.trim();if(!q)return;
  $("#status").textContent=(IT?"Cerco ":"Finding ")+q+"…";
  try{
    await load();
    const match=q.length>=4?state.loos.filter(x=>x.active&&x.name.toLocaleLowerCase().startsWith(q.toLocaleLowerCase()))
      .sort((a,b)=>a.name.length-b.name.length)[0]:null;
    if(match){
      $("#status").textContent="";
      render({lat:match.lat,lon:match.lon},(IT?"Vicino a ":"Near ")+match.name);
      return;
    }
    const r=await fetch("/api/loo-geocode?q="+encodeURIComponent(q),{headers:{Accept:"application/json"}}),d=await r.json();
    if(!r.ok||!d.ok)throw Error(d.message||"Place not found");
    $("#status").textContent="";
    render({lat:d.lat,lon:d.lon},(IT?"Vicino a ":"Near ")+d.label);
  }catch(e){$("#status").textContent=e.message||"Could not find that place."}
};
$("#show-more").onclick=()=>{state.shown+=10;showResults()};
$("#map-toggle").onclick=()=>{const w=$("#map-wrap"),show=w.hidden;w.hidden=!show;$("#map-toggle").textContent=show?(IT?"Nascondi mappa":"Hide map"):(IT?"Mostra mappa":"Show map");$("#map-toggle").setAttribute("aria-expanded",String(show));if(show&&state.map)setTimeout(()=>state.map.invalidateSize(),30)};load().catch(()=>{});