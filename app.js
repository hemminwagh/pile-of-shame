
const STORAGE_KEY = "pile-of-shame-v2";
const THEME_KEY = "pile-of-shame-theme";
const SEEN_FATE_KEY = "pile-of-shame-seen-fate";

const factions = [
  { id:"orks", name:"Orks", universe:"40K", icon:"☠" },
  { id:"adepta", name:"Adepta Sororitas", universe:"40K", icon:"✠" },
  { id:"necrons", name:"Necrons", universe:"40K", icon:"◇" },
  { id:"tyranids", name:"Tyranids", universe:"40K", icon:"⌁" },
  { id:"aeldari", name:"Aeldari", universe:"40K", icon:"◬" },
  { id:"chaos40k", name:"Chaos Space Marines", universe:"40K", icon:"✣" },
  { id:"stormcast", name:"Stormcast Eternals", universe:"Sigmar", icon:"✦" },
  { id:"gitz", name:"Gloomspite Gitz", universe:"Sigmar", icon:"☾" },
  { id:"skaven-aos", name:"Skaven", universe:"Sigmar", icon:"⚙" },
  { id:"soulblight", name:"Soulblight Gravelords", universe:"Sigmar", icon:"♜" },
  { id:"nighthaunt", name:"Nighthaunt", universe:"Sigmar", icon:"♧" },
  { id:"seraphon", name:"Seraphon", universe:"Sigmar", icon:"☀" },
  { id:"bretonnia", name:"Bretonnia", universe:"Fantasy", icon:"⚜" },
  { id:"empire", name:"Empire", universe:"Fantasy", icon:"♛" },
  { id:"dwarfs", name:"Dwarfs", universe:"Fantasy", icon:"◆" },
  { id:"high-elves", name:"High Elves", universe:"Fantasy", icon:"✧" },
  { id:"orcs-goblins", name:"Orcs & Goblins", universe:"Fantasy", icon:"☠" },
  { id:"vampires", name:"Vampire Counts", universe:"Fantasy", icon:"♜" },
  { id:"tomb-kings", name:"Tomb Kings", universe:"Fantasy", icon:"☥" },
  { id:"skaven-fantasy", name:"Skaven", universe:"Fantasy", icon:"⚙" },
  { id:"none", name:"Sin favorita", universe:"—", icon:"·" }
];

const defaultState = {
  user: {
    name:"Elena",
    handle:"@elena",
    bio:"Pintura, plástico y decisiones financieras cuestionables.",
    favoriteFaction:"orks",
    avatarData:"",
    bannerData:""
  },
  collection:[
    {id:crypto.randomUUID(),name:"Gretchin",faction:"Orks",status:"Pintado",cost:18,emoji:"🟢"},
    {id:crypto.randomUUID(),name:"Grifocorcel",faction:"Stormcast",status:"En proceso",cost:32,emoji:"🪽"},
    {id:crypto.randomUUID(),name:"Proyecto caja",faction:"Otros",status:"Pendiente",cost:0,emoji:"📦"}
  ],
  posts:[
    {id:crypto.randomUUID(),author:"Laura",initials:"L",text:"He terminado por fin esta unidad. Tres tardes y una cantidad irresponsable de pinceles.",likes:4,comments:2,time:"Hace 32 min",emoji:"🎨"},
    {id:crypto.randomUUID(),author:"Elena",initials:"E",text:"Probando esquema nuevo para los Gretchin. Creo que este verde se queda.",likes:3,comments:1,time:"Hace 2 h",emoji:"🟢"}
  ],
  friends:[
    {name:"Laura",handle:"@laura",info:"12 proyectos · 84 minis",faction:"gitz"},
    {name:"Marta",handle:"@marta",info:"6 proyectos · 41 minis",faction:"soulblight"},
    {name:"Ana",handle:"@ana",info:"9 proyectos · 67 minis",faction:"bretonnia"},
    {name:"Sara",handle:"@sara",info:"4 proyectos · 29 minis",faction:"adepta"}
  ]
};

let state = loadState();
let route = "feed";
let profileTab = "posts";

function cloneDefault(){
  return JSON.parse(JSON.stringify(defaultState));
}
function loadState(){
  try{
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!existing) return cloneDefault();
    return {
      ...cloneDefault(),
      ...existing,
      user:{...cloneDefault().user,...existing.user}
    };
  }catch{
    return cloneDefault();
  }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}
