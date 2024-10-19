const CACHE_NAME = 'my-site-cache-v1.1';
const STATIC_CACHE_NAME = 'my-site-static-v1.1';

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
            ]);
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


    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
		console.log('Serving from cache:', event.request.url);
                return response; // 如果在缓存中找到响应，则返回缓存的版本
            }

            return fetch(event.request).then(function(response) {
                // 检查是否是有效的响应
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // 克隆响应。因为响应是数据流，主体只能使用一次。
                var responseToCache = response.clone();

                // 检查是否是静态资源
                if (event.request.url.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico)$/)) {
                    caches.open(STATIC_CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
			console.log('Cached new static resource:', event.request.url);
                    });
                } else {
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
			console.log('Cached new resource:', event.request.url);
                    });
                }

                return response;
            });
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
