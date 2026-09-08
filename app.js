
const STORAGE_KEY = "hobbycircle-v1";

const defaultState = {
  user: {
    name: "Elena",
    handle: "@elena",
    bio: "Pintura, plástico y una pila de la vergüenza perfectamente controlada.",
  },
  collection: [
    { id: crypto.randomUUID(), name: "Gretchin", faction: "Orks", status: "Pintado", cost: 18, emoji: "🟢" },
    { id: crypto.randomUUID(), name: "Grifocorcel", faction: "Stormcast", status: "En proceso", cost: 32, emoji: "🪽" },
    { id: crypto.randomUUID(), name: "Proyecto caja", faction: "Otros", status: "Pendiente", cost: 0, emoji: "📦" }
  ],
  posts: [
    { id: crypto.randomUUID(), author: "Laura", initials: "L", text: "He terminado por fin esta unidad. Tres tardes y una cantidad irresponsable de pinceles.", likes: 4, comments: 2, time: "Hace 32 min", emoji: "🎨" },
    { id: crypto.randomUUID(), author: "Elena", initials: "E", text: "Probando esquema nuevo para los Gretchin. Creo que este verde se queda.", likes: 3, comments: 1, time: "Hace 2 h", emoji: "🟢" }
  ],
  friends: [
    { name: "Laura", handle: "@laura", info: "12 proyectos · 84 minis" },
    { name: "Marta", handle: "@marta", info: "6 proyectos · 41 minis" },
    { name: "Ana", handle: "@ana", info: "9 proyectos · 67 minis" },
    { name: "Sara", handle: "@sara", info: "4 proyectos · 29 minis" }
  ]
};

let state = loadState();
let route = "feed";

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function esc(str="") {
  return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}
function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}
function titleFor(r){
  return ({feed:"Feed",collection:"Colección",add:"Añadir",community:"Comunidad",profile:"Perfil"})[r];
}
function setRoute(next){
  route = next;
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.route === route));
  document.getElementById("screenTitle").textContent = titleFor(route);
  render();
  window.scrollTo({top:0,behavior:"smooth"});
}
function collectionStats(){
  const total = state.collection.length;
  const painted = state.collection.filter(x => x.status === "Pintado").length;
  const spent = state.collection.reduce((a,b) => a + Number(b.cost || 0), 0);
  return { total, painted, spent };
}

function renderFeed(){
  const {total, painted} = collectionStats();
  return `
    <section class="hero">
      <span class="muted">Tu círculo de hobby</span>
      <strong>Buenas, ${esc(state.user.name)}.</strong>
      <p class="muted">Tienes ${painted} de ${total} piezas registradas como pintadas.</p>
      <div class="progress"><span style="width:${total ? Math.round((painted/total)*100) : 0}%"></span></div>
    </section>

    <div class="section-title"><h2>Actividad reciente</h2><span class="meta">Grupo privado</span></div>
    ${state.posts.map(p => `
      <article class="card">
        <div class="row">
          <div class="avatar">${esc(p.initials)}</div>
          <div>
            <strong>${esc(p.author)}</strong>
            <div class="meta">${esc(p.time)}</div>
          </div>
        </div>
        <div class="feed-photo">${esc(p.emoji)}</div>
        <p>${esc(p.text)}</p>
        <div class="actions">
          <button class="pill like-btn" data-id="${p.id}">♡ ${p.likes}</button>
          <button class="pill">💬 ${p.comments}</button>
        </div>
      </article>
    `).join("")}
  `;
}

function renderCollection(){
  return `
    <section class="grid-2">
      <div class="card stat"><strong>${state.collection.length}</strong><span>Piezas</span></div>
      <div class="card stat"><strong>${state.collection.filter(x=>x.status==="Pintado").length}</strong><span>Pintadas</span></div>
    </section>

    <div class="section-title"><h2>Mi colección</h2><button class="pill" data-go="add">＋ Añadir</button></div>
    <section class="collection-grid">
      ${state.collection.map(item => `
        <article class="mini-card">
          <div class="mini-thumb">${esc(item.emoji || "🎨")}</div>
          <div class="mini-body">
            <strong>${esc(item.name)}</strong>
            <div class="meta">${esc(item.faction)}</div>
            <div style="margin-top:8px"><span class="tag">${esc(item.status)}</span></div>
          </div>
        </article>
      `).join("") || `<div class="empty">Aún no has añadido nada.</div>`}
    </section>
  `;
}

