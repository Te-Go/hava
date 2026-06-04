<?php
/**
 * Tedder API Proxy
 * Secures external API calls (TomTom, WeatherUnlocked, KeyCollect) behind internal WordPress routes.
 * Implements SSD Transient Caching and specific chronological limits.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class TedderAPIProxy {

    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        // Traffic Route (TomTom) - 20 minute cache
        register_rest_route( 'sinan/v1', '/traffic', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'proxy_tomtom_traffic' ),
            'permission_callback' => '__return_true'
        ));

        // Ski Route (WeatherUnlocked) - 06:30 / 12:30 cache
        register_rest_route( 'sinan/v1', '/ski', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'proxy_weatherunlocked_ski' ),
            'permission_callback' => '__return_true'
        ));

        // Finance Route (KeyCollect) - 2 minute cache
        register_rest_route( 'sinan/v1', '/finance', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'proxy_keycollect_finance' ),
            'permission_callback' => '__return_true'
        ));
    }

    /**
     * Proxy TomTom Traffic
     */
    public function proxy_tomtom_traffic( $request ) {
        $lat = sanitize_text_field( $request->get_param( 'lat' ) );
        $lon = sanitize_text_field( $request->get_param( 'lon' ) );

        if ( ! $lat || ! $lon ) {
            return new WP_Error( 'missing_params', 'Latitude and Longitude are required', array( 'status' => 400 ) );
        }

        $api_key = get_option( 'tedder_tomtom_api_key' );
        if ( empty( $api_key ) ) {
            return new WP_Error( 'missing_key', 'TomTom API key not configured', array( 'status' => 500 ) );
        }

        // Generate coordinate-based cache key
        $cache_key = 'tedder_traffic_' . md5( $lat . '_' . $lon );
        $cached_data = get_transient( $cache_key );

        if ( false === $cached_data ) {
            $url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={$lat},{$lon}&unit=KMPH&key={$api_key}";
            $response = wp_remote_get( $url, array( 'timeout' => 10 ) );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = wp_remote_retrieve_body( $response );
            // Standard 20-minute cache for Traffic
            set_transient( $cache_key, $body, 20 * MINUTE_IN_SECONDS );
            $cached_data = $body;
        }

        $response = new WP_REST_Response( json_decode( $cached_data, true ) );
        $response->set_status( 200 );
        return $response;
    }

    /**
     * Smart Time-Boundary Cache Evaluation for Ski Resorts
     * Flushes data if 06:30 or 12:30 (Europe/Istanbul time) has been crossed since the last fetch.
     */
    private function is_tedder_ski_cache_expired( $last_fetch_timestamp ) {
        if ( ! $last_fetch_timestamp ) {
            return true;
        }

        // Force Turkish Local Time
        $tz = new DateTimeZone( 'Europe/Istanbul' );
        $now = new DateTime( 'now', $tz );
        $last_fetch = new DateTime( '@' . $last_fetch_timestamp );
        $last_fetch->setTimezone( $tz );

        // Define today's strict update boundaries
        $morning_update = clone $now;
        $morning_update->setTime( 6, 30, 0 );

        $afternoon_update = clone $now;
        $afternoon_update->setTime( 12, 30, 0 );

        // Cross 06:30 boundary
        if ( $now >= $morning_update && $last_fetch < $morning_update ) {
            return true;
        }

        // Cross 12:30 boundary
        if ( $now >= $afternoon_update && $last_fetch < $afternoon_update ) {
            return true;
        }

        // Standard 6-hour max limit
        if ( ( $now->getTimestamp() - $last_fetch_timestamp ) > ( 6 * HOUR_IN_SECONDS ) ) {
            return true;
        }

        return false;
    }

    /**
     * Proxy WeatherUnlocked Ski
     */
    public function proxy_weatherunlocked_ski( $request ) {
        $resort_id = sanitize_text_field( $request->get_param( 'id' ) );
        if ( ! $resort_id ) {
            return new WP_Error( 'missing_params', 'Resort ID required', array( 'status' => 400 ) );
        }

        $app_id  = get_option( 'tedder_wu_app_id' );
        $app_key = get_option( 'tedder_wu_app_key' );

        if ( empty( $app_id ) || empty( $app_key ) ) {
            return new WP_Error( 'missing_key', 'WeatherUnlocked API credentials not configured', array( 'status' => 500 ) );
        }

        $cache_key = 'tedder_ski_data_' . md5($resort_id);
        $time_key  = 'tedder_ski_time_' . md5($resort_id);

        $cached_data = get_transient( $cache_key );
        $last_fetch  = get_option( $time_key );

        if ( ! $cached_data || $this->is_tedder_ski_cache_expired( $last_fetch ) ) {
            $url = "http://api.weatherunlocked.com/api/resortforecast/{$resort_id}?app_id={$app_id}&app_key={$app_key}";
            $response = wp_remote_get( $url, array( 'timeout' => 10 ) );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = wp_remote_retrieve_body( $response );
            
            // Set transient to 6 hours fallback, update exact timestamp
            set_transient( $cache_key, $body, 6 * HOUR_IN_SECONDS );
            update_option( $time_key, time() ); 
            
            $cached_data = $body;
        }

        $response = new WP_REST_Response( json_decode( $cached_data, true ) );
        $response->set_status( 200 );
        return $response;
    }

    /**
     * Proxy KeyCollect Finance
     */
    public function proxy_keycollect_finance( $request ) {
        $api_key = get_option( 'tedder_keycollect_api_key' );
        if ( empty( $api_key ) ) {
            // Graceful fallback if key is missing
            $response = new WP_REST_Response( array() );
            $response->set_status( 200 );
            return $response;
        }

        $cache_key = 'tedder_finance_ticker';
        $cached_data = get_transient( $cache_key );

        if ( false === $cached_data ) {
            // Proxying to standard CollectAPI economy endpoints for Altin, USD, Euro, BIST
            // Since CollectAPI splits endpoints, we fetch multiple or a unified one. 
            // The frontend map assumes an array of {symbol, price, change}
            
            // CollectAPI "allCurrency" Endpoint (Example implementation)
            $url = "https://api.collectapi.com/economy/allCurrency";
            $response = wp_remote_get( $url, array(
                'timeout' => 5,
                'headers' => array(
                    'authorization' => "apikey {$api_key}",
                    'content-type'  => 'application/json'
                )
            ));

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = wp_remote_retrieve_body( $response );
            $data = json_decode( $body, true );

            $formatted_data = array();

            // Format CollectAPI response into the expected standard if successful
            if ( isset( $data['success'] ) && $data['success'] == true && isset( $data['result'] ) ) {
                foreach ( $data['result'] as $item ) {
                    // Extract USD, EUR, GA, BIST, BTC if present
                    $code = strtoupper( $item['code'] ?? $item['name'] );
                    $formatted_data[] = array(
                        'symbol' => $item['name'],
                        'price'  => $item['buyingstr'] . ' ₺',
                        'change' => (float) $item['rate'],
                        'code'   => $code
                    );
                }
            }

            // High-velocity 2-minute cache per Dev Leader's instruction
            set_transient( $cache_key, json_encode($formatted_data), 2 * MINUTE_IN_SECONDS );
            $cached_data = json_encode($formatted_data);
        }

        $response = new WP_REST_Response( json_decode( $cached_data, true ) );
        $response->set_status( 200 );
        return $response;
    }
}

new TedderAPIProxy();
