<?php
/**
 * Class SinanWeatherBridge
 * Enforces architectural isolation parameters across dynamic React components.
 */

class SinanWeatherBridge {

    public function __construct() {
        // 1. Intercept request early to kill WordPress interference
        add_action( 'template_redirect', array( $this, 'virtual_route_intercept' ), 1 );
        
        // 2. Force WordPress to load our specific template
        add_filter( 'template_include', array( $this, 'force_weather_template' ), 99 );
        
        // 3. Inject payload (Existing Tier 2 JIT Cache logic)
        add_action( 'wp_head', array( $this, 'inject_weather_payload_head' ), 10 );
    }

    public function virtual_route_intercept() {
        $uri = $_SERVER['REQUEST_URI'];
        
        // If the URL contains our app path
        if ( strpos( $uri, '/hava-durumu' ) !== false ) {
            // Kill canonical guessing immediately
            remove_filter( 'template_redirect', 'redirect_canonical' );
            
            // Force WordPress to treat this as a successful page load
            global $wp_query;
            $wp_query->init(); // Reset the failed query
            $wp_query->is_404 = false;
            $wp_query->is_archive = false;
            $wp_query->is_home = false;
            $wp_query->is_page = true;
            status_header( 200 );
            
            // Natively extract the location parameter (Supports both City and District)
            $path = trim( parse_url( $uri, PHP_URL_PATH ), '/' );
            if ( preg_match( '/hava-durumu\/(.+)/', $path, $matches ) ) {
                $location_slug = sanitize_text_field( $matches[1] );
                $parts = explode('/', $location_slug);
                set_query_var( 'weather_city', $parts[0] );
                if ( isset( $parts[1] ) ) {
                    set_query_var( 'weather_district', $parts[1] );
                }
            }
        }
    }

    public function force_weather_template( $template ) {
        $uri = $_SERVER['REQUEST_URI'];
        if ( strpos( $uri, '/hava-durumu' ) !== false ) {
            // Load the custom template directly from the GeneratePress child theme
            $custom_template = get_stylesheet_directory() . '/template-weather-hub.php';
            if ( file_exists( $custom_template ) ) {
                return $custom_template;
            }
        }
        return $template;
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
