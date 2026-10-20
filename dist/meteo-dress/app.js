const scenarios = [
  { label: "Pioggia e vento", icon: "☔", min: 9, max: 14, feels: 7, rain: 68, gust: 39, hourly: [[6,9,42,"🌧"],[9,10,51,"🌧"],[12,13,32,"🌦"],[15,14,46,"🌦"],[18,11,68,"🌧"],[21,9,38,"☁️"]] },
  { label: "Fresco e variabile", icon: "🌦", min: 8, max: 13, feels: 6, rain: 44, gust: 27, hourly: [[6,8,18,"☁️"],[9,9,24,"☁️"],[12,12,35,"🌦"],[15,13,44,"🌦"],[18,10,22,"☁️"],[21,8,12,"☁️"]] },
  { label: "Sereno ma frizzante", icon: "🌤", min: 7, max: 15, feels: 5, rain: 12, gust: 19, hourly: [[6,7,5,"🌙"],[9,9,8,"🌤"],[12,13,9,"☀️"],[15,15,12,"🌤"],[18,11,8,"🌤"],[21,8,4,"🌙"]] },
  { label: "Mite e nuvoloso", icon: "☁️", min: 12, max: 17, feels: 11, rain: 26, gust: 22, hourly: [[6,12,18,"☁️"],[9,13,20,"☁️"],[12,16,24,"☁️"],[15,17,26,"☁️"],[18,15,19,"☁️"],[21,13,12,"☁️"]] },
  { label: "Pioggia insistente", icon: "🌧", min: 10, max: 13, feels: 8, rain: 86, gust: 31, hourly: [[6,10,62,"🌧"],[9,11,74,"🌧"],[12,12,81,"🌧"],[15,13,86,"🌧"],[18,11,79,"🌧"],[21,10,58,"🌧"]] },
  { label: "Luminoso e mite", icon: "☀️", min: 13, max: 20, feels: 12, rain: 8, gust: 16, hourly: [[6,13,4,"🌤"],[9,15,5,"☀️"],[12,18,6,"☀️"],[15,20,8,"☀️"],[18,17,6,"🌤"],[21,14,4,"🌙"]] },
  { label: "Freddo e asciutto", icon: "🌥", min: 4, max: 10, feels: 2, rain: 18, gust: 33, hourly: [[6,4,8,"🌙"],[9,5,11,"🌥"],[12,9,12,"🌥"],[15,10,18,"☁️"],[18,7,12,"☁️"],[21,5,7,"🌙"]] }
];

let productCatalog = [];
let catalogMeta = null;

const catalogReady = fetch("/api/meteo-dress-products", {
  headers: { Accept: "application/json" }
})
  .then(response => {
    if (!response.ok) throw new Error(`Catalogo non disponibile (${response.status})`);
    return response.json();
  })
  .then(data => {
    productCatalog = data.products || [];
    catalogMeta = data;
    const updated = document.querySelector("#catalog-updated");
    if (updated && data.snapshotUpdated) {
      updated.textContent = `Feed Maxi Sport · aggiornato ${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(new Date(data.snapshotUpdated))}`;
    }
    return productCatalog;
  });

const garmentSvg = {
  impermeabile: '<svg viewBox="0 0 180 180" aria-hidden="true"><path fill="#fff" d="M60 31 78 21h24l18 10 31 25-17 27-16-11v84H62V72L46 83 29 56z"/><path d="M78 22c1 12 23 12 24 0M90 35v120M67 89h16m14 0h16" fill="none" stroke="#373737" stroke-width="4" stroke-linecap="round"/></svg>',
  cappotto: '<svg viewBox="0 0 180 180" aria-hidden="true"><path fill="#fff" d="m60 28 20-9h20l20 9 26 30-18 19-12-11 10 91H54l10-91-12 11-18-19z"/><path d="m78 21 12 25 12-25M90 46v110m-22-52h16m12 0h16" fill="none" stroke="#373737" stroke-width="4" stroke-linecap="round"/></svg>',
  maglia: '<svg viewBox="0 0 180 180" aria-hidden="true"><path fill="#fff" d="m59 35 21-13c5 8 15 8 20 0l21 13 29 38-22 17-13-19v84H65V71L52 90 30 73z"/><path d="M79 24c3 16 19 16 22 0" fill="none" stroke="#373737" stroke-width="4"/></svg>',
  scarpe: '<svg viewBox="0 0 180 180" aria-hidden="true"><path fill="#fff" d="M22 99c19 1 36-6 45-28l22 12c10 16 26 25 52 31 13 3 20 11 17 27H25c-10-7-11-27-3-42Z"/><path d="M24 122h132M63 82l18 10m-24 0 17 9" fill="none" stroke="#373737" stroke-width="4" stroke-linecap="round"/></svg>',
  accessorio: '<svg viewBox="0 0 180 180" aria-hidden="true"><path fill="#fff" d="M58 31h64v85H58zM70 116h40v44H70z"/><path d="M58 55h64m-64 38h64M77 32v83m26-83v83" fill="none" stroke="#373737" stroke-width="4"/></svg>'
};

