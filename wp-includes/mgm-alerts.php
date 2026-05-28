<?php
/**
 * MGM Weather Alerts Proxy for WordPress
 * 
 * Fetches and caches weather alerts from Turkish Meteorological Service.
 * Since MGM doesn't have a public API, this scrapes their alert pages and
 * provides fallback manual alert entry via WordPress options.
 * 
 * @package HavaDurumlari
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// ============================================================================
// ALERT CONFIGURATION
// ============================================================================

define('MGM_ALERTS_CACHE_KEY', 'mgm_weather_alerts');
define('MGM_ALERTS_CACHE_TTL', 30 * MINUTE_IN_SECONDS); // 30 minutes

// Alert severity levels
define('MGM_ALERT_SEVERITY', [
    'yellow' => ['label' => 'Dikkat', 'priority' => 3],
    'orange' => ['label' => 'Uyarı', 'priority' => 2],
    'red' => ['label' => 'Acil Uyarı', 'priority' => 1]
]);

// Alert types in Turkish
define('MGM_ALERT_TYPES', [
    'storm' => 'Fırtına',
    'rain' => 'Kuvvetli Yağış',
    'snow' => 'Yoğun Kar',
    'frost' => 'Don',
    'heat' => 'Sıcak Hava Dalgası',
    'cold' => 'Soğuk Hava Dalgası',
    'wind' => 'Kuvvetli Rüzgar',
    'fog' => 'Yoğun Sis',
    'avalanche' => 'Çığ Tehlikesi',
    'thunderstorm' => 'Gök Gürültülü Sağanak',
    'hail' => 'Dolu',
    'dust' => 'Toz Fırtınası',
    'flood' => 'Sel/Su Baskını'
]);

// ============================================================================
// REST API ENDPOINT
// ============================================================================

add_action('rest_api_init', function () {
    register_rest_route('sinan/v1', '/alerts', [
        'methods' => 'GET',
        'callback' => 'sinan_get_weather_alerts',
        'permission_callback' => '__return_true',
        'args' => [
            'city' => [
                'required' => false,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field'
            ]
        ]
    ]);
});

/**
 * Get weather alerts endpoint handler
 */
function sinan_get_weather_alerts(WP_REST_Request $request)
{
    $city = $request->get_param('city');

    // Get cached alerts
    $alerts = get_transient(MGM_ALERTS_CACHE_KEY);

    if ($alerts === false) {
        // Cache miss - fetch fresh alerts
        $alerts = sinan_fetch_mgm_alerts();
        set_transient(MGM_ALERTS_CACHE_KEY, $alerts, MGM_ALERTS_CACHE_TTL);
    }

    // Filter by city if specified
    if ($city && !empty($alerts)) {
        $city_normalized = sinan_normalize_city_name($city);
        $alerts = array_filter($alerts, function ($alert) use ($city_normalized) {
            if (empty($alert['cities']))
                return true; // Nationwide alerts
            foreach ($alert['cities'] as $alert_city) {
                if (sinan_normalize_city_name($alert_city) === $city_normalized) {
                    return true;
                }
            }
            return false;
        });
        $alerts = array_values($alerts); // Re-index
    }

    return new WP_REST_Response([
        'alerts' => $alerts,
        'lastUpdated' => date('c'),
        'source' => 'mgm'
    ], 200);
}

/**
 * Normalize Turkish city names for comparison
 */
function sinan_normalize_city_name($city)
{
    $replacements = [
        'ı' => 'i',
        'İ' => 'i',
        'ş' => 's',
        'Ş' => 's',
        'ğ' => 'g',
        'Ğ' => 'g',
        'ü' => 'u',
        'Ü' => 'u',
        'ö' => 'o',
        'Ö' => 'o',
        'ç' => 'c',
        'Ç' => 'c'
    ];
    return mb_strtolower(strtr(trim($city), $replacements));
}

// ============================================================================
// MGM FETCHING (Scraping fallback + manual alerts)
// ============================================================================

/**
 * Fetch alerts from MGM website or manual entries
 * 
 * Since MGM uses dynamic ASP.NET pages without a public API,
 * we provide two methods:
 * 1. Parse MGM alert pages (when possible)
 * 2. Use manually entered alerts via WordPress admin
 */
function sinan_fetch_mgm_alerts()
{
    $alerts = [];

    // Method 1: Try to fetch from MGM (basic parsing)
    $mgm_alerts = sinan_parse_mgm_meteouyari();
    if (!empty($mgm_alerts)) {
        $alerts = array_merge($alerts, $mgm_alerts);
    }

    // Method 2: Get manual alerts from WordPress options
    $manual_alerts = get_option('sinan_manual_alerts', []);
    if (!empty($manual_alerts)) {
        // Filter expired alerts
        $now = current_time('timestamp');
        $manual_alerts = array_filter($manual_alerts, function ($alert) use ($now) {
            return strtotime($alert['validUntil']) > $now;
        });
        $alerts = array_merge($alerts, $manual_alerts);
    }

    // Sort by severity (red > orange > yellow)
    usort($alerts, function ($a, $b) {
        $priority = ['red' => 1, 'orange' => 2, 'yellow' => 3, 'none' => 4];
        return ($priority[$a['severity'] ?? 'none'] ?? 4) - ($priority[$b['severity'] ?? 'none'] ?? 4);
    });

    return $alerts;
}

