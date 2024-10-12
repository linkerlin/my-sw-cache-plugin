<?php
/*
Plugin Name: My SW Cache Plugin
Description: Adds local caching to the website using a Service Worker
Version: 1.1
Author: Halo Master 
*/

// 注册 Service Worker
function register_service_worker() {
    if (function_exists('wp_register_service_worker')) {
        wp_register_service_worker('my-sw-cache', plugin_dir_url(__FILE__) . 'service-worker.js');
    }
}
add_action('wp_enqueue_scripts', 'register_service_worker');

function copy_service_worker_to_root() {
    $source = plugin_dir_path(__FILE__) . 'service-worker.js';
    $destination = ABSPATH . 'service-worker.js';
    copy($source, $destination);
}
register_activation_hook(__FILE__, 'copy_service_worker_to_root');

// 添加 Service Worker 注册脚本
function add_sw_register_script() {
    ?>
    <script>
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/service-worker.js', {scope: '/'})
                .then(function(registration) {
                    console.log('Service Worker registered with scope: ', registration.scope);
                })
                .catch(function(error) {
                    console.log('Service Worker registration failed: ', error);
                });
        });
    }
    </script>
    <?php
}
add_action('wp_footer', 'add_sw_register_script');
