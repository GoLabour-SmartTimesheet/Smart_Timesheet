'use strict';
const BASE = new URL('./', self.location.href);
const PREFIX = 'golabour-timesheet:' + BASE.pathname + ':';
const CACHE = PREFIX + 'v1.2.0';
const SHELL = new URL('index.html', BASE).href;
const FILES = ['index.html','style.css','app.js','pwa.css','pwa.js','invoice.css','invoice.js','manifest.webmanifest','logo.png','favicon.svg','favicon.ico','icons/favicon-32.png','icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(new URL(file,BASE).href,{cache:'reload'})))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      // Use the matching cached shell until the user accepts a newer version.
      const shell = await cache.match(SHELL);
      if (shell) return shell;
      return fetch(request);
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request,{ignoreSearch:true});
    if (cached) return cached;
    return fetch(request);
  })());
});
