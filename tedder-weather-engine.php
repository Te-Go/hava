<?php
/**
 * Plugin Name: Tedder Weather Engine
 * Description: Core SEO and React Weather Hub Integration Engine.
 * Version: 22.12
 * Author: TG Dijital
 * Text Domain: tedder-weather-engine
 * 
 * Responsible for:
 * 1. Freshness Engine: Programmatic `lastmod` updates based on significant weather changes.
 * 2. LiteSpeed Cache Purge: Triggering cache clear only when necessary.
 * 3. Kill Switch: Preventing "Live" schema on stale data (Soft 404 protection).
 * 4. Logging: Tracking SEO events for debugging.
 */

class TedderWeatherEngine
{
    private $log_file;
    private $throttle_duration = 900; // 15 Minutes in seconds
    private $significant_temp_diff = 2.0; // 2°C change triggers update

    public function __construct()
    {
        $this->log_file = dirname(__FILE__) . '/seo_events.log';
    }

    /**
     * CORE: Checks if weather data change warrants an SEO update
     * @param int $post_id WordPress Post ID
     * @param array $old_data Previous weather data packet
     * @param array $new_data Fresh API weather data packet
     */
    public function process_update($post_id, $old_data, $new_data)
    {
        // 1. KILL SWITCH CHECK
        if ($this->is_data_stale($new_data)) {
            $this->log("KILL SWITCH: Data stale for Post ID $post_id. Aborting update to prevent Soft 404.");
            return false;
        }

        // 2. THROTTLE CHECK
        $last_update = get_post_meta($post_id, '_tedder_last_seo_update', true);
        if ($last_update && (time() - $last_update < $this->throttle_duration)) {
            $this->log("THROTTLE: Update skipped for Post ID $post_id (Too soon).");
            return false;
        }

        // 3. SIGNIFICANCE CHECK
        if ($this->is_significant_change($old_data, $new_data)) {
            $this->log("FRESHNESS: Significant change detected for Post ID $post_id. Triggering flush.");
            $this->trigger_seo_update($post_id);
            return true;
        }

        return false;
    }

    /**
     * Determines if the data difference matches QDF (Query Deserves Freshness) criteria
     */
    private function is_significant_change($old, $new)
    {
        if (empty($old))
            return true; // First run

        // Condition 1: Temperature Swing > 2°C
        $temp_diff = abs($old['current_temp'] - $new['current_temp']);
        if ($temp_diff >= $this->significant_temp_diff)
            return true;

        // Condition 2: Weather Code Change (Sunny -> Rainy)
        if ($old['weather_code'] !== $new['weather_code'])
            return true;

        return false;
    }

    /**
     * Checks if API data is too old (> 2 hours)
     */
    private function is_data_stale($data)
    {
        if (!isset($data['timestamp']))
            return true;
        $age = time() - $data['timestamp'];
        return $age > 7200; // 2 Hours
    }

    /**
     * Executes the SEO Update Protocol
     */
    private function trigger_seo_update($post_id)
    {
        // A. Update WordPress "Modified Date"
        $current_time = current_time('mysql');
        wp_update_post(array(
            'ID' => $post_id,
            'post_modified' => $current_time,
            'post_modified_gmt' => get_gmt_from_date($current_time)
        ));

        // B. Update Internal Meta (for Throttling)
        update_post_meta($post_id, '_tedder_last_seo_update', time());

        // C. Purge LiteSpeed Cache
        if (class_exists('LiteSpeed_Cache_API')) {
            LiteSpeed_Cache_API::purge_post($post_id);
            $this->log("LITESPEED: Cache purged for Post ID $post_id");
        }

        $this->log("UPDATE: Post ID $post_id updated successfully.");
    }

    /**
     * Simple File Logger
     */
    private function log($message)
    {
        $timestamp = date('Y-m-d H:i:s');
        $entry = "[$timestamp] $message" . PHP_EOL;
        file_put_contents($this->log_file, $entry, FILE_APPEND);
    }
}

// Instantiate for global use
global $tedder_engine;
$tedder_engine = new TedderWeatherEngine();

/**
 * TURKISH NORMALIZATION ENGINE
 * Resolves agglutinative search suffixes and provides Turkish-aware lowercase conversion.
 */
class TurkishNormalizer {
    /**
     * Converts a Turkish string to pure lowercase, handling I -> ı and İ -> i cases.
     */
    public static function to_lowercase($string) {
        $string = str_replace(
            ['İ', 'I', 'Ş', 'ş', 'Ç', 'ç', 'Ğ', 'ğ', 'Ü', 'ü', 'Ö', 'ö'],
            ['i', 'ı', 'ş', 'ş', 'ç', 'ç', 'ğ', 'ğ', 'ü', 'ü', 'ö', 'ö'],
            $string
        );
        return mb_strtolower($string, 'UTF-8');
    }

