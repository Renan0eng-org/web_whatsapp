const CACHE_NAME = 'rsvp-app-cache-v3';
const OFFLINE_URL = '/offline.html';

// Arquivos para pré-cache (shell da aplicação)
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/admin',
  '/admin/rsvp',
  '/manifest.json',
];

// INSTALAÇÃO: pré-cache dos arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ATIVAÇÃO: limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// Estratégia: Network First com fallback para cache
// Para páginas HTML e navegação
const networkFirstStrategy = async (request) => {
  try {
    const networkResponse = await fetch(request);
    
    // Se sucesso, atualiza o cache
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Se offline, tenta o cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se é navegação e não tem cache, mostra página offline
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
};

// Estratégia: Cache First com fallback para network
// Para assets estáticos (JS, CSS, imagens)
const cacheFirstStrategy = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Retorna uma resposta de erro para assets que não podem ser carregados
    return new Response('Asset not available offline', { status: 503 });
  }
};

// Estratégia: Stale While Revalidate
// Para APIs que podem usar dados um pouco desatualizados
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
};

// FETCH: Intercepta requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignora requisições não-GET
  if (request.method !== 'GET') return;
  
  // Ignora requisições para outros domínios (exceto CDNs conhecidas)
  if (!url.origin.includes(self.location.origin) && 
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }
  
  // Navegação de páginas: Network First
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Assets estáticos (_next/static, imagens, fonts): Cache First
  if (url.pathname.startsWith('/_next/static') || 
      url.pathname.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // API requests: Stale While Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // Outras requisições: Network First
  event.respondWith(networkFirstStrategy(request));
});

// Listener para mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Limpar cache manualmente
  if (event.data === 'clearCache') {
    caches.keys().then((keyList) => {
      keyList.forEach((key) => caches.delete(key));
    });
  }
});

// Background Sync para quando voltar online (opcional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
  }
});