const dayFormatter = new Intl.DateTimeFormat("it-IT", { weekday: "short" });
const dateFormatter = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" });
const longDateFormatter = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });
const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

const dateOptions = document.querySelector("#date-options");
const form = document.querySelector("#dress-form");
const results = document.querySelector("#results");
const ageSelect = document.querySelector("#age-select");
const toast = document.querySelector("#toast");

function buildDates() {
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const label = i === 0 ? "Oggi" : i === 1 ? "Domani" : dayFormatter.format(date).replace(".", "");
    dateOptions.insertAdjacentHTML("beforeend", `<label><input type="radio" name="day" value="${i}" ${i === 0 ? "checked" : ""}><span><b>${label}</b><small>${dateFormatter.format(date)}</small></span></label>`);
  }
}

function updateAgeOptions(section) {
  const prior = ageSelect.value;
  const child = [["0-3","0–3"],["4-11","4–11"],["12-17","12–17"]];
  const adult = [["18-34","18–34"],["35-54","35–54"],["55-69","55–69"],["70+","70+"]];
  const options = section === "bambino" ? child : adult;
  ageSelect.innerHTML = options.map(([value,label]) => `<option value="${value}">${label}</option>`).join("");
  if (options.some(([value]) => value === prior)) ageSelect.value = prior;
  else ageSelect.value = section === "bambino" ? "4-11" : "35-54";
}

