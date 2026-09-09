const CACHE="pile-of-shame-v9-5-shell";
const ASSETS=[
  "./",
  "./index.html",
  "./styles.css?v=9.4",
  "./app.js?v=9.4",
  "./supabase-config.js?v=9.4",
  "./manifest.webmanifest",
  "./assets/app-icon.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

// Durante desarrollo preferimos RED antes que caché. Así GitHub Pages muestra
// la versión recién subida y el caché queda solo como respaldo offline.
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  event.respondWith(
    fetch(event.request).then(response=>{
      if(response && response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }).catch(async()=>{
      return (await caches.match(event.request)) || (await caches.match("./index.html"));
    })
  );
});
