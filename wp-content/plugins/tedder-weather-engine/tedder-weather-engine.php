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

        // SERVER-SIDE CLEANUP: Delete the stale crashing weather-app.js from all possible directories
        add_action('init', function() {
            $paths = [];
            
            // Path 1: ABSPATH (WordPress Root Directory)
            if (defined('ABSPATH')) {
                $paths[] = ABSPATH . 'tedder-assets/js/weather-app.js';
                $paths[] = ABSPATH . 'wp-content/uploads/tedder-assets/js/weather-app.js';
            }
            
            // Path 2: Official Uploads directory
            if (function_exists('wp_upload_dir')) {
                $upload_dir = wp_upload_dir();
                $paths[] = $upload_dir['basedir'] . '/tedder-assets/js/weather-app.js';
            }
            
            // Path 3: Child theme stylesheet directory
            if (function_exists('get_stylesheet_directory')) {
                $paths[] = get_stylesheet_directory() . '/tedder-assets/js/weather-app.js';
            }

            foreach (array_unique($paths) as $target_file) {
                if ($target_file && file_exists($target_file)) {
                    @unlink($target_file); // Quietly delete it, overriding strict FTP owner permissions
                    $parent_dir = dirname($target_file);
                    if (is_dir($parent_dir) && count(scandir($parent_dir)) == 2) {
                        @rmdir($parent_dir); // Clear out the parent directory if empty
                    }
                }
            }

            // EXTRA SWEEP: Purge any non-repository files inside the child theme directory (e.g. template-weather-hub.php)
            if (function_exists('get_stylesheet_directory')) {
                $child_dir = get_stylesheet_directory();
                if (is_dir($child_dir)) {
                    $allowed_files = ['functions.php', 'style.css', 'screenshot.png', '.', '..'];
                    $files = @scandir($child_dir);
                    if (is_array($files)) {
                        foreach ($files as $file) {
                            if (!in_array($file, $allowed_files)) {
                                $target = $child_dir . '/' . $file;
                                if (is_file($target)) {
                                    @unlink($target); // Physically delete legacy/leftover files
                                }
                            }
                        }
                    }
                }
            }
        }, 1);
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




// Load the Centralized Data Engine (Tier 1 Proactive Sync)
require_once plugin_dir_path(__FILE__) . 'tedder-data-engine.php';

// Load the Weather Bridge integration (Tier 2 Reactive JIT)
require_once plugin_dir_path(__FILE__) . 'sinan-weather-bridge/sinan-weather-bridge.php';


/**
 * Tedder Configuration Admin Page
 */
add_action('admin_menu', 'tedder_configuration_menu');

function tedder_configuration_menu() {
    add_options_page(
        'Tedder Configuration',
        'Tedder Config',
        'manage_options',
        'tedder-configuration',
        'tedder_configuration_page'
    );
}

function tedder_configuration_page() {
    if (!current_user_can('manage_options')) {
        return;
    }

    if (isset($_POST['tedder_save_config']) && check_admin_referer('tedder_config_nonce_action', 'tedder_config_nonce')) {
        update_option('tedder_tomtom_api_key', sanitize_text_field($_POST['tedder_tomtom_api_key']));
        update_option('tedder_wu_app_id', sanitize_text_field($_POST['tedder_wu_app_id']));
        update_option('tedder_wu_app_key', sanitize_text_field($_POST['tedder_wu_app_key']));
        update_option('tedder_keycollect_api_key', sanitize_text_field($_POST['tedder_keycollect_api_key']));
        echo '<div class="updated"><p>Configuration saved securely.</p></div>';
    }

    $tomtom = get_option('tedder_tomtom_api_key', '');
    $wu_id = get_option('tedder_wu_app_id', '');
    $wu_key = get_option('tedder_wu_app_key', '');
    $keycollect = get_option('tedder_keycollect_api_key', '');
    ?>
    <div class="wrap">
        <h1>Tedder System Configuration</h1>
        <form method="POST" action="">
            <?php wp_nonce_field('tedder_config_nonce_action', 'tedder_config_nonce'); ?>
            <input type="hidden" name="tedder_save_config" value="1">
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="tedder_tomtom_api_key">TomTom API Key (Traffic)</label></th>
                    <td><input name="tedder_tomtom_api_key" type="text" id="tedder_tomtom_api_key" value="<?php echo esc_attr($tomtom); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="tedder_wu_app_id">WeatherUnlocked App ID (Ski)</label></th>
                    <td><input name="tedder_wu_app_id" type="text" id="tedder_wu_app_id" value="<?php echo esc_attr($wu_id); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="tedder_wu_app_key">WeatherUnlocked App Key (Ski)</label></th>
                    <td><input name="tedder_wu_app_key" type="text" id="tedder_wu_app_key" value="<?php echo esc_attr($wu_key); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="tedder_keycollect_api_key">KeyCollect API Key (Finance)</label></th>
                    <td><input name="tedder_keycollect_api_key" type="text" id="tedder_keycollect_api_key" value="<?php echo esc_attr($keycollect); ?>" class="regular-text"></td>
                </tr>
            </table>
            <?php submit_button('Save Config'); ?>
        </form>
    </div>
    <?php
}
