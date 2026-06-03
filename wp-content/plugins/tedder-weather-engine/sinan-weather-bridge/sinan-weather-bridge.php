<?php
/**
 * Class SinanWeatherBridge
 * Enterprise Brute-Force Route Interceptor & Payload Hydration
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class SinanWeatherBridge {

    public function __construct() {
        // 1. The Home Page Shortcode Mount
        add_shortcode( 'tedder_weather_hub', array( $this, 'render_react_mount' ) );
        
        // 2. The Brute-Force Virtual Route Interceptor
        add_action( 'template_redirect', array( $this, 'brute_force_virtual_routes' ), 1 );
        
        // 3. The Centralized Data Hydration
        add_action( 'wp_head', array( $this, 'inject_weather_payload_head' ), 10 );
    }

    // Renders the empty DOM node for React to attach to
    public function render_react_mount() {
        return '<div id="weather-app"></div>';
    }

    // Completely bypasses WordPress 404s by drawing the page manually and terminating the process
    public function brute_force_virtual_routes() {
        $uri = $_SERVER['REQUEST_URI'];
        $verticals = array('/hava-durumu', '/deniz-suyu-sicakligi', '/kayak-merkezleri');
        $matched_vertical = null;

        foreach ($verticals as $vertical) {
            if (strpos($uri, $vertical) !== false) {
                $matched_vertical = $vertical;
                break;
            }
        }

        if ($matched_vertical) {
            // Tell browsers and Googlebot this is a perfectly valid page
            status_header(200);
            
            // Extract the location for the payload injector
            $path = trim(parse_url($uri, PHP_URL_PATH), '/');
            $base_slug = trim($matched_vertical, '/');
            $location_param = 'istanbul'; // Safe default

            if (preg_match('/' . preg_quote($base_slug, '/') . '\/(.+)/', $path, $matches)) {
                $location_slug = sanitize_text_field($matches[1]);
                $parts = explode('/', $location_slug);
                $location_param = $parts[0];
                if (isset($parts[1])) {
                    set_query_var('weather_district', $parts[1]);
                }
            }
            
            set_query_var('weather_city', $location_param);
            set_query_var('current_vertical', $base_slug);

            // MANUALLY CONSTRUCT THE PAGE & BYPASS GENERATEPRESS 404 LOGIC
            get_header(); // Draws the GeneratePress Nav and Head
            
            echo '<main id="main" class="site-main">';
            echo '<div class="inside-article">';
            echo $this->render_react_mount(); // Drops the React Engine
            echo '</div>';
            echo '</main>';
            
            get_footer(); // Draws the GeneratePress Footer
            
            exit; // ABSOLUTE KILL SWITCH: WordPress stops here. 404 impossible.
        }
    }

    // Hydrates the React app with SSD Data
    public function inject_weather_payload_head() {
        // Run on Virtual Routes OR the Home Page
        $is_virtual = get_query_var('weather_city') ? true : false;
        $is_home    = is_front_page() || is_home();
        
        global $post;
        $has_shortcode = (isset($post->post_content) && strpos($post->post_content, '[tedder_weather_hub]') !== false);

        if ( ! $is_virtual && ! $is_home && ! $has_shortcode ) {
            return; // Stay completely invisible on standard pages (Contact, About, etc.)
        }

        // Clean parameters
        $city = get_query_var('weather_city') ? get_query_var('weather_city') : 'istanbul';
        $city_slug = sanitize_title($city);
        
        $district = get_query_var('weather_district');
        if ($district) {
            $district_slug = sanitize_title($district);
            $cache_file_slug = "{$city_slug}-{$district_slug}";
        } else {
            $cache_file_slug = $city_slug;
        }

        $cache_dir = wp_upload_dir()['basedir'] . '/sinan-weather-cache';
        $live_file = "{$cache_dir}/{$cache_file_slug}.json";
        $weather_payload = '';

        // Reactive JIT SSD Cache check (20 mins)
        if ( file_exists( $live_file ) && (time() - filemtime( $live_file ) < 1200) ) {
            $weather_payload = file_get_contents( $live_file );
        }

        // Fallback or Initial Fetch
        if ( empty( $weather_payload ) ) {
            // Istanbul Fallback Coordinates
            $lat = 41.0082; $lon = 28.9784;
            $api_url  = "https://api.open-meteo.com/v1/forecast?latitude={$lat}&longitude={$lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m";
            $response = wp_remote_get( $api_url, array( 'timeout' => 5 ) );

            if ( ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) === 200 ) {
                $weather_payload = wp_remote_retrieve_body( $response );
                if ( ! file_exists( $cache_dir ) ) wp_mkdir_p( $cache_dir );
                
                // Atomic Write
                $tmp_file = "{$cache_dir}/{$cache_file_slug}.tmp.json";
                file_put_contents( $tmp_file, $weather_payload );
                rename( $tmp_file, $live_file );
            } else {
                // Parent Fallback if API is down
                $parent_file = "{$cache_dir}/{$city_slug}.json";
                $weather_payload = file_exists( $parent_file ) ? file_get_contents( $parent_file ) : '{}';
                if (empty($weather_payload) || $weather_payload === '{}') {
                    // Absolute fallback to Istanbul
                    $absolute_fallback = "{$cache_dir}/istanbul.json";
                    $weather_payload = file_exists( $absolute_fallback ) ? file_get_contents( $absolute_fallback ) : '{}';
                }
            }
        }

        // Output the JSON payload securely
        ?>
        <script data-no-optimize="1">
            window.SinanWeatherPayload = {
                currentVertical: "<?php echo esc_js( get_query_var('current_vertical') ?: 'hava-durumu' ); ?>",
                currentCity: "<?php echo esc_js( $city_slug ); ?>",
                weatherData: <?php echo $weather_payload ? $weather_payload : '{}'; ?>,
                modules: { showTraffic: true, showMarine: true }
            };
        </script>
        <?php
    }
}
new SinanWeatherBridge();
