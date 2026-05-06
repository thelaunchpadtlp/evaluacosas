// evaluacosas Service Worker — cache-first para assets estáticos
const CACHE = "evaluacosas-v3";
const PRECACHE = [
  "/",
  "/styles.css",
  "/device-view.css",
  "/device-view.js",
  "/favicon.svg",
  "/manifest.webmanifest",
  "/ayuda/",
  "/sitemap/",
  "/privacy/",
  "/terms/"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // No cachear /admin/* o backend
  if (url.pathname.startsWith("/admin/") || url.hostname.includes("run.app")) return;

  // No cachear nada con fragmento de query no-cache
  if (url.search.includes("nocache=1")) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkResp) => {
        if (networkResp && networkResp.ok && url.origin === location.origin) {
          const clone = networkResp.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return networkResp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
