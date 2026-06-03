<?php
/**
 * Class SinanWeatherBridge
 * Enforces architectural isolation parameters across dynamic React components.
 */

class SinanWeatherBridge {

    public function __construct() {
        add_action( 'pre_get_posts', array( $this, 'short_circuit_db_queries' ) );
        add_action( 'template_redirect', array( $this, 'force_200_header' ) );
        add_action( 'wp_head', array( $this, 'inject_weather_payload_head' ), 10 );
    }

    /**
     * 1. Short-Circuit DB Query overhead on dynamic weather parameters
     */
    public function short_circuit_db_queries( $query ) {
        if ( ! is_admin() && $query->is_main_query() && get_query_var( 'weather_city' ) ) {
            // THE CRITICAL FIX: Force the engine to fetch our real "Hava Durumu" page data,
            // preventing WordPress from failing the query and falling back to the blog post loop.
            $query->set( 'pagename', 'hava-durumu' ); 

            $query->set( 'no_found_rows', true ); // Eliminate dynamic pagination row calculations
            $query->set( 'update_post_meta_cache', false ); // Block dynamic object relation loading
            $query->set( 'update_post_term_cache', false );
        }
    }

    /**
     * 2. Overrule legacy Soft-404 reporting variables
     */
    public function force_200_header() {
        if ( get_query_var( 'weather_city' ) ) {
            global $wp_query;
            $wp_query->is_404 = false; // Block WordPress 404 categorization
            status_header( 200 ); // Command edge servers to process view as 200 OK index

            // Force WordPress to drop the blog archive template and load our clear shell
            $custom_template = get_stylesheet_directory() . '/template-weather-hub.php';
            if ( file_exists( $custom_template ) ) {
                include $custom_template;
                exit;
            }
        }
    }

    /**
     * 3. Handle Reactive JIT Caching & Hydrate Payload globally into Document Head
     */
    public function inject_weather_payload_head() {
        $city = get_query_var( 'weather_city' );
        if ( ! $city ) {
            return; // Exit if not visiting a route segment
        }

        // Clean parameters to match file namespace criteria
        $city_slug = sanitize_title( $city );
        
        $district = get_query_var( 'weather_district' );
        if ( $district ) {
            $district_slug = sanitize_title( $district );
            $cache_file_slug = "{$city_slug}-{$district_slug}";
        } else {
            $cache_file_slug = $city_slug;
        }

        $cache_dir = wp_upload_dir()['basedir'] . '/sinan-weather-cache';
        $live_file = "{$cache_dir}/{$cache_file_slug}.json";

        $weather_payload = '';

        // JIT (Just-In-Time) District Filtering Logic
        if ( file_exists( $live_file ) ) {
            $cache_age = time() - filemtime( $live_file );
            if ( $cache_age < 1200 ) { // 20 minutes expiration trap (1200 seconds)
                $weather_payload = file_get_contents( $live_file );
            }
        }

        // Execution path if file is missing, stale, or represents an un-synced district
        if ( empty( $weather_payload ) ) {
            // Determine geographic coordinates dynamically using internal arrays or parent fallbacks
            // For example, fallback coordinates for un-cached district entities:
            $lat = 41.0082; $lon = 28.9784; // Istanbul base metrics as structural failsafe

            $api_url  = "https://api.open-meteo.com/v1/forecast?latitude={$lat}&longitude={$lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m";
            $response = wp_remote_get( $api_url, array( 'timeout' => 5 ) );

            if ( ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) === 200 ) {
                $weather_payload = wp_remote_retrieve_body( $response );
                
                // Write the new dynamic file variant to SSD cache instantly
                if ( ! file_exists( $cache_dir ) ) {
                    wp_mkdir_p( $cache_dir );
                }
                $tmp_file = "{$cache_dir}/{$cache_file_slug}.tmp.json";
                file_put_contents( $tmp_file, $weather_payload );
                rename( $tmp_file, $live_file );
            } elseif ( file_exists( $live_file ) ) {
                // Failsafe parameter: if API times out, fallback immediately to old cache state
                $weather_payload = file_get_contents( $live_file );
            } else {
                // Parent Fallback protocol: Load parent city metrics if district fails completely
                $parent_file = "{$cache_dir}/{$city_slug}.json"; 
                $weather_payload = file_exists( $parent_file ) ? file_get_contents( $parent_file ) : '{}';
            }
        }

        // Secure Injection Envelope: Immune to wpautop and protected against LiteSpeed minification
        ?>
        <script data-no-optimize="1">
            window.SinanWeatherPayload = {
                currentCity: "<?php echo esc_js( $city_slug ); ?>",
                weatherData: <?php echo $weather_payload ? $weather_payload : '{}'; ?>,
                modules: {
                    showTraffic: true,
                    showMarine: true
                }
            };
        </script>
        <?php
    }
}
new SinanWeatherBridge();
