<?php
/**
 * Weather Commentary Generator for WordPress
 * 
 * Generates MSN-style Turkish weather commentary for SEO optimization.
 * This PHP implementation mirrors the TypeScript version for server-side rendering.
 * 
 * @package HavaDurumlari
 * @version 1.0.0
 * @see weather-commentary-spec.yaml for full specification
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// ============================================================================
// CITY FLAVORS (Anti-Duplication) - 15 Major Turkish Provinces
// ============================================================================

define('WEATHER_CITY_FLAVORS', [
    // 1. İstanbul (Plate 34) - Population: 16.2M
    'istanbul' => [
        'wind' => "Boğaz'da rüzgar daha belirgin olabilir.",
        'humidity' => "Marmara'dan gelen nemli hava etkili.",
        'temperature' => "Avrupa ve Anadolu yakası arasında fark olabilir.",
        'rain' => "Trakya'dan gelen yağış sistemleri etkili."
    ],
    // 2. Ankara (Plate 6) - Population: 5.5M
    'ankara' => [
        'wind' => "Bozkır rüzgarları sert esebilir.",
        'temperature' => "Gece-gündüz farkı yüksek, dikkatli olun.",
        'humidity' => "İç Anadolu'nun kuru havası hakim.",
        'snow' => "Kış aylarında kar yağışı etkili olabilir."
    ],
    // 3. İzmir (Plate 35) - Population: 3.2M
    'izmir' => [
        'humidity' => "Ege'nin nemli havası hissedilir.",
        'temperature' => "Kıyı serinliği etkili.",
        'wind' => "İmbat rüzgarı öğleden sonra başlayabilir.",
        'uv' => "Sahil kesimlerinde UV daha yüksek."
    ],
    // 4. Bursa (Plate 16) - Population: 2.1M
    'bursa' => [
        'temperature' => "Uludağ etekleri şehir merkezinden serin.",
        'snow' => "Kış aylarında Uludağ'da kar etkili.",
        'humidity' => "Marmara'dan gelen nem hissedilir."
    ],
    // 5. Antalya (Plate 7) - Population: 1.4M
    'antalya' => [
        'temperature' => "Akdeniz iklimi ile mülayim hava.",
        'uv' => "Sahil UV değerleri şehir merkezinden yüksek.",
        'humidity' => "Deniz etkisiyle nemli.",
        'rain' => "Kış yağışları yoğun olabilir."
    ],
    // 6. Adana (Plate 1) - Population: 1.9M
    'adana' => [
        'temperature' => "Çukurova'nın sıcak iklimi hakim.",
        'humidity' => "Akdeniz'den gelen nem bunaltıcı olabilir.",
        'uv' => "Yaz aylarında UV oldukça yüksek.",
        'rain' => "Sonbahar yağışları şiddetli olabilir."
    ],
    // 7. Konya (Plate 42) - Population: 1.5M
    'konya' => [
        'temperature' => "Bozkır iklimi ile sert sıcaklık değişimleri.",
        'wind' => "Düz arazide rüzgar etkili.",
        'humidity' => "Kuru hava hakim, cilt bakımına dikkat.",
        'snow' => "Kış aylarında yoğun kar olabilir."
    ],
    // 8. Gaziantep (Plate 27) - Population: 1.9M
    'gaziantep' => [
        'temperature' => "Güneydoğu'nun karasal iklimi etkili.",
        'humidity' => "Yaz aylarında kuru ve sıcak.",
        'wind' => "Kuzeyden gelen rüzgarlar serinletici.",
        'rain' => "Bahar yağışları fıstık üretimi için önemli."
    ],
    // 9. Mersin (Plate 33) - Population: 1.1M
    'mersin' => [
        'temperature' => "Akdeniz kıyısı ılıman iklim.",
        'humidity' => "Deniz etkisiyle nemli hava.",
        'uv' => "Sahilde güneş koruma şart.",
        'rain' => "Kış yağışları düzenli."
    ],
    // 10. Kocaeli (Plate 41) - Population: 2.0M
    'kocaeli' => [
        'humidity' => "Marmara geçişi nemli hava getirir.",
        'wind' => "Körfez rüzgarları etkili olabilir.",
        'rain' => "Marmara yağış kuşağında bol yağış.",
        'temperature' => "Sanayi bölgesi şehir merkezinden sıcak."
    ],
    // 11. Diyarbakır (Plate 21) - Population: 1.1M
    'diyarbakir' => [
        'temperature' => "Yaz aylarında 40°'ı aşan sıcaklıklar.",
        'humidity' => "Kuru ve sıcak yaz iklimi.",
        'wind' => "Güneşten korunma şart.",
        'snow' => "Kış aylarında kar yağabilir."
    ],
    // 12. Samsun (Plate 55) - Population: 0.7M
    'samsun' => [
        'humidity' => "Karadeniz'in nemli havası baskın.",
        'rain' => "Yıl boyunca yağış alabilen iklimiyle dikkat.",
        'temperature' => "Karadeniz serinliği hissedilir.",
        'wind' => "Poyraz etkili olabilir."
    ],
    // 13. Kayseri (Plate 38) - Population: 1.0M
    'kayseri' => [
        'temperature' => "Yüksek rakım nedeniyle serin geceler.",
        'snow' => "Erciyes'te kış sporları için ideal.",
        'wind' => "Bozkırdan gelen rüzgarlar sert.",
        'humidity' => "İç Anadolu'nun kuru havası hakim."
    ],
    // 14. Eskişehir (Plate 26) - Population: 0.9M
    'eskisehir' => [
        'temperature' => "Karasal iklim ile belirgin mevsim farkları.",
        'wind' => "Açık arazide rüzgar hissedilir.",
        'snow' => "Kış aylarında kar sürprizi olabilir.",
        'humidity' => "Orta nem seviyeleri."
    ],
    // 15. Trabzon (Plate 61) - Population: 0.8M
    'trabzon' => [
        'humidity' => "Karadeniz nemliliği yüksek.",
        'rain' => "Yıl boyunca yağış ihtimali var.",
        'temperature' => "Yaz ayları bile serindir.",
        'wind' => "Denizden gelen esintiler etkili."
    ]
]);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize city name for flavor lookup
 */
