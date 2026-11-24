import { readFile, writeFile } from "node:fs/promises";

const file = "dist/loo/loo.js";
let source = await readFile(file, "utf8");

function replaceOnce(before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${file}: expected one match, found ${count}`);
  source = source.replace(before, after);
}

replaceOnce(
  'const state={loos:[],map:null,markers:null,ordered:[],origin:null,shown:10};const $=s=>document.querySelector(s);',
  'const state={loos:[],map:null,markers:null,ordered:[],origin:null,shown:10};const $=s=>document.querySelector(s);const track=(name,context={})=>window.LAAnalytics?.event(name,{tool_id:"loo_finder",language:IT?"it":"en",...context});'
);
replaceOnce(
  '}async function load(){const r=await fetch("/api/loos?v=20261027-it-notes",{headers:{Accept:"application/json"}});if(!r.ok)throw Error(IT?"Impossibile caricare i dati sui bagni":"Could not load loo data");state.loos=(await r.json()).loos||[]}$("#nearby").onclick=async()=>{try{',
  '}async function load(){const r=await fetch("/api/loos?v=20261027-it-notes",{headers:{Accept:"application/json"}});if(!r.ok)throw Error(IT?"Impossibile caricare i dati sui bagni":"Could not load loo data");state.loos=(await r.json()).loos||[]}$("#nearby").onclick=async()=>{track("loo_nearby_search_started");try{'
);
replaceOnce(
  'render({lat:match.lat,lon:match.lon},(IT?"Vicino a ":"Near ")+match.name);\n      return;',
  'render({lat:match.lat,lon:match.lon},(IT?"Vicino a ":"Near ")+match.name);\n      track("loo_place_search_completed",{search_method:"venue"});\n      return;'
);
replaceOnce(
  'render({lat:d.lat,lon:d.lon},(IT?"Vicino a ":"Near ")+d.label);',
  'render({lat:d.lat,lon:d.lon},(IT?"Vicino a ":"Near ")+d.label);\n    track("loo_place_search_completed",{search_method:"place"});'
);

await writeFile(file, source, "utf8");
console.log("Phase 2 Loo Finder events applied.");