    /**
     * Isolates the root lemma of a Turkish city or district.
     * Strips apostrophes and standard agglutinative suffixes.
     */
    public static function isolate_lemma($slug) {
        $slug = self::to_lowercase($slug);
        
        // 1. If there is an apostrophe, split and take the root (e.g. istanbul'da -> istanbul, ankara'ya -> ankara)
        if (strpos($slug, "'") !== false) {
            $parts = explode("'", $slug);
            $slug = $parts[0];
        } else {
            // 2. If no apostrophe, ONLY strip suffixes that never collide with valid city/district roots:
            // - Locative: da, de, ta, te (e.g. istanbulda -> istanbul, kadikoyde -> kadikoy)
            // - Genitive (4-way long genitive): nin, nın, nun, nün (e.g. kadikoynun -> kadikoy)
            // (Single character datives like -a/-e and short genitives like -in/-un are ignored here to protect Mardin, Mersin, Adana, Bursa, Antalya, Konya, Samsun, etc.)
            $suffixes_pattern = '/(da|de|ta|te|nin|nın|nun|nün)$/u';
            $slug = preg_replace($suffixes_pattern, '', $slug);
        }

        // Sanitize any remaining non-alphanumeric characters except Turkish letters and hyphen
        $slug = preg_replace('/[^a-z0-9ıışşçcğgüüöö\-]/u', '', $slug);
        
        return trim($slug, '-');
    }
}

/**
 * KVKK SCRIPT SHIELD (DATA PROTECTION GUARD)
 * Enforces absolute pre-consent script blocking to prevent 17,092,242 TL penalties.
 */
class KVKK_Script_Shield {
    /**
     * Wraps and shields the AdSense/Ezoic scripts to ensure strict KVKK compliance.
     */
    public static function render_ad_script($publisher_id) {
        // Retrieve the Complianz cookie consent token state
        $consent_status = isset($_COOKIE['complianz_consent_status']) ? sanitize_text_field($_COOKIE['complianz_consent_status']) : 'deny';

        if ($consent_status === 'allow') {
            // Render active standard script if consent was already given
            echo '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' . esc_attr($publisher_id) . '" crossorigin="anonymous"></script>';
        } else {
            // Block script execution. Output with text/plain type and Complianz class.
            echo '<script type="text/plain" class="cmplz-script cmplz-stats" data-src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' . esc_attr($publisher_id) . '" crossorigin="anonymous"></script>';
            
            // Execute Google Consent Mode V2 cookieless traffic ping fallback
            echo "<script>
                window.gtag = window.gtag || function() { (window.dataLayer = window.dataLayer || []).push(arguments); };
                gtag('consent', 'default', {
                    'ad_storage': 'denied',
                    'analytics_storage': 'denied',
                    'ad_user_data': 'denied',
                    'ad_personalization': 'denied',
                    'wait_for_update': 500
                });
            </script>";
        }
    }
}

/**
 * VIRTUAL PAGE TEMPLATE ROUTING CONTROLLER
 * Integrates scoped rewrite tags and prevents Soft-404 indexation bugs using 200 OK headers.
 */
function tedder_register_query_vars($vars) {
    $vars[] = 'weather_city';
    $vars[] = 'weather_district';
    $vars[] = 'weather_timeframe';
    return $vars;
}
add_filter('query_vars', 'tedder_register_query_vars');

function tedder_register_weather_rewrites() {
    add_rewrite_tag('%weather_city%', '([^/]+)');
    add_rewrite_tag('%weather_district%', '([^/]+)');
    add_rewrite_tag('%weather_timeframe%', '([^/]+)');

    // Scoped pattern to prevent hijacking standard WordPress category/post loops
    add_rewrite_rule(
        '^hava-durumu/([^/]+)/([^/]+)/([^/]+)/?$',
        'index.php?weather_city=$matches[1]&weather_district=$matches[2]&weather_timeframe=$matches[3]',
        'top'
    );
}
add_action('init', 'tedder_register_weather_rewrites');

function tedder_route_weather_template($template) {
    $city = get_query_var('weather_city');
    $district = get_query_var('weather_district');

    if ($city && $district) {
        // Enforce clean 200 OK headers to guarantee Googlebot indexing success
        global $wp_query;
        $wp_query->is_404 = false;
        $wp_query->is_single = false;
        $wp_query->is_page = true;
        status_header(200);

        // Normalize using TurkishNormalizer to support suffixes
        $normalized_city = TurkishNormalizer::isolate_lemma($city);
        $normalized_district = TurkishNormalizer::isolate_lemma($district);

        // Update the query vars with normalized lemmas for engine consumption
        set_query_var('weather_city', $normalized_city);
        set_query_var('weather_district', $normalized_district);

        $custom_template = get_stylesheet_directory() . '/template-weather-hub.php';
        if (file_exists($custom_template)) {
            return $custom_template;
        }
    }
    return $template;
}
add_filter('template_include', 'tedder_route_weather_template');

// Load the Weather Bridge integration
require_once plugin_dir_path(__FILE__) . 'sinan-weather-bridge/sinan-weather-bridge.php';
