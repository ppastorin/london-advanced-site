(() => {
  const DATA = window.LONDON_ADVANCED;
  const toolId = document.body.dataset.toolId;
  const tool = DATA?.apps?.find(item => item.id === toolId);
  const status = document.querySelector(".frame-status");
  if (!tool) { if (status) status.textContent = "Impossibile configurare lo strumento."; return; }
  const frame = document.querySelector("#tool-frame");
  const stage = document.querySelector(".tool-stage");
  const direct = document.querySelector("#direct-link");
  const switcher = document.querySelector("#tool-switcher");
  frame.title = tool.name;
  frame.src = tool.embedUrl;
  if (direct) {
    direct.href = tool.embedUrl;
    direct.setAttribute("aria-label", `Apri ${tool.name} in una nuova scheda`);
  }
  DATA.apps.forEach(item => { const option=document.createElement("option"); option.value=item.href; option.textContent=item.name; option.selected=item.id===toolId; switcher.appendChild(option); });
  switcher.addEventListener("change", event => window.location.assign(event.target.value));
  frame.addEventListener("load", () => stage.classList.add("is-loaded"));
  const trigger=document.querySelector(".about-trigger"); const panel=document.querySelector(".about-panel"); const close=document.querySelector(".panel-close");
  if(trigger&&panel&&close){trigger.addEventListener("click",()=>panel.showModal());close.addEventListener("click",()=>panel.close());panel.addEventListener("click",event=>{const b=panel.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)panel.close();});}
  const menus=[...document.querySelectorAll(".nav-dropdown")];
  menus.forEach(menu=>menu.addEventListener("toggle",()=>{if(menu.open)menus.filter(x=>x!==menu).forEach(x=>x.removeAttribute("open"));}));
  document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(panel?.open)panel.close();menus.forEach(x=>x.removeAttribute("open"));}});
})();
