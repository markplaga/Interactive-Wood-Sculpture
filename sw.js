const VERSION='wood-sculpture-v1';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
const ASSETS=['straight-panel.png','corner-panel.png','blank-panel.png','dark-walnut-bright-red-straight.png','dark-walnut-bright-red-corner.png','dark-walnut-bright-red-blank.png','whitewood-forestgreen-exact-straight.png','whitewood-forestgreen-exact-corner.png','whitewood-forestgreen-exact-blank.png'].map(f=>'assets/'+f);

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(VERSION);
    await c.addAll(SHELL);
    // Wood images are large; cache them best-effort so a failure never blocks install.
    await Promise.allSettled(ASSETS.map(a=>c.add(a)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()) if(k!==VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin) return;
  if(req.mode==='navigate'){
    // Network first for the page so updates arrive; fall back to cache offline.
    e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(VERSION).then(c=>c.put('index.html',copy));return r}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{
    if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(req,copy));}
    return r;
  })));
});
