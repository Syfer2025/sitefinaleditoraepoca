const CACHE_NAME = "epoca-editora-v2";
const PRECACHE_URLS = ["/", "/assets/logo.png", "/assets/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Only cache same-origin requests (our JS/CSS/HTML).
  // Let ALL cross-origin requests (Unsplash images, Supabase API/Storage, CDNs) go straight to network.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip service-worker and manifest
  if (url.pathname === "/sw.js" || url.pathname === "/manifest.json") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response && response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