function weather_normalize_city($city) {
    $replacements = [
        'ı' => 'i', 'İ' => 'i',
        'ş' => 's', 'Ş' => 's',
        'ğ' => 'g', 'Ğ' => 'g',
        'ü' => 'u', 'Ü' => 'u',
        'ö' => 'o', 'Ö' => 'o',
        'ç' => 'c', 'Ç' => 'c'
    ];
    return strtolower(strtr($city, $replacements));
}

/**
 * Get city flavor text if available
 */
function weather_get_city_flavor($city, $metric) {
    $normalized = weather_normalize_city($city);
    $flavors = WEATHER_CITY_FLAVORS;
    
    if (isset($flavors[$normalized][$metric])) {
        return $flavors[$normalized][$metric];
    }
    return null;
}

/**
 * Get wind direction label from degrees
 */
function weather_get_wind_direction($degrees) {
    if (!is_numeric($degrees)) return $degrees;
    
    $num = floatval($degrees);
    if ($num >= 337.5 || $num < 22.5) return 'Kuzey';
    if ($num >= 22.5 && $num < 67.5) return 'Kuzeydoğu';
    if ($num >= 67.5 && $num < 112.5) return 'Doğu';
    if ($num >= 112.5 && $num < 157.5) return 'Güneydoğu';
    if ($num >= 157.5 && $num < 202.5) return 'Güney';
    if ($num >= 202.5 && $num < 247.5) return 'Güneybatı';
    if ($num >= 247.5 && $num < 292.5) return 'Batı';
    if ($num >= 292.5 && $num < 337.5) return 'Kuzeybatı';
    return 'Kuzey';
}

/**
 * Deterministic template selection (same city + day = same template)
 */
function weather_select_template($templates, $city, $day_of_year = null) {
    if ($day_of_year === null) {
        $day_of_year = date('z'); // 0-365
    }
    $seed = strlen($city) + $day_of_year;
    $index = $seed % count($templates);
    return $templates[$index];
}

/**
 * Get day of year
 */
function weather_get_day_of_year() {
    return intval(date('z'));
}

// ============================================================================
// METRIC COMMENTARY GENERATORS
// ============================================================================

/**
 * Generate temperature commentary
 */
