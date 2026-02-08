const APP_CACHE = "spotify-codex-v5";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/playlist.html",
  "/recently.html",
  "/session.html",
  "/css/styles.css",
  "/js/menu.js",
  "/js/auth.js",
  "/js/app.js",
  "/js/queue.js",
  "/js/playlist.js",
  "/js/recently.js",
  "/js/session.js",
  "/js/pwa.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(APP_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});
