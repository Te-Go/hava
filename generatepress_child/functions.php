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
    
    // Enqueue Child Theme Style
    wp_enqueue_style( 'generatepress-child-style', get_stylesheet_directory_uri() . '/style.css', array( 'generatepress-parent-style' ) );
    
    // Check if the current view is using our programmatic weather hub template
    if ( is_page_template('template-weather-hub.php') || get_query_var('weather_city') || is_page('hava-durumu') ) {
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
                filemtime($css_file)
            );
        }

        if (file_exists($js_file)) {
            wp_enqueue_script(
                'sinan-weather-react-app',
                $js_uri,
                array(), // Dependency on wp-element (React) if needed, or just standard
                filemtime($js_file),
                true // Load in footer
            );
        }
    }
}
