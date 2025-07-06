const CACHE_NAME = 'edil-di-maggio-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/offline.html' // Pagina da mostrare quando non c'è connessione
];

// Evento di installazione: memorizza i file principali nella cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta, file principali memorizzati.');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
});

// Evento di attivazione: pulisce le vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Evento fetch: intercetta le richieste di rete
// Se il file è in cache, lo restituisce da lì. Altrimenti, prova dalla rete.
// Se anche la rete fallisce, mostra la pagina offline.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se la risorsa è in cache, la restituisco
        if (response) {
          return response;
        }
        // Altrimenti, provo a recuperarla dalla rete
        return fetch(event.request).catch(() => {
          // Se la rete fallisce, mostro la pagina di fallback offline
          return caches.match('/offline.html');
        });
      })
  );
});