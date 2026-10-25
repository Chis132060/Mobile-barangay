/* Mobile Barangay web PWA: cache only public static app shell/assets.
   Do not cache Supabase, bearer-authenticated requests, API data, or mutations. */
const VERSION = 'barangay-pwa-public-v1';
const SHELL_CACHE = VERSION + '-shell';
const ASSET_CACHE = VERSION + '-assets';
const MAX_ASSETS = 90;
const STATIC_EXT = /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|otf)$/i;
const EXCLUDED = /(?:^|\/)(?:api|auth|rest|graphql|storage|functions|realtime|payments?|residents?|document_requests)(?:\/|$)/i;
const isSafePublicGet = (request) => {
  const url = new URL(request.url);
  return request.method === 'GET' && url.origin === self.location.origin &&
    !request.headers.has('Authorization') && !request.headers.has('X-Api-Key') &&
    !request.headers.has('Cookie') && !EXCLUDED.test(url.pathname) &&
    !url.pathname.startsWith('/_expo/api/') && !url.search;
};
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    try {
      const response = await fetch(new Request('/', { cache: 'reload' }));
      if (response.ok && response.type === 'basic' && (response.headers.get('content-type') || '').includes('text/html'))
        await cache.put('/', response);
    } catch { /* install offline; runtime caching can fill shell later */ }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('barangay-pwa-public-') && k !== SHELL_CACHE && k !== ASSET_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (!isSafePublicGet(request)) return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        // Only store the generic root app shell, never user-specific route payloads.
        if (url.pathname === '/' && response.ok && response.type === 'basic') {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put('/', response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match('/')) || Response.error();
      }
    })());
    return;
  }
  if (!STATIC_EXT.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(ASSET_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        if (keys.length > MAX_ASSETS) await cache.delete(keys[0]);
      }
      return response;
    } catch { return Response.error(); }
  })());
});