function renderAdd(){
  return `
    <section class="card">
      <h2>Añadir a colección</h2>
      <p class="muted">Esta primera versión guarda todo localmente en este dispositivo.</p>
      <form id="addForm" class="form">
        <label>Nombre
          <input name="name" placeholder="Ej. Gretchin Runtherd" required />
        </label>
        <label>Facción / categoría
          <input name="faction" placeholder="Ej. Orks" required />
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
          <input name="cost" type="number" step="0.01" min="0" placeholder="0,00" />
        </label>
        <label>Notas
          <textarea name="notes" placeholder="Pinturas, receta de color, ideas..."></textarea>
        </label>
        <button class="btn primary" type="submit">Guardar pieza</button>
      </form>
    </section>

    <section class="card">
      <h3>Publicar en el feed</h3>
      <form id="postForm" class="form">
        <label>¿Qué estás haciendo?
          <textarea name="text" placeholder="He terminado..., estoy probando..., nueva compra..." required></textarea>
        </label>
        <button class="btn" type="submit">Publicar</button>
      </form>
    </section>
  `;
}

function renderCommunity(){
  return `
    <section class="hero">
      <span class="muted">Grupo privado</span>
      <strong>5 personas</strong>
      <p class="muted">Vuestro espacio para compartir proyectos, compras, avances y desgracias con pinceles.</p>
    </section>
    <section class="card">
      <h2>Miembros</h2>
      ${[{name:state.user.name,handle:state.user.handle,info:"Tú"}, ...state.friends].map((f,i) => `
        <div class="friend row">
          <div class="avatar">${esc(f.name[0])}</div>
          <div style="flex:1">
            <strong>${esc(f.name)} ${i===0 ? '<span class="tag">Tú</span>' : ''}</strong>
            <div class="meta">${esc(f.handle)} · ${esc(f.info)}</div>
          </div>
          ${i ? '<button class="pill">Ver</button>' : ''}
        </div>
      `).join("")}
    </section>
  `;
}

function renderProfile(){
  const s = collectionStats();
  return `
    <section class="card">
      <div class="row">
        <div class="avatar" style="width:64px;height:64px;font-size:1.4rem">${esc(state.user.name[0])}</div>
        <div>
          <h2 style="margin-bottom:3px">${esc(state.user.name)}</h2>
          <div class="meta">${esc(state.user.handle)}</div>
        </div>
      </div>
      <p style="margin-top:16px">${esc(state.user.bio)}</p>
    </section>

    <section class="grid-2">
      <div class="card stat"><strong>${s.total}</strong><span>Colección</span></div>
      <div class="card stat"><strong>${s.painted}</strong><span>Pintadas</span></div>
      <div class="card stat"><strong>${s.spent.toFixed(2)} €</strong><span>Registrado</span></div>
      <div class="card stat"><strong>${state.posts.filter(p=>p.author===state.user.name).length}</strong><span>Publicaciones</span></div>
    </section>

    <section class="card">
      <h3>Datos</h3>
      <p class="muted">Puedes exportar una copia de esta versión local y restaurarla después.</p>
      <div class="actions">
        <button id="exportBtn" class="btn">Exportar copia</button>
        <label class="btn ghost" style="cursor:pointer">
          Importar
          <input id="importInput" type="file" accept="application/json" hidden />
        </label>
      </div>
    </section>
  `;
}

function render(){
  const app = document.getElementById("app");
  app.innerHTML = ({
    feed: renderFeed,
    collection: renderCollection,
    add: renderAdd,
    community: renderCommunity,
    profile: renderProfile
  })[route]();

  bindDynamicEvents();
}

function bindDynamicEvents(){
  document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => setRoute(b.dataset.go)));

  document.querySelectorAll(".like-btn").forEach(btn => btn.addEventListener("click", () => {
    const p = state.posts.find(x => x.id === btn.dataset.id);
    if (p) { p.likes++; saveState(); render(); }
  }));

  document.getElementById("addForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    state.collection.unshift({
      id: crypto.randomUUID(),
      name: fd.get("name"),
      faction: fd.get("faction"),
      status: fd.get("status"),
      cost: Number(fd.get("cost") || 0),
      notes: fd.get("notes"),
      emoji: "🎨"
    });
    saveState();
    toast("Guardado");
    setRoute("collection");
  });

  document.getElementById("postForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    state.posts.unshift({
      id: crypto.randomUUID(),
      author: state.user.name,
      initials: state.user.name[0].toUpperCase(),
      text: fd.get("text"),
      likes: 0,
      comments: 0,
      time: "Ahora",
      emoji: "✨"
    });
    saveState();
    toast("Publicado");
    setRoute("feed");
  });

  document.getElementById("exportBtn")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hobbycircle-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importInput")?.addEventListener("change", async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      state = imported;
      saveState();
      toast("Copia restaurada");
      render();
    } catch {
      toast("Archivo no válido");
    }
  });
}

document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => setRoute(btn.dataset.route)));
document.getElementById("notifBtn").addEventListener("click", () => document.getElementById("notificationsDialog").showModal());
document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => document.getElementById(btn.dataset.close).close()));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.error));
}
render();