/**
 * Parse MGM MeteoUyarı pages for active alerts
 * 
 * NOTE: This is a basic parser. MGM's website structure may change.
 * For production, consider using their email alert service or 
 * contacting MGM directly for API access.
 */
function sinan_parse_mgm_meteouyari()
{
    $alerts = [];

    try {
        // Fetch Turkish nationwide alert page
        $response = wp_remote_get('https://www.mgm.gov.tr/meteouyari/turkiye.aspx', [
            'timeout' => 10,
            'headers' => [
                'Accept' => 'text/html',
                'User-Agent' => 'Mozilla/5.0 (compatible; HavaDurumlari/1.0)'
            ]
        ]);

        if (is_wp_error($response)) {
            error_log('MGM fetch error: ' . $response->get_error_message());
            return [];
        }

        $body = wp_remote_retrieve_body($response);
        if (empty($body))
            return [];

        // Look for alert indicators in the page
        // MGM uses colored circles for alert levels:
        // - Yellow (Dikkat): class contains "sari" or yellow indicator
        // - Orange (Uyarı): class contains "turuncu" or orange indicator  
        // - Red (Acil): class contains "kirmizi" or red indicator

        // Check for "Uyarı Yok" (No Warnings) text
        if (
            stripos($body, 'uyarı bulunmamaktadır') !== false ||
            stripos($body, 'uyarı yok') !== false
        ) {
            return [];
        }

        // Parse for specific alerts (simplified extraction)
        // In production, this should use DOMDocument for proper HTML parsing

        // Look for city-specific alerts
        if (preg_match_all('/<div[^>]*class="[^"]*meteo-uyari[^"]*"[^>]*>(.*?)<\/div>/si', $body, $matches)) {
            foreach ($matches[1] as $alertHtml) {
                $alert = sinan_parse_alert_div($alertHtml);
                if ($alert) {
                    $alerts[] = $alert;
                }
            }
        }

    } catch (Exception $e) {
        error_log('MGM parse exception: ' . $e->getMessage());
    }

    return $alerts;
}

/**
 * Parse individual alert div content
 */
function sinan_parse_alert_div($html)
{
    // Determine severity from color classes or icons
    $severity = 'yellow';
    if (stripos($html, 'kirmizi') !== false || stripos($html, 'red') !== false) {
        $severity = 'red';
    } elseif (stripos($html, 'turuncu') !== false || stripos($html, 'orange') !== false) {
        $severity = 'orange';
    }

    // Extract text content
    $text = strip_tags($html);
    $text = trim(preg_replace('/\s+/', ' ', $text));

    if (empty($text))
        return null;

    // Determine alert type from keywords
    $type = 'storm'; // default
    $type_keywords = [
        'yağış' => 'rain',
        'yağmur' => 'rain',
        'kar' => 'snow',
        'don' => 'frost',
        'sıcak' => 'heat',
        'soğuk' => 'cold',
        'rüzgar' => 'wind',
        'sis' => 'fog',
        'çığ' => 'avalanche',
        'gök gürültü' => 'thunderstorm',
        'dolu' => 'hail',
        'toz' => 'dust',
        'sel' => 'flood',
        'fırtına' => 'storm'
    ];

    foreach ($type_keywords as $keyword => $alert_type) {
        if (mb_stripos($text, $keyword) !== false) {
            $type = $alert_type;
            break;
        }
    }

    return [
        'id' => 'mgm-' . md5($text),
        'type' => $type,
        'severity' => $severity,
        'title' => MGM_ALERT_TYPES[$type] ?? 'Meteorolojik Uyarı',
        'description' => $text,
        'cities' => [], // Nationwide if empty
        'validFrom' => date('c'),
        'validUntil' => date('c', strtotime('+24 hours')),
        'source' => 'mgm',
        'url' => 'https://www.mgm.gov.tr/meteouyari/turkiye.aspx'
    ];
}

// ============================================================================
// ADMIN INTERFACE FOR MANUAL ALERTS
// ============================================================================

add_action('admin_menu', function () {
    add_submenu_page(
        'options-general.php',
        'Hava Uyarıları',
        'Hava Uyarıları',
        'manage_options',
        'sinan-weather-alerts',
        'sinan_render_alerts_admin_page'
    );
});

/**
 * Render admin page for manual alert management
 */