function esc(value=""){
  return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function getTheme(){
  return localStorage.getItem(THEME_KEY) || "40k";
}
function setTheme(theme, persist=true){
  if(!["40k","sigmar","fantasy"].includes(theme)) theme="40k";
  document.body.dataset.theme=theme;
  if(persist) localStorage.setItem(THEME_KEY,theme);

  const metas={
    "40k":{sub:"HOBBY · COMUNIDAD · COLECCIÓN",themeColor:"#07131b"},
    "sigmar":{sub:"HOBBY · REINOS · COMUNIDAD",themeColor:"#070c10"},
    "fantasy":{sub:"HOBBY · LORE · COMUNIDAD",themeColor:"#17110c"}
  };
  document.getElementById("brandSub").textContent=metas[theme].sub;
  document.querySelector('meta[name="theme-color"]').setAttribute("content",metas[theme].themeColor);

  document.querySelectorAll("[data-quick-theme],[data-settings-theme]").forEach(btn=>{
    const value=btn.dataset.quickTheme || btn.dataset.settingsTheme;
    btn.classList.toggle("active",value===theme);
  });
}
function openFateGate(){
  const gate=document.getElementById("fateGate");
  gate.classList.add("open");
  gate.setAttribute("aria-hidden","false");
}
function closeFateGate(){
  const gate=document.getElementById("fateGate");
  gate.classList.remove("open");
  gate.setAttribute("aria-hidden","true");
}
function pickTheme(theme){
  setTheme(theme);
  localStorage.setItem(SEEN_FATE_KEY,"yes");
  closeFateGate();
  render();
}
function currentFaction(){
  return factions.find(f=>f.id===state.user.favoriteFaction) || factions.at(-1);
}
function avatarHTML(sizeClass="avatar"){
  return state.user.avatarData
    ? `<div class="${sizeClass}"><img src="${state.user.avatarData}" alt=""></div>`
    : `<div class="${sizeClass}">${esc(state.user.name?.[0]?.toUpperCase() || "P")}</div>`;
}
function headerAvatar(){
  const el=document.getElementById("headerAvatar");
  if(state.user.avatarData){
    el.innerHTML=`<img src="${state.user.avatarData}" alt="">`;
  }else{
    el.textContent=state.user.name?.[0]?.toUpperCase() || "P";
  }
}
function toast(message){
  const node=document.createElement("div");
  node.textContent=message;
  node.style.cssText="position:fixed;left:50%;bottom:100px;transform:translateX(-50%);z-index:200;background:var(--text);color:var(--bg);padding:10px 14px;border-radius:999px;font-weight:900;box-shadow:var(--shadow)";
  document.body.appendChild(node);
  setTimeout(()=>node.remove(),1600);
}

function renderFeed(){
  return `
    <section class="hero">
      <span class="micro-label">TU CÍRCULO</span>
      <strong>La pila jamás disminuye.<br>Al menos ahora tiene feed.</strong>
      <p>Proyectos, compras, pintura y pequeñas victorias contra el gris plástico.</p>
    </section>

    <div class="section-head">
      <h2>Actividad reciente</h2>
      <button data-route="community">Ver círculo</button>
    </div>

    ${state.posts.map(post=>`
      <article class="card post-card">
        <div class="row">
          <div class="avatar">${esc(post.initials)}</div>
          <div>
            <div class="post-name">${esc(post.author)}</div>
            <div class="meta">${esc(post.time)}</div>
          </div>
          <button style="margin-left:auto;border:0;background:transparent;color:var(--muted)">•••</button>
        </div>

        <p class="post-text">${esc(post.text)}</p>
        <div class="post-media">${esc(post.emoji)}</div>

        <div class="post-actions">
          <button class="like-btn" data-id="${post.id}">♡ <span>${post.likes}</span></button>
          <button>▢ <span>${post.comments}</span></button>
          <button class="save-action">◇</button>
        </div>
      </article>
    `).join("")}
  `;
}

function renderCollection(){
  const painted=state.collection.filter(x=>x.status==="Pintado").length;
  return `
    <section class="hero">
      <span class="micro-label">MI COLECCIÓN</span>
      <strong>${state.collection.length} piezas registradas.</strong>
      <p>${painted} pintadas. El resto están “en proceso”, una expresión legalmente muy flexible.</p>
    </section>

    <div class="section-head">
      <h2>Colección</h2>
      <button data-route="add">＋ Añadir</button>
    </div>

    <section class="collection-grid">
      ${state.collection.map(item=>`
        <article class="collection-card">
          <div class="thumb">${esc(item.emoji)}</div>
          <div class="copy">
            <strong>${esc(item.name)}</strong>
            <span class="meta">${esc(item.faction)}</span>
            <span class="tag">${esc(item.status)}</span>
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function renderAdd(){
  return `
    <section class="form-card">
      <span class="micro-label">COLECCIÓN</span>
      <h2>Añadir pieza</h2>
      <p>Registra una miniatura, caja o proyecto físico.</p>

      <form id="addCollectionForm" class="form">
        <label>Nombre
          <input name="name" placeholder="Ej. Gretchin Runtherd" required>
        </label>
        <label>Facción / categoría
          <input name="faction" placeholder="Ej. Orks" required>
        </label>
        <label>Estado
          <select name="status">
            <option>Pendiente</option>
            <option>Montado</option>
            <option>Imprimado</option>
            <option>En proceso</option>
            <option>Pintado</option>
          </select>
        </label>
        <label>Coste (€)
          <input name="cost" type="number" step="0.01" min="0" placeholder="0,00">
        </label>
        <button class="primary-btn" type="submit">Guardar</button>
      </form>
    </section>

    <section class="form-card">
      <span class="micro-label">FEED</span>
      <h2>Nueva publicación</h2>
      <p>Comparte un avance con tu círculo.</p>
      <form id="postForm" class="form">
        <label>Texto
          <textarea name="text" placeholder="He terminado…, estoy probando…, nueva compra…" required></textarea>
        </label>
        <button class="primary-btn" type="submit">Publicar</button>
      </form>
    </section>
  `;
}

function renderCommunity(){
  return `
    <section class="hero">
      <span class="micro-label">MI CÍRCULO</span>
      <strong>5 personas.</strong>
      <p>Lo bastante pequeño para conocer a todo el mundo. Lo bastante grande para habilitar compras.</p>
    </section>

    <div class="section-head"><h2>Miembros</h2><button>Invitar</button></div>
    <section class="card">
      ${[
        {name:state.user.name,handle:state.user.handle,info:"Tú",faction:state.user.favoriteFaction,self:true},
        ...state.friends
      ].map(user=>{
        const faction=factions.find(f=>f.id===user.faction) || factions.at(-1);
        return `
          <div class="community-user row">
            <div class="avatar">${esc(user.name[0])}</div>
            <div style="flex:1">
              <div class="post-name">${esc(user.name)} ${user.self?'<span class="tag">Tú</span>':''}</div>
              <div class="meta">${esc(user.handle)} · ${esc(user.info)}</div>
            </div>
            <div class="faction-sigil" title="${esc(faction.name)}">${esc(faction.icon)}</div>
          </div>
        `;
      }).join("")}
    </section>
  `;
}

function profileGallery(){
  if(profileTab==="posts"){
    return state.posts.filter(p=>p.author===state.user.name).map(p=>`<div class="gallery-item">${esc(p.emoji)}</div>`).join("")
      || `<div class="empty-state">Aún no has publicado nada.</div>`;
  }
  if(profileTab==="collection"){
    return state.collection.map(x=>`<div class="gallery-item">${esc(x.emoji)}</div>`).join("")
      || `<div class="empty-state">Tu colección está vacía.</div>`;
  }
  if(profileTab==="projects"){
    return `<div class="empty-state">Los proyectos llegan en la siguiente fase funcional.</div>`;
  }
  return `<div class="empty-state">Wishlist preparada para la siguiente fase funcional.</div>`;
}

function renderProfile(){
  const faction=currentFaction();
  const ownPosts=state.posts.filter(p=>p.author===state.user.name).length;
  const bannerStyle=state.user.bannerData
    ? `style="background-image:linear-gradient(180deg,transparent 52%,var(--bg)),url('${state.user.bannerData}')"`
    : "";

  return `
    <div class="profile-cover ${state.user.bannerData?"has-banner":""}" ${bannerStyle}></div>

    <section class="profile-panel">
      <div class="profile-top">
        ${avatarHTML("profile-avatar")}
        <button id="editProfileBtn" class="edit-btn">Editar perfil</button>
      </div>

      <h1 class="profile-name">${esc(state.user.name)}</h1>
      <div class="profile-handle">${esc(state.user.handle)}</div>

      <p class="profile-bio">${esc(state.user.bio)}</p>

      <div class="faction-badge">
        <div class="faction-sigil">${esc(faction.icon)}</div>
        <div class="faction-copy">
          <small>FACCIÓN FAVORITA · ${esc(faction.universe)}</small>
          <strong>${esc(faction.name)}</strong>
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat"><strong>${ownPosts}</strong><span>Publicaciones</span></div>
        <div class="profile-stat"><strong>${state.collection.length}</strong><span>Colección</span></div>
        <div class="profile-stat"><strong>${state.friends.length}</strong><span>Círculo</span></div>
      </div>

      <div class="profile-tabs">
        <button class="profile-tab ${profileTab==="posts"?"active":""}" data-profile-tab="posts">Publicaciones</button>
        <button class="profile-tab ${profileTab==="collection"?"active":""}" data-profile-tab="collection">Colección</button>
        <button class="profile-tab ${profileTab==="projects"?"active":""}" data-profile-tab="projects">Proyectos</button>
        <button class="profile-tab ${profileTab==="wishlist"?"active":""}" data-profile-tab="wishlist">Wishlist</button>
      </div>

      <div class="gallery">${profileGallery()}</div>
    </section>
  `;
}

function render(){
  const app=document.getElementById("app");
  app.innerHTML={
    feed:renderFeed,
    collection:renderCollection,
    add:renderAdd,
    community:renderCommunity,
    profile:renderProfile
  }[route]();

  document.querySelectorAll("[data-route]").forEach(btn=>{
    btn.addEventListener("click",()=>setRoute(btn.dataset.route));
  });

  document.querySelectorAll(".like-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const post=state.posts.find(p=>p.id===btn.dataset.id);
      if(!post) return;
      post.likes++;
      saveState();
      render();
    });
  });

  document.getElementById("addCollectionForm")?.addEventListener("submit",event=>{
    event.preventDefault();
    const fd=new FormData(event.currentTarget);
    state.collection.unshift({
      id:crypto.randomUUID(),
      name:fd.get("name"),
      faction:fd.get("faction"),
      status:fd.get("status"),
      cost:Number(fd.get("cost")||0),
      emoji:"🎨"
    });
    saveState();
    toast("Añadido a tu pila");
    setRoute("collection");
  });

  document.getElementById("postForm")?.addEventListener("submit",event=>{
    event.preventDefault();
    const fd=new FormData(event.currentTarget);
    state.posts.unshift({
      id:crypto.randomUUID(),
      author:state.user.name,
      initials:state.user.name[0]?.toUpperCase()||"P",
      text:fd.get("text"),
      likes:0,
      comments:0,
      time:"Ahora",
      emoji:"✨"
    });
    saveState();
    toast("Publicado");
    setRoute("feed");
  });

  document.getElementById("editProfileBtn")?.addEventListener("click",openProfileEditor);

  document.querySelectorAll("[data-profile-tab]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      profileTab=btn.dataset.profileTab;
      render();
    });
  });

  headerAvatar();
  syncNav();
}

