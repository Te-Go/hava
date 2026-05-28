<?php
/**
 * TomTom Traffic Proxy with Caching
 * 
 * Provides a server-side proxy for TomTom Traffic Flow API to map traffic data
 * and cache responses to stay within API rate limits/quotas.
 * 
 * Usage: GET /wp-json/sinan/v1/traffic?lat=41.123&lon=29.123
 * Cache Usage: 20 minutes (1200 seconds) using WordPress Transients
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('sinan/v1', '/traffic', array(
        'methods' => 'GET',
        'callback' => 'handle_tomtom_proxy',
        'permission_callback' => '__return_true', // Public endpoint
    ));
});

function handle_tomtom_proxy($request)
{
    // 1. Get Lat/Lon from request
    $lat = $request->get_param('lat');
    $lon = $request->get_param('lon');

    // API Key (User provided)
    // In production, consider moving this to wp-config.php: define('TOMTOM_API_KEY', '...');
    $key = defined('TOMTOM_API_KEY') ? TOMTOM_API_KEY : 'qUlGJOObY34eaqSXZto9H0OVWfGYqhP5';

    if (!$lat || !$lon) {
        return new WP_Error('missing_params', 'Latitude and Longitude required', array('status' => 400));
    }

    // 2. Check Transient Cache (20 minutes = 1200 seconds)
    // Key: tomtom_flow_LAT_LON
    // Round coords to 4 decimals to normalize cache hits (approx 11m precision)
    // This ensures nearby requests hit the same cache
    $lat_r = round((float) $lat, 4);
    $lon_r = round((float) $lon, 4);
    $cache_key = "tomtom_flow_{$lat_r}_{$lon_r}";

    $cached = get_transient($cache_key);
    if ($cached !== false) {
        // Return cached response with header indicating cache hit (optional)
        return rest_ensure_response($cached);
    }

    // 3. Fetch from TomTom
    // Flow Segment Data (Absolute, Zoom 10 for city-level view)
    $url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key={$key}&point={$lat},{$lon}&unit=KMPH";

    $response = wp_remote_get($url);
    if (is_wp_error($response)) {
        return $response;
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (isset($data['flowSegmentData'])) {
        // Cache Valid Data for 20 Minutes (1200 seconds)
        // Adjust this duration to manage daily quota (2500 requests)
        // 20 mins * 3 points * 8 cities = ~1700 calls/day (Safe)
        set_transient($cache_key, $data, 1200);
        return rest_ensure_response($data);
    }

    return new WP_Error('tomtom_error', 'Invalid response from TomTom API', array('status' => 502));
}