function weather_generate_sicaklik($data, $timeframe, $city) {
    $current = isset($data['currentTemp']) ? round($data['currentTemp']) : 0;
    $today_high = isset($data['high']) ? round($data['high']) : $current;
    $today_low = isset($data['low']) ? round($data['low']) : $current;
    $tomorrow = isset($data['daily'][1]) ? $data['daily'][1] : null;
    $tomorrow_high = $tomorrow ? round($tomorrow['high']) : $today_high;
    $tomorrow_low = $tomorrow ? round($tomorrow['low']) : $today_low;
    $diff = $tomorrow_high - $today_high;
    $day_of_year = weather_get_day_of_year();
    
    $status = 'Sabit';
    $status_color = 'blue';
    $description = '';
    
    // Determine condition
    if ($current >= 30) {
        $status = 'Sıcak';
        $status_color = 'orange';
        if ($timeframe === 'today') {
            $description = "Sıcak bir gün! {$current}° ile bunaltıcı hava. Bol su için.";
        } elseif ($timeframe === 'tomorrow' && $tomorrow) {
            $templates = [
                "Yarın {$city}'da kavurucu sıcak: {$tomorrow_high}°! Gölgede kalın, bol sıvı tüketin.",
                "{$city} yarın sıcak dalgası altında: {$tomorrow_high}°. Öğle saatlerinde dışarı çıkmayın."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } elseif ($current <= 5) {
        $status = 'Soğuk';
        $status_color = 'blue';
        if ($timeframe === 'today') {
            $description = "Soğuk bir gün! {$current}° ile don riski. Kalın giyinin.";
        } elseif ($timeframe === 'tomorrow' && $tomorrow) {
            $templates = [
                "Yarın {$city}'da soğuk: {$tomorrow_high}°. Kış kıyafetlerinizi hazırlayın.",
                "{$city} yarın için don uyarısı olabilir. En düşük {$tomorrow_low}°."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } elseif ($diff >= 2) {
        $status = 'Yükseliyor';
        $status_color = 'orange';
        if ($timeframe === 'today') {
            $description = "Şu anda {$current}°. Yarın {$diff}° daha sıcak olacak.";
        } elseif ($timeframe === 'tomorrow' && $tomorrow) {
            $templates = [
                "Yarın {$city}'da sıcaklık artıyor: {$tomorrow_high}°, bugünden {$diff}° yüksek.",
                "{$city} yarın daha sıcak! En yüksek {$tomorrow_high}°, bugün {$today_high}° idi.",
                "Yarın için {$city} tahmini: Isınma var, {$tomorrow_high}°'ye çıkacak.",
                "{$city} yarın {$tomorrow_high}° görecek. Bugüne göre belirgin sıcaklık artışı."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } elseif ($diff <= -2) {
        $status = 'Düşüyor';
        $status_color = 'blue';
        $abs_diff = abs($diff);
        if ($timeframe === 'today') {
            $description = "Şu anda {$current}°. Yarın {$abs_diff}° daha serin olacak.";
        } elseif ($timeframe === 'tomorrow' && $tomorrow) {
            $templates = [
                "Yarın {$city}'da sıcaklık düşüyor: {$tomorrow_high}°, bugünden {$abs_diff}° düşük.",
                "{$city} yarın serinliyor! En yüksek {$tomorrow_high}°, bugün {$today_high}° idi.",
                "Yarın için {$city} tahmini: Düşüş var, {$tomorrow_high}°'de kalacak.",
                "{$city} yarın daha serin: {$tomorrow_high}°. Üzerinize bir şeyler alın."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } else {
        $status = 'Sabit';
        $status_color = 'gray';
        if ($timeframe === 'today') {
            $templates = [
                "Şu anda {$current}°. Sıcaklık gün boyunca sabit kalacak.",
                "{$current}° ile dengeli bir gün. Önemli değişiklik beklenmiyor."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        } elseif ($timeframe === 'tomorrow' && $tomorrow) {
            $templates = [
                "Yarın {$city} için sıcaklık bugünle aynı seviyede: {$tomorrow_high}°/{$tomorrow_low}°.",
                "Yarın {$city}'da sıcaklık değişimi beklenmiyor. En yüksek {$tomorrow_high}°.",
                "{$city} yarın için tahmin: Bugünkü {$today_high}° seviyesi korunacak."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    }
    
    // Add city flavor
    $flavor = weather_get_city_flavor($city, 'temperature');
    if ($flavor && mt_rand(0, 1) === 1) {
        $description .= ' ' . $flavor;
    }
    
    return [
        'id' => 'sicaklik',
        'label' => 'Sıcaklık',
        'value' => ($timeframe === 'tomorrow' && $tomorrow) ? $tomorrow_high : $current,
        'unit' => '°C',
        'status' => $status,
        'status_color' => $status_color,
        'description' => $description,
        'icon' => 'thermometer'
    ];
}

/**
 * Generate rain/precipitation commentary
 */
function weather_generate_yagis($data, $timeframe, $city) {
    $prob = isset($data['rainProb']) ? $data['rainProb'] : 0;
    $volume = isset($data['rainVolume']) ? $data['rainVolume'] : 0;
    $tomorrow = isset($data['daily'][1]) ? $data['daily'][1] : null;
    $tomorrow_prob = $tomorrow ? $tomorrow['rainProb'] : 0;
    $day_of_year = weather_get_day_of_year();
    
    $target_prob = ($timeframe === 'tomorrow') ? $tomorrow_prob : $prob;
    
    $status = 'Yağış Yok';
    $status_color = 'green';
    $description = '';
    
    if ($target_prob < 20) {
        $status = 'Yağış Yok';
        $status_color = 'green';
        if ($timeframe === 'today') {
            $description = "Yağış beklenmiyor ({$prob}%). Şemsiyeye gerek yok.";
        } elseif ($timeframe === 'tomorrow') {
            $templates = [
                "Yarın {$city}'da yağış yok. {$tomorrow_prob}% olasılıkla kuru geçecek.",
                "{$city} yarın için yağmur beklenmiyor. Dış mekan planlarınızı rahatça yapabilirsiniz."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } elseif ($target_prob >= 20 && $target_prob < 50) {
        $status = 'Olası';
        $status_color = 'yellow';
        if ($timeframe === 'today') {
            $description = "Hafif yağış ihtimali ({$prob}%). Şemsiye yanınızda olsun.";
        } elseif ($timeframe === 'tomorrow') {
            $templates = [
                "Yarın {$city}'da yağış ihtimali var ({$tomorrow_prob}%). Şemsiyenizi alın.",
                "{$city} yarın için belirsiz tahmin: {$tomorrow_prob}% yağış olasılığı."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } elseif ($target_prob >= 50 && $target_prob < 80) {
        $status = 'Muhtemel';
        $status_color = 'orange';
        if ($timeframe === 'today') {
            $description = "Yağış muhtemel ({$prob}%). {$volume} mm bekleniyor.";
        } elseif ($timeframe === 'tomorrow') {
            $templates = [
                "Yarın {$city}'da yağış muhtemel: {$tomorrow_prob}% olasılık.",
                "{$city} yarın için yağmur tahmini. Şemsiyesiz çıkmayın."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } else {
        $status = 'Kesin';
        $status_color = 'blue';
        if ($timeframe === 'today') {
            $description = "Yağış kesin ({$prob}%). {$volume} mm yağış bekleniyor.";
        } elseif ($timeframe === 'tomorrow') {
            $templates = [
                "Yarın {$city}'da kesin yağış: {$tomorrow_prob}% olasılık.",
                "{$city} yarın yağmurlu! Dışarı çıkmadan önce yağmurluk veya şemsiye alın.",
                "Yarın için {$city} tahmini: Yoğun yağış. Dış mekan planlarını erteleyin."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    }
    
    return [
        'id' => 'yagis',
        'label' => 'Yağış',
        'value' => $volume,
        'unit' => 'mm',
        'status' => $status,
        'status_color' => $status_color,
        'description' => $description,
        'icon' => 'cloud-rain'
    ];
}

/**
 * Generate wind commentary
 */
function weather_generate_ruzgar($data, $timeframe, $city) {
    $speed = isset($data['windSpeed']) ? round($data['windSpeed']) : 0;
    $direction = isset($data['windDirection']) ? weather_get_wind_direction($data['windDirection']) : 'Kuzey';
    $day_of_year = weather_get_day_of_year();
    
    $status = 'Sakin';
    $status_color = 'green';
    $description = '';
    
    if ($speed < 10) {
        $status = 'Sakin';
        $status_color = 'green';
        if ($timeframe === 'today') {
            $description = "Rüzgar sakin ({$speed} km/sa). Çok hafif esinti.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da rüzgar sakin. Açık hava aktiviteleri için ideal.";
        }
    } elseif ($speed >= 10 && $speed < 20) {
        $status = 'Hafif';
        $status_color = 'green';
        if ($timeframe === 'today') {
            $description = "Hafif rüzgar ({$speed} km/sa). {$direction} yönünden.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da hafif rüzgar, {$direction} yönünden.";
        }
    } elseif ($speed >= 20 && $speed < 40) {
        $status = 'Orta';
        $status_color = 'yellow';
        if ($timeframe === 'today') {
            $description = "Orta şiddette rüzgar ({$speed} km/sa). {$direction}'den esiyor.";
        } elseif ($timeframe === 'tomorrow') {
            $templates = [
                "Yarın {$city}'da orta şiddette rüzgar bekleniyor.",
                "{$city} yarın rüzgarlı. Şapka ve hafif eşyalara dikkat."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } elseif ($speed >= 40 && $speed < 60) {
        $status = 'Kuvvetli';
        $status_color = 'orange';
        if ($timeframe === 'today') {
            $description = "Kuvvetli rüzgar! {$speed} km/sa. Dikkatli olun.";
        } elseif ($timeframe === 'tomorrow') {
            $templates = [
                "Yarın {$city}'da kuvvetli rüzgar uyarısı: {$speed} km/sa.",
                "{$city} yarın için dikkat: Kuvvetli rüzgar bekleniyor. Balkondaki eşyaları alın."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } else {
        $status = 'Fırtına';
        $status_color = 'red';
        if ($timeframe === 'today') {
            $description = "Fırtına uyarısı! {$speed} km/sa rüzgar. Zorunlu olmadıkça dışarı çıkmayın.";
        } elseif ($timeframe === 'tomorrow') {
            $templates = [
                "Yarın {$city}'da fırtına bekleniyor: {$speed} km/sa. Önlem alın!",
                "{$city} yarın için meteorolojik uyarı: Fırtına riski. Dışarı çıkmaktan kaçının."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    }
    
    // Add city flavor
    $flavor = weather_get_city_flavor($city, 'wind');
    if ($flavor && $speed >= 15) {
        $description .= ' ' . $flavor;
    }
    
    return [
        'id' => 'ruzgar',
        'label' => 'Rüzgar',
        'value' => $speed,
        'unit' => 'km/sa',
        'status' => $status,
        'status_color' => $status_color,
        'description' => $description,
        'icon' => 'wind'
    ];
}

/**
 * Generate humidity commentary
 */
function weather_generate_nem($data, $timeframe, $city) {
    $humidity = isset($data['humidity']) ? round($data['humidity']) : 50;
    $day_of_year = weather_get_day_of_year();
    
    $status = 'Normal';
    $status_color = 'green';
    $description = '';
    
    if ($humidity < 30) {
        $status = 'Kuru';
        $status_color = 'yellow';
        if ($timeframe === 'today') {
            $description = "Kuru hava ({$humidity}%). Cilt bakımına dikkat, nemlendirici kullanın.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da hava kuru kalacak. Cilt kuruluğuna karşı önlem alın.";
        }
    } elseif ($humidity >= 30 && $humidity <= 60) {
        $status = 'Normal';
        $status_color = 'green';
        if ($timeframe === 'today') {
            $description = "Nem seviyesi konforlu ({$humidity}%). İdeal hava.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da nem seviyeleri normal: {$humidity}%. Konforlu bir gün.";
        }
    } elseif ($humidity > 60 && $humidity <= 80) {
        $status = 'Nemli';
        $status_color = 'yellow';
        if ($timeframe === 'today') {
            $description = "Nemli hava ({$humidity}%). Biraz bunaltıcı olabilir.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da nemli hava: {$humidity}%. Terleme artabilir.";
        }
    } else {
        $status = 'Çok Nemli';
        $status_color = 'orange';
        if ($timeframe === 'today') {
            $description = "Çok nemli ({$humidity}%)! Bunaltıcı sıcak hissi yaratabilir.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da çok yüksek nem: {$humidity}%. Rahatsızlık verebilir.";
        }
    }
    
    return [
        'id' => 'nem',
        'label' => 'Nem',
        'value' => $humidity,
        'unit' => '%',
        'status' => $status,
        'status_color' => $status_color,
        'description' => $description,
        'icon' => 'droplets'
    ];
}

/**
 * Generate UV commentary
 */
function weather_generate_uv($data, $timeframe, $city) {
    $uv = isset($data['uvIndex']) ? round($data['uvIndex']) : 0;
    $tomorrow = isset($data['daily'][1]) ? $data['daily'][1] : null;
    $tomorrow_uv = $tomorrow && isset($tomorrow['uvIndex']) ? round($tomorrow['uvIndex']) : $uv;
    $day_of_year = weather_get_day_of_year();
    
    $target_uv = ($timeframe === 'tomorrow') ? $tomorrow_uv : $uv;
    
    $status = 'Düşük';
    $status_color = 'green';
    $description = '';
    
    if ($target_uv <= 2) {
        $status = 'Düşük';
        $status_color = 'green';
        if ($timeframe === 'today') {
            $description = "UV düşük ({$uv}). Koruma opsiyonel.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da UV düşük: {$tomorrow_uv}. Güneş kremi isteğe bağlı.";
        }
    } elseif ($target_uv > 2 && $target_uv <= 5) {
        $status = 'Orta';
        $status_color = 'yellow';
        if ($timeframe === 'today') {
            $description = "UV orta ({$uv}). SPF 30+ güneş kremi önerilir.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da UV orta seviyede: {$tomorrow_uv}. Güneş kremi sürün.";
        }
    } elseif ($target_uv > 5 && $target_uv <= 7) {
        $status = 'Yüksek';
        $status_color = 'orange';
        if ($timeframe === 'today') {
            $description = "Yüksek UV ({$uv})! Yanma süresi ~20dk. Şapka ve güneş kremi şart.";
        } elseif ($timeframe === 'tomorrow') {
            $templates = [
                "Yarın {$city}'da yüksek UV: {$tomorrow_uv}. Korumasız güneşe çıkmayın.",
                "{$city} yarın için UV uyarısı: {$tomorrow_uv} indeks. Güneş gözlüğü ve SPF50+ kullanın."
            ];
            $description = weather_select_template($templates, $city, $day_of_year);
        }
    } elseif ($target_uv > 7 && $target_uv <= 10) {
        $status = 'Çok Yüksek';
        $status_color = 'red';
        if ($timeframe === 'today') {
            $description = "Çok yüksek UV ({$uv})! Yanma süresi ~15dk. 11-16 arası güneşten kaçının.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da çok yüksek UV: {$tomorrow_uv}. Öğle saatlerinde dışarı çıkmayın.";
        }
    } else {
        $status = 'Aşırı';
        $status_color = 'purple';
        if ($timeframe === 'today') {
            $description = "Aşırı UV ({$uv})! Yanma süresi ~10dk. Mümkünse evde kalın.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da aşırı UV: {$tomorrow_uv}. Zorunlu olmadıkça dışarı çıkmayın.";
        }
    }
    
    return [
        'id' => 'uv',
        'label' => 'UV',
        'value' => $target_uv,
        'unit' => '',
        'status' => $status,
        'status_color' => $status_color,
        'description' => $description,
        'icon' => 'sun'
    ];
}

/**
 * Generate AQI commentary
 */
function weather_generate_hki($data, $timeframe, $city) {
    $aqi = isset($data['aqi']) ? round($data['aqi']) : 40;
    
    $status = 'İyi';
    $status_color = 'green';
    $description = '';
    
    if ($aqi <= 50) {
        $status = 'İyi';
        $status_color = 'green';
        if ($timeframe === 'today') {
            $description = "Hava kalitesi iyi (AQI: {$aqi}). Dışarıda vakit geçirmek için ideal.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da hava kalitesi iyi olacak. Dış mekan aktiviteleri için uygun.";
        }
    } elseif ($aqi > 50 && $aqi <= 100) {
        $status = 'Orta';
        $status_color = 'yellow';
        if ($timeframe === 'today') {
            $description = "Hava kalitesi orta (AQI: {$aqi}). Hassas gruplar dikkatli olsun.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da hava kalitesi orta. Astımlılar dikkat etsin.";
        }
    } elseif ($aqi > 100 && $aqi <= 150) {
        $status = 'Hassas Gruplar';
        $status_color = 'orange';
        if ($timeframe === 'today') {
            $description = "Hassas gruplar için sağlıksız (AQI: {$aqi}). Kalp-akciğer hastası olanlar dikkat!";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da hassas gruplar için riskli hava kalitesi.";
        }
    } elseif ($aqi > 150 && $aqi <= 200) {
        $status = 'Sağlıksız';
        $status_color = 'red';
        if ($timeframe === 'today') {
            $description = "Sağlıksız hava (AQI: {$aqi}). Dış aktiviteleri sınırlandırın.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da sağlıksız hava kalitesi. Mümkünse evde kalın.";
        }
    } else {
        $status = 'Çok Sağlıksız';
        $status_color = 'purple';
        if ($timeframe === 'today') {
            $description = "Çok sağlıksız hava (AQI: {$aqi})! Evden çıkmayın, maske takın.";
        } elseif ($timeframe === 'tomorrow') {
            $description = "Yarın {$city}'da çok kötü hava kalitesi. Zorunlu olmadıkça dışarı çıkmayın.";
        }
    }
    
    return [
        'id' => 'hki',
        'label' => 'HKİ',
        'value' => $aqi,
        'unit' => '',
        'status' => $status,
        'status_color' => $status_color,
        'description' => $description,
        'icon' => 'gauge'
    ];
}

// ============================================================================
// DAILY SUMMARY GENERATOR
// ============================================================================

function weather_generate_daily_summary($data, $timeframe, $city) {
    $condition = isset($data['condition']) ? $data['condition'] : 'Normal';
    $high = isset($data['high']) ? round($data['high']) : 20;
    $low = isset($data['low']) ? round($data['low']) : 15;
    $rain_prob = isset($data['rainProb']) ? $data['rainProb'] : 0;
    $tomorrow = isset($data['daily'][1]) ? $data['daily'][1] : null;
    
    if ($timeframe === 'today') {
        $rain_statement = ($rain_prob > 30) 
            ? "{$rain_prob}% yağış ihtimali var." 
            : "Yağış beklenmiyor.";
        return "Bugün {$city}'da hava {$condition}. Sıcaklık {$high}°/{$low}° arasında. {$rain_statement}";
    } elseif ($timeframe === 'tomorrow' && $tomorrow) {
        $diff = $tomorrow['high'] - $high;
        if ($diff >= 2) {
            $comparison = "Bugüne göre {$diff}° daha sıcak olacak.";
        } elseif ($diff <= -2) {
            $comparison = "Bugüne göre " . abs($diff) . "° daha serin olacak.";
        } else {
            $comparison = "Bugünle benzer sıcaklıklar bekleniyor.";
        }
        $tomorrow_condition = isset($tomorrow['condition']) ? $tomorrow['condition'] : $condition;
        return "Yarın {$city}'da {$tomorrow_condition} bekleniyor. En yüksek {$tomorrow['high']}°, en düşük {$tomorrow['low']}°. {$comparison}";
    }
    
    return "{$city} için hava durumu tahmini.";
}

// ============================================================================
// FAQ GENERATOR
// ============================================================================

function weather_generate_faq($data, $timeframe, $city) {
    $faq = [];
    $tomorrow = isset($data['daily'][1]) ? $data['daily'][1] : null;
    $high = isset($data['high']) ? round($data['high']) : 20;
    $feels_like = isset($data['feelsLike']) ? round($data['feelsLike']) : $high;
    $current_temp = isset($data['currentTemp']) ? round($data['currentTemp']) : $high;
    
    // FAQ 1: Tomorrow rain (high SEO value)
    if ($tomorrow) {
        $rain_prob = $tomorrow['rainProb'];
        $rain_desc = ($rain_prob >= 50) ? 'yağış bekleniyor' : 
                     (($rain_prob >= 20) ? 'yağış olabilir' : 'yağış beklenmiyor');
        $advice = ($rain_prob >= 30) ? 'Şemsiyenizi yanınıza alın.' : 'Dış mekan planları yapabilirsiniz.';
        
        $faq[] = [
            'question' => "Yarın {$city}'da yağmur yağacak mı?",
            'answer' => "{$city}'da yarın {$rain_prob}% olasılıkla {$rain_desc}. {$advice}"
        ];
    }
    
    // FAQ 2: Tomorrow temperature (high SEO value)
    if ($tomorrow) {
        $diff = $tomorrow['high'] - $high;
        if ($diff >= 2) {
            $comparison = "Bugüne göre {$diff}° daha sıcak.";
        } elseif ($diff <= -2) {
            $comparison = "Bugüne göre " . abs($diff) . "° daha serin.";
        } else {
            $comparison = "Bugünle aynı seviyede.";
        }
        
        $faq[] = [
            'question' => "{$city}'da yarın hava kaç derece olacak?",
            'answer' => "Yarın {$city}'da en yüksek sıcaklık {$tomorrow['high']}°, en düşük {$tomorrow['low']}° olacak. {$comparison}"
        ];
    }
    
    // FAQ 3: Clothing advice
    if ($tomorrow) {
        $temp = $tomorrow['high'];
        if ($temp >= 25) {
            $clothing = "Hafif ve açık renkli kıyafetler tercih edin. Güneş kremi unutmayın.";
        } elseif ($temp >= 15) {
            $clothing = "İnce bir ceket veya hırka almanızı öneririz.";
        } elseif ($temp >= 5) {
            $clothing = "Kat kat giyinmenizi ve mont almanızı öneririz.";
        } else {
            $clothing = "Kalın mont, atkı ve eldiven gerekli. Kış önlemlerinizi alın.";
        }
        
        $faq[] = [
            'question' => "Yarın {$city}'da ne giymeli?",
            'answer' => "{$city}'da yarın {$tomorrow['high']}° bekleniyor. {$clothing}"
        ];
    }
    
    // FAQ 4: Feels like (conditional)
    $feels_diff = abs($feels_like - $current_temp);
    if ($feels_diff > 3) {
        $reason = ($feels_like > $current_temp) 
            ? "Yüksek nem nedeniyle hava daha sıcak hissediliyor."
            : "Rüzgar nedeniyle hava daha soğuk hissediliyor.";
        
        $faq[] = [
            'question' => "{$city}'da hissedilen sıcaklık neden farklı?",
            'answer' => "{$city}'da şu anda {$current_temp}° olmasına rağmen hissedilen {$feels_like}°. {$reason}"
        ];
    }
    
    return array_slice($faq, 0, 4); // Max 4 FAQs
}

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

/**
 * Generate complete weather commentary
 * 
 * @param array $data Weather data from API
 * @param string $timeframe 'today', 'tomorrow', or 'weekend'
 * @return array Complete commentary object
 */
function weather_generate_commentary($data, $timeframe = 'today') {
    $city = isset($data['city']) ? $data['city'] : 'Bilinmeyen';
    
    return [
        'timeframe' => $timeframe,
        'city' => $city,
        'generated_at' => date('c'),
        'metrics' => [
            'sicaklik' => weather_generate_sicaklik($data, $timeframe, $city),
            'yagis' => weather_generate_yagis($data, $timeframe, $city),
            'ruzgar' => weather_generate_ruzgar($data, $timeframe, $city),
            'nem' => weather_generate_nem($data, $timeframe, $city),
            'uv' => weather_generate_uv($data, $timeframe, $city),
            'hki' => weather_generate_hki($data, $timeframe, $city),
        ],
        'daily_summary' => weather_generate_daily_summary($data, $timeframe, $city),
        'faq' => weather_generate_faq($data, $timeframe, $city)
    ];
}

/**
 * Generate JSON-LD structured data for WeatherForecast schema
 */
function weather_generate_schema($data, $commentary) {
    $city = isset($data['city']) ? $data['city'] : 'Bilinmeyen';
    $current_temp = isset($data['currentTemp']) ? round($data['currentTemp']) : 0;
    $high = isset($data['high']) ? round($data['high']) : $current_temp;
    $low = isset($data['low']) ? round($data['low']) : $current_temp;
    
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'WeatherForecast',
        'name' => "{$city} Hava Durumu",
        'description' => $commentary['daily_summary'],
        'validFrom' => date('c'),
        'validThrough' => date('c', strtotime('+1 day')),
        'temperature' => [
            '@type' => 'QuantitativeValue',
            'value' => $current_temp,
            'unitCode' => 'CEL',
            'minValue' => $low,
            'maxValue' => $high
        ]
    ];
    
    return $schema;
}

/**
 * Generate FAQ Page schema for SEO
 */
function weather_generate_faq_schema($faq) {
    if (empty($faq)) return null;
    
    $main_entity = [];
    foreach ($faq as $item) {
        $main_entity[] = [
            '@type' => 'Question',
            'name' => $item['question'],
            'acceptedAnswer' => [
                '@type' => 'Answer',
                'text' => $item['answer']
            ]
        ];
    }
    
    return [
        '@context' => 'https://schema.org',
        '@type' => 'FAQPage',
        'mainEntity' => $main_entity
    ];
}

// ============================================================================
// WORDPRESS INTEGRATION HOOKS
// ============================================================================

/**
 * Register commentary generation on city page load
 */
function weather_commentary_init() {
    // Hook into city page template
    add_action('weather_before_content', 'weather_output_commentary');
    add_action('wp_head', 'weather_output_schema');
}
add_action('init', 'weather_commentary_init');

/**
 * Output commentary HTML
 */
function weather_output_commentary() {
    global $weather_data;
    
    if (!isset($weather_data)) return;
    
    $commentary = weather_generate_commentary($weather_data, 'today');
    $tomorrow_commentary = weather_generate_commentary($weather_data, 'tomorrow');
    
    // Store for TedderConfig injection
    $GLOBALS['weather_commentary'] = [
        'today' => $commentary,
        'tomorrow' => $tomorrow_commentary
    ];
}

/**
 * Output JSON-LD schema in head
 */
function weather_output_schema() {
    global $weather_data, $weather_commentary;
    
    if (!isset($weather_data) || !isset($weather_commentary)) return;
    
    $commentary = $weather_commentary['today'];
    
    // Weather schema
    $weather_schema = weather_generate_schema($weather_data, $commentary);
    echo '<script type="application/ld+json">' . wp_json_encode($weather_schema, JSON_UNESCAPED_UNICODE) . '</script>';
    
    // FAQ schema
    if (!empty($commentary['faq'])) {
        $faq_schema = weather_generate_faq_schema($commentary['faq']);
        echo '<script type="application/ld+json">' . wp_json_encode($faq_schema, JSON_UNESCAPED_UNICODE) . '</script>';
    }
}

/**
 * Add commentary to TedderConfig for React hydration
 */
function weather_add_tedder_config($config) {
    global $weather_commentary;
    
    if (isset($weather_commentary)) {
        $config['preloadedCommentary'] = $weather_commentary;
    }
    
    return $config;
}
add_filter('tedder_config', 'weather_add_tedder_config');
