const CACHE_NAME = 'pwa-crm-v1.0';
const API_CACHE = 'pwa-crm-api-v1.0';

const urlsToCache = [
    '/',
    '/index.html',
    '/auth.html',
    '/register.html',
    '/dashboard.html',
    '/admin.html',
    '/style.css',
    '/app.js',
    '/auth.js',
    '/dashboard.js',
    '/admin.js',
    '/register.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cache => {
                        if (cache !== CACHE_NAME && cache !== API_CACHE) {
                            return caches.delete(cache);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Проверяем авторизацию для API запросов
    if (url.pathname.includes('/api/') && !isAuthenticated(event.request)) {
        event.respondWith(new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        }));
        return;
    }
    
    // Кэшируем API запросы
    if (url.pathname.includes('/api/')) {
        event.respondWith(
            caches.open(API_CACHE).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        // Клонируем ответ для кэширования
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            cache.put(event.request, responseClone);
                        }
                        return response;
                    })
                    .catch(() => {
                        // Оффлайн: возвращаем из кэша
                        return cache.match(event.request)
                            .then(cachedResponse => {
                                if (cachedResponse) {
                                    return cachedResponse;
                                }
                                
                                // Возвращаем заглушку для API
                                return new Response(JSON.stringify({
                                    message: 'You are offline',
                                    data: []
                                }), {
                                    status: 200,
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            });
                    });
            })
        );
        return;
    }
    
    // Стратегия "Cache First" для остальных запросов
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Для HTML страниц возвращаем оффлайн страницу
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// Функция проверки авторизации
function isAuthenticated(request) {
    // В реальном приложении здесь будет проверка токена
    // Для демо всегда возвращаем true
    return true;
}

// Фоновая синхронизация
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncPendingData());
    }
});

async function syncPendingData() {
    // Здесь будет логика синхронизации данных
    console.log('Background sync started');
    
    // Получаем клиентов для отправки сообщений
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_COMPLETE',
            message: 'Data synchronized'
        });
    });
}

// Push-уведомления
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Новое уведомление',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Открыть',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Закрыть',
                icon: '/icons/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('PWA CRM', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});