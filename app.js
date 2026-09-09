import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js?v=9.4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

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

const emptyState = () => ({
  user: {
    id:"",
    name:"",
    handle:"",
    bio:"",
    favoriteFaction:"none",
    avatarData:"",
    bannerData:""
  },
  collection:[],
  posts:[],
  people:[]
});

let state = emptyState();
let currentUser = null;
let route = "feed";
let profileTab = "posts";
let activeSocialFilter = "all";
let loadingCloud = false;

function esc(value=""){
  return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}

function normalizeHandle(raw=""){
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/^@+/,"")
    .replace(/[^a-z0-9_]/g,"");
}
function credentialEmail(handle){
  // Dirección técnica interna para Supabase Auth.
  // El usuario nunca la ve ni tiene que introducir un email real.
  return `${normalizeHandle(handle)}@users.pileofshame.app`;
}
function displayHandle(handle=""){
  const h=normalizeHandle(handle);
  return h ? `@${h}` : "";
}
function relativeTime(iso){
  if(!iso) return "";
  const ms=Date.now()-new Date(iso).getTime();
  const mins=Math.max(0,Math.floor(ms/60000));
  if(mins<1) return "Ahora";
  if(mins<60) return `Hace ${mins} min`;
  const hours=Math.floor(mins/60);
  if(hours<24) return `Hace ${hours} h`;
  const days=Math.floor(hours/24);
  if(days<7) return `Hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-ES");
}
function toast(message){
  const node=document.createElement("div");
  node.textContent=message;
  node.style.cssText="position:fixed;left:50%;bottom:100px;transform:translateX(-50%);z-index:220;background:var(--text);color:var(--bg);padding:10px 14px;border-radius:999px;font-weight:900;box-shadow:var(--shadow)";
  document.body.appendChild(node);
  setTimeout(()=>node.remove(),1800);
}
function setAuthMessage(message="",error=false){
  const el=document.getElementById("authMessage");
  if(!el) return;
  el.textContent=message;
  el.classList.toggle("error",error);
}

function getTheme(){
  return localStorage.getItem(THEME_KEY) || "40k";
}
function setTheme(theme,persist=true){
  if(!["40k","sigmar","fantasy"].includes(theme)) theme="40k";
  document.body.dataset.theme=theme;
  if(persist) localStorage.setItem(THEME_KEY,theme);

  const logoStore=document.getElementById("embeddedLogoStore");
  const metas={
    "40k":{themeColor:"#07131b",logo:logoStore?.dataset.logo40k || ""},
    "sigmar":{themeColor:"#070c10",logo:logoStore?.dataset.logoSigmar || ""},
    "fantasy":{themeColor:"#17110c",logo:logoStore?.dataset.logoFantasy || ""}
  };

  const brandLogo=document.getElementById("brandLogo");
  const authLogo=document.getElementById("authLogo");
  if(brandLogo && metas[theme].logo) brandLogo.src=metas[theme].logo;
  if(authLogo && metas[theme].logo) authLogo.src=metas[theme].logo;
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

function showAuthGate(){
  const gate=document.getElementById("authGate");
  gate.classList.add("open");
  gate.setAttribute("aria-hidden","false");
}
function hideAuthGate(){
  const gate=document.getElementById("authGate");
  gate.classList.remove("open");
  gate.setAttribute("aria-hidden","true");
}

function currentFaction(){
  return factions.find(f=>f.id===state.user.favoriteFaction) || factions.at(-1);
}
function isMutual(person){
  return Boolean(person?.following && person?.followsYou);
}
function followerCount(){
  return state.people.filter(p=>p.followsYou).length;
}
function followingCount(){
  return state.people.filter(p=>p.following).length;
}
function personForAuthor(authorId){
  return state.people.find(p=>p.id===authorId);
}
function visibilityMeta(value){
  return ({
    public:{icon:"◎",label:"Público"},
    friends:{icon:"♧",label:"Amigos"},
    private:{icon:"◈",label:"Solo yo"}
  })[value] || {icon:"◎",label:"Público"};
}

function avatarHTML(sizeClass="avatar"){
  return state.user.avatarData
    ? `<div class="${sizeClass}"><img src="${esc(state.user.avatarData)}" alt=""></div>`
    : `<div class="${sizeClass}">${esc(state.user.name?.[0]?.toUpperCase() || "P")}</div>`;
}
function headerAvatar(){
  const el=document.getElementById("headerAvatar");
  if(!el) return;
  if(state.user.avatarData){
    el.innerHTML=`<img src="${esc(state.user.avatarData)}" alt="">`;
  }else{
    el.textContent=state.user.name?.[0]?.toUpperCase() || "P";
  }
}

async function loadCloudState(){
  if(!currentUser) return;
  loadingCloud=true;
  render();

  const uid=currentUser.id;

  const [
    profileRes,
    profilesRes,
    followsRes,
    postsRes,
    collectionRes
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id",uid).single(),
    supabase.from("profiles").select("*").neq("id",uid).order("created_at",{ascending:true}),
    supabase.from("follows").select("*").or(`follower_id.eq.${uid},following_id.eq.${uid}`),
    supabase.from("posts").select("*").order("created_at",{ascending:false}).limit(100),
    supabase.from("collection_items").select("*").eq("user_id",uid).order("created_at",{ascending:false})
  ]);

  const firstError=[profileRes,profilesRes,followsRes,postsRes,collectionRes].find(x=>x.error)?.error;
  if(firstError){
    loadingCloud=false;
    console.error(firstError);
    throw firstError;
  }

  const visiblePosts=postsRes.data || [];
  const postIds=visiblePosts.map(p=>p.id);

  let likes=[], comments=[];
  if(postIds.length){
    const [likesRes,commentsRes]=await Promise.all([
      supabase.from("post_likes").select("post_id,user_id").in("post_id",postIds),
      supabase.from("comments").select("id,post_id").in("post_id",postIds)
    ]);
    if(likesRes.error) throw likesRes.error;
    if(commentsRes.error) throw commentsRes.error;
    likes=likesRes.data || [];
    comments=commentsRes.data || [];
  }

  const ownProfile=profileRes.data;
  const allOtherProfiles=profilesRes.data || [];
  const follows=followsRes.data || [];

  state.user={
    id:uid,
    name:ownProfile.display_name,
    handle:displayHandle(ownProfile.handle),
    bio:ownProfile.bio || "",
    favoriteFaction:ownProfile.favorite_faction || "none",
    avatarData:ownProfile.avatar_url || "",
    bannerData:ownProfile.banner_url || ""
  };

  state.people=allOtherProfiles.map(profile=>({
    id:profile.id,
    name:profile.display_name,
    handle:displayHandle(profile.handle),
    info:"Coleccionista",
    faction:profile.favorite_faction || "none",
    avatarData:profile.avatar_url || "",
    following:follows.some(f=>f.follower_id===uid && f.following_id===profile.id),
    followsYou:follows.some(f=>f.follower_id===profile.id && f.following_id===uid)
  }));

  const profileMap=new Map([[uid,ownProfile],...allOtherProfiles.map(p=>[p.id,p])]);

  state.posts=visiblePosts.map(post=>{
    const profile=profileMap.get(post.user_id);
    const postLikes=likes.filter(l=>l.post_id===post.id);
    return {
      id:post.id,
      authorId:post.user_id,
      author:profile?.display_name || "Usuario",
      authorHandle:displayHandle(profile?.handle || ""),
      initials:(profile?.display_name || "U")[0].toUpperCase(),
      text:post.body,
      likes:postLikes.length,
      comments:comments.filter(c=>c.post_id===post.id).length,
      time:relativeTime(post.created_at),
      emoji:"✨",
      visibility:post.visibility,
      likedByMe:postLikes.some(l=>l.user_id===uid),
      avatarData:profile?.avatar_url || ""
    };
  });

  state.collection=(collectionRes.data || []).map(item=>({
    id:item.id,
    kind:item.kind,
    name:item.name,
    faction:item.faction,
    category:item.category,
    brand:item.brand,
    status:item.status,
    quantity:item.quantity,
    cost:Number(item.cost || 0),
    notes:item.notes,
    visibility:item.visibility,
    emoji:item.kind==="material"
      ? (item.category==="Pintura" ? "🎨" : item.category==="Pincel" ? "🖌️" : item.category==="Herramienta" ? "🛠️" : "📦")
      : "🎨"
  }));

  loadingCloud=false;
  render();
}

function renderFeed(){
  if(loadingCloud) return `<div class="cloud-loading"><strong>Consultando la pila…</strong>Sincronizando con Supabase.</div>`;

  return `
    <div class="screen-intro">
      <div>
        <span class="micro-label">INICIO</span>
        <h1>Actividad</h1>
      </div>
      <button style="border:0;background:transparent;color:var(--accent-2);cursor:pointer" data-route="explore">Explorar</button>
    </div>

    ${state.posts.length ? state.posts.map(post=>{
      const privacy=visibilityMeta(post.visibility);
      const person=personForAuthor(post.authorId);
      const friend=person && isMutual(person);
      const avatar=post.avatarData
        ? `<div class="avatar"><img src="${esc(post.avatarData)}" alt=""></div>`
        : `<div class="avatar">${esc(post.initials)}</div>`;

      return `
        <article class="card post-card">
          <div class="row">
            ${avatar}
            <div>
              <div class="post-name">
                ${esc(post.author)}
                ${friend ? '<span class="friend-chip">Amigos</span>' : ''}
              </div>
              <div class="meta">${esc(post.authorHandle)} · ${esc(post.time)}</div>
              <div class="visibility-pill">${privacy.icon} ${privacy.label}</div>
            </div>
            <button style="margin-left:auto;border:0;background:transparent;color:var(--muted)">•••</button>
          </div>

          <p class="post-text">${esc(post.text)}</p>
          <div class="post-media">${esc(post.emoji)}</div>

          <div class="post-actions">
            <button class="like-btn ${post.likedByMe ? "liked" : ""}" data-id="${post.id}">
              ${post.likedByMe ? "♥" : "♡"} <span>${post.likes}</span>
            </button>
            <button>▢ <span>${post.comments}</span></button>
            <button class="save-action">◇</button>
          </div>
        </article>
      `;
    }).join("") : `<div class="no-posts">Todavía no hay publicaciones visibles. Alguien tendrá que estrenar la desgracia.</div>`}
  `;
}

function renderCollection(){
  if(loadingCloud) return `<div class="cloud-loading"><strong>Abriendo vitrinas…</strong>Sincronizando colección.</div>`;
  const painted=state.collection.filter(x=>x.status==="Pintado").length;

  return `
    <div class="screen-intro">
      <div>
        <span class="micro-label">MI COLECCIÓN</span>
        <h1>Colección</h1>
        <p>${state.collection.length} elementos · ${painted} pintados</p>
      </div>
      <button style="border:0;background:transparent;color:var(--accent-2);cursor:pointer" data-route="add">＋ Añadir</button>
    </div>

    <section class="collection-grid">
      ${state.collection.length ? state.collection.map(item=>`
        <article class="collection-card">
          <div class="thumb">${esc(item.emoji)}</div>
          <div class="copy">
            <strong>${esc(item.name)}</strong>
            <span class="meta">${esc(item.faction || item.category || "Hobby")}</span>
            <div>
              <span class="item-kind">${item.kind==="material" ? "Material" : "Miniatura"}</span>
              ${item.status ? `<span class="tag">${esc(item.status)}</span>` : ""}
            </div>
          </div>
        </article>
      `).join("") : `<div class="empty-state">Tu pila está sospechosamente vacía.</div>`}
    </section>
  `;
}

function renderAdd(){
  return `
    <div class="screen-intro">
      <div>
        <span class="micro-label">AÑADIR</span>
        <h1>¿Qué entra hoy en la pila?</h1>
      </div>
    </div>

    <section class="add-stack">

      <details class="add-accordion" name="add-type">
        <summary>
          <span class="add-summary-icon">⚔</span>
          <span class="add-summary-copy">
            <strong>Miniatura</strong>
            <small>Mini, unidad, caja o pieza de colección</small>
          </span>
          <span class="add-chevron">⌄</span>
        </summary>

        <div class="add-accordion-body">
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
            <button class="primary-btn" type="submit">Guardar miniatura</button>
          </form>
        </div>
      </details>

      <details class="add-accordion" name="add-type">
        <summary>
          <span class="add-summary-icon">🖌</span>
          <span class="add-summary-copy">
            <strong>Material de hobby</strong>
            <small>Pinturas, pinceles, herramientas y otros consumibles</small>
          </span>
          <span class="add-chevron">⌄</span>
        </summary>

        <div class="add-accordion-body">
          <form id="addMaterialForm" class="form">
            <label>Tipo</label>
            <div class="material-type-row">
              <label class="material-type-option">
                <input type="radio" name="category" value="Pintura" checked>
                <span>🎨 Pintura</span>
              </label>
              <label class="material-type-option">
                <input type="radio" name="category" value="Pincel">
                <span>🖌 Pincel</span>
              </label>
              <label class="material-type-option">
                <input type="radio" name="category" value="Herramienta">
                <span>🛠 Herramienta</span>
              </label>
              <label class="material-type-option">
                <input type="radio" name="category" value="Otro">
                <span>📦 Otro</span>
              </label>
            </div>

            <label>Nombre
              <input name="name" placeholder="Ej. Nuln Oil" required>
            </label>
            <label>Marca
              <input name="brand" placeholder="Ej. Citadel">
            </label>
            <label>Cantidad
              <input name="quantity" type="number" min="1" value="1">
            </label>
            <label>Coste (€)
              <input name="cost" type="number" step="0.01" min="0" placeholder="0,00">
            </label>
            <button class="primary-btn" type="submit">Guardar material</button>
          </form>
        </div>
      </details>

      <details class="add-accordion" name="add-type">
        <summary>
          <span class="add-summary-icon">✦</span>
          <span class="add-summary-copy">
            <strong>Nueva publicación</strong>
            <small>Comparte un avance, compra o proyecto</small>
          </span>
          <span class="add-chevron">⌄</span>
        </summary>

        <div class="add-accordion-body">
          <form id="postForm" class="form">
            <label>Texto
              <textarea name="text" placeholder="He terminado…, estoy probando…, nueva compra…" required></textarea>
            </label>
            <label>Visibilidad</label>
            <div class="privacy-options">
              <label class="privacy-option">
                <input type="radio" name="visibility" value="public" checked>
                <span><b>◎</b>Todo el mundo</span>
              </label>
              <label class="privacy-option">
                <input type="radio" name="visibility" value="friends">
                <span><b>♧</b>Amigos</span>
              </label>
              <label class="privacy-option">
                <input type="radio" name="visibility" value="private">
                <span><b>◈</b>Solo yo</span>
              </label>
            </div>
            <button class="primary-btn" type="submit">Publicar</button>
          </form>
        </div>
      </details>

    </section>
  `;
}

function renderExplore(){
  if(loadingCloud) return `<div class="cloud-loading"><strong>Buscando coleccionistas…</strong>Sincronizando perfiles.</div>`;

  return `
    <div class="screen-intro">
      <div>
        <span class="micro-label">DESCUBRIR</span>
        <h1>Explorar</h1>
        <p>Encuentra gente del hobby y decide a quién seguir.</p>
      </div>
    </div>

    <div class="explore-search">
      <input id="peopleSearch" type="search" placeholder="Buscar por nombre o @usuario">
    </div>

    <div class="social-tabs">
      <button class="social-tab ${activeSocialFilter==="all"?"active":""}" data-social-filter="all">Todos</button>
      <button class="social-tab ${activeSocialFilter==="friends"?"active":""}" data-social-filter="friends">Amigos</button>
    </div>

    <section class="card" id="peopleList">
      ${renderPeopleList(activeSocialFilter)}
    </section>
  `;
}

function renderPeopleList(filter="all",query=""){
  const q=String(query||"").trim().toLowerCase();
  const people=state.people.filter(person=>{
    const matchesFilter=filter==="friends" ? isMutual(person) : true;
    const matchesQuery=!q || person.name.toLowerCase().includes(q) || person.handle.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  if(!people.length) return `<div class="no-posts">No hay usuarios que coincidan.</div>`;

  return people.map(person=>{
    const faction=factions.find(f=>f.id===person.faction) || factions.at(-1);
    const mutual=isMutual(person);
    const buttonClass=mutual ? "friend" : person.following ? "following" : "";
    const buttonText=mutual ? "Amigos" : person.following ? "Siguiendo" : person.followsYou ? "Seguir también" : "Seguir";
    const avatar=person.avatarData
      ? `<div class="avatar"><img src="${esc(person.avatarData)}" alt=""></div>`
      : `<div class="avatar">${esc(person.name[0])}</div>`;

    return `
      <div class="person-card">
        ${avatar}
        <div class="person-copy">
          <strong>${esc(person.name)} ${mutual ? '<span class="friend-chip">Amigos</span>' : ''}</strong>
          <div class="meta">${esc(person.handle)} · ${esc(person.info)}</div>
          <div class="visibility-pill">${esc(faction.icon)} ${esc(faction.name)}${person.followsYou && !mutual ? " · Te sigue" : ""}</div>
        </div>
        <button class="follow-btn ${buttonClass}" data-person-id="${esc(person.id)}">${buttonText}</button>
      </div>
    `;
  }).join("");
}

function profileGallery(){
  if(profileTab==="posts"){
    return state.posts.filter(p=>p.authorId===state.user.id).map(p=>`<div class="gallery-item">${esc(p.emoji)}</div>`).join("")
      || `<div class="empty-state">Aún no has publicado nada.</div>`;
  }
  if(profileTab==="collection"){
    return state.collection.map(x=>`<div class="gallery-item">${esc(x.emoji)}</div>`).join("")
      || `<div class="empty-state">Tu colección está vacía.</div>`;
  }
  if(profileTab==="projects") return `<div class="empty-state">Proyectos: tabla creada en Supabase; interfaz completa en la siguiente fase.</div>`;
  return `<div class="empty-state">Wishlist: tabla creada en Supabase; interfaz completa en la siguiente fase.</div>`;
}

function renderProfile(){
  if(loadingCloud) return `<div class="cloud-loading"><strong>Montando tu vitrina…</strong>Sincronizando perfil.</div>`;

  const faction=currentFaction();
  const ownPosts=state.posts.filter(p=>p.authorId===state.user.id).length;
  const bannerStyle=state.user.bannerData
    ? `style="background-image:linear-gradient(180deg,transparent 52%,var(--bg)),url('${esc(state.user.bannerData)}')"`
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

      <div class="profile-follow-line">
        <strong>${followingCount()}</strong> Siguiendo · <strong>${followerCount()}</strong> Seguidores
      </div>

      <div class="faction-badge">
        <div class="faction-sigil">${esc(faction.icon)}</div>
        <div class="faction-copy">
          <small>FACCIÓN FAVORITA · ${esc(faction.universe)}</small>
          <strong>${esc(faction.name)}</strong>
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat"><strong>${ownPosts}</strong><span>Publicaciones</span></div>
        <div class="profile-stat"><strong>${followerCount()}</strong><span>Seguidores</span></div>
        <div class="profile-stat"><strong>${followingCount()}</strong><span>Siguiendo</span></div>
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
  if(!currentUser){
    app.innerHTML="";
    return;
  }

  app.innerHTML={
    feed:renderFeed,
    collection:renderCollection,
    add:renderAdd,
    explore:renderExplore,
    profile:renderProfile
  }[route]();

  bindDynamicEvents();
  headerAvatar();
  syncNav();
}

function bindDynamicEvents(){
  document.querySelectorAll("[data-route]").forEach(btn=>{
    btn.addEventListener("click",()=>setRoute(btn.dataset.route));
  });

  document.querySelectorAll(".like-btn").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const post=state.posts.find(p=>p.id===btn.dataset.id);
      if(!post || !currentUser) return;
      btn.disabled=true;

      let result;
      if(post.likedByMe){
        result=await supabase.from("post_likes")
          .delete()
          .eq("post_id",post.id)
          .eq("user_id",currentUser.id);
      }else{
        result=await supabase.from("post_likes")
          .insert({post_id:post.id,user_id:currentUser.id});
      }

      if(result.error){
        console.error(result.error);
        toast("No se pudo cambiar el like");
      }else{
        post.likedByMe=!post.likedByMe;
        post.likes=Math.max(0,post.likes+(post.likedByMe?1:-1));
        render();
      }
    });
  });

  document.querySelectorAll("[data-social-filter]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      activeSocialFilter=btn.dataset.socialFilter;
      render();
    });
  });

  document.getElementById("peopleSearch")?.addEventListener("input",event=>{
    const list=document.getElementById("peopleList");
    if(list) {
      list.innerHTML=renderPeopleList(activeSocialFilter,event.currentTarget.value);
      bindFollowButtons();
    }
  });

  bindFollowButtons();

  document.getElementById("addCollectionForm")?.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!currentUser) return;
    const fd=new FormData(event.currentTarget);

    const {error}=await supabase.from("collection_items").insert({
      user_id:currentUser.id,
      kind:"mini",
      name:String(fd.get("name")||"").trim(),
      faction:String(fd.get("faction")||"").trim(),
      status:String(fd.get("status")||""),
      quantity:1,
      cost:Number(fd.get("cost")||0),
      visibility:"public"
    });

    if(error){
      console.error(error);
      toast("No se pudo guardar");
      return;
    }
    toast("Añadido a tu pila");
    route="collection";
    await loadCloudState();
  });

  document.getElementById("addMaterialForm")?.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!currentUser) return;
    const fd=new FormData(event.currentTarget);

    const {error}=await supabase.from("collection_items").insert({
      user_id:currentUser.id,
      kind:"material",
      name:String(fd.get("name")||"").trim(),
      category:String(fd.get("category")||"Otro"),
      brand:String(fd.get("brand")||"").trim(),
      quantity:Number(fd.get("quantity")||1),
      cost:Number(fd.get("cost")||0),
      visibility:"public"
    });

    if(error){
      console.error(error);
      toast("No se pudo guardar");
      return;
    }
    toast("Material añadido");
    route="collection";
    await loadCloudState();
  });

  document.getElementById("postForm")?.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!currentUser) return;
    const fd=new FormData(event.currentTarget);

    const {error}=await supabase.from("posts").insert({
      user_id:currentUser.id,
      body:String(fd.get("text")||"").trim(),
      visibility:String(fd.get("visibility")||"public")
    });

    if(error){
      console.error(error);
      toast("No se pudo publicar");
      return;
    }
    toast("Publicado");
    route="feed";
    await loadCloudState();
  });

  document.getElementById("editProfileBtn")?.addEventListener("click",openProfileEditor);

  document.querySelectorAll("[data-profile-tab]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      profileTab=btn.dataset.profileTab;
      render();
    });
  });
}

function bindFollowButtons(){
  document.querySelectorAll("[data-person-id]").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      if(!currentUser) return;
      const person=state.people.find(p=>p.id===btn.dataset.personId);
      if(!person) return;
      btn.disabled=true;

      const result=person.following
        ? await supabase.from("follows")
            .delete()
            .eq("follower_id",currentUser.id)
            .eq("following_id",person.id)
        : await supabase.from("follows")
            .insert({follower_id:currentUser.id,following_id:person.id});

      if(result.error){
        console.error(result.error);
        toast("No se pudo cambiar el seguimiento");
        btn.disabled=false;
        return;
      }

      person.following=!person.following;
      render();
    });
  });
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
  select.innerHTML=["40K","Sigmar","Fantasy","—"].map(universe=>{
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
async function uploadProfileMedia(file,kind){
  if(!file || !currentUser) return "";
  const extension=(file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
  const path=`${currentUser.id}/${kind}-${Date.now()}.${extension || "jpg"}`;

  const {error}=await supabase.storage.from("profile-media").upload(path,file,{
    cacheControl:"3600",
    upsert:true
  });
  if(error) throw error;

  const {data}=supabase.storage.from("profile-media").getPublicUrl(path);
  return data.publicUrl;
}

async function exportBackup(){
  if(!currentUser) return;

  const uid=currentUser.id;
  const [profile,posts,collection,projects,wishlist,follows]=await Promise.all([
    supabase.from("profiles").select("*").eq("id",uid).single(),
    supabase.from("posts").select("*").eq("user_id",uid).order("created_at"),
    supabase.from("collection_items").select("*").eq("user_id",uid).order("created_at"),
    supabase.from("projects").select("*").eq("user_id",uid).order("created_at"),
    supabase.from("wishlist_items").select("*").eq("user_id",uid).order("created_at"),
    supabase.from("follows").select("following_id").eq("follower_id",uid)
  ]);

  const failed=[profile,posts,collection,projects,wishlist,follows].find(r=>r.error);
  if(failed){
    console.error(failed.error);
    toast("No se pudo crear la copia");
    return;
  }

  const backup={
    format:"pile-of-shame-backup",
    version:1,
    created_at:new Date().toISOString(),
    profile:profile.data,
    posts:posts.data,
    collection:collection.data,
    projects:projects.data,
    wishlist:wishlist.data,
    following:(follows.data || []).map(x=>x.following_id)
  };

  const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`pile-of-shame-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importBackup(file){
  if(!currentUser || !file) return;

  let backup;
  try{
    backup=JSON.parse(await file.text());
  }catch{
    toast("El archivo no es válido");
    return;
  }

  if(backup?.format!=="pile-of-shame-backup"){
    toast("No es una copia de PILE OF SHAME");
    return;
  }

  const uid=currentUser.id;
  const operations=[];

  if(backup.profile){
    operations.push(
      supabase.from("profiles").update({
        display_name:backup.profile.display_name || state.user.name,
        bio:backup.profile.bio || "",
        favorite_faction:backup.profile.favorite_faction || "none",
        avatar_url:backup.profile.avatar_url || "",
        banner_url:backup.profile.banner_url || ""
      }).eq("id",uid)
    );
  }

  if(Array.isArray(backup.collection) && backup.collection.length){
    operations.push(
      supabase.from("collection_items").insert(
        backup.collection.map(item=>({
          user_id:uid,
          kind:item.kind,
          name:item.name,
          faction:item.faction || "",
          category:item.category || "",
          brand:item.brand || "",
          status:item.status || "",
          quantity:item.quantity || 1,
          cost:item.cost || 0,
          purchase_date:item.purchase_date || null,
          notes:item.notes || "",
          visibility:item.visibility || "public"
        }))
      )
    );
  }

  if(Array.isArray(backup.posts) && backup.posts.length){
    operations.push(
      supabase.from("posts").insert(
        backup.posts.map(post=>({
          user_id:uid,
          body:post.body,
          visibility:post.visibility || "public"
        }))
      )
    );
  }

  const results=await Promise.all(operations);
  const failed=results.find(r=>r.error);
  if(failed){
    console.error(failed.error);
    toast("La copia se restauró solo parcialmente");
  }else{
    toast("Copia restaurada");
  }

  document.getElementById("settingsDialog")?.close();
  await loadCloudState();
}

function setAuthTab(tab){
  const validTab=tab==="signup" ? "signup" : "login";

  document.querySelectorAll("[data-auth-tab]").forEach(btn=>{
    const selected=btn.dataset.authTab===validTab;
    btn.classList.toggle("active",selected);
    btn.setAttribute("aria-selected",selected ? "true" : "false");
  });

  document.querySelectorAll("[data-auth-view]").forEach(form=>{
    const active=form.dataset.authView===validTab;

    form.hidden=!active;
    form.classList.toggle("active",active);
    form.setAttribute("aria-hidden",active ? "false" : "true");

    // Forzamos display inline con !important para que ningún CSS cacheado pueda
    // volver a mostrar ambos formularios a la vez en Safari.
    form.style.setProperty("display", active ? "grid" : "none", "important");

    // Un formulario inactivo ni se ve ni participa en validación/autofill/submit.
    form.querySelectorAll("input, textarea, select, button").forEach(control=>{
      control.disabled=!active;
    });
  });

  setAuthMessage("");
}

async function handleLogin(event){
  event.preventDefault();
  const fd=new FormData(event.currentTarget);
  const handle=normalizeHandle(fd.get("handle"));
  const password=String(fd.get("password")||"");

  if(handle.length<3){
    setAuthMessage("El @usuario no es válido.",true);
    return;
  }

  setAuthMessage("Entrando…");
  const {data,error}=await supabase.auth.signInWithPassword({
    email:credentialEmail(handle),
    password
  });

  if(error){
    console.error(error);
    setAuthMessage("Usuario o contraseña incorrectos.",true);
    return;
  }

  currentUser=data.user;
  hideAuthGate();
  setAuthMessage("");
  await loadCloudState();

  if(!localStorage.getItem(SEEN_FATE_KEY)) openFateGate();
}

async function handleSignup(event){
  event.preventDefault();
  const fd=new FormData(event.currentTarget);

  const displayName=String(fd.get("name")||"").trim();
  const handle=normalizeHandle(fd.get("handle"));
  const password=String(fd.get("password")||"");
  const password2=String(fd.get("password2")||"");

  if(handle.length<3 || handle.length>24){
    setAuthMessage("El @usuario debe tener entre 3 y 24 caracteres.",true);
    return;
  }
  if(password!==password2){
    setAuthMessage("Las contraseñas no coinciden.",true);
    return;
  }

  setAuthMessage("Creando cuenta…");

  const {data,error}=await supabase.auth.signUp({
    email:credentialEmail(handle),
    password,
    options:{
      data:{
        handle,
        display_name:displayName
      }
    }
  });

  if(error){
    console.error(error);
    const msg=String(error.message || "");
    if(msg.toLowerCase().includes("database error")){
      setAuthMessage("La base de datos no ha quedado instalada correctamente. Ejecuta el SQL de V9.1 completo en Supabase.",true);
    }else if(msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")){
      setAuthMessage("Ese @usuario ya está registrado.",true);
    }else{
      setAuthMessage(msg || "No se pudo crear la cuenta.",true);
    }
    return;
  }

  if(!data.session){
    setAuthMessage("La cuenta se creó, pero falta desactivar Confirm Email en Supabase para poder entrar sin correo.",true);
    return;
  }

  currentUser=data.user;
  hideAuthGate();
  setAuthMessage("");
  await loadCloudState();

  if(!localStorage.getItem(SEEN_FATE_KEY)) openFateGate();
}

function bindStaticEvents(){
  document.querySelectorAll("[data-auth-tab]").forEach(btn=>{
    btn.addEventListener("click",()=>setAuthTab(btn.dataset.authTab));
  });

  document.getElementById("loginForm").addEventListener("submit",handleLogin);
  document.getElementById("signupForm").addEventListener("submit",handleSignup);

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

  document.getElementById("logoutBtn").addEventListener("click",async()=>{
    await supabase.auth.signOut();
    currentUser=null;
    state=emptyState();
    document.getElementById("settingsDialog").close();
    showAuthGate();
    render();
  });

  document.getElementById("exportBackupBtn").addEventListener("click",exportBackup);
  document.getElementById("importBackupInput").addEventListener("change",async event=>{
    const file=event.currentTarget.files?.[0];
    if(file) await importBackup(file);
    event.currentTarget.value="";
  });

  document.getElementById("profileForm").addEventListener("submit",async event=>{
    event.preventDefault();
    if(!currentUser) return;

    const form=event.currentTarget;
    const fd=new FormData(form);

    try{
      let avatarUrl=state.user.avatarData;
      let bannerUrl=state.user.bannerData;

      const avatarFile=form.elements.avatarFile.files?.[0];
      const bannerFile=form.elements.bannerFile.files?.[0];

      if(avatarFile) avatarUrl=await uploadProfileMedia(avatarFile,"avatar");
      if(bannerFile) bannerUrl=await uploadProfileMedia(bannerFile,"banner");

      const {error}=await supabase.from("profiles").update({
        display_name:String(fd.get("name")||"").trim(),
        bio:String(fd.get("bio")||"").trim(),
        favorite_faction:String(fd.get("favoriteFaction")||"none"),
        avatar_url:avatarUrl || "",
        banner_url:bannerUrl || ""
      }).eq("id",currentUser.id);

      if(error) throw error;

      document.getElementById("editProfileDialog").close();
      toast("Perfil actualizado");
      await loadCloudState();
    }catch(error){
      console.error(error);
      toast("No se pudo actualizar el perfil");
    }
  });
}

async function init(){
  populateFactionSelect();
  setTheme(getTheme(),false);
  bindStaticEvents();
  setAuthTab("login");

  const {data:{session},error}=await supabase.auth.getSession();
  if(error) console.error(error);

  if(session?.user){
    currentUser=session.user;
    hideAuthGate();
    try{
      await loadCloudState();
      if(!localStorage.getItem(SEEN_FATE_KEY)) openFateGate();
    }catch(error){
      console.error(error);
      showAuthGate();
      setAuthMessage("No se pudo cargar la base de datos. Ejecuta supabase_setup.sql en Supabase.",true);
    }
  }else{
    showAuthGate();
    render();
  }

  supabase.auth.onAuthStateChange(async(event,session)=>{
    if(event==="SIGNED_OUT"){
      currentUser=null;
      state=emptyState();
      showAuthGate();
      render();
    }
  });

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>{
      navigator.serviceWorker.register("./sw.js", {updateViaCache:"none"})
        .then(registration=>registration.update())
        .catch(()=>{});
    });
  }
}

init();
