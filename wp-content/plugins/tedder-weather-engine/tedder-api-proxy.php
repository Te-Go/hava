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

    private function handle_tomtom_city_request( $city, $passed_lat = null, $passed_lon = null ) {
        // Force explicit local scoping to prevent multi-request variable cross-contamination
        $lat = !empty($passed_lat) ? sanitize_text_field($passed_lat) : (isset($_GET['lat']) ? sanitize_text_field($_GET['lat']) : null);
        $lon = !empty($passed_lon) ? sanitize_text_field($passed_lon) : (isset($_GET['lon']) ? sanitize_text_field($_GET['lon']) : null);
        $roadName = '';
        $resolvedLocationName = '';
        $cityKey = strtolower( sanitize_text_field( trim( $city ) ) );
        
        $cityKey = str_replace(
            array('ı', 'ş', 'ğ', 'ü', 'ö', 'ç', 'İ', 'Ş', 'Ğ', 'Ü', 'Ö', 'Ç'),
            array('i', 's', 'g', 'u', 'o', 'c', 'i', 's', 'g', 'u', 'o', 'c'),
            $cityKey
        );

        if ( empty( $lat ) || empty( $lon ) ) {
            $city_points = array(
                'istanbul' => array('lat' => 41.0082, 'lon' => 28.9784),
                'ankara'   => array('lat' => 39.9334, 'lon' => 32.8597),
                'antalya'  => array('lat' => 36.8841, 'lon' => 30.7056),
                'izmir'    => array('lat' => 38.4237, 'lon' => 27.1428),
                'bursa'    => array('lat' => 40.1825, 'lon' => 29.0625)
            );
            if ( isset( $city_points[$cityKey] ) ) {
                $lat = $city_points[$cityKey]['lat'];
                $lon = $city_points[$cityKey]['lon'];
            }
        }

        if ( ! $lat || ! $lon ) {
            return new WP_Error( 'invalid_coords', 'State hydration parameter tracking mismatch.', array( 'status' => 400 ) );
        }

        $lat_r = round((float) $lat, 3);
        $lon_r = round((float) $lon, 3);
        $coord_hash = md5( $lat_r . '_' . $lon_r );
        
        $flow_cache_key = 'tg_flow_v9_' . $coord_hash;
        $road_cache_key = 'tg_road_v9_' . $coord_hash;

        $cached_flow = get_transient( $flow_cache_key );
        if ( false !== $cached_flow ) {
            return json_decode( $cached_flow, true );
        }

        $flow_data = $this->fetch_tomtom_flow_direct( $lat, $lon );
        if ( is_wp_error( $flow_data ) ) { return $flow_data; }

        $api_key = get_option( 'tedder_tomtom_api_key' );
        if ( empty( $api_key ) ) { $api_key = 'qUlGJOObY34eaqSXZto9H0OVWfGYqhP5'; }

        $stored_road_data = get_transient( $road_cache_key );
        if ( false === $stored_road_data ) {
            $geocode_lat = isset($flow_data['flowSegmentData']['coordinates']['coordinate'][0]['latitude']) ? $flow_data['flowSegmentData']['coordinates']['coordinate'][0]['latitude'] : $lat;
            $geocode_lon = isset($flow_data['flowSegmentData']['coordinates']['coordinate'][0]['longitude']) ? $flow_data['flowSegmentData']['coordinates']['coordinate'][0]['longitude'] : $lon;

            $geocode_url = "https://api.tomtom.com/search/2/reverseGeocode/${geocode_lat},${geocode_lon}.json?radius=1000&key=${api_key}";
            $geocode_response = wp_remote_get( $geocode_url, array( 'timeout' => 5 ) );

            if ( ! is_wp_error( $geocode_response ) ) {
                $geocode_body = wp_remote_retrieve_body( $geocode_response );
                $geocode_json = json_decode( $geocode_body, true );
                $addr = isset( $geocode_json['addresses'][0]['address'] ) ? $geocode_json['addresses'][0]['address'] : null;
                if ( $addr ) {
                    $roadName = !empty($addr['streetName']) ? $addr['streetName'] : (!empty($addr['freeformAddress']) ? trim(explode(',', $addr['freeformAddress'])[0]) : '');
                    $resolvedLocationName = !empty($addr['neighbourhood']) ? $addr['neighbourhood'] : (!empty($addr['municipality']) ? $addr['municipality'] : '');
                }
            }

            $cleanCityName = ucfirst(sanitize_text_field(trim($city)));
            if ( empty( $roadName ) || $roadName === 'Bölgesel Yol Segmenti' || preg_match('/^\d+$/', $roadName) ) {
                $roadName = (!empty($resolvedLocationName) && strpos($cleanCityName, 'Konum') !== false) ? $resolvedLocationName : $cleanCityName;
                $roadName = $roadName . ' Giriş Arteri';
            }
            
            $road_payload = array( 'road' => $roadName, 'loc' => $resolvedLocationName );
            set_transient( $road_cache_key, json_encode( $road_payload ), 30 * DAY_IN_SECONDS );
        } else {
            $road_payload = json_decode( $stored_road_data, true );
            $roadName = $road_payload['road'];
            $resolvedLocationName = $road_payload['loc'];
        }

        $displayTitle = $city;
        if ( (preg_match('/[0-9]/', $city) || strpos(strtolower($city), 'konum') !== false) && !empty($resolvedLocationName) ) {
            $displayTitle = $resolvedLocationName;
        }

        $speed = isset( $flow_data['flowSegmentData']['currentSpeed'] ) ? round($flow_data['flowSegmentData']['currentSpeed']) : 50;
        $freeFlow = isset( $flow_data['flowSegmentData']['freeFlowSpeed'] ) ? round($flow_data['flowSegmentData']['freeFlowSpeed']) : 50;
        $percent = $freeFlow > 0 ? max( 0, min( 100, round( ( 1 - ( $speed / $freeFlow ) ) * 100 ) ) ) : 0;
        $level = $percent > 50 ? 'severe' : ($percent > 35 ? 'high' : ($percent > 15 ? 'medium' : 'low'));
        $levelDescriptions = array('low' => 'akıcı', 'medium' => 'yoğun', 'high' => 'çok yoğun', 'severe' => 'kilitli');

        $compiled_data = array(
            'city'               => ucfirst(sanitize_text_field(trim($displayTitle))),
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
            'narrative'          => ucfirst(trim($displayTitle)) . ' ve çevresinde anlık yol durumuna bağlı trafik akışı ' . $levelDescriptions[$level] . '.',
            'lastUpdated'        => time() * 1000
        );

        set_transient( $flow_cache_key, json_encode( $compiled_data ), 300 );
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
