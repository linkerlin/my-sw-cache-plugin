const CACHE_NAME = 'my-site-cache-v1.5';
const STATIC_CACHE_NAME = 'my-site-static-v1.5';
const CACHE_EXPIRATION = 25 * 60 * 60 * 1000; // 25小时,以毫秒为单位

// 辅助函数:获取缓存的时间戳
function getCacheTimestamp(cacheName) {
    return caches.open(cacheName).then(cache => {
        return cache.match('__TIMESTAMP__').then(response => {
            return response ? response.text() : null;
        });
    });
}

// 辅助函数:设置缓存的时间戳
function setCacheTimestamp(cacheName) {
    return caches.open(cacheName).then(cache => {
        const timestamp = Date.now().toString();
        return cache.put('__TIMESTAMP__', new Response(timestamp));
    });
}

// 静态资源缓存
self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting());
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then(function(cache) {
            return cache.addAll([
                '/',
                '/wp-includes/css/dist/block-library/style.min.css',
                '/wp-includes/js/jquery/jquery.min.js',
                // 可以添加其他你确定要缓存的特定资源
            ]).then(() => setCacheTimestamp(STATIC_CACHE_NAME));
        })
    );
});

// 动态缓存策略
self.addEventListener('fetch', function(event) {
    // 只处理 http 和 https 请求
    if (!event.request.url.startsWith('http')) {
        return;
    }
    if (event.request.method !== 'GET') {
        return;
    }
    
    // 添加新的检查：排除 WordPress AJAX 请求
    if (event.request.url.includes('wp-admin/admin-ajax.php')) {
        return fetch(event.request);
    }

    event.respondWith(
        caches.match(event.request).then(function(cachedResponse) {
            const fetchPromise = fetch(event.request).then(function(networkResponse) {
                // 克隆网络响应
                const responseToCache = networkResponse.clone();
                
                // 如果网络请求成功,更新缓存
                if (responseToCache && responseToCache.status === 200) {
                    const cacheName = event.request.url.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico)$/)
                        ? STATIC_CACHE_NAME
                        : CACHE_NAME;
                    
                    caches.open(cacheName).then(function(cache) {
                        cache.put(event.request, responseToCache);
                        console.log('Updated cached resource:', event.request.url);
                        setCacheTimestamp(cacheName);
                    });
                }
                return networkResponse;
            });

            // 如果有缓存的响应,立即返回并在后台更新
            if (cachedResponse) {
                console.log('Serving from cache while revalidating:', event.request.url);
                // 使用 event.waitUntil 来确保 Service Worker 不会在后台更新完成之前终止
                event.waitUntil(fetchPromise);
                return cachedResponse;
            }

            // 如果没有缓存的响应,返回网络请求结果
            return fetchPromise;
        })
    );
});

// 清理旧缓存
self.addEventListener('activate', function(event) {
    var cacheWhitelist = [CACHE_NAME, STATIC_CACHE_NAME];
    event.waitUntil(clients.claim());
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