function sinan_render_alerts_admin_page()
{
    // Handle form submission
    if (isset($_POST['sinan_add_alert']) && check_admin_referer('sinan_alerts_nonce')) {
        $alerts = get_option('sinan_manual_alerts', []);

        $new_alert = [
            'id' => 'manual-' . time(),
            'type' => sanitize_text_field($_POST['alert_type']),
            'severity' => sanitize_text_field($_POST['alert_severity']),
            'title' => sanitize_text_field($_POST['alert_title']),
            'description' => sanitize_textarea_field($_POST['alert_description']),
            'cities' => array_map('trim', explode(',', sanitize_text_field($_POST['alert_cities']))),
            'validFrom' => sanitize_text_field($_POST['alert_valid_from']),
            'validUntil' => sanitize_text_field($_POST['alert_valid_until']),
            'source' => 'manual'
        ];

        $alerts[] = $new_alert;
        update_option('sinan_manual_alerts', $alerts);

        // Clear cache so new alert appears immediately
        delete_transient(MGM_ALERTS_CACHE_KEY);

        echo '<div class="notice notice-success"><p>Uyarı eklendi!</p></div>';
    }

    // Handle delete
    if (isset($_GET['delete_alert']) && check_admin_referer('delete_alert_' . $_GET['delete_alert'])) {
        $alerts = get_option('sinan_manual_alerts', []);
        $alerts = array_filter($alerts, function ($a) {
            return $a['id'] !== $_GET['delete_alert']; });
        update_option('sinan_manual_alerts', array_values($alerts));
        delete_transient(MGM_ALERTS_CACHE_KEY);
        echo '<div class="notice notice-success"><p>Uyarı silindi!</p></div>';
    }

    $alerts = get_option('sinan_manual_alerts', []);
    ?>
    <div class="wrap">
        <h1>Hava Uyarıları Yönetimi</h1>

        <h2>Yeni Uyarı Ekle</h2>
        <form method="post" class="form-table">
            <?php wp_nonce_field('sinan_alerts_nonce'); ?>
            <table class="form-table">
                <tr>
                    <th><label for="alert_type">Uyarı Tipi</label></th>
                    <td>
                        <select name="alert_type" id="alert_type">
                            <?php foreach (MGM_ALERT_TYPES as $key => $label): ?>
                                <option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th><label for="alert_severity">Seviye</label></th>
                    <td>
                        <select name="alert_severity" id="alert_severity">
                            <option value="yellow">Sarı (Dikkat)</option>
                            <option value="orange">Turuncu (Uyarı)</option>
                            <option value="red">Kırmızı (Acil)</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th><label for="alert_title">Başlık</label></th>
                    <td><input type="text" name="alert_title" id="alert_title" class="regular-text" required></td>
                </tr>
                <tr>
                    <th><label for="alert_description">Açıklama</label></th>
                    <td><textarea name="alert_description" id="alert_description" rows="3" class="large-text"
                            required></textarea></td>
                </tr>
                <tr>
                    <th><label for="alert_cities">Şehirler</label></th>
                    <td>
                        <input type="text" name="alert_cities" id="alert_cities" class="regular-text"
                            placeholder="İstanbul, Ankara, İzmir">
                        <p class="description">Virgülle ayırın. Boş bırakırsanız tüm Türkiye için geçerli olur.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="alert_valid_from">Başlangıç</label></th>
                    <td><input type="datetime-local" name="alert_valid_from" id="alert_valid_from" required></td>
                </tr>
                <tr>
                    <th><label for="alert_valid_until">Bitiş</label></th>
                    <td><input type="datetime-local" name="alert_valid_until" id="alert_valid_until" required></td>
                </tr>
            </table>
            <p><input type="submit" name="sinan_add_alert" class="button button-primary" value="Uyarı Ekle"></p>
        </form>

        <h2>Mevcut Uyarılar</h2>
        <?php if (empty($alerts)): ?>
            <p>Henüz manuel uyarı eklenmemiş.</p>
        <?php else: ?>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Tip</th>
                        <th>Seviye</th>
                        <th>Başlık</th>
                        <th>Şehirler</th>
                        <th>Bitiş</th>
                        <th>İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($alerts as $alert): ?>
                        <tr>
                            <td><?php echo esc_html(MGM_ALERT_TYPES[$alert['type']] ?? $alert['type']); ?></td>
                            <td><?php echo esc_html(MGM_ALERT_SEVERITY[$alert['severity']]['label'] ?? $alert['severity']); ?></td>
                            <td><?php echo esc_html($alert['title']); ?></td>
                            <td><?php echo esc_html(implode(', ', $alert['cities'] ?? ['Tüm Türkiye'])); ?></td>
                            <td><?php echo esc_html($alert['validUntil']); ?></td>
                            <td>
                                <?php
                                $delete_url = wp_nonce_url(
                                    add_query_arg('delete_alert', $alert['id']),
                                    'delete_alert_' . $alert['id']
                                );
                                ?>
                                <a href="<?php echo esc_url($delete_url); ?>" class="button button-secondary"
                                    onclick="return confirm('Bu uyarıyı silmek istediğinizden emin misiniz?')">Sil</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
    <?php
}
