<?php
/**
 * Tedder API Proxy
 * Secures external API calls (TomTom, WeatherUnlocked, KeyCollect) behind internal WordPress routes.
 * Implements SSD Transient Caching and specific chronological limits.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class TedderAPIProxy {

    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        // Traffic Route (TomTom) - 20 minute cache
        register_rest_route( 'sinan/v1', '/traffic', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'proxy_tomtom_traffic' ),
            'permission_callback' => '__return_true'
        ));



        // Finance Route (KeyCollect) - 2 minute cache
        register_rest_route( 'sinan/v1', '/finance', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'proxy_keycollect_finance' ),
            'permission_callback' => '__return_true'
        ));

        // Radar Route (RainViewer Proxy) - 5 minute cache
        register_rest_route( 'sinan/v1', '/radar', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'proxy_rainviewer_radar' ),
            'permission_callback' => '__return_true'
        ));

        // Geocoding Proxy Route - 30 Day Long Term Database Transient Cache
        register_rest_route( 'sinan/v1', '/geocode', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'proxy_openmeteo_geocode' ),
            'permission_callback' => '__return_true'
        ));
    }

    /**
     * Proxy TomTom Traffic
     */
    public function proxy_tomtom_traffic( $request ) {
        $city = sanitize_text_field( $request->get_param( 'city' ) );
        $lat = sanitize_text_field( $request->get_param( 'lat' ) );
        $lon = sanitize_text_field( $request->get_param( 'lon' ) );

        if ( ! empty( $city ) ) {
            $city_data = $this->handle_tomtom_city_request( $city, $lat, $lon );
            if ( is_wp_error( $city_data ) ) {
                return $city_data;
            }
            $response = new WP_REST_Response( $city_data );
            $response->set_status( 200 );
            return $response;
        }

        if ( ! $lat || ! $lon ) {
            return new WP_Error( 'missing_params', 'City or Latitude/Longitude required', array( 'status' => 400 ) );
        }

        $flow_data = $this->fetch_tomtom_flow_direct( $lat, $lon );
        if ( is_wp_error( $flow_data ) ) {
            return $flow_data;
        }

        $speed = round( $flow_data['flowSegmentData']['currentSpeed'] ?? 50 );
        $freeFlow = round( $flow_data['flowSegmentData']['freeFlowSpeed'] ?? 50 );
        $percent = max( 0, min( 100, round( ( 1 - ( $speed / $freeFlow ) ) * 100 ) ) );
        
        $compiled_data = array(
            'city' => 'Bölge',
            'currentSpeed' => $speed,
            'freeFlowSpeed' => $freeFlow,
            'congestionLevel' => $percent > 50 ? 'severe' : ($percent > 35 ? 'high' : ($percent > 15 ? 'medium' : 'low')),
            'congestionPercent' => $percent,
            'mainRoutes' => array(
                array('name' => 'Yakın Bağlantı Otoyolu (Canlı Akış)', 'delay' => $percent > 25 ? 6 : 0)
            ),
            'narrative' => 'Bölgesel yol segmentleri üzerinde trafik akışı anlık koordinat verilerine göre işleniyor.',
            'lastUpdated' => time() * 1000
        );

        $response = new WP_REST_Response( $compiled_data );
        $response->set_status( 200 );
        return $response;
    }

    private function fetch_tomtom_flow_direct( $lat, $lon ) {
        $api_key = get_option( 'tedder_tomtom_api_key' );
        if ( empty( $api_key ) ) {
            $api_key = 'qUlGJOObY34eaqSXZto9H0OVWfGYqhP5';
        }

        $lat_r = round((float) $lat, 4);
        $lon_r = round((float) $lon, 4);
        $cache_key = 'tedder_traffic_' . md5( $lat_r . '_' . $lon_r );
        $cached_data = get_transient( $cache_key );

        if ( false === $cached_data ) {
            // Enforce functionalRoadClass=0,1,2 to dynamically snap queries onto motorways and national arteries globally
            $url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={$lat},{$lon}&unit=KMPH&functionalRoadClass=0,1,2&key={$api_key}";
            $response = wp_remote_get( $url, array( 'timeout' => 10 ) );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = wp_remote_retrieve_body( $response );
            $data = json_decode( $body, true );
            
            if ( isset( $data['flowSegmentData'] ) ) {
                set_transient( $cache_key, json_encode( $data ), 20 * MINUTE_IN_SECONDS );
                $cached_data = json_encode( $data );
            } else {
                return new WP_Error( 'tomtom_error', 'Invalid response from TomTom API', array( 'status' => 502 ) );
            }
        }

        return json_decode( $cached_data, true );
    }

    private function handle_tomtom_city_request( $city, $lat = null, $lon = null ) {
        $cityKey = strtolower( $city );
        $cityKey = str_replace(
            array('ı', 'ş', 'ğ', 'ü', 'ö', 'ç', 'İ', 'Ş', 'Ğ', 'Ü', 'Ö', 'Ç'),
            array('i', 's', 'g', 'u', 'o', 'c', 'i', 's', 'g', 'u', 'o', 'c'),
            $cityKey
        );

        $cache_key = 'tedder_city_traffic_' . $cityKey;
        $cached = get_transient( $cache_key );
        if ( $cached !== false ) { return json_decode( $cached, true ); }

        $city_points = array(
            'istanbul' => array(
                array('name' => 'E-5 (Bakırköy) - Topkapı Yönü', 'lat' => 40.9867, 'lon' => 28.8508),
                array('name' => 'FSM Köprüsü - Avrupa Yakası Yönü', 'lat' => 41.0917, 'lon' => 29.0678),
                array('name' => 'D-100 (Kartal) - Kadıköy Yönü', 'lat' => 40.8922, 'lon' => 29.1967),
                array('name' => '15 Temmuz Köprüsü - Avrupa Yakası Yönü', 'lat' => 41.0458, 'lon' => 29.0342),
                array('name' => 'TEM (Seyrantepe) - Ankara Yönü', 'lat' => 41.1064, 'lon' => 28.9925),
                array('name' => 'Haliç Köprüsü - Mecidiyeköy Yönü', 'lat' => 41.0342, 'lon' => 28.9692),
            ),
            'ankara' => array(
                array('name' => 'Eskişehir Yolu', 'lat' => 39.9167, 'lon' => 32.7833),
                array('name' => 'Konya Yolu', 'lat' => 39.8833, 'lon' => 32.8667),
                array('name' => 'İstanbul Yolu', 'lat' => 39.9667, 'lon' => 32.6833),
                array('name' => 'Çankaya-Kızılay', 'lat' => 39.9272, 'lon' => 32.8644),
            ),
            'izmir' => array(
                array('name' => 'Altınyol', 'lat' => 38.4192, 'lon' => 27.1287),
                array('name' => 'Konak-Bornova', 'lat' => 38.4219, 'lon' => 27.1389),
                array('name' => 'Çeşme Otoyolu', 'lat' => 38.4331, 'lon' => 27.0892),
            ),
            'bursa' => array(
                array('name' => 'İstanbul Yolu', 'lat' => 40.2056, 'lon' => 28.9500),
                array('name' => 'Mudanya Yolu', 'lat' => 40.2667, 'lon' => 28.8667),
                array('name' => 'Yalova Yolu', 'lat' => 40.2333, 'lon' => 29.0167),
            ),
            'antalya' => array(
                array('name' => 'D-400 (Lara)', 'lat' => 36.8533, 'lon' => 30.7267),
                array('name' => 'Akdeniz Bulvarı', 'lat' => 36.8867, 'lon' => 30.6983),
                array('name' => 'Aspendos Bulvarı', 'lat' => 36.8950, 'lon' => 30.7117),
            ),
            'konya' => array(
                array('name' => 'Ankara Yolu', 'lat' => 37.9500, 'lon' => 32.4833),
                array('name' => 'Meram Çevreyolu', 'lat' => 37.8500, 'lon' => 32.4500),
                array('name' => 'Karaman Yolu', 'lat' => 37.8200, 'lon' => 32.5000),
            ),
            'adana' => array(
                array('name' => 'Turhan Cemal Beriker', 'lat' => 37.0017, 'lon' => 35.3289),
                array('name' => 'D-400 Mersin', 'lat' => 36.9850, 'lon' => 35.2900),
                array('name' => 'Tarsus Otoyolu', 'lat' => 36.9917, 'lon' => 35.3500),
            ),
            'sanliurfa' => array(
                array('name' => 'Diyarbakır Yolu', 'lat' => 37.1700, 'lon' => 38.8000),
                array('name' => 'Mardin Yolu', 'lat' => 37.1500, 'lon' => 38.8200),
            ),
            'gaziantep' => array(
                array('name' => 'İstasyon Caddesi', 'lat' => 37.0628, 'lon' => 37.3783),
                array('name' => 'Suburcu Kavşağı', 'lat' => 37.0567, 'lon' => 37.3650),
                array('name' => 'Adana Otoyolu', 'lat' => 37.0500, 'lon' => 37.4000),
            ),
            'kocaeli' => array(
                array('name' => 'TEM Köprüsü', 'lat' => 40.7658, 'lon' => 29.9308),
                array('name' => 'Gebze Çıkışı', 'lat' => 40.8028, 'lon' => 29.4308),
                array('name' => 'D-100 Merkez', 'lat' => 40.7650, 'lon' => 29.9200),
            ),
            'mersin' => array(
                array('name' => 'D-400 Merkez', 'lat' => 36.7950, 'lon' => 34.6200),
                array('name' => 'Tarsus Yolu', 'lat' => 36.8100, 'lon' => 34.6500),
            ),
            'diyarbakir' => array(
                array('name' => 'Elazığ Yolu', 'lat' => 37.9200, 'lon' => 40.2000),
                array('name' => 'Mardin Yolu', 'lat' => 37.8800, 'lon' => 40.2200),
            ),
            'hatay' => array(
                array('name' => 'Antakya Merkez', 'lat' => 36.2000, 'lon' => 36.1600),
                array('name' => 'İskenderun Yolu', 'lat' => 36.5800, 'lon' => 36.1700),
            ),
            'manisa' => array(
                array('name' => 'İzmir Yolu', 'lat' => 38.6200, 'lon' => 27.4000),
                array('name' => 'Merkez Kavşak', 'lat' => 38.6150, 'lon' => 27.4300),
            ),
            'kayseri' => array(
                array('name' => 'Sivas Yolu', 'lat' => 38.7500, 'lon' => 35.5000),
                array('name' => 'Erciyes Yolu', 'lat' => 38.7200, 'lon' => 35.4500),
            ),
            'samsun' => array(
                array('name' => 'Sahil Yolu', 'lat' => 41.2900, 'lon' => 36.3300),
                array('name' => 'Ankara Yolu', 'lat' => 41.2700, 'lon' => 36.3500),
            ),
            'balikesir' => array(
                array('name' => 'Bursa Yolu', 'lat' => 39.6500, 'lon' => 27.9000),
                array('name' => 'İzmir Yolu', 'lat' => 39.6400, 'lon' => 27.8500),
            ),
            'tekirdag' => array(
                array('name' => 'İstanbul Yolu', 'lat' => 41.0000, 'lon' => 27.5500),
                array('name' => 'Çorlu Kavşağı', 'lat' => 41.1500, 'lon' => 27.8000),
            ),
            'aydin' => array(
                array('name' => 'İzmir Yolu', 'lat' => 37.8500, 'lon' => 27.8200),
                array('name' => 'Denizli Yolu', 'lat' => 37.8400, 'lon' => 27.8600),
            ),
            'van' => array(
                array('name' => 'Erciş Yolu', 'lat' => 38.5200, 'lon' => 43.3500),
                array('name' => 'İran Sınırı Yolu', 'lat' => 38.5000, 'lon' => 43.4500),
            ),
            'kahramanmaras' => array(
                array('name' => 'Gaziantep Yolu', 'lat' => 37.5800, 'lon' => 36.9300),
                array('name' => 'Adana Yolu', 'lat' => 37.5600, 'lon' => 36.9500),
            ),
            'sakarya' => array(
                array('name' => 'TEM Otoyolu', 'lat' => 40.7400, 'lon' => 30.3500),
                array('name' => 'İstanbul Yolu', 'lat' => 40.7500, 'lon' => 30.4000),
            ),
            'mugla' => array(
                array('name' => 'Bodrum Yolu', 'lat' => 37.2100, 'lon' => 28.3500),
                array('name' => 'Fethiye Yolu', 'lat' => 37.2200, 'lon' => 28.3800),
            ),
            'denizli' => array(
                array('name' => 'İzmir Yolu', 'lat' => 37.7800, 'lon' => 29.0700),
                array('name' => 'Antalya Yolu', 'lat' => 37.7700, 'lon' => 29.1000),
            ),
            'eskisehir' => array(
                array('name' => 'Ankara Yolu', 'lat' => 39.7800, 'lon' => 30.5500),
                array('name' => 'Bursa Yolu', 'lat' => 39.7700, 'lon' => 30.5000),
            ),
            'alanya' => array(
                array('name' => 'D-400 Kaleiçi', 'lat' => 36.5437, 'lon' => 31.9994),
            ),
            'bodrum' => array(
                array('name' => 'Turgutreis Yolu', 'lat' => 37.0344, 'lon' => 27.4305),
            ),
            'marmaris' => array(
                array('name' => 'İçmeler Yolu', 'lat' => 36.8550, 'lon' => 28.2742),
            ),
            'fethiye' => array(
                array('name' => 'Ölüdeniz Yolu', 'lat' => 36.6538, 'lon' => 29.1236),
            ),
            'belek' => array(
                array('name' => 'Turizm Caddesi - Oteller Bölgesi', 'lat' => 36.8625, 'lon' => 31.0556),
                array('name' => 'Belek Caddesi - Merkez Yönü', 'lat' => 36.8640, 'lon' => 31.0490),
                array('name' => 'D-400 Serik-Belek Bağlantısı', 'lat' => 36.9150, 'lon' => 31.0620)
            ),
        );

        if ( ! isset( $city_points[$cityKey] ) ) {
            // Fix: Protect passed parameters from being overwritten by un-hydrated global arrays
            if ( empty( $lat ) || empty( $lon ) ) {
                $lat = isset($_GET['lat']) ? sanitize_text_field($_GET['lat']) : null;
                $lon = isset($_GET['lon']) ? sanitize_text_field($_GET['lon']) : null;
            }
            
            if ( ! $lat || ! $lon ) {
                return new WP_Error( 'invalid_city', 'Coordinates missing for fallback evaluation.', array( 'status' => 400 ) );
            }
            
            $flow_data = $this->fetch_tomtom_flow_direct( $lat, $lon );
            if ( is_wp_error( $flow_data ) ) { return $flow_data; }
            
            $api_key = get_option( 'tedder_tomtom_api_key' );
            if ( empty( $api_key ) ) { $api_key = 'qUlGJOObY34eaqSXZto9H0OVWfGYqhP5'; }
            
            // 30-Day Long-Term Transient Cache Split for Road Names to protect TomTom API volume bounds
            $lat_r = round((float) $lat, 3);
            $lon_r = round((float) $lon, 3);
            $road_cache_key = 'tedder_road_name_' . md5( $lat_r . '_' . $lon_r );
            $roadName = get_transient( $road_cache_key );
            
            if ( false === $roadName ) {
                $roadName = '';
                // Refinement: Enforce a 2km radius expander and filter exclusively by major corridors to snap onto national routes automatically
                $geocode_url = "https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?radius=2000&roadUse=LimitedAccess,Arterial&key=${api_key}";
                $geocode_response = wp_remote_get( $geocode_url, array( 'timeout' => 5 ) );
                
                if ( ! is_wp_error( $geocode_response ) ) {
                    $geocode_body = wp_remote_retrieve_body( $geocode_response );
                    $geocode_json = json_decode( $geocode_body, true );
                    if ( isset( $geocode_json['addresses'][0]['address']['streetName'] ) && ! empty( $geocode_json['addresses'][0]['address']['streetName'] ) ) {
                        $roadName = $geocode_json['addresses'][0]['address']['streetName'];
                    } elseif ( isset( $geocode_json['addresses'][0]['address']['freeformAddress'] ) && ! empty( $geocode_json['addresses'][0]['address']['freeformAddress'] ) ) {
                        $addressParts = explode(',', $geocode_json['addresses'][0]['address']['freeformAddress']);
                        $roadName = trim($addressParts[0]);
                    }
                }
                
                if ( empty( $roadName ) || $roadName === 'Bölgesel Yol Segmenti' ) {
                    $roadName = ucfirst($city) . ' Çevresi Ana Arter';
                }
                
                set_transient( $road_cache_key, $roadName, 30 * DAY_IN_SECONDS );
            }

            $speed = isset( $flow_data['flowSegmentData']['currentSpeed'] ) ? round($flow_data['flowSegmentData']['currentSpeed']) : 50;
            $freeFlow = isset( $flow_data['flowSegmentData']['freeFlowSpeed'] ) ? round($flow_data['flowSegmentData']['freeFlowSpeed']) : 50;
            $percent = $freeFlow > 0 ? max( 0, min( 100, round( ( 1 - ( $speed / $freeFlow ) ) * 100 ) ) ) : 0;
            $level = $percent > 50 ? 'severe' : ($percent > 35 ? 'high' : ($percent > 15 ? 'medium' : 'low'));
            $levelDescriptions = array('low' => 'akıcı', 'medium' => 'yoğun', 'high' => 'çok yoğun', 'severe' => 'kilitli');
            
            $compiled_data = array(
                'city'               => $city,
                'currentSpeed'       => $speed,
                'freeFlowSpeed'      => $freeFlow,
                'currentTravelTime'  => 0,
                'freeFlowTravelTime' => 0,
                'confidence'         => 0.9,
                'roadClosure'        => false,
                'congestionLevel'    => $level,
                'congestionPercent'  => (int)$percent,
                'mainRoutes'         => array(
                    array('name' => $roadName . ' (Canlı Akış)', 'delay' => $percent > 25 ? 4 : 0, 'status' => $percent > 40 ? 'congested' : 'normal')
                ),
                'narrative'          => ucfirst($city) . ' ve çevresinde rüzgar ve yol durumuna bağlı trafik akışı ' . $levelDescriptions[$level] . '.',
                'lastUpdated'        => time() * 1000
            );

            set_transient( $cache_key, json_encode( $compiled_data ), 300 );
            return $compiled_data;
        }

        $points = $city_points[$cityKey];
        $totalCurrentSpeed = 0;
        $totalFreeFlowSpeed = 0;
        $validPoints = 0;
        $mainRoutes = array();

        foreach ( $points as $point ) {
            $lat = $point['lat'];
            $lon = $point['lon'];
            $flow = $this->fetch_tomtom_flow_direct( $lat, $lon );

            if ( $flow && ! is_wp_error( $flow ) && isset( $flow['flowSegmentData'] ) ) {
                $data = $flow['flowSegmentData'];
                $validPoints++;
                $currentSpeed = isset( $data['currentSpeed'] ) ? $data['currentSpeed'] : 0;
                $freeFlowSpeed = isset( $data['freeFlowSpeed'] ) ? $data['freeFlowSpeed'] : 50;
                $currentTravelTime = isset( $data['currentTravelTime'] ) ? $data['currentTravelTime'] : 0;
                $freeFlowTravelTime = isset( $data['freeFlowTravelTime'] ) ? $data['freeFlowTravelTime'] : 0;

                $totalCurrentSpeed += $currentSpeed;
                $totalFreeFlowSpeed += $freeFlowSpeed;

                $delaySeconds = $currentTravelTime - $freeFlowTravelTime;
                $delayMinutes = max( 0, round( $delaySeconds / 60 ) );

                $speedRatio = $freeFlowSpeed > 0 ? $currentSpeed / $freeFlowSpeed : 1;
                $status = 'normal';
                if ( $speedRatio < 0.3 ) {
                    $status = 'congested';
                } elseif ( $speedRatio < 0.6 ) {
                    $status = 'slow';
                }

                $mainRoutes[] = array(
                    'name'   => $point['name'],
                    'delay'  => (int)$delayMinutes,
                    'status' => $status
                );
            }
        }

        if ( $validPoints === 0 ) {
            return new WP_Error( 'no_traffic_data', 'No valid traffic data could be fetched for this city', array( 'status' => 502 ) );
        }

        $avgCurrentSpeed = $totalCurrentSpeed / $validPoints;
        $avgFreeFlowSpeed = $totalFreeFlowSpeed / $validPoints;

        $speedRatio = $avgFreeFlowSpeed > 0 ? $avgCurrentSpeed / $avgFreeFlowSpeed : 1;
        $congestionPercent = round( ( 1 - $speedRatio ) * 100 );
        $congestionPercent = max( 0, min( 100, $congestionPercent ) );

        $congestionLevel = 'low';
        if ( $speedRatio >= 0.75 ) {
            $congestionLevel = 'low';
        } elseif ( $speedRatio >= 0.5 ) {
            $congestionLevel = 'medium';
        } elseif ( $speedRatio >= 0.25 ) {
            $congestionLevel = 'high';
        } else {
            $congestionLevel = 'severe';
        }

        // Sort routes by delay desc
        usort( $mainRoutes, function( $a, $b ) {
            return $b['delay'] - $a['delay'];
        });

        $levelDescriptions = array(
            'low'    => 'akıcı',
            'medium' => 'yoğun',
            'high'   => 'çok yoğun',
            'severe' => 'kilitli durumda'
        );
        
        $displayCity = ucfirst( $city );
        $narrative = $displayCity . ' trafiği ' . $levelDescriptions[$congestionLevel] . '.';
        if ( count( $mainRoutes ) > 0 && $mainRoutes[0]['delay'] > 5 ) {
            $narrative .= ' ' . $mainRoutes[0]['name'] . ' güzergahında ' . $mainRoutes[0]['delay'] . ' dakika gecikme var.';
        }
        
        $congestedCount = 0;
        foreach ( $mainRoutes as $r ) {
            if ( $r['status'] === 'congested' ) {
                $congestedCount++;
            }
        }
        if ( $congestedCount > 1 ) {
            $narrative .= ' ' . $congestedCount . ' ana güzergahta yoğunluk mevcut.';
        }

        $compiled_data = array(
            'city'               => $city,
            'currentSpeed'       => round( $avgCurrentSpeed ),
            'freeFlowSpeed'      => round( $avgFreeFlowSpeed ),
            'currentTravelTime'  => 0,
            'freeFlowTravelTime' => 0,
            'confidence'         => 0.9,
            'roadClosure'        => false,
            'congestionLevel'    => $congestionLevel,
            'congestionPercent'  => (int)$congestionPercent,
            'mainRoutes'         => array_slice( $mainRoutes, 0, 6 ),
            'narrative'          => $narrative,
            'lastUpdated'        => time() * 1000
        );

        // Cache the aggregated city data for 5 minutes (300 seconds)
        set_transient( $cache_key, json_encode( $compiled_data ), 300 );

        return $compiled_data;
    }



    /**


    /**
     * Proxy KeyCollect Finance
     */
    public function proxy_keycollect_finance( $request ) {
        $api_key = get_option( 'tedder_keycollect_api_key' );
        if ( empty( $api_key ) ) {
            // Graceful fallback if key is missing
            $response = new WP_REST_Response( array() );
            $response->set_status( 200 );
            return $response;
        }

        $cache_key = 'tedder_finance_ticker';
        $cached_data = get_transient( $cache_key );

        if ( false === $cached_data ) {
            // Proxying to standard CollectAPI economy endpoints for Altin, USD, Euro, BIST
            // Since CollectAPI splits endpoints, we fetch multiple or a unified one. 
            // The frontend map assumes an array of {symbol, price, change}
            
            // CollectAPI "allCurrency" Endpoint (Example implementation)
            $url = "https://api.collectapi.com/economy/allCurrency";
            $response = wp_remote_get( $url, array(
                'timeout' => 5,
                'headers' => array(
                    'authorization' => "apikey {$api_key}",
                    'content-type'  => 'application/json'
                )
            ));

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = wp_remote_retrieve_body( $response );
            $data = json_decode( $body, true );

            $formatted_data = array();

            // Format CollectAPI response into the expected standard if successful
            if ( isset( $data['success'] ) && $data['success'] == true && isset( $data['result'] ) ) {
                foreach ( $data['result'] as $item ) {
                    // Extract USD, EUR, GA, BIST, BTC if present
                    $code = strtoupper( $item['code'] ?? $item['name'] );
                    $formatted_data[] = array(
                        'symbol' => $item['name'],
                        'price'  => $item['buyingstr'] . ' ₺',
                        'change' => (float) $item['rate'],
                        'code'   => $code
                    );
                }
            }

            // High-velocity 2-minute cache per Dev Leader's instruction
            set_transient( $cache_key, json_encode($formatted_data), 2 * MINUTE_IN_SECONDS );
            $cached_data = json_encode($formatted_data);
        }

        $response = new WP_REST_Response( json_decode( $cached_data, true ) );
        $response->set_status( 200 );
        return $response;
    }

    /**
     * Proxy RainViewer Radar Configuration
     */
    public function proxy_rainviewer_radar( $request ) {
        $cache_key = 'tedder_radar_maps';
        $cached_data = get_transient( $cache_key );

        if ( false === $cached_data ) {
            $url = "https://api.rainviewer.com/public/weather-maps.json";
            $response = wp_remote_get( $url, array( 'timeout' => 5 ) );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = wp_remote_retrieve_body( $response );
            $data = json_decode( $body, true );
            
            if ( isset( $data['host'] ) ) {
                set_transient( $cache_key, $body, 5 * MINUTE_IN_SECONDS );
                $cached_data = $body;
            } else {
                return new WP_Error( 'radar_error', 'Invalid response from RainViewer API', array( 'status' => 502 ) );
            }
        }

        $response = new WP_REST_Response( json_decode( $cached_data, true ) );
        $response->set_status( 200 );
        return $response;
    }

    public function proxy_openmeteo_geocode( $request ) {
        $query = sanitize_text_field( $request->get_param( 'q' ) );
        if ( empty( $query ) || strlen( $query ) < 2 ) {
            return new WP_Error( 'missing_query', 'Query string parameter required', array( 'status' => 400 ) );
        }

        // Deterministic Key Optimization via MD5 to protect database character integrity bounds
        $cache_key = 'tg_search_' . md5( strtolower( trim( $query ) ) );
        $cached = get_transient( $cache_key );

        if ( false === $cached ) {
            $url = "https://geocoding-api.open-meteo.com/v1/search?name=" . urlencode( $query ) . "&count=10&language=tr&format=json";
            $response = wp_remote_get( $url, array( 'timeout' => 8 ) );
            if ( is_wp_error( $response ) ) { return $response; }

            $body = wp_remote_retrieve_body( $response );
            set_transient( $cache_key, $body, 30 * DAY_IN_SECONDS );
            $cached = $body;
        }

        // De-serialize array to prevent runtime double-JSON escape quote string encoding breaks
        $response = new WP_REST_Response( json_decode( $cached, true ) );
        $response->set_status( 200 );
        return $response;
    }
}

new TedderAPIProxy();
