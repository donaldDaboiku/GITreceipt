const CACHE = "receipt-v7";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./db.js",
  "./manifest.json",
  "./vendor/html2canvas.min.js",
  "./vendor/jspdf.umd.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", e => {
  e.respondWith((async () => {
    // 1. Check if the request is in the cache
    const cachedResponse = await caches.match(e.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      // 2. If not in cache, fetch from the network
      const networkResponse = await fetch(e.request);

      // 3. Cache the new response for future requests (only GET requests can be cached)
      if (e.request.method === "GET") {
        const cache = await caches.open(CACHE);
        cache.put(e.request, networkResponse.clone());
      }

      return networkResponse;
    } catch (error) {
      // 4. Handle network errors (e.g., offline and resource not cached)
      console.error("Fetch failed:", error);
      throw error;
    }
  })());
});