function syncNav(){
  document.querySelectorAll(".bottom-nav .nav-item").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.route===route);
  });
}
function setRoute(next){
  route=next;
  render();
  window.scrollTo({top:0,behavior:"smooth"});
}

function populateFactionSelect(){
  const select=document.getElementById("favoriteFactionSelect");
  select.innerHTML = ["40K","Sigmar","Fantasy","—"].map(universe=>{
    const options=factions.filter(f=>f.universe===universe)
      .map(f=>`<option value="${f.id}">${f.name}</option>`).join("");
    return `<optgroup label="${universe}">${options}</optgroup>`;
  }).join("");
}
function openProfileEditor(){
  const dialog=document.getElementById("editProfileDialog");
  const form=document.getElementById("profileForm");
  form.elements.name.value=state.user.name;
  form.elements.handle.value=state.user.handle;
  form.elements.bio.value=state.user.bio;
  form.elements.favoriteFaction.value=state.user.favoriteFaction;
  dialog.showModal();
}
function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("notifBtn").addEventListener("click",()=>{
  document.getElementById("notificationsDialog").showModal();
});
document.getElementById("settingsBtn").addEventListener("click",()=>{
  document.getElementById("settingsDialog").showModal();
  setTheme(getTheme(),false);
});
document.querySelectorAll("[data-close]").forEach(btn=>{
  btn.addEventListener("click",()=>document.getElementById(btn.dataset.close).close());
});
document.querySelectorAll("[data-pick-theme]").forEach(btn=>{
  btn.addEventListener("click",()=>pickTheme(btn.dataset.pickTheme));
});
document.querySelectorAll("[data-quick-theme]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    setTheme(btn.dataset.quickTheme);
    render();
  });
});
document.querySelectorAll("[data-settings-theme]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    setTheme(btn.dataset.settingsTheme);
    render();
  });
});
document.getElementById("showFateAgain").addEventListener("click",()=>{
  document.getElementById("settingsDialog").close();
  openFateGate();
});
document.getElementById("profileForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const fd=new FormData(form);

  state.user.name=String(fd.get("name")||"").trim();
  state.user.handle=String(fd.get("handle")||"").trim();
  state.user.bio=String(fd.get("bio")||"").trim();
  state.user.favoriteFaction=String(fd.get("favoriteFaction")||"none");

  const avatarFile=form.elements.avatarFile.files?.[0];
  const bannerFile=form.elements.bannerFile.files?.[0];
  if(avatarFile) state.user.avatarData=await fileToDataURL(avatarFile);
  if(bannerFile) state.user.bannerData=await fileToDataURL(bannerFile);

  saveState();
  document.getElementById("editProfileDialog").close();
  toast("Perfil actualizado");
  render();
});

populateFactionSelect();
setTheme(getTheme(),false);
render();

if(!localStorage.getItem(SEEN_FATE_KEY)){
  openFateGate();
}

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}
