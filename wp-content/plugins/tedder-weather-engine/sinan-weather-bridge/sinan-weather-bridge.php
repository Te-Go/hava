<?php
/**
 * Class SinanWeatherBridge
 * Enterprise Brute-Force Route Interceptor, SEO Title Engine & Data Hydration
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class SinanWeatherBridge {

    public function __construct() {
        // 1. Home Page Shortcode Mount
        add_shortcode( 'tedder_weather_hub', array( $this, 'render_react_mount' ) );
        
        // 2. Brute-Force Route Interceptor
        add_action( 'template_redirect', array( $this, 'brute_force_virtual_routes' ), 1 );
        
        // 3. Centralized Data Hydration
        add_action( 'wp_head', array( $this, 'inject_weather_payload_head' ), 10 );

        // 4. Dynamic SEO Title Engine
        add_filter( 'document_title_parts', array( $this, 'inject_dynamic_seo_titles' ), 999 );
    }

    public function render_react_mount() {
        // ALWAYS inject the payload right before the mount point, but safely buffer it to protect the REST API
        ob_start();
        $this->inject_weather_payload_head(true);
        $payload = ob_get_clean();
        
        return $payload . '<div id="weather-app"></div>';
    }

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
            // FORCE CLEAN CRITICAL WP 404 FLAGS BEFORE THEME LOADS
            global $wp_query;
            $wp_query->init();
            $wp_query->is_404       = false;
            $wp_query->is_page      = true;
            $wp_query->is_singular  = true;
            $wp_query->is_archive   = false;
            $wp_query->is_home      = false;
            
            status_header(200);
            remove_filter('template_redirect', 'redirect_canonical');
            
            // Extract location parameters
            $path = trim(parse_url($uri, PHP_URL_PATH), '/');
            $base_slug = trim($matched_vertical, '/');
            $location_param = 'istanbul'; 

            if (preg_match('/' . preg_quote($base_slug, '/') . '\/(.+)/', $path, $matches)) {
                $location_param = sanitize_text_field($matches[1]);
            }
            
            set_query_var('weather_city', $location_param);
            set_query_var('current_vertical', $base_slug);

            // RENDER BLANK CANVAS FOR FULL-SCREEN REACT APP
            ?>
            <!DOCTYPE html>
            <html <?php language_attributes(); ?>>
            <head>
                <meta charset="<?php bloginfo( 'charset' ); ?>">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <?php wp_head(); // Injects SEO, Title, and our Payload ?>
                <style>
                    /* Reset margins so React can touch the edges of the screen */
                    body, html { margin: 0; padding: 0; width: 100%; min-height: 100vh; }
                </style>
            </head>
            <body <?php body_class(); ?>>
                
                <?php echo $this->render_react_mount(); // Mounts <div id="weather-app"> and the script payload ?>
                
                <?php wp_footer(); // Executes the React JS Bundle ?>
            </body>
            </html>
            <?php
            
            exit; // Absolute kill switch to guarantee zero template leaks
        }
    }

    // Overrides the "Page Not Found" title with high-value localized SEO keywords
    public function inject_dynamic_seo_titles($title_parts) {
        $city = get_query_var('weather_city');
        $vertical = get_query_var('current_vertical');

        if ( ! empty($city) ) {
            $formatted_city = esc_html(ucfirst($city));
            
            if ($vertical === 'deniz-suyu-sicakligi') {
                $title_parts['title'] = "{$formatted_city} Deniz Suyu Sıcaklığı - Anlık Ölçümler";
            } elseif ($vertical === 'kayak-merkezleri') {
                $title_parts['title'] = "{$formatted_city} Kayak Merkezi Kar Kalınlığı ve Hava Durumu";
            } else {
                $title_parts['title'] = "{$formatted_city} Hava Durumu - 15 Günlük Detaylı Tahmin Raporu";
            }
        }
        return $title_parts;
    }

    public function inject_weather_payload_head($force = false) {
        // Only run once per page load to prevent duplicate <script> tags
        static $has_run = false;
        if ($has_run) return;

        $is_virtual = get_query_var('weather_city') ? true : false;
        $is_home    = is_front_page() || is_home() || is_page(305); 
        
        // If force is true (called via shortcode), bypass the standard checks
        if ( ! $force && ! $is_virtual && ! $is_home ) {
            return; 
        }

        $has_run = true; // Mark as injected

        $city_slug = get_query_var('weather_city') ? sanitize_title(get_query_var('weather_city')) : 'istanbul';
        $cache_dir = wp_upload_dir()['basedir'] . '/sinan-weather-cache';
        $live_file = "{$cache_dir}/{$city_slug}.json";
        $weather_payload = '{}';

        if ( file_exists( $live_file ) && (time() - filemtime( $live_file ) < 1200) ) {
            $weather_payload = file_get_contents( $live_file );
        }

        if ( $weather_payload === '{}' || empty( $weather_payload ) ) {
            $lat = 41.0082; $lon = 28.9784; 
            $api_url  = "https://api.open-meteo.com/v1/forecast?latitude={$lat}&longitude={$lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m";
            
            $response = wp_remote_get( $api_url, array( 'timeout' => 10, 'sslverify' => false ) );

            if ( ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) === 200 ) {
                $weather_payload = wp_remote_retrieve_body( $response );
                if ( ! file_exists( $cache_dir ) ) wp_mkdir_p( $cache_dir );
                file_put_contents( $live_file, $weather_payload );
            }
        }

        // To prevent React crashing on an empty data object, mock a minimal structure if api failed
        if ( $weather_payload === '{}' || empty( $weather_payload ) ) {
            $weather_payload = json_encode(array(
                'current_weather' => array('temperature' => 15, 'windspeed' => 10, 'weathercode' => 0),
                'hourly' => array('time' => array(), 'temperature_2m' => array())
            ));
        }

        echo '<script data-no-optimize="1">
            window.SinanWeatherPayload = {
                city: "' . esc_js( $city_slug ) . '",
                weatherData: ' . ($weather_payload ? $weather_payload : '{}') . ',
                modules: { showTraffic: true, showMarine: true }
            };
        </script>';
    }
}
new SinanWeatherBridge();