function getProfile() {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function relevantHours(scenario, priority) {
  const map = { mattina:[0,1], pomeriggio:[2,3], sera:[4,5] };
  return map[priority] ? map[priority].map(i => scenario.hourly[i]) : scenario.hourly;
}

function calculate(profile, scenario) {
  const selected = relevantHours(scenario, profile.priority);
  const baseMin = Math.min(...selected.map(h => h[1]), scenario.feels);
  const coldMod = profile.cold === "freddoloso" ? -3 : profile.cold === "resistente" ? 2 : 0;
  const exposureMod = profile.exposure === "esterno" ? -2 : profile.exposure === "interno" ? 1 : 0;
  const ageMod = ["0-3","70+"].includes(profile.age) ? -2 : ["4-11","55-69"].includes(profile.age) ? -1 : 0;
  const effective = baseMin + coldMod + exposureMod + ageMod;
  const wet = scenario.rain >= 45;
  const windy = scenario.gust >= 35;
  const veryCold = effective <= 4;
  const cold = effective <= 9;
  const cool = effective <= 14;

  const kit = [];
  if (veryCold) kit.push({type:"cappotto", icon:"🧥", title:"Cappotto caldo o piumino", note:"Il freddo percepito e il tempo all'aperto richiedono isolamento vero."});
  else if (wet) kit.push({type:"impermeabile", icon:"🌧️", title:cold ? "Giacca impermeabile imbottita" : "Giacca impermeabile leggera", note:"Protegge dalla pioggia senza costringerti a portare un secondo capospalla."});
  else if (cool) kit.push({type:"impermeabile", icon:"🧥", title:"Giacca leggera antivento", note:"Uno strato esterno facile da aprire o riporre quando sale la temperatura."});
  else kit.push({type:"maglia", icon:"👕", title:"Strato leggero traspirante", note:"La giornata è mite: meglio evitare un capospalla troppo pesante."});

  if (cold || profile.cold === "freddoloso") kit.push({type:"maglia", icon:"🧶", title:veryCold ? "Maglia termica e pullover" : "Pullover o felpa", note:"Lo strato intermedio permette di adattarsi a Tube, musei e temperatura esterna."});
  else kit.push({type:"maglia", icon:"👕", title:"T-shirt più strato sottile", note:"Una combinazione semplice per passare dagli interni alla strada."});

  kit.push({type:"scarpe", icon:"👟", title:wet ? "Scarpe resistenti all'acqua" : "Scarpe comode da cammino", note:wet ? "Marciapiedi bagnati e molte ore a piedi: la suola conta più delle intenzioni." : "Londra si capisce meglio camminando, ma i piedi devono essere d'accordo."});

  if (windy && wet) kit.push({type:"accessorio", icon:"🪖", title:"Cappuccio, non ombrello", note:"Con queste raffiche l'ombrello rischia una carriera autonoma sul Tamigi."});
  else if (wet) kit.push({type:"accessorio", icon:"☂️", title:"Ombrello compatto", note:"Piccolo, leggero e abbastanza vicino da non finire dimenticato in hotel."});
  else if (cold) kit.push({type:"accessorio", icon:"🧣", title:"Sciarpa leggera", note:"Utile nelle ore più fredde e facile da togliere durante il giorno."});
  else kit.push({type:"accessorio", icon:"🕶️", title:"Occhiali da sole", note:"Sì, anche a Londra. Quando servono, nessuno sa più dove li ha messi."});

  let title;
  if (veryCold) title = wet ? "Servono calore e protezione dalla pioggia." : "Copriti bene, ma costruisci l'outfit a strati.";
  else if (wet && windy) title = "Giacca con cappuccio. L'ombrello oggi può riposare.";
  else if (wet) title = "Vestiti a strati e porta una giacca impermeabile.";
  else if (cool) title = "Strati leggeri: Londra cambierà idea durante il giorno.";
  else title = "Giornata mite: punta su leggerezza e scarpe comode.";

  const text = `La temperatura percepita scende fino a ${scenario.feels}°C. ${profile.exposure === "esterno" ? "Passerai molto tempo all'aperto, quindi abbiamo aumentato la protezione." : profile.exposure === "interno" ? "Starai spesso al chiuso, quindi gli strati devono essere facili da togliere." : "Il mix di interni e passeggiate rende gli strati la scelta più flessibile."} ${windy && wet ? "Con il vento previsto, meglio un cappuccio affidabile di un ombrello eroico." : ""}`;

  return { effective, rainChance: scenario.rain, wet, windy, cold, veryCold, kit, title, text };
}

function renderPeriods(profile, scenario, calc) {
  const periods = [
    { key:"mattina", label:"mattina", hours:scenario.hourly.slice(0,2), advice:[calc.cold ? "Parti con lo strato intermedio indossato" : "Basta uno strato leggero", calc.wet ? "Giacca chiusa e scarpe protette" : "Giacca facile da aprire", "Evita di lasciare tutto nella valigia"] },
    { key:"pomeriggio", label:"pomeriggio", hours:scenario.hourly.slice(2,4), advice:[scenario.max >= 17 ? "Alleggerisci lo strato esterno" : "Mantieni il pullover a portata di mano", scenario.rain >= 40 ? "Controlla la pioggia prima di uscire" : "È la fascia più semplice della giornata", "Scarpe comode: il contapassi non perdona"] },
    { key:"sera", label:"sera", hours:scenario.hourly.slice(4,6), advice:["Rimetti lo strato intermedio", calc.windy ? "Proteggi collo e testa dal vento" : "Una sciarpa leggera può bastare", scenario.rain >= 45 ? "Il cappuccio torna protagonista" : "Nessun equipaggiamento da spedizione polare"] }
  ];
  const priorityKey = profile.priority === "giornata" ? null : profile.priority;
  document.querySelector("#period-grid").innerHTML = periods.map(p => {
    const min = Math.min(...p.hours.map(h=>h[1]));
    const max = Math.max(...p.hours.map(h=>h[1]));
    const rain = Math.max(...p.hours.map(h=>h[2]));
    return `<article class="period-card ${priorityKey === p.key ? "featured" : ""}">${priorityKey === p.key ? '<span class="priority-tag">Priorità</span>' : ""}<h4>${p.label}</h4><p class="period-weather">${min}–${max}°C · pioggia fino al ${rain}%</p><ul>${p.advice.map(a=>`<li>${a}</li>`).join("")}</ul></article>`;
  }).join("");
}

function productScore(product, profile, calc, type) {
  if (product.type !== type) return -100;
  const sectionMatch = profile.section === "bambino"
    ? product.sections.includes("bambino")
    : product.sections.includes(profile.section) || product.sections.includes("unisex");
  if (!sectionMatch) return -100;
  const productText = `${product.name} ${product.category}`.toLowerCase();
  const isGlove = /\b(guant\w*|moffol\w*)\b/.test(productText);
  const isColdHeadwear = /\b(beanie|cappell\w*|berrett\w*|sciarp\w*|scaldacollo|paraorecchie|fascia)\b/.test(productText);
  const isSunglasses = /\b(occhial\w*|sunglasses)\b/.test(productText);
  const isWinterSport = /\b(sci|snowboard)\b/.test(productText);

  // Accessories must solve the need generated by the weather, not merely share a style tag.
  if (product.type === "accessorio") {
    if (isWinterSport && calc.effective > 5) return -100;
    if (isGlove && calc.effective > 5) return -100;
    if (isColdHeadwear && calc.effective > 9) return -100;
    if (isSunglasses && (calc.wet || calc.effective < 11)) return -100;
    if (!isGlove && !isColdHeadwear && !isSunglasses) return -100;
  }

  const targetWarmth = calc.effective <= 4 ? 4 : calc.effective <= 8 ? 3 : calc.effective <= 12 ? 2 : calc.effective <= 16 ? 1 : 0;
  if (product.type === "impermeabile" && calc.wet && product.rain < 2) return -100;
  if (product.type === "maglia" && targetWarmth >= 3 && product.warmth < 2) return -100;
  if (product.type !== "scarpe" && product.warmth > targetWarmth + 1) return -100;
  let score = 0;
  if (product.styles.includes(profile.style)) score += 5;
  if (profile.budget === "qualsiasi" || product.tier === profile.budget) score += 3;
  if (calc.rainChance >= 25) score += product.rain * (calc.rainChance >= 60 ? 2 : 1);
  score += 4 - Math.abs(product.warmth - targetWarmth) * 2;
  if (isWinterSport) score -= calc.effective > 6 ? 8 : profile.style === "sportivo" ? 2 : 4;
  if (profile.style === "elegante" && product.styles.includes("elegante")) score += 3;
  if (profile.style === "sportivo" && product.styles.includes("sportivo")) score += 2;
  if (product.sizes?.length) score += Math.min(product.sizes.length, 5) * .15;
  return score;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
}

function trackedUrl(product, profile) {
  const url = new URL(product.url);
  url.searchParams.set("clickref", `meteodress_${product.type}_${profile.style}`.slice(0, 50));
  return url.toString();
}

function productFamilyKey(product) {
  return product.name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(uomo|donna|unisex|junior|bambin[oa]|giacca|maglia|scarpe?)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function renderProducts(profile, calc) {
  const types = [...new Set(calc.kit.map(k=>k.type))];
  const picks = [];
  types.forEach(type => {
    const ranked = productCatalog.map(p=>({p,score:productScore(p,profile,calc,type)})).filter(x=>x.score>-50).sort((a,b)=>b.score-a.score);
    const candidate = ranked.find(({p}) => !picks.some(chosen => chosen.id === p.id || productFamilyKey(chosen) === productFamilyKey(p)));
    if (candidate) picks.push(candidate.p);
  });
  const visible = picks.slice(0,4);
  document.querySelector("#product-grid").innerHTML = visible.map(p => {
    const reason = p.type === "impermeabile" ? "Adatta alla probabilità di pioggia e al tuo stile." : p.type === "cappotto" ? "Calore coerente con temperatura percepita ed esposizione." : p.type === "scarpe" ? "Pensata per camminare a lungo senza ignorare il meteo." : p.type === "maglia" ? "Uno strato intermedio coerente con il tuo profilo termico." : "Completa il kit senza appesantire la giornata.";
    const sizeText = p.sizes?.length ? `Taglie nel feed: ${p.sizes.slice(0,5).map(escapeHtml).join(", ")}${p.sizes.length > 5 ? "…" : ""}` : "Disponibilità da verificare";
    return `<article class="product-card"><div class="product-visual"><span class="merchant-chip">${escapeHtml(p.merchant)}</span><span class="mock-chip">Feed reale</span><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"></div><div class="product-copy"><p class="product-brand">${escapeHtml(p.brand)}</p><h4>${escapeHtml(p.name)}</h4><p class="product-reason">${reason} ${sizeText}</p><div class="product-bottom"><span class="product-price">${euro.format(p.price)}</span><a class="product-link" href="${escapeHtml(trackedUrl(p, profile))}" target="_blank" rel="sponsored noopener noreferrer">Vedi su Maxi Sport ↗</a></div></div></article>`;
  }).join("");
}

function render(profile) {
  const scenario = scenarios[Number(profile.day)];
  const calc = calculate(profile, scenario);
  const date = new Date();
  date.setDate(date.getDate() + Number(profile.day));
  const periodLabels = { mattina:"soprattutto la mattina", pomeriggio:"soprattutto il pomeriggio", sera:"soprattutto la sera" };
  const periodText = profile.priority === "giornata" ? "tutta la giornata" : periodLabels[profile.priority];

  document.querySelector("#weather-icon").textContent = scenario.icon;
  document.querySelector("#temperature-range").textContent = `${scenario.min}–${scenario.max}°C`;
  document.querySelector("#condition-label").textContent = scenario.label;
  document.querySelector("#verdict-eyebrow").textContent = `${longDateFormatter.format(date)} · ${periodText}`;
  document.querySelector("#verdict-title").textContent = calc.title;
  document.querySelector("#verdict-text").textContent = calc.text;
  document.querySelector("#feels-min").textContent = `${scenario.feels}°C`;
  document.querySelector("#rain-max").textContent = `${scenario.rain}%`;
  document.querySelector("#gust-max").textContent = `${scenario.gust} km/h`;

  document.querySelector("#hourly-strip").innerHTML = scenario.hourly.map((h,i) => `<article class="hour-card ${i===2 ? "current" : ""}"><div class="hour-top"><strong>${String(h[0]).padStart(2,"0")}:00</strong><span>${h[3]}</span></div><div class="hour-temp">${h[1]}°</div><div class="hour-meta"><span>Pioggia</span><strong>${h[2]}%</strong></div></article>`).join("");

  renderPeriods(profile, scenario, calc);
  document.querySelector("#profile-summary").textContent = `${profile.section} · ${profile.style} · ${profile.cold} · ${profile.exposure}`;
  document.querySelector("#kit-grid").innerHTML = calc.kit.map((item,i)=>`<article class="kit-card ${i===3 ? "optional" : ""}"><span class="kit-icon">${item.icon}</span><h4>${item.title}</h4><p>${item.note}</p></article>`).join("");
  renderProducts(profile, calc);
  results.hidden = false;
  results.scrollIntoView({behavior:"smooth", block:"start"});
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(()=>toast.classList.remove("show"), 3000);
}

buildDates();

form.addEventListener("change", event => {
  if (event.target.name === "section") updateAgeOptions(event.target.value);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  const prior = button.innerHTML;
  button.disabled = true;
  button.textContent = "Carico i prodotti reali…";
  try {
    await catalogReady;
    render(getProfile());
  } catch (error) {
    showToast("Il catalogo Maxi Sport non è disponibile. Riprova tra poco.");
  } finally {
    button.disabled = false;
    button.innerHTML = prior;
  }
});

document.querySelector("#edit-button").addEventListener("click", () => document.querySelector("#planner-title").scrollIntoView({behavior:"smooth", block:"start"}));
document.querySelector("#restart-button").addEventListener("click", () => {
  results.hidden = true;
  form.reset();
  updateAgeOptions("donna");
  document.querySelector("#planner-title").scrollIntoView({behavior:"smooth", block:"start"});
});
