/**
 * LinearViz Service Worker
 * Caches static assets for offline use
 */

const CACHE_NAME = 'linearviz-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/audio.js',
    '/js/engine.js',
    '/js/main.js',
    '/js/topics/vectors.js',
    '/js/topics/matrices.js',
    '/js/topics/transforms.js',
    '/js/topics/determinants.js',
    '/js/topics/eigen.js',
    '/js/topics/applications.js',
    '/js/components/playground.js',
    '/assets/icon.svg',
    '/manifest.json'
];

// CDN assets we want to cache too
const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Network-first for HTML pages, cache-first for static assets
    const isHTML = request.headers.get('accept')?.includes('text/html');
    const isCDN = CDN_ASSETS.some(url => request.url.includes(url));

    if (isHTML) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then(r => r || caches.match('/')))
        );
    } else {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    // Cache successful responses
                    if (response.ok && (isCDN || request.url.startsWith(self.location.origin))) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                }).catch(() => cached);
            })
        );
    }
});
