<?php
/**
 * Plugin Name: Sinan Weather Bridge
 * Description: Connects the React Weather App (Silo Protocol) to WordPress.
 * Version: 3.1
 * Author: TG Dijital
 */

if (!defined('ABSPATH'))
    exit; // Exit if accessed directly

class SinanWeatherBridge
{
    private $plugin_path;
    private $plugin_url;
    private $manifest_path;

    public function __construct()
    {
        $this->plugin_path = plugin_dir_path(__FILE__);
        $this->plugin_url = plugin_dir_url(__FILE__);

        // dist/ is expected to be inside the plugin folder
        $this->manifest_path = $this->plugin_path . 'assets/.vite/manifest.json';
        if (!file_exists($this->manifest_path)) {
            // Fallback for older Vite versions or flat structure
            $this->manifest_path = $this->plugin_path . 'assets/manifest.json';
        }

        // 1. Register Shortcode
        add_shortcode('sinan_weather_app', [$this, 'render_react_root']);

        // 2. Register Rewrite Rules
        add_action('init', [$this, 'add_rewrite_rules']);
        add_filter('query_vars', [$this, 'add_query_vars']);

        // 3. Enqueue Assets (Only on Weather Page)
        add_action('wp_enqueue_scripts', [$this, 'enqueue_react_assets']);

        // 4. SEO Injection
        add_action('wp_head', [$this, 'render_seo_meta'], 1);

        // 5. Cache Purge Hook (LiteSpeed)
        add_action('litespeed_purge_post', [$this, 'trigger_litespeed_purge']);
    }

    /**
     * URL REWRITE RULES (Silo Protocol)
     */
    public function add_rewrite_rules()
    {
        // /hava-durumu/istanbul/yarin
        add_rewrite_rule(
            '^hava-durumu/([^/]+)/(yarin|hafta-sonu|15-gunluk)/?$',
            'index.php?pagename=hava-durumu&city_slug=$matches[1]&weather_view=$matches[2]',
            'top'
        );

        // /hava-durumu/istanbul
        add_rewrite_rule(
            '^hava-durumu/([^/]+)/?$',
            'index.php?pagename=hava-durumu&city_slug=$matches[1]',
            'top'
        );
    }

    public function add_query_vars($vars)
    {
        $vars[] = 'city_slug';
        $vars[] = 'weather_view';
        return $vars;
    }

    /**
     * ASSET ENQUEUEING (Manifest Reader)
     */
    public function enqueue_react_assets()
    {
        global $post;
        if (!is_a($post, 'WP_Post') || !has_shortcode($post->post_content, 'sinan_weather_app')) {
            return;
        }

        $assets = $this->get_assets_from_manifest();

        // Enqueue CSS
        if (!empty($assets['css'])) {
            foreach ($assets['css'] as $css_file) {
                wp_enqueue_style('weather-app-style-' . md5($css_file), $this->plugin_url . 'assets/' . $css_file);
            }
        }

        // Enqueue JS (Main Entry)
        if (!empty($assets['file'])) {
            wp_enqueue_script('weather-app-main', $this->plugin_url . 'assets/' . $assets['file'], [], null, true);
        }

        // Pass Data to React
        $city_slug = get_query_var('city_slug');
        $view = get_query_var('weather_view');

        // If Shortcode has specific city override
        // We handle this in render_react_root, but could pass global config here
    }

    private function get_assets_from_manifest()
    {
        if (!file_exists($this->manifest_path)) {
            // Fallback: Scan directory for index.js/css if manifest missing (DEV mode safety)
            return [
                'file' => 'index.js',
                'css' => ['index.css']
            ];
        }

        $manifest = json_decode(file_get_contents($this->manifest_path), true);

        // Vite Manifest format: find entry point
        // usually 'index.html' is the key
        $entry_key = 'index.html';
        if (isset($manifest[$entry_key])) {
            return $manifest[$entry_key];
        }

        return [];
    }

    /**
     * SHORTCODE RENDERER
     */
    public function render_react_root($atts)
    {
        $url_city = get_query_var('city_slug');
        $url_view = get_query_var('weather_view');

        // Shortcode attrs can override (default: istanbul)
        $a = shortcode_atts(['city' => 'istanbul'], $atts);

        // URL takes precedence over shortcode attr
        $city_slug = !empty($url_city) ? $url_city : $a['city'];
        $city_display = $this->format_city_name($city_slug);

        $view_map = [
            'yarin' => 'tomorrow',
            'hafta-sonu' => 'weekend', // Legacy mapping
            '15-gunluk' => '15-days'
        ];

        $initial_view = isset($view_map[$url_view]) ? $view_map[$url_view] : 'home';

        // Initial Data Packet (Server Injection)
        $initial_data = [
            'city' => $city_display,
            'view' => $initial_view
        ];

        // Output Container
        $output = '<div id="weather-app" ';
        $output .= 'data-initial-city="' . esc_attr($city_display) . '" ';
        $output .= 'data-initial-view="' . esc_attr($initial_view) . '" ';
        $output .= 'aria-live="polite" aria-busy="true">';

        // SEO Fallback Content (Inside Container - Hydrated away)
        $output .= '<noscript><article><h1>' . esc_html($city_display) . ' Hava Durumu</h1>';
        $output .= '<p>Güncel hava durumu verileri yükleniyor...</p></article></noscript>';

        $output .= '<div class="react-loader" style="min-height:400px; display:flex; justify-content:center; align-items:center;">';
        $output .= '<span style="color:#666;">Yükleniyor...</span></div>';

        $output .= '</div>';

        // Inject Config Check
        $output .= '<script>window.INITIAL_WEATHER_DATA = ' . json_encode($initial_data) . ';</script>';

        return $output;
    }

    /**
     * SEO META INJECTION (Server Side)
     */
    public function render_seo_meta()
    {
        if (!is_page('hava-durumu'))
            return;

        $city_slug = get_query_var('city_slug') ?: 'istanbul';
        $view = get_query_var('weather_view') ?: '';
        $city_name = $this->format_city_name($city_slug);

        // Titles logic copied from docs
        $timeframe = match ($view) {
            'yarin' => 'Yarın',
            'hafta-sonu' => 'Hafta Sonu',
            '15-gunluk' => '15 Günlük',
            default => 'Saatlik'
        };

        // If plugin runs too late, title might be set by Yoast. 
        // We use a filter usually, but here is raw echo for verification
        // Better: Use 'pre_get_document_title' filter if Theme supports it.
        // For now, we assume this runs before </head>

        // Note: Real implementation should use 'document_title_parts' filter
    }

    /**
     * HELPER: City Name Formatter
     */
    private function format_city_name($slug)
    {
        $slug = str_replace(['i', 'o', 'u', 's', 'c', 'g'], ['ı', 'ö', 'ü', 'ş', 'ç', 'ğ'], $slug);
        return mb_convert_case(str_replace('-', ' ', $slug), MB_CASE_TITLE, "UTF-8");
    }

    /**
     * HELPER: LiteSpeed Purge
     */
    public function trigger_litespeed_purge($post_id)
    {
        if (defined('LSCWP_V')) {
            do_action('litespeed_purge_post', $post_id);
        }
    }
}

// Initialize
new SinanWeatherBridge();
