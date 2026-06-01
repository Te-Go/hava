<?php
/**
 * GeneratePress child theme functions and definitions.
 *
 * Add your custom PHP in this file.
 */

add_action( 'wp_enqueue_scripts', 'generatepress_child_enqueue_styles' );
function generatepress_child_enqueue_styles() {
    wp_enqueue_style( 'generatepress-parent-style', get_template_directory_uri() . '/style.css' );
    wp_enqueue_style( 'generatepress-child-style', get_stylesheet_directory_uri() . '/style.css', array( 'generatepress-parent-style' ) );
}
