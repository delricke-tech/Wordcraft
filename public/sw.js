/**
 * Service Worker pour WordCraft IA - PWA
 * 
 * Ce service worker gère le cache, le mode hors ligne,
 * les notifications push et les mises à jour
 * 
 * Date: 12 mars 2026
 */

const CACHE_NAME = 'wordcraft-ia-v1.0.0';
const STATIC_CACHE = 'wordcraft-static-v1.0.0';
const DYNAMIC_CACHE = 'wordcraft-dynamic-v1.0.0';
const API_CACHE = 'wordcraft-api-v1.0.0';

// URLs à mettre en cache statique
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/favicon.ico'
];

// API endpoints à mettre en cache
const API_ENDPOINTS = [
  '/api/user/profile',
  '/api/documents',
  '/api/notifications'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('📦 Installation du Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📚 Mise en cache des assets statiques...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker installé avec succès');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erreur installation Service Worker:', error);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Activation du Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Supprimer les anciens caches
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activé');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Erreur activation Service Worker:', error);
      })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  // Stratégie de cache basée sur le type de requête
  if (request.method === 'GET') {
    // Requêtes API : Network First avec fallback au cache
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirstStrategy(request, API_CACHE));
    }
    // Assets statiques : Cache First
    else if (isStaticAsset(request)) {
      event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    }
    // Pages HTML : Network First avec fallback au cache
    else if (request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    }
    // Autres : Cache First avec fallback au réseau
    else {
      event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
    }
  }
  // Requêtes POST : Network uniquement
  else {
    event.respondWith(fetch(request));
  }
});

// Stratégie Cache First
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Mettre à jour le cache en arrière-plan
      updateCacheInBackground(request, cacheName);
      return cachedResponse;
    }

    // Si pas dans le cache, aller sur le réseau
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Erreur Cache First:', error);
    
    // Pour les requêtes de page, retourner la page offline
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Stratégie Network First
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('📡 Réseau indisponible, utilisation du cache...');
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Pour les requêtes API, retourner une réponse d'erreur structurée
    if (request.url.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Hors ligne', 
          message: 'Vérifiez votre connexion internet' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Pour les pages, retourner la page offline
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Mettre à jour le cache en arrière-plan
async function updateCacheInBackground(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Ignorer les erreurs de mise à jour en arrière-plan
    console.log('🔄 Mise à jour cache échouée:', error);
  }
}

// Vérifier si c'est un asset statique
function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.doc', '.docx'
  ];
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname.startsWith('/icons/') ||
         url.pathname.startsWith('/images/');
}

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('📨 Notification push reçue');
  
  const options = {
    body: 'Vous avez une nouvelle notification WordCraft',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icons/xmark.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'WordCraft IA';
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'WordCraft IA', options)
  );
});

// Gestion du clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Clic sur notification');
  
  event.notification.close();

  if (event.action === 'explore') {
    // Ouvrir l'application
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Ne rien faire, juste fermer
    return;
  } else {
    // Action par défaut : ouvrir l'application
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('🔄 Synchronisation en arrière-plan:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Synchronisation en arrière-plan
async function doBackgroundSync() {
  try {
    // Récupérer les données hors ligne
    const offlineData = await getOfflineData();
    
    // Synchroniser avec le serveur
    for (const data of offlineData) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        // Supprimer les données synchronisées
        await removeOfflineData(data.id);
        
      } catch (error) {
        console.error('❌ Erreur synchronisation:', error);
      }
    }
    
    console.log('✅ Synchronisation terminée');
    
  } catch (error) {
    console.error('❌ Erreur synchronisation en arrière-plan:', error);
  }
}

// Obtenir les données hors ligne (simulation)
async function getOfflineData() {
  // TODO: Implémenter le stockage des données hors ligne
  return [];
}

// Supprimer les données hors ligne (simulation)
async function removeOfflineData(id) {
  // TODO: Implémenter la suppression des données hors ligne
  console.log('🗑️ Suppression des données synchronisées:', id);
}

// Gestion du message du client
self.addEventListener('message', (event) => {
  console.log('📩 Message reçu du client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    updateCache(event.data.url);
  }
});

// Mettre à jour le cache manuellement
async function updateCache(url) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = await fetch(url);
    
    if (response.ok) {
      await cache.put(url, response);
      console.log('✅ Cache mis à jour:', url);
    }
  } catch (error) {
    console.error('❌ Erreur mise à jour cache:', error);
  }
}

// Nettoyage périodique du cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    cleanupCache();
  }
});

async function cleanupCache() {
  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      // Supprimer les entrées expirées
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const date = response.headers.get('date');
          if (date) {
            const responseDate = new Date(date);
            const now = new Date();
            const daysDiff = (now - responseDate) / (1000 * 60 * 60 * 24);
            
            // Supprimer les entrées de plus de 30 jours
            if (daysDiff > 30) {
              await cache.delete(request);
              console.log('🗑️ Entrée expirée supprimée:', request.url);
            }
          }
        }
      }
    }
    
    console.log('✅ Nettoyage du cache terminé');
    
  } catch (error) {
    console.error('❌ Erreur nettoyage cache:', error);
  }
}

console.log('🚀 Service Worker WordCraft IA chargé');
