const CACHE = "receipt-v4";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./db.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
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
