<?php
/**
 * GeneratePress child theme functions and definitions.
 *
 * Add your custom PHP in this file.
 */

add_action( 'wp_enqueue_scripts', 'generatepress_child_enqueue_styles', 20 );
function generatepress_child_enqueue_styles() {
    // Enqueue Parent Theme Style
    wp_enqueue_style( 'generatepress-parent-style', get_template_directory_uri() . '/style.css' );
    
    // Enqueue Child Theme Style with Cache Busting
    $child_css_path = get_stylesheet_directory() . '/style.css';
    $child_version = file_exists($child_css_path) ? filemtime($child_css_path) : '1.0.0';
    wp_enqueue_style( 'generatepress-child-style', get_stylesheet_directory_uri() . '/style.css', array( 'generatepress-parent-style' ), $child_version );
    
    // Check if the current view is using our programmatic weather hub template or is the home page
    if ( is_front_page() || is_home() || get_query_var('weather_city') || is_page('hava-durumu') ) {
        $js_file = get_stylesheet_directory() . '/dist/bundle.js';
        $js_uri  = get_stylesheet_directory_uri() . '/dist/bundle.js';
        
        // Due to rollup output, CSS might be bundle.css or index.css
        // Let's assume it outputs index.css by default or bundle.css if named
        $css_file = get_stylesheet_directory() . '/dist/index.css';
        $css_uri  = get_stylesheet_directory_uri() . '/dist/index.css';
        
        if (!file_exists($css_file)) {
            $css_file = get_stylesheet_directory() . '/dist/bundle.css';
            $css_uri  = get_stylesheet_directory_uri() . '/dist/bundle.css';
        }

        if (file_exists($css_file)) {
            wp_enqueue_style(
                'sinan-weather-react-styles', 
                $css_uri, 
                array(), 
                time()
            );
        }

        if (file_exists($js_file)) {
            wp_enqueue_script(
                'sinan-weather-react-app',
                $js_uri,
                array(), // Dependency on wp-element (React) if needed, or just standard
                time(),
                true // Load in footer
            );
        }
    }
}

// SINAN: Client-Side Redirect Interceptor for KVKK/GDPR compliant local dashboard routing
add_action('wp_head', 'tedder_city_memory_redirect', 5);
function tedder_city_memory_redirect() {
    // Only run this intercept on the exact root hub URLs
    if ( ( is_page('hava-durumu') || is_front_page() || is_home() ) && !get_query_var('weather_city') ) {
        ?>
        <script>
            (function() {
                // 1. Check if the user has a saved city in their browser
                var lastCity = localStorage.getItem('sinan_last_city') || localStorage.getItem('last_visited_city');
                
                // 2. Route them to their local hub, fallback to Istanbul
                if (lastCity) {
                    var slug = lastCity.toLowerCase()
                        .replace(/ı/g, 'i')
                        .replace(/ğ/g, 'g')
                        .replace(/ü/g, 'u')
                        .replace(/ş/g, 's')
                        .replace(/ö/g, 'o')
                        .replace(/ç/g, 'c')
                        .replace(/[^a-z0-9\-]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-+|-+$/g, '');
                    window.location.replace('/hava-durumu/' + slug + '/');
                } else {
                    window.location.replace('/hava-durumu/istanbul/');
                }
            })();
        </script>
        <?php
    }
}

/**
 * Prevent WordPress from hijacking our virtual React routes.
 * Disables canonical URL guessing for any path under /hava-durumu/
 */
add_filter( 'redirect_canonical', 'tedder_disable_url_guessing', 10, 2 );
function tedder_disable_url_guessing( $redirect_url, $requested_url ) {
    // If the user is requesting a URL inside our weather app
    if ( strpos( $requested_url, '/hava-durumu/' ) !== false ) {
        return false; // Block WordPress from redirecting to random blog posts
    }
    return $redirect_url;
}

/**
 * Add type="module" to the React bundle script tag so the browser can parse ES Modules.
 */
add_filter( 'script_loader_tag', 'tedder_add_module_type_to_react', 10, 3 );
function tedder_add_module_type_to_react( $tag, $handle, $src ) {
    // Check if it is our specific React bundle
    if ( 'sinan-weather-react-app' === $handle ) {
        // Rewrite the script tag to include type="module"
        $tag = '<script type="module" src="' . esc_url( $src ) . '" id="sinan-weather-react-app-js"></script>' . "\n";
    }
    return $tag;
}
