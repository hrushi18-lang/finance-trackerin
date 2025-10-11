// Service Worker for Offline Support
const CACHE_NAME = 'fintrack-onboarding-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip external API requests - let them go directly to the network
  // These should NEVER be cached or intercepted by the service worker
  const skipUrls = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'openrouter.ai',
    'api.openai.com',
    'api.anthropic.com',
    'generativelanguage.googleapis.com',
    'supabase.co',
    'exchangerate-api.com',
    'api.fixer.io',
    'api.currencyapi.com'
  ];
  
  // If URL matches any of the skip patterns, don't intercept - let browser handle it
  if (skipUrls.some(skipUrl => url.includes(skipUrl))) {
    return; // Let the request pass through to the network
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Fetch from network
        return fetch(event.request).catch(() => {
          // Return a fallback response for failed requests
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
