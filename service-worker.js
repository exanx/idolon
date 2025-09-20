/**
 * Idolon Chat Service Worker
 *
 * Caching Strategy:
 * - For Navigation (HTML pages): Network First, falling back to Cache.
 *   This ensures users always get the latest app shell when online.
 * - For all other assets: Cache First, falling back to Network.
 *   This provides the best performance for static assets like images and icons.
 */

// IMPORTANT: Increment this version whenever you deploy updates.
const CACHE_NAME = 'idolon-chat-cache-v37'; // Change to v33 for your next update

const urlsToCache = [
  // Core HTML files
  '/',
  '/index.html',
  '/help.html',

  // Manifest and core favicons
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon.png',

  // Default character images specified in the initial app state
  '/char_imgs/idolon.jpg',
  '/char_imgs/gremlin.jpg',
  '/char_imgs/olivia.jpg',
  '/char_imgs/kaelan.jpg',

  // Key PWA icons
  '/android/android-launchericon-512-512.png',
  '/android/android-launchericon-192-192.png',
  '/ios/192.png',
  '/ios/512.png',
  '/windows11/Square150x150Logo.scale-200.png',
  '/windows11/SplashScreen.scale-200.png',

  // Screenshots
  '/screenshots/1ss.jpg',
  '/screenshots/desktop-ss.jpg'
];

/**
 * INSTALL: Cache the application shell.
 */
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event fired.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching App Shell...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache App Shell:', error);
      })
  );
});

/**
 * ACTIVATE: Clean up old caches.
 */
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event fired.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

/**
 * FETCH: Intercept network requests with our new hybrid strategy.
 */
self.addEventListener('fetch', event => {
  // We only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // --- STRATEGY 1: Network First for Navigation ---
  // If the request is for a page navigation (e.g., loading index.html).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // If the network request is successful, cache the new response.
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If the network fails (offline), serve the page from the cache.
          console.log('[Service Worker] Network fetch failed for navigation. Serving from cache.');
          return caches.match(event.request);
        })
    );
    return; // End execution for navigation requests.
  }

  // --- STRATEGY 2: Cache First for All Other Assets ---
  // For images, scripts, styles, etc.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // If the asset is in the cache, return it.
      if (cachedResponse) {
        return cachedResponse;
      }
      // Otherwise, fetch it from the network, cache it, and return it.
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

/**
 * MESSAGE: Listen for the 'skipWaiting' command from the app.
 */
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[Service Worker] skipWaiting command received. Activating new version.');
    self.skipWaiting();
  }
});