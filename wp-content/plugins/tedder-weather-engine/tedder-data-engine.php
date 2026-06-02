<?php
/**
 * Plugin Name: Tedder Centralized Weather Data Engine
 * Description: Proactive rolling batch sync architecture for the 81 primary provinces.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Prevent direct access
}

class TedderDataEngine {

    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_sync_endpoint' ) );
    }

    public function register_sync_endpoint() {
        register_rest_route( 'tedder/v1', '/sync-weather', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'execute_stateful_batch_sync' ),
            'permission_callback' => '__return_true', // Secure via hidden token internally if needed
        ) );
    }

    public function execute_stateful_batch_sync( WP_REST_Request $request ) {
        // 1. Prevent infrastructure execution timeouts
        set_time_limit( 0 );
        ignore_user_abort( true );

        // 2. Define master array of the 81 Turkish Provinces (Slugs mapped to Lat/Lon)
        $provinces = array(
            array( 'slug' => 'adana', 'lat' => 37.0000, 'lon' => 35.3213 ),
            array( 'slug' => 'adiyaman', 'lat' => 37.7648, 'lon' => 38.2786 ),
            array( 'slug' => 'afyonkarahisar', 'lat' => 38.7507, 'lon' => 30.5567 ),
            array( 'slug' => 'agri', 'lat' => 39.7191, 'lon' => 43.0503 ),
            array( 'slug' => 'amasya', 'lat' => 40.6499, 'lon' => 35.8353 ),
            array( 'slug' => 'ankara', 'lat' => 39.9334, 'lon' => 32.8597 ),
            array( 'slug' => 'antalya', 'lat' => 36.8969, 'lon' => 30.7133 ),
            array( 'slug' => 'artvin', 'lat' => 41.1828, 'lon' => 41.8183 ),
            array( 'slug' => 'aydin', 'lat' => 37.8380, 'lon' => 27.8456 ),
            array( 'slug' => 'balikesir', 'lat' => 39.6484, 'lon' => 27.8826 ),
            array( 'slug' => 'bilecik', 'lat' => 40.1451, 'lon' => 29.9798 ),
            array( 'slug' => 'bingol', 'lat' => 38.8847, 'lon' => 40.4939 ),
            array( 'slug' => 'bitlis', 'lat' => 38.4006, 'lon' => 42.1095 ),
            array( 'slug' => 'bolu', 'lat' => 40.7392, 'lon' => 31.6116 ),
            array( 'slug' => 'burdur', 'lat' => 37.7183, 'lon' => 30.2823 ),
            array( 'slug' => 'bursa', 'lat' => 40.1824, 'lon' => 29.0669 ),
            array( 'slug' => 'canakkale', 'lat' => 40.1553, 'lon' => 26.4089 ),
            array( 'slug' => 'cankiri', 'lat' => 40.6013, 'lon' => 33.6134 ),
            array( 'slug' => 'corum', 'lat' => 40.5506, 'lon' => 34.9556 ),
            array( 'slug' => 'denizli', 'lat' => 37.7765, 'lon' => 29.0864 ),
            array( 'slug' => 'diyarbakir', 'lat' => 37.9144, 'lon' => 40.2306 ),
            array( 'slug' => 'edirne', 'lat' => 41.6771, 'lon' => 26.5557 ),
            array( 'slug' => 'elazig', 'lat' => 38.6810, 'lon' => 39.2264 ),
            array( 'slug' => 'erzincan', 'lat' => 39.7500, 'lon' => 39.5000 ),
            array( 'slug' => 'erzurum', 'lat' => 39.9043, 'lon' => 41.2679 ),
            array( 'slug' => 'eskisehir', 'lat' => 39.7667, 'lon' => 30.5256 ),
            array( 'slug' => 'gaziantep', 'lat' => 37.0662, 'lon' => 37.3833 ),
            array( 'slug' => 'giresun', 'lat' => 40.9128, 'lon' => 38.3895 ),
            array( 'slug' => 'gumushane', 'lat' => 40.4600, 'lon' => 39.4817 ),
            array( 'slug' => 'hakkari', 'lat' => 37.5744, 'lon' => 43.7408 ),
            array( 'slug' => 'hatay', 'lat' => 36.2000, 'lon' => 36.1667 ),
            array( 'slug' => 'isparta', 'lat' => 37.7648, 'lon' => 30.5566 ),
            array( 'slug' => 'mersin', 'lat' => 36.8119, 'lon' => 34.6389 ),
            array( 'slug' => 'istanbul', 'lat' => 41.0082, 'lon' => 28.9784 ),
            array( 'slug' => 'izmir', 'lat' => 38.4237, 'lon' => 27.1428 ),
            array( 'slug' => 'kars', 'lat' => 40.6013, 'lon' => 43.0940 ),
            array( 'slug' => 'kastamonu', 'lat' => 41.3887, 'lon' => 33.7827 ),
            array( 'slug' => 'kayseri', 'lat' => 38.7205, 'lon' => 35.4826 ),
            array( 'slug' => 'kirklareli', 'lat' => 41.7333, 'lon' => 27.2167 ),
            array( 'slug' => 'kirsehir', 'lat' => 39.1458, 'lon' => 34.1639 ),
            array( 'slug' => 'kocaeli', 'lat' => 40.8533, 'lon' => 29.8815 ),
            array( 'slug' => 'konya', 'lat' => 37.8667, 'lon' => 32.4833 ),
            array( 'slug' => 'kutahya', 'lat' => 39.4167, 'lon' => 29.9833 ),
            array( 'slug' => 'malatya', 'lat' => 38.3552, 'lon' => 38.3095 ),
            array( 'slug' => 'manisa', 'lat' => 38.6191, 'lon' => 27.4289 ),
            array( 'slug' => 'kahramanmaras', 'lat' => 37.5847, 'lon' => 36.9339 ),
            array( 'slug' => 'mardin', 'lat' => 37.3131, 'lon' => 40.7436 ),
            array( 'slug' => 'mugla', 'lat' => 37.2153, 'lon' => 28.3636 ),
            array( 'slug' => 'mus', 'lat' => 38.7304, 'lon' => 41.4883 ),
            array( 'slug' => 'nevsehir', 'lat' => 38.6258, 'lon' => 34.7122 ),
            array( 'slug' => 'nigde', 'lat' => 37.9667, 'lon' => 34.6833 ),
            array( 'slug' => 'ordu', 'lat' => 40.9862, 'lon' => 37.8797 ),
            array( 'slug' => 'rize', 'lat' => 41.0201, 'lon' => 40.5234 ),
            array( 'slug' => 'sakarya', 'lat' => 40.7569, 'lon' => 30.3783 ),
            array( 'slug' => 'samsun', 'lat' => 41.2867, 'lon' => 36.3300 ),
            array( 'slug' => 'siirt', 'lat' => 37.9333, 'lon' => 41.9500 ),
            array( 'slug' => 'sinop', 'lat' => 42.0268, 'lon' => 35.1553 ),
            array( 'slug' => 'sivas', 'lat' => 39.7477, 'lon' => 37.0179 ),
            array( 'slug' => 'tekirdag', 'lat' => 40.9780, 'lon' => 27.5117 ),
            array( 'slug' => 'tokat', 'lat' => 40.3167, 'lon' => 36.5500 ),
            array( 'slug' => 'trabzon', 'lat' => 41.0027, 'lon' => 39.7168 ),
            array( 'slug' => 'tunceli', 'lat' => 39.1083, 'lon' => 39.5469 ),
            array( 'slug' => 'sanliurfa', 'lat' => 37.1500, 'lon' => 38.8000 ),
            array( 'slug' => 'usak', 'lat' => 38.6823, 'lon' => 29.4082 ),
            array( 'slug' => 'van', 'lat' => 38.4891, 'lon' => 43.3811 ),
            array( 'slug' => 'yozgat', 'lat' => 39.8181, 'lon' => 34.8147 ),
            array( 'slug' => 'zonguldak', 'lat' => 41.4564, 'lon' => 31.7987 ),
            array( 'slug' => 'aksaray', 'lat' => 38.3687, 'lon' => 34.0370 ),
            array( 'slug' => 'bayburt', 'lat' => 40.2552, 'lon' => 40.2249 ),
            array( 'slug' => 'karaman', 'lat' => 37.1759, 'lon' => 33.2287 ),
            array( 'slug' => 'kirikkale', 'lat' => 39.8468, 'lon' => 33.5153 ),
            array( 'slug' => 'batman', 'lat' => 37.8812, 'lon' => 41.1351 ),
            array( 'slug' => 'sirnak', 'lat' => 37.5228, 'lon' => 42.4594 ),
            array( 'slug' => 'bartin', 'lat' => 41.6344, 'lon' => 32.3375 ),
            array( 'slug' => 'ardahan', 'lat' => 41.1105, 'lon' => 42.7022 ),
            array( 'slug' => 'igdir', 'lat' => 39.9167, 'lon' => 44.0333 ),
            array( 'slug' => 'yalova', 'lat' => 40.6500, 'lon' => 29.2667 ),
            array( 'slug' => 'karabuk', 'lat' => 41.2061, 'lon' => 32.6228 ),
            array( 'slug' => 'kilis', 'lat' => 36.7184, 'lon' => 37.1147 ),
            array( 'slug' => 'osmaniye', 'lat' => 37.0742, 'lon' => 36.2472 ),
            array( 'slug' => 'duzce', 'lat' => 40.8438, 'lon' => 31.1565 )
        );

        $total_provinces = count( $provinces );
        $batch_size      = 5; // Elite constraint: 5 cities per minute to keep CPU load invisible

        // 3. Extract the pointer memory from the database
        $current_index = (int) get_option( 'tedder_sync_index', 0 );

        // 4. Slice the next operational queue segment
        $batch = array_slice( $provinces, $current_index, $batch_size );

        $cache_dir = wp_upload_dir()['basedir'] . '/sinan-weather-cache';
        if ( ! file_exists( $cache_dir ) ) {
            wp_mkdir_p( $cache_dir );
        }

        foreach ( $batch as $province ) {
            $slug = $province['slug'];
            
            // Replicate Open-Meteo external service calls via server context
            $api_url  = "https://api.open-meteo.com/v1/forecast?latitude={$province['lat']}&longitude={$province['lon']}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m";
            $response = wp_remote_get( $api_url, array( 'timeout' => 10 ) );

            if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) !== 200 ) {
                error_log( "Tedder Data Engine Error: Failed background sync for province: {$slug}" );
                continue; // Fail-Safe Caching: Leave existing file completely uncorrupted
            }

            $raw_data = wp_remote_retrieve_body( $response );
            
            // Validate JSON payload configuration properties
            $json_test = json_decode( $raw_data );
            if ( json_last_error() !== JSON_ERROR_NONE ) {
                continue;
            }

            // 5. Execute Atomic Write Protocol to eliminate race condition file locks
            $tmp_file  = "{$cache_dir}/{$slug}.tmp.json";
            $live_file = "{$cache_dir}/{$slug}.json";

            file_put_contents( $tmp_file, $raw_data );
            if ( file_exists( $tmp_file ) ) {
                rename( $tmp_file, $live_file ); // Instant transactional file-swap
            }
        }

        // 6. Recalculate pointer coordinate and update memory state
        $new_index = $current_index + $batch_size;
        if ( $new_index >= $total_provinces ) {
            $new_index = 0; // Seamless rotation loop reset
        }
        update_option( 'tedder_sync_index', $new_index );

        return new WP_REST_Response( array( 'success' => true, 'synchronized_index' => $current_index ), 200 );
    }
}
new TedderDataEngine();
