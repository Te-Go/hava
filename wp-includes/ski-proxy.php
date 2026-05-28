<?php
/**
 * Weather Unlocked Ski Proxy
 * 
 * Proxies requests to api.weatherunlocked.com/api/resortforecast
 * Caches for 2 hours (7200 seconds)
 * 
 * Usage: GET /wp-json/sinan/v1/ski?id=54887323
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('sinan/v1', '/ski', array(
        'methods' => 'GET',
        'callback' => 'handle_ski_proxy',
        'permission_callback' => '__return_true',
    ));
});

function handle_ski_proxy($request)
{
    $id = $request->get_param('id');

    // Credentials (User Provided)
    $app_id = '904fe6ce';
    $app_key = '6034c52f1991fd234505fd851f309fe7';

    if (!$id) {
        return new WP_Error('missing_id', 'Resort ID required', array('status' => 400));
    }

    $cache_key = 'ski_forecast_' . $id;
    $cached = get_transient($cache_key);

    if ($cached !== false) {
        return rest_ensure_response($cached);
    }

    // Fetch 7-day forecast
    $url = "http://api.weatherunlocked.com/api/resortforecast/{$id}?app_id={$app_id}&app_key={$app_key}";

    $response = wp_remote_get($url);
    if (is_wp_error($response)) {
        return $response;
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (isset($data['forecast'])) {
        // Cache for 2 Hours (Mountain weather updates less frequently)
        set_transient($cache_key, $data, 7200);
        return rest_ensure_response($data);
    }

    return new WP_Error('api_error', 'Invalid response from Ski API', array('status' => 502));
}
