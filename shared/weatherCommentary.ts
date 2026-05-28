/**
 * Weather Commentary Generator
 * 
 * Generates MSN-style Turkish weather commentary for SEO optimization.
 * This is the TypeScript implementation - PHP version should mirror this logic.
 * 
 * @version 1.0.0
 * @see weather-commentary-spec.yaml for full specification
 */

import { WeatherData, DailyForecast } from '../types';
import { getCityRegion } from './cityData';

// ============================================================================
// TYPES
// ============================================================================

export type Timeframe = 'today' | 'tomorrow' | 'weekend';
export type ConditionStatus = 'good' | 'moderate' | 'bad' | 'warning' | 'danger';

export interface MetricCommentary {
    id: string;
    label: string;
    value: string | number;
    unit: string;
    status: string;
    statusColor: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | 'gray';
    description: string;
    icon: string;
}

export interface CommentaryMetadata {
    generatedAt: string;     // ISO 8601
    dateModified: string;    // ISO 8601
    displayDate: string;     // "20 Aralık 2024, 19:00"
}

export interface WeatherCommentary {
    timeframe: Timeframe;
    city: string;
    generatedAt: string;
    metadata: CommentaryMetadata;
    metrics: {
        sicaklik: MetricCommentary;
        hissedilen: MetricCommentary;
        bulutOrtusu: MetricCommentary;
        yagis: MetricCommentary;
        ruzgar: MetricCommentary;
        nem: MetricCommentary;
        uv: MetricCommentary;
        hki: MetricCommentary;
        basinc: MetricCommentary;
        gun: MetricCommentary;
    };
    answerBlock: string;     // AI-quotable 40-60 word summary (Zero-Click SEO target)
    timeframeBlock: TimeframeBlock;  // SEO H2 section with date stamp
    forecastTable: ForecastTableRow[];  // Structured forecast table for snippets
    dailySummary: string;
    faq: Array<{ question: string; answer: string }>;
}

// Timeframe H2 block for SEO (with date stamps)
export interface TimeframeBlock {
    heading: string;       // "Bugün İstanbul'da Hava Nasıl? (21 Aralık 2024)"
    headingWithRegion: string;  // "Bugün İstanbul – Marmara Hava Durumu (21 Aralık 2024)"
    content: string;       // 40-70 words
    comparison?: string;   // For tomorrow: "artıyor/azalıyor/benzer"
    dateStamp: string;     // "21 Aralık 2024"
}

// Forecast summary table row for rich snippets
export interface ForecastTableRow {
    metric: string;        // "En Yüksek"
    value: string;         // "18°"
    icon?: string;         // Optional icon identifier
}

// ============================================================================
// CITY FLAVORS (Anti-Duplication)
// ============================================================================

const CITY_FLAVORS: Record<string, Record<string, string>> = {
    // 1. İstanbul (Plate 34) - Population: 15.8M
    'istanbul': {
        wind: "Boğaz'da rüzgar daha belirgin olabilir.",
        humidity: "Marmara'dan gelen nemli hava etkili.",
        temperature: "Avrupa ve Anadolu yakası arasında fark olabilir.",
        rain: "Trakya'dan gelen yağış sistemleri etkili."
    },
    // 2. Ankara (Plate 6) - Population: 5.7M
    'ankara': {
        wind: "Bozkır rüzgarları sert esebilir.",
        temperature: "Gece-gündüz farkı yüksek, dikkatli olun.",
        humidity: "İç Anadolu'nun kuru havası hakim.",
        snow: "Kış aylarında kar yağışı etkili olabilir."
    },
    // 3. İzmir (Plate 35) - Population: 4.4M
    'izmir': {
        humidity: "Ege'nin nemli havası hissedilir.",
        temperature: "Kıyı serinliği etkili.",
        wind: "İmbat rüzgarı öğleden sonra başlayabilir.",
        uv: "Sahil kesimlerinde UV daha yüksek."
    },
    // 4. Bursa (Plate 16) - Population: 3.1M
    'bursa': {
        temperature: "Uludağ etekleri şehir merkezinden serin.",
        snow: "Kış aylarında Uludağ'da kar etkili.",
        humidity: "Marmara'dan gelen nem hissedilir."
    },
    // 5. Antalya (Plate 7) - Population: 2.6M
    'antalya': {
        temperature: "Akdeniz iklimi ile mülayim hava.",
        uv: "Sahil UV değerleri şehir merkezinden yüksek.",
        humidity: "Deniz etkisiyle nemli.",
        rain: "Kış yağışları yoğun olabilir."
    },
    // 6. Adana (Plate 1) - Population: 2.2M
    'adana': {
        temperature: "Çukurova'nın sıcak iklimi hakim.",
        humidity: "Akdeniz'den gelen nem bunaltıcı olabilir.",
        uv: "Yaz aylarında UV oldukça yüksek.",
        rain: "Sonbahar yağışları şiddetli olabilir."
    },
    // 7. Konya (Plate 42) - Population: 2.3M
    'konya': {
        temperature: "Bozkır iklimi ile sert sıcaklık değişimleri.",
        wind: "Düz arazide rüzgar etkili.",
        humidity: "Kuru hava hakim, cilt bakımına dikkat.",
        snow: "Kış aylarında yoğun kar olabilir."
    },
    // 8. Gaziantep (Plate 27) - Population: 2.1M
    'gaziantep': {
        temperature: "Güneydoğu'nun karasal iklimi etkili.",
        humidity: "Yaz aylarında kuru ve sıcak.",
        wind: "Kuzeyden gelen rüzgarlar serinletici.",
        rain: "Bahar yağışları fıstık üretimi için önemli."
    },
    // 9. Mersin (Plate 33) - Population: 1.9M
    'mersin': {
        temperature: "Akdeniz kıyısı ılıman iklim.",
        humidity: "Deniz etkisiyle nemli hava.",
        uv: "Sahilde güneş koruma şart.",
        rain: "Kış yağışları düzenli."
    },
    // 10. Kocaeli (Plate 41) - Population: 2.0M
    'kocaeli': {
        humidity: "Marmara geçişi nemli hava getirir.",
        wind: "Körfez rüzgarları etkili olabilir.",
        rain: "Marmara yağış kuşağında bol yağış.",
        temperature: "Sanayi bölgesi şehir merkezinden sıcak."
    },
    // 11. Diyarbakır (Plate 21) - Population: 1.8M
    'diyarbakir': {
        temperature: "Yaz aylarında 40°'ı aşan sıcaklıklar.",
        humidity: "Kuru ve sıcak yaz iklimi.",
        wind: "Güneşten korunma şart.",
        snow: "Kış aylarında kar yağabilir."
    },
    // 12. Samsun (Plate 55) - Population: 1.4M
    'samsun': {
        humidity: "Karadeniz'in nemli havası baskın.",
        rain: "Yıl boyunca yağış alabilen iklimiyle dikkat.",
        temperature: "Karadeniz serinliği hissedilir.",
        wind: "Poyraz etkili olabilir."
    },
    // 13. Kayseri (Plate 38) - Population: 1.4M
    'kayseri': {
        temperature: "Yüksek rakım nedeniyle serin geceler.",
        snow: "Erciyes'te kış sporları için ideal.",
        wind: "Bozkırdan gelen rüzgarlar sert.",
        humidity: "İç Anadolu'nun kuru havası hakim."
    },
    // 14. Eskişehir (Plate 26) - Population: 0.9M
    'eskisehir': {
        temperature: "Karasal iklim ile belirgin mevsim farkları.",
        wind: "Açık arazide rüzgar hissedilir.",
        snow: "Kış aylarında kar sürprizi olabilir.",
        humidity: "Orta nem seviyeleri."
    },
    // 15. Trabzon (Plate 61) - Population: 0.8M
    'trabzon': {
        humidity: "Karadeniz nemliliği yüksek.",
        rain: "Yıl boyunca yağış ihtimali var.",
        temperature: "Yaz ayları bile serindir.",
        wind: "Denizden gelen esintiler etkili."
    }
};


// ============================================================================
// WIND DIRECTION HELPER
// ============================================================================

const getWindDirectionLabel = (degrees: number | string): string => {
    const num = typeof degrees === 'string' ? parseFloat(degrees) : degrees;
    if (isNaN(num)) return degrees as string;

    if (num >= 337.5 || num < 22.5) return 'Kuzey';
    if (num >= 22.5 && num < 67.5) return 'Kuzeydoğu';
    if (num >= 67.5 && num < 112.5) return 'Doğu';
    if (num >= 112.5 && num < 157.5) return 'Güneydoğu';
    if (num >= 157.5 && num < 202.5) return 'Güney';
    if (num >= 202.5 && num < 247.5) return 'Güneybatı';
    if (num >= 247.5 && num < 292.5) return 'Batı';
    if (num >= 292.5 && num < 337.5) return 'Kuzeybatı';
    return 'Kuzey';
};

// ============================================================================
// TEMPLATE SELECTION (Deterministic randomization)
// ============================================================================

const selectTemplate = (templates: string[], city: string, dayOfYear: number): string => {
    // Deterministic: same city + same day = same template
    const seed = city.length + dayOfYear;
    const index = seed % templates.length;
    return templates[index];
};

const getDayOfYear = (): number => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
};

// ============================================================================
// HASH FUNCTION (Deterministic seed generation)
// ============================================================================

const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

// ============================================================================
// CONFIDENCE MODIFIERS (EEAT Enhancement)
// ============================================================================

const CONFIDENCE_MODIFIERS: Record<string, string[]> = {
    high: ['kesinlikle', 'büyük olasılıkla', 'büyük ölçüde'],
    medium: ['muhtemelen', 'tahminlere göre', 'beklentilere göre'],
    low: ['yer yer', 'kısa süreli', 'ara sıra'],
    uncertain: ['değişken', 'belirsiz koşullarda', 'tahmin güçleşen']
};

const getConfidenceModifier = (probability: number, city: string, timeframe: string): string => {
    const seed = hashCode(city + timeframe + 'confidence');
    let level: keyof typeof CONFIDENCE_MODIFIERS;

    if (probability >= 80) level = 'high';
    else if (probability >= 50) level = 'medium';
    else if (probability >= 20) level = 'low';
    else level = 'uncertain';

    const modifiers = CONFIDENCE_MODIFIERS[level];
    return modifiers[Math.abs(seed) % modifiers.length];
};

// ============================================================================
// DATE-BASED INTRO VARIATION (Anti-Duplication)
// ============================================================================

const DAILY_OPENERS: Record<Timeframe, string[]> = {
    today: [
        'Bugün {city} genelinde',
        '{city}\'da bugün',
        'Bugün {city} için',
        '{city} bugün'
    ],
    tomorrow: [
        'Yarın {city} genelinde',
        '{city}\'da yarınki hava',
        'Yarın {city} için',
        '{city} yarın'
    ],
    weekend: [
        'Hafta sonu {city} genelinde',
        '{city}\'da hafta sonu',
        'Bu hafta sonu {city} için',
        '{city} hafta sonu boyunca'
    ]
};

const getDailyOpener = (city: string, timeframe: Timeframe): string => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const seed = hashCode(city + today + timeframe);
    const openers = DAILY_OPENERS[timeframe];
    const opener = openers[Math.abs(seed) % openers.length];
    return opener.replace('{city}', city);
};

// ============================================================================
// METADATA FORMATTING (Trust Signal)
// ============================================================================

const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const formatDisplayDate = (date: Date): string => {
    const day = date.getDate();
    const month = TURKISH_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const generateMetadata = (): CommentaryMetadata => {
    const now = new Date();
    const isoString = now.toISOString();
    return {
        generatedAt: isoString,
        dateModified: isoString,
        displayDate: formatDisplayDate(now)
    };
};

// ============================================================================
// METRIC GENERATORS
// ============================================================================

const generateSicaklikCommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const today = data.daily[0];
    const tomorrow = data.daily[1];
    const current = data.currentTemp;
    const diff = tomorrow ? Math.round(tomorrow.high - today.high) : 0;
    const dayOfYear = getDayOfYear();

    let status = 'Sabit';
    let statusColor: MetricCommentary['statusColor'] = 'blue';
    let description = '';

    // Determine condition
    if (current >= 30) {
        status = 'Sıcak';
        statusColor = 'orange';
        if (timeframe === 'today') {
            description = `Sıcak bir gün! ${current}° ile bunaltıcı hava. Bol su için.`;
        } else if (timeframe === 'tomorrow' && tomorrow) {
            const templates = [
                `Yarın ${city}'da kavurucu sıcak: ${tomorrow.high}°! Gölgede kalın, bol sıvı tüketin.`,
                `${city} yarın sıcak dalgası altında: ${tomorrow.high}°. Öğle saatlerinde dışarı çıkmayın.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else if (current <= 5) {
        status = 'Soğuk';
        statusColor = 'blue';
        if (timeframe === 'today') {
            description = `Soğuk bir gün! ${current}° ile don riski. Kalın giyinin.`;
        } else if (timeframe === 'tomorrow' && tomorrow) {
            const templates = [
                `Yarın ${city}'da soğuk: ${tomorrow.high}°. Kış kıyafetlerinizi hazırlayın.`,
                `${city} yarın için don uyarısı olabilir. En düşük ${tomorrow.low}°.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else if (diff >= 2) {
        status = 'Yükseliyor';
        statusColor = 'orange';
        if (timeframe === 'today') {
            description = `Şu anda ${current}°. Yarın ${diff}° daha sıcak olacak.`;
        } else if (timeframe === 'tomorrow' && tomorrow) {
            const templates = [
                `Yarın ${city}'da sıcaklık artıyor: ${tomorrow.high}°, bugünden ${diff}° yüksek.`,
                `${city} yarın daha sıcak! En yüksek ${tomorrow.high}°, bugün ${today.high}° idi.`,
                `Yarın için ${city} tahmini: Isınma var, ${tomorrow.high}°'ye çıkacak.`,
                `${city} yarın ${tomorrow.high}° görecek. Bugüne göre belirgin sıcaklık artışı.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else if (diff <= -2) {
        status = 'Düşüyor';
        statusColor = 'blue';
        if (timeframe === 'today') {
            description = `Şu anda ${current}°. Yarın ${Math.abs(diff)}° daha serin olacak.`;
        } else if (timeframe === 'tomorrow' && tomorrow) {
            const templates = [
                `Yarın ${city}'da sıcaklık düşüyor: ${tomorrow.high}°, bugünden ${Math.abs(diff)}° düşük.`,
                `${city} yarın serinliyor! En yüksek ${tomorrow.high}°, bugün ${today.high}° idi.`,
                `Yarın için ${city} tahmini: Düşüş var, ${tomorrow.high}°'de kalacak.`,
                `${city} yarın daha serin: ${tomorrow.high}°. Üzerinize bir şeyler alın.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else {
        status = 'Sabit';
        statusColor = 'gray';
        if (timeframe === 'today') {
            const templates = [
                `Şu anda ${current}°. Sıcaklık gün boyunca sabit kalacak.`,
                `${current}° ile dengeli bir gün. Önemli değişiklik beklenmiyor.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        } else if (timeframe === 'tomorrow' && tomorrow) {
            const templates = [
                `Yarın ${city} için sıcaklık bugünle aynı seviyede: ${tomorrow.high}°/${tomorrow.low}°.`,
                `Yarın ${city}'da sıcaklık değişimi beklenmiyor. En yüksek ${tomorrow.high}°.`,
                `${city} yarın için tahmin: Bugünkü ${today.high}° seviyesi korunacak.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    }

    // Add city flavor if available
    const cityKey = city.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
    const flavor = CITY_FLAVORS[cityKey]?.temperature;
    if (flavor && Math.random() > 0.5) {
        description += ' ' + flavor;
    }

    return {
        id: 'sicaklik',
        label: 'Sıcaklık',
        value: timeframe === 'tomorrow' && tomorrow ? tomorrow.high : current,
        unit: '°C',
        status,
        statusColor,
        description,
        icon: 'thermometer'
    };
};

const generateHissedilenCommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const feels = Math.round(data.feelsLike);
    const actual = Math.round(data.currentTemp);
    const diff = feels - actual;
    const dayOfYear = getDayOfYear();

    let status = 'Rahat';
    let statusColor: MetricCommentary['statusColor'] = 'green';
    let description = '';

    if (diff > 2) {
        status = 'Daha Sıcak';
        statusColor = 'orange';
        if (timeframe === 'today') {
            const templates = [
                `Hissedilen ${feels}°, gerçek sıcaklık ${actual}°. Nem etkisiyle daha sıcak.`,
                `${feels}° hissediliyor. Yüksek nem nedeniyle bunaltıcı.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da hissedilen sıcaklık yüksek olacak. Nem nedeniyle bunaltıcı.`;
        }
    } else if (diff < -2) {
        status = 'Daha Soğuk';
        statusColor = 'blue';
        if (timeframe === 'today') {
            const windSpeed = data.windSpeed;
            const windDesc = windSpeed < 20 ? 'Hafif rüzgar' : (windSpeed < 40 ? 'Rüzgar' : 'Sert rüzgar');
            const templates = [
                `Hissedilen ${feels}°, gerçek ${actual}°. Rüzgar nedeniyle daha soğuk.`,
                `${windDesc} etkili. ${feels}° hissediliyor, termometre ${actual}° gösterse de.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da rüzgar nedeniyle hissedilen sıcaklık düşük olacak.`;
        }
    } else {
        status = 'Rahat';
        statusColor = 'green';
        if (timeframe === 'today') {
            const templates = [
                `Rahat. Hissedilen ${feels}°, gerçek sıcaklıkla uyumlu.`,
                `Konforlu hava. Ne nem ne rüzgar rahatsız etmiyor.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da konforlu hava. Hissedilen ile gerçek sıcaklık yakın.`;
        }
    }

    return {
        id: 'hissedilen',
        label: 'Hissedilen',
        value: feels,
        unit: '°C',
        status,
        statusColor,
        description,
        icon: 'thermometer-sun'
    };
};

const generateYagisCommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const prob = data.rainProb;
    const volume = data.rainVolume;
    const tomorrow = data.daily[1];
    const tomorrowProb = tomorrow?.rainProb || 0;
    const dayOfYear = getDayOfYear();

    let status = 'Yağış Yok';
    let statusColor: MetricCommentary['statusColor'] = 'green';
    let description = '';

    // Use correct data based on timeframe
    const targetProb = timeframe === 'tomorrow' ? tomorrowProb : prob;
    // For tomorrow, we don't have volume data, so use probability only
    const hasVolume = timeframe === 'today' && volume > 0;

    if (targetProb < 20) {
        status = 'Yağış Yok';
        statusColor = 'green';
        if (timeframe === 'today') {
            description = `Yağış beklenmiyor (${prob}%). Şemsiyeye gerek yok.`;
        } else if (timeframe === 'tomorrow') {
            const templates = [
                `Yarın ${city}'da yağış yok. ${tomorrowProb}% olasılıkla kuru geçecek.`,
                `${city} yarın için yağmur beklenmiyor. Dış mekan planlarınızı rahatça yapabilirsiniz.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else if (targetProb >= 20 && targetProb < 50) {
        status = 'Olası';
        statusColor = 'yellow';
        if (timeframe === 'today') {
            description = `Hafif yağış ihtimali (${prob}%). Şemsiye yanınızda olsun.`;
        } else if (timeframe === 'tomorrow') {
            const templates = [
                `Yarın ${city}'da yağış ihtimali var (${tomorrowProb}%). Şemsiyenizi alın.`,
                `${city} yarın için belirsiz tahmin: ${tomorrowProb}% yağış olasılığı.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else if (targetProb >= 50 && targetProb < 80) {
        status = 'Muhtemel';
        statusColor = 'orange';
        if (timeframe === 'today') {
            description = `Yağış muhtemel (${prob}%). ${hasVolume ? `${volume} mm bekleniyor.` : 'Şemsiye alın.'}`;
        } else if (timeframe === 'tomorrow') {
            const templates = [
                `Yarın ${city}'da yağış muhtemel: ${tomorrowProb}% olasılık. Şemsiyenizi hazırlayın.`,
                `${city} yarın için yağmur tahmini. Şemsiyesiz çıkmayın.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else {
        status = 'Kesin';
        statusColor = 'blue';
        if (timeframe === 'today') {
            description = `Yağış kesin (${prob}%). ${hasVolume ? `${volume} mm yağış bekleniyor.` : 'Yağmurluk şart.'}`;
        } else if (timeframe === 'tomorrow') {
            const templates = [
                `Yarın ${city}'da kesin yağış: ${tomorrowProb}% olasılık. Yağmurluk veya şemsiye alın.`,
                `${city} yarın yağmurlu! Dışarı çıkmadan önce yağmurluk veya şemsiye alın.`,
                `Yarın için ${city} tahmini: Yoğun yağış. Dış mekan planlarını erteleyin.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    }

    // Show probability as value when volume is unavailable (tomorrow) or 0
    // This prevents confusing "0mm" with "Muhtemel" status
    const displayValue = hasVolume ? volume : targetProb;
    const displayUnit = hasVolume ? 'mm' : '%';

    return {
        id: 'yagis',
        label: 'Yağış',
        value: displayValue,
        unit: displayUnit,
        status,
        statusColor,
        description,
        icon: 'cloud-rain'
    };
};

const generateRuzgarCommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const speed = data.windSpeed;
    const direction = getWindDirectionLabel(parseFloat(data.windDirection));
    const dayOfYear = getDayOfYear();

    let status = 'Sakin';
    let statusColor: MetricCommentary['statusColor'] = 'green';
    let description = '';

    if (speed < 10) {
        status = 'Sakin';
        statusColor = 'green';
        if (timeframe === 'today') {
            description = `Rüzgar sakin (${speed} km/sa). Çok hafif esinti.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da rüzgar sakin. Açık hava aktiviteleri için ideal.`;
        }
    } else if (speed >= 10 && speed < 20) {
        status = 'Hafif';
        statusColor = 'green';
        if (timeframe === 'today') {
            description = `Hafif rüzgar (${speed} km/sa). ${direction} yönünden.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da hafif rüzgar, ${direction} yönünden.`;
        }
    } else if (speed >= 20 && speed < 40) {
        status = 'Orta';
        statusColor = 'yellow';
        if (timeframe === 'today') {
            description = `Orta şiddette rüzgar (${speed} km/sa). ${direction}'den esiyor.`;
        } else if (timeframe === 'tomorrow') {
            const templates = [
                `Yarın ${city}'da orta şiddette rüzgar bekleniyor.`,
                `${city} yarın rüzgarlı. Şapka ve hafif eşyalara dikkat.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else if (speed >= 40 && speed < 60) {
        status = 'Kuvvetli';
        statusColor = 'orange';
        if (timeframe === 'today') {
            description = `Kuvvetli rüzgar! ${speed} km/sa. Dikkatli olun.`;
        } else if (timeframe === 'tomorrow') {
            const templates = [
                `Yarın ${city}'da kuvvetli rüzgar uyarısı: ${speed} km/sa.`,
                `${city} yarın için dikkat: Kuvvetli rüzgar bekleniyor. Balkondaki eşyaları alın.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else {
        status = 'Fırtına';
        statusColor = 'red';
        if (timeframe === 'today') {
            description = `Fırtına uyarısı! ${speed} km/sa rüzgar. Zorunlu olmadıkça dışarı çıkmayın.`;
        } else if (timeframe === 'tomorrow') {
            const templates = [
                `Yarın ${city}'da fırtına bekleniyor: ${speed} km/sa. Önlem alın!`,
                `${city} yarın için meteorolojik uyarı: Fırtına riski. Dışarı çıkmaktan kaçının.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    }

    // Add city flavor
    const cityKey = city.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
    const flavor = CITY_FLAVORS[cityKey]?.wind;
    if (flavor && speed >= 15) {
        description += ' ' + flavor;
    }

    return {
        id: 'ruzgar',
        label: 'Rüzgar',
        value: speed,
        unit: 'km/sa',
        status,
        statusColor,
        description,
        icon: 'wind'
    };
};

const generateNemCommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const humidity = data.humidity;
    const dayOfYear = getDayOfYear();

    let status = 'Normal';
    let statusColor: MetricCommentary['statusColor'] = 'green';
    let description = '';

    if (humidity < 30) {
        status = 'Kuru';
        statusColor = 'yellow';
        if (timeframe === 'today') {
            description = `Kuru hava (${humidity}%). Cilt bakımına dikkat, nemlendirici kullanın.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da hava kuru kalacak. Cilt kuruluğuna karşı önlem alın.`;
        }
    } else if (humidity >= 30 && humidity <= 60) {
        status = 'Normal';
        statusColor = 'green';
        if (timeframe === 'today') {
            description = `Nem seviyesi konforlu (${humidity}%). İdeal hava.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da nem seviyeleri normal: ${humidity}%. Konforlu bir gün.`;
        }
    } else if (humidity > 60 && humidity <= 80) {
        status = 'Nemli';
        statusColor = 'yellow';
        if (timeframe === 'today') {
            description = `Nemli hava (${humidity}%). Biraz bunaltıcı olabilir.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da nemli hava: ${humidity}%. Terleme artabilir.`;
        }
    } else {
        status = 'Çok Nemli';
        statusColor = 'orange';
        if (timeframe === 'today') {
            description = `Çok nemli (${humidity}%)! Bunaltıcı sıcak hissi yaratabilir.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da çok yüksek nem: ${humidity}%. Rahatsızlık verebilir.`;
        }
    }

    return {
        id: 'nem',
        label: 'Nem',
        value: humidity,
        unit: '%',
        status,
        statusColor,
        description,
        icon: 'droplets'
    };
};

const generateUVCommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const uv = data.uvIndex;
    const tomorrow = data.daily[1];
    const tomorrowUV = tomorrow?.uvIndex || uv;
    const dayOfYear = getDayOfYear();

    const targetUV = timeframe === 'tomorrow' ? tomorrowUV : uv;

    let status = 'Düşük';
    let statusColor: MetricCommentary['statusColor'] = 'green';
    let description = '';

    if (targetUV <= 2) {
        status = 'Düşük';
        statusColor = 'green';
        if (timeframe === 'today') {
            description = `UV düşük (${uv}). Koruma opsiyonel.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da UV düşük: ${tomorrowUV}. Güneş kremi isteğe bağlı.`;
        }
    } else if (targetUV > 2 && targetUV <= 5) {
        status = 'Orta';
        statusColor = 'yellow';
        if (timeframe === 'today') {
            description = `UV orta (${uv}). SPF 30+ güneş kremi önerilir.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da UV orta seviyede: ${tomorrowUV}. Güneş kremi sürün.`;
        }
    } else if (targetUV > 5 && targetUV <= 7) {
        status = 'Yüksek';
        statusColor = 'orange';
        if (timeframe === 'today') {
            description = `Yüksek UV (${uv})! Yanma süresi ~20dk. Şapka ve güneş kremi şart.`;
        } else if (timeframe === 'tomorrow') {
            const templates = [
                `Yarın ${city}'da yüksek UV: ${tomorrowUV}. Korumasız güneşe çıkmayın.`,
                `${city} yarın için UV uyarısı: ${tomorrowUV} indeks. Güneş gözlüğü ve SPF50+ kullanın.`
            ];
            description = selectTemplate(templates, city, dayOfYear);
        }
    } else if (targetUV > 7 && targetUV <= 10) {
        status = 'Çok Yüksek';
        statusColor = 'red';
        if (timeframe === 'today') {
            description = `Çok yüksek UV (${uv})! Yanma süresi ~15dk. 11-16 arası güneşten kaçının.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da çok yüksek UV: ${tomorrowUV}. Öğle saatlerinde dışarı çıkmayın.`;
        }
    } else {
        status = 'Aşırı';
        statusColor = 'purple';
        if (timeframe === 'today') {
            description = `Aşırı UV (${uv})! Yanma süresi ~10dk. Mümkünse evde kalın.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da aşırı UV: ${tomorrowUV}. Zorunlu olmadıkça dışarı çıkmayın.`;
        }
    }

    return {
        id: 'uv',
        label: 'UV',
        value: targetUV,
        unit: '',
        status,
        statusColor,
        description,
        icon: 'sun'
    };
};

const generateHKICommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const aqi = data.aqi;

    let status = 'İyi';
    let statusColor: MetricCommentary['statusColor'] = 'green';
    let description = '';

    if (aqi <= 50) {
        status = 'İyi';
        statusColor = 'green';
        if (timeframe === 'today') {
            description = `Hava kalitesi iyi (AQI: ${aqi}). Dışarıda vakit geçirmek için ideal.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da hava kalitesi iyi olacak. Dış mekan aktiviteleri için uygun.`;
        }
    } else if (aqi > 50 && aqi <= 100) {
        status = 'Orta';
        statusColor = 'yellow';
        if (timeframe === 'today') {
            description = `Hava kalitesi orta (AQI: ${aqi}). Hassas gruplar dikkatli olsun.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da hava kalitesi orta. Astımlılar dikkat etsin.`;
        }
    } else if (aqi > 100 && aqi <= 150) {
        status = 'Hassas Gruplar';
        statusColor = 'orange';
        if (timeframe === 'today') {
            description = `Hassas gruplar için sağlıksız (AQI: ${aqi}). Kalp-akciğer hastası olanlar dikkat!`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da hassas gruplar için riskli hava kalitesi.`;
        }
    } else if (aqi > 150 && aqi <= 200) {
        status = 'Sağlıksız';
        statusColor = 'red';
        if (timeframe === 'today') {
            description = `Sağlıksız hava (AQI: ${aqi}). Dış aktiviteleri sınırlandırın.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da sağlıksız hava kalitesi. Mümkünse evde kalın.`;
        }
    } else {
        status = 'Çok Sağlıksız';
        statusColor = 'purple';
        if (timeframe === 'today') {
            description = `Çok sağlıksız hava (AQI: ${aqi})! Evden çıkmayın, maske takın.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da çok kötü hava kalitesi. Zorunlu olmadıkça dışarı çıkmayın.`;
        }
    }

    return {
        id: 'hki',
        label: 'HKİ',
        value: aqi,
        unit: '',
        status,
        statusColor,
        description,
        icon: 'gauge'
    };
};

const generateBasincCommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const pressure = Math.round(data.pressure);

    // Simple trend detection (would need hourly data for real implementation)
    let status = 'Sabit';
    let statusColor: MetricCommentary['statusColor'] = 'gray';
    let description = '';

    if (pressure > 1020) {
        status = 'Yüksek';
        statusColor = 'green';
        if (timeframe === 'today') {
            description = `Yüksek basınç (${pressure} hPa). Açık hava bekleniyor.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da yüksek basınç sistemi etkili. Açık hava bekleniyor.`;
        }
    } else if (pressure < 1010) {
        status = 'Düşük';
        statusColor = 'yellow';
        if (timeframe === 'today') {
            description = `Düşük basınç (${pressure} hPa). Hava değişkenliği olabilir.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da düşük basınç etkisi. Hava değişkenliği olabilir.`;
        }
    } else {
        status = 'Sabit';
        statusColor = 'gray';
        if (timeframe === 'today') {
            description = `Basınç sabit (${pressure} hPa). Ani değişiklik beklenmiyor.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da basınç sabit kalacak. Stabil hava koşulları.`;
        }
    }

    return {
        id: 'basinc',
        label: 'Basınç',
        value: pressure,
        unit: 'hPa',
        status,
        statusColor,
        description,
        icon: 'gauge'
    };
};

const generateGunCommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const sunrise = data.sunrise;
    const sunset = data.sunset;

    // Calculate day length
    const [srH, srM] = sunrise.split(':').map(Number);
    const [ssH, ssM] = sunset.split(':').map(Number);
    const dayMinutes = (ssH * 60 + ssM) - (srH * 60 + srM);
    const dayHours = Math.floor(dayMinutes / 60);
    const dayMins = dayMinutes % 60;
    const dayLength = `${dayHours} saat ${dayMins} dk`;

    let description = '';
    if (timeframe === 'today') {
        description = `Gün doğumu: ${sunrise}, gün batımı: ${sunset}. ${dayLength} aydınlık.`;
    } else if (timeframe === 'tomorrow') {
        description = `Yarın ${city}'da güneş ${sunrise}'de doğacak, ${sunset}'de batacak.`;
    }

    return {
        id: 'gun',
        label: 'Gün',
        value: dayLength,
        unit: '',
        status: 'Normal',
        statusColor: 'gray',
        description,
        icon: 'sunrise'
    };
};

const generateBulutOrtusuCommentary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): MetricCommentary => {
    const cloudCover = data.cloudCover;

    let status = 'Açık';
    let statusColor: MetricCommentary['statusColor'] = 'blue';
    let description = '';

    if (cloudCover <= 10) {
        status = 'Açık';
        statusColor = 'blue';
        if (timeframe === 'today') {
            description = `Açık gökyüzü (${cloudCover}%). Güneşli bir gün.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da büyük olasılıkla açık hava. Güneş gözlüğünü unutmayın.`;
        }
    } else if (cloudCover > 10 && cloudCover <= 50) {
        status = 'Parçalı Bulutlu';
        statusColor = 'gray';
        if (timeframe === 'today') {
            description = `Parçalı bulutlu (${cloudCover}%). Güneş zaman zaman görünecek.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da parçalı bulutlu hava. Güneş aralıklarla belirgin.`;
        }
    } else if (cloudCover > 50 && cloudCover <= 85) {
        status = 'Çoğunlukla Bulutlu';
        statusColor = 'gray';
        if (timeframe === 'today') {
            description = `Çoğunlukla bulutlu (${cloudCover}%). Gökyüzü kapalıya yakın.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da bulutlu hava hakim. Güneş pek görünmeyebilir.`;
        }
    } else {
        status = 'Kapalı';
        statusColor = 'gray';
        if (timeframe === 'today') {
            description = `Tamamen kapalı (${cloudCover}%). Güneş bugün görünmeyecek.`;
        } else if (timeframe === 'tomorrow') {
            description = `Yarın ${city}'da kapalı hava. Vitamin D alamayacaksınız.`;
        }
    }

    return {
        id: 'bulutOrtusu',
        label: 'Bulut Örtüsü',
        value: cloudCover,
        unit: '%',
        status,
        statusColor,
        description,
        icon: 'cloud'
    };
};

// ============================================================================
// DAILY SUMMARY GENERATOR
// ============================================================================

const generateDailySummary = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): string => {
    const condition = data.condition;
    const high = Math.round(data.high);
    const low = Math.round(data.low);
    const rainProb = data.rainProb;
    const tomorrow = data.daily[1];

    // Use date-based opener for anti-duplication
    const opener = getDailyOpener(city, timeframe);

    if (timeframe === 'today') {
        const modifier = getConfidenceModifier(100 - rainProb, city, 'today');
        let rainStatement = rainProb > 30
            ? `${rainProb}% yağış ihtimali var.`
            : `${modifier} yağış beklenmiyor.`;
        return `${opener} hava ${condition}. Sıcaklık ${high}°/${low}° arasında. ${rainStatement}`;
    } else if (timeframe === 'tomorrow' && tomorrow) {
        const diff = tomorrow.high - high;
        const modifier = getConfidenceModifier(70, city, 'tomorrow'); // Medium confidence for tomorrow
        let comparison = '';
        if (diff >= 2) {
            comparison = `Bugüne göre ${modifier} ${diff}° daha sıcak olacak.`;
        } else if (diff <= -2) {
            comparison = `Bugüne göre ${modifier} ${Math.abs(diff)}° daha serin olacak.`;
        } else {
            comparison = 'Bugünle benzer sıcaklıklar bekleniyor.';
        }
        return `${opener} ${tomorrow.condition} bekleniyor. En yüksek ${tomorrow.high}°, en düşük ${tomorrow.low}°. ${comparison}`;
    } else if (timeframe === 'weekend') {
        const weekend = data.daily.slice(5, 7);
        if (weekend.length >= 2) {
            const saturday = weekend[0];
            const sunday = weekend[1];
            const modifier = getConfidenceModifier(50, city, 'weekend'); // Lower confidence for weekend
            return `${opener} Cumartesi ${saturday.condition} (${saturday.high}°), Pazar ${sunday.condition} (${sunday.high}°). ${modifier} planlarınızı bu tahminlere göre yapabilirsiniz.`;
        }
    }

    return `${city} için hava durumu tahmini.`;
};

// ============================================================================
// ANSWER BLOCK GENERATOR (Zero-Click SEO - AI Primary Target)
// ============================================================================

/**
 * Generates a 40-60 word AI-quotable summary block.
 * This is the primary target for AI Overview citations.
 * 
 * Format: "Bugün {Şehir}'de hava {durum}. Gün içinde sıcaklık {min}° ile {max}° 
 * arasında olacak. Yağış ihtimali %{x} civarında, rüzgâr {yon} yönünden {hiz} km/sa hızla esecek."
 */
const generateAnswerBlock = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): string => {
    const condition = data.condition.toLowerCase();
    const high = Math.round(data.high);
    const low = Math.round(data.low);
    const rainProb = data.rainProb;
    const windSpeed = data.windSpeed;
    const windDir = getWindDirectionLabel(parseFloat(data.windDirection));
    const tomorrow = data.daily[1];
    const weekend = data.daily.slice(5, 7);

    if (timeframe === 'today') {
        // Today: Current conditions with immediate forecast
        let rainStatement = '';
        if (rainProb >= 50) {
            rainStatement = `Yağış ihtimali %${rainProb} civarında.`;
        } else if (rainProb >= 20) {
            rainStatement = `Düşük yağış ihtimali (%${rainProb}) bulunuyor.`;
        } else {
            rainStatement = 'Yağış beklenmiyor.';
        }

        return `Bugün ${city}'de hava ${condition}. Gün içinde sıcaklık ${low}° ile ${high}° arasında olacak. ${rainStatement} Rüzgâr ${windDir} yönünden ${windSpeed} km/sa hızla esecek.`;

    } else if (timeframe === 'tomorrow' && tomorrow) {
        // Tomorrow: Focus on changes from today
        const diff = tomorrow.high - high;
        let changeStatement = '';
        if (diff >= 3) {
            changeStatement = `Bugüne göre belirgin şekilde ısınıyor.`;
        } else if (diff <= -3) {
            changeStatement = `Bugüne göre belirgin şekilde serinliyor.`;
        } else {
            changeStatement = `Bugünkü sıcaklıklara benzer.`;
        }

        let rainStatement = '';
        if (tomorrow.rainProb >= 50) {
            rainStatement = `Yağış ihtimali %${tomorrow.rainProb}.`;
        } else if (tomorrow.rainProb >= 20) {
            rainStatement = `Hafif yağış olasılığı var (%${tomorrow.rainProb}).`;
        } else {
            rainStatement = 'Yağış beklenmiyor.';
        }

        return `Yarın ${city}'de hava ${tomorrow.condition.toLowerCase()} olacak. Sıcaklık ${tomorrow.low}° ile ${tomorrow.high}° arasında. ${changeStatement} ${rainStatement}`;

    } else if (timeframe === 'weekend' && weekend.length >= 2) {
        // Weekend: Aggregate Saturday and Sunday
        const saturday = weekend[0];
        const sunday = weekend[1];
        const avgHigh = Math.round((saturday.high + sunday.high) / 2);
        const avgLow = Math.round((saturday.low + sunday.low) / 2);
        const maxRainProb = Math.max(saturday.rainProb, sunday.rainProb);

        let rainStatement = '';
        if (maxRainProb >= 50) {
            rainStatement = `Yağış riski yüksek (%${maxRainProb}).`;
        } else if (maxRainProb >= 20) {
            rainStatement = `Hafif yağış ihtimali var.`;
        } else {
            rainStatement = 'Yağış beklenmiyor, dış mekan aktiviteleri için uygun.';
        }

        return `Hafta sonu ${city}'de Cumartesi ${saturday.condition.toLowerCase()}, Pazar ${sunday.condition.toLowerCase()} bekleniyor. Sıcaklıklar ${avgLow}° ile ${avgHigh}° arasında. ${rainStatement}`;
    }

    // Fallback
    return `${city} için güncel hava durumu tahmini.`;
};

// ============================================================================
// TIMEFRAME BLOCK GENERATOR (Competitor-Derived SEO Enhancement)
// ============================================================================

/**
 * Generates timeframe H2 block with date stamps for SEO freshness signals.
 * Includes city-region format for improved entity recognition.
 */
const generateTimeframeBlock = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): TimeframeBlock => {
    const now = new Date();
    const tomorrow = data.daily[1];
    const weekend = data.daily.slice(5, 7);

    // Format date stamp (Turkish)
    const day = now.getDate();
    const month = TURKISH_MONTHS[now.getMonth()];
    const year = now.getFullYear();
    const dateStamp = `${day} ${month} ${year}`;

    // Get region for entity signal
    const region = getCityRegion(city);
    const cityWithRegion = region ? `${city} – ${region}` : city;

    let heading = '';
    let headingWithRegion = '';
    let content = '';
    let comparison: string | undefined;

    if (timeframe === 'today') {
        heading = `Bugün ${city}'de Hava Nasıl? (${dateStamp})`;
        headingWithRegion = `Bugün ${cityWithRegion} Hava Durumu (${dateStamp})`;

        const rainStatement = data.rainProb >= 30
            ? `%${data.rainProb} yağış ihtimali bulunuyor.`
            : 'Yağış beklenmiyor.';

        content = `${city}'de bugün ${data.condition.toLowerCase()} hava hakim. ` +
            `Sıcaklık ${data.low}° ile ${data.high}° arasında değişecek. ${rainStatement} ` +
            `Rüzgar ${getWindDirectionLabel(parseFloat(data.windDirection))} yönünden ` +
            `${data.windSpeed} km/sa hızla esecek.`;

    } else if (timeframe === 'tomorrow' && tomorrow) {
        // Calculate tomorrow's date
        const tomorrowDate = new Date(now);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowDay = tomorrowDate.getDate();
        const tomorrowMonth = TURKISH_MONTHS[tomorrowDate.getMonth()];
        const tomorrowDateStamp = `${tomorrowDay} ${tomorrowMonth} ${year}`;

        heading = `Yarın ${city}'de Hava Nasıl Olacak? (${tomorrowDateStamp})`;
        headingWithRegion = `Yarın ${cityWithRegion} Hava Durumu (${tomorrowDateStamp})`;

        const diff = tomorrow.high - data.high;
        if (diff >= 3) {
            comparison = 'artıyor';
            content = `Yarın ${city}'de sıcaklıklar belirgin şekilde yükseliyor. `;
        } else if (diff <= -3) {
            comparison = 'azalıyor';
            content = `Yarın ${city}'de serinleme bekleniyor. `;
        } else {
            comparison = 'benzer';
            content = `Yarın ${city}'de bugünkü hava koşulları devam edecek. `;
        }

        content += `${tomorrow.condition} bekleniyor, sıcaklık ${tomorrow.low}° ile ${tomorrow.high}° arasında. `;
        content += tomorrow.rainProb >= 30
            ? `%${tomorrow.rainProb} yağış ihtimali var.`
            : 'Yağış beklenmiyor.';

    } else if (timeframe === 'weekend' && weekend.length >= 2) {
        const saturday = weekend[0];
        const sunday = weekend[1];

        // Calculate weekend dates
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
        const satDate = new Date(now);
        satDate.setDate(satDate.getDate() + daysUntilSaturday);
        const sunDate = new Date(satDate);
        sunDate.setDate(sunDate.getDate() + 1);

        const weekendDateStamp = `${satDate.getDate()}-${sunDate.getDate()} ${TURKISH_MONTHS[satDate.getMonth()]} ${year}`;

        heading = `Hafta Sonu ${city} Hava Durumu (${weekendDateStamp})`;
        headingWithRegion = `Hafta Sonu ${cityWithRegion} Hava Durumu (${weekendDateStamp})`;

        const maxRainProb = Math.max(saturday.rainProb, sunday.rainProb);
        const avgHigh = Math.round((saturday.high + sunday.high) / 2);

        content = `Hafta sonu ${city}'de Cumartesi ${saturday.condition.toLowerCase()}, ` +
            `Pazar ${sunday.condition.toLowerCase()} bekleniyor. ` +
            `Ortalama en yüksek sıcaklık ${avgHigh}°. `;
        content += maxRainProb >= 30
            ? `Yağış riski mevcut (%${maxRainProb}).`
            : 'Dış mekan aktiviteleri için uygun koşullar bekleniyor.';
    }

    return {
        heading: heading || `${city} Hava Durumu (${dateStamp})`,
        headingWithRegion: headingWithRegion || `${cityWithRegion} Hava Durumu (${dateStamp})`,
        content: content || `${city} için hava durumu tahmini.`,
        comparison,
        dateStamp
    };
};

// ============================================================================
// FORECAST TABLE GENERATOR (Rich Snippet Opportunity)
// ============================================================================

/**
 * Generates structured forecast table for rich snippet opportunities.
 * Competitors rank well with visible tables.
 * NOTE: For 'tomorrow' and 'weekend', the data object is already transformed
 * by weatherService.ts to contain the correct values at the root level.
 */
const generateForecastTable = (
    data: WeatherData,
    timeframe: Timeframe
): ForecastTableRow[] => {
    // All timeframes use the same structure now - the data.high/low/etc are already
    // transformed by weatherService.ts for tomorrow/weekend views
    return [
        { metric: 'En Yüksek', value: `${data.high}°`, icon: 'thermometer' },
        { metric: 'En Düşük', value: `${data.low}°`, icon: 'thermometer' },
        { metric: 'Yağış İhtimali', value: `%${data.rainProb}`, icon: 'cloud-rain' },
        { metric: 'Rüzgâr', value: `${getWindDirectionLabel(parseFloat(data.windDirection))} ${data.windSpeed} km/sa`, icon: 'wind' },
        { metric: 'Nem', value: `%${data.humidity}`, icon: 'droplets' },
        { metric: 'UV İndeksi', value: `${data.uvIndex}`, icon: 'sun' },
    ];
};

// ============================================================================
// FAQ GENERATOR
// ============================================================================

const generateFAQ = (
    data: WeatherData,
    timeframe: Timeframe,
    city: string
): Array<{ question: string; answer: string }> => {
    const faq: Array<{ question: string; answer: string }> = [];
    const tomorrow = data.daily[1];
    // For weekend view, the daily array is already transformed by weatherService.ts
    // to contain weekend days at indices 0 and 1 (not 5 and 6)
    const weekend = timeframe === 'weekend' ? data.daily.slice(0, 2) : data.daily.slice(5, 7);

    // ========================================================================
    // TODAY TIMEFRAME FAQs
    // ========================================================================
    if (timeframe === 'today') {
        // FAQ 1: Today's rain
        const rainDesc = data.rainProb >= 50 ? 'yağış bekleniyor' :
            data.rainProb >= 20 ? 'yağış olabilir' : 'yağış beklenmiyor';
        const advice = data.rainProb >= 30 ? 'Şemsiyenizi yanınıza alın.' : 'Dış mekan planları yapabilirsiniz.';
        faq.push({
            question: `Bugün ${city}'da yağmur yağacak mı?`,
            answer: `${city}'da bugün ${data.rainProb}% olasılıkla ${rainDesc}. ${advice}`
        });

        // FAQ 2: Today's temperature
        faq.push({
            question: `Bugün ${city}'da hava kaç derece?`,
            answer: `${city}'da bugün en yüksek sıcaklık ${data.high}°, en düşük ${data.low}° olacak. Şu an ${Math.round(data.currentTemp)}°.`
        });

        // FAQ 3: Today's clothing advice
        let clothing = '';
        if (data.high >= 25) {
            clothing = 'Hafif ve açık renkli kıyafetler tercih edin. Güneş kremi unutmayın.';
        } else if (data.high >= 15) {
            clothing = 'İnce bir ceket veya hırka almanızı öneririz.';
        } else if (data.high >= 5) {
            clothing = 'Kat kat giyinmenizi ve mont almanızı öneririz.';
        } else {
            clothing = 'Kalın mont, atkı ve eldiven gerekli. Kış önlemlerinizi alın.';
        }
        faq.push({
            question: `Bugün ${city}'da ne giymeli?`,
            answer: `${city}'da bugün ${data.high}° bekleniyor. ${clothing}`
        });

        // FAQ 4: Feels like (conditional)
        const feelsDiff = Math.abs(data.feelsLike - data.currentTemp);
        if (feelsDiff > 3) {
            const reason = data.feelsLike > data.currentTemp
                ? 'Yüksek nem nedeniyle hava daha sıcak hissediliyor.'
                : 'Rüzgar nedeniyle hava daha soğuk hissediliyor.';
            faq.push({
                question: `${city}'da hissedilen sıcaklık neden farklı?`,
                answer: `${city}'da şu anda ${Math.round(data.currentTemp)}° olmasına rağmen hissedilen ${Math.round(data.feelsLike)}°. ${reason}`
            });
        }
    }

    // ========================================================================
    // TOMORROW TIMEFRAME FAQs
    // ========================================================================
    else if (timeframe === 'tomorrow' && tomorrow) {
        // FAQ 1: Tomorrow rain
        const rainDesc = tomorrow.rainProb >= 50 ? 'yağış bekleniyor' :
            tomorrow.rainProb >= 20 ? 'yağış olabilir' : 'yağış beklenmiyor';
        const advice = tomorrow.rainProb >= 30 ? 'Şemsiyenizi yanınıza alın.' : 'Dış mekan planları yapabilirsiniz.';
        faq.push({
            question: `Yarın ${city}'da yağmur yağacak mı?`,
            answer: `${city}'da yarın ${tomorrow.rainProb}% olasılıkla ${rainDesc}. ${advice}`
        });

        // FAQ 2: Tomorrow temperature
        const diff = tomorrow.high - data.high;
        let comparison = '';
        if (diff >= 2) {
            comparison = `Bugüne göre ${diff}° daha sıcak.`;
        } else if (diff <= -2) {
            comparison = `Bugüne göre ${Math.abs(diff)}° daha serin.`;
        } else {
            comparison = 'Bugünle aynı seviyede.';
        }
        faq.push({
            question: `${city}'da yarın hava kaç derece olacak?`,
            answer: `Yarın ${city}'da en yüksek sıcaklık ${tomorrow.high}°, en düşük ${tomorrow.low}° olacak. ${comparison}`
        });

        // FAQ 3: Tomorrow clothing advice
        let clothing = '';
        if (tomorrow.high >= 25) {
            clothing = 'Hafif ve açık renkli kıyafetler tercih edin. Güneş kremi unutmayın.';
        } else if (tomorrow.high >= 15) {
            clothing = 'İnce bir ceket veya hırka almanızı öneririz.';
        } else if (tomorrow.high >= 5) {
            clothing = 'Kat kat giyinmenizi ve mont almanızı öneririz.';
        } else {
            clothing = 'Kalın mont, atkı ve eldiven gerekli. Kış önlemlerinizi alın.';
        }
        faq.push({
            question: `Yarın ${city}'da ne giymeli?`,
            answer: `${city}'da yarın ${tomorrow.high}° bekleniyor. ${clothing}`
        });

        // FAQ 4: Tomorrow vs Today comparison
        const weatherChange = tomorrow.condition !== data.condition;
        if (weatherChange) {
            faq.push({
                question: `Yarın ${city}'da hava nasıl olacak?`,
                answer: `Yarın ${city}'da ${tomorrow.condition} bekleniyor. Bugünkü ${data.condition} durumundan farklı olacak.`
            });
        }
    }

    // ========================================================================
    // WEEKEND TIMEFRAME FAQs
    // ========================================================================
    else if (timeframe === 'weekend' && weekend.length >= 2) {
        const saturday = weekend[0];
        const sunday = weekend[1];
        const avgHigh = Math.round((saturday.high + sunday.high) / 2);
        const avgLow = Math.round((saturday.low + sunday.low) / 2);
        const maxRainProb = Math.max(saturday.rainProb, sunday.rainProb);

        // FAQ 1: Weekend rain
        const rainDesc = maxRainProb >= 50 ? 'yağış bekleniyor' :
            maxRainProb >= 20 ? 'yağış olabilir' : 'yağış beklenmiyor';
        const advice = maxRainProb >= 30 ? 'Şemsiyenizi yanınıza alın.' : 'Dış mekan aktiviteleri için uygun.';
        faq.push({
            question: `Hafta sonu ${city}'da yağmur yağacak mı?`,
            answer: `${city}'da hafta sonu ${maxRainProb}% olasılıkla ${rainDesc}. ${advice}`
        });

        // FAQ 2: Weekend temperature
        faq.push({
            question: `Hafta sonu ${city}'da hava kaç derece olacak?`,
            answer: `Hafta sonu ${city}'da sıcaklık ${avgHigh}°/${avgLow}° arasında olacak. Cumartesi ${saturday.high}°, Pazar ${sunday.high}°.`
        });

        // FAQ 3: Weekend clothing advice
        let clothing = '';
        if (avgHigh >= 25) {
            clothing = 'Hafif ve açık renkli kıyafetler tercih edin. Güneş kremi unutmayın.';
        } else if (avgHigh >= 15) {
            clothing = 'İnce bir ceket veya hırka almanızı öneririz.';
        } else if (avgHigh >= 5) {
            clothing = 'Kat kat giyinmenizi ve mont almanızı öneririz.';
        } else {
            clothing = 'Kalın mont, atkı ve eldiven gerekli. Kış önlemlerinizi alın.';
        }
        faq.push({
            question: `Hafta sonu ${city}'da ne giymeli?`,
            answer: `${city}'da hafta sonu ortalama ${avgHigh}° bekleniyor. ${clothing}`
        });

        // FAQ 4: Weekend activity recommendation
        const goodWeekend = maxRainProb < 30 && avgHigh >= 10 && avgHigh <= 30;
        faq.push({
            question: `Hafta sonu ${city}'da dışarı çıkılabilir mi?`,
            answer: goodWeekend
                ? `Hafta sonu ${city}'da dış mekan aktiviteleri için uygun hava bekleniyor. Piknik veya gezinti planları yapabilirsiniz.`
                : `Hafta sonu ${city}'da hava koşullarına dikkat edin. ${maxRainProb >= 30 ? 'Yağış ihtimali var.' : avgHigh < 10 ? 'Hava serin olacak.' : 'Hava sıcak olabilir.'}`
        });
    }

    return faq.slice(0, 4); // Max 4 FAQs
};

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

export const generateWeatherCommentary = (
    data: WeatherData,
    timeframe: Timeframe = 'today'
): WeatherCommentary => {
    const city = data.city;
    const metadata = generateMetadata();

    return {
        timeframe,
        city,
        generatedAt: metadata.generatedAt,
        metadata,
        metrics: {
            sicaklik: generateSicaklikCommentary(data, timeframe, city),
            hissedilen: generateHissedilenCommentary(data, timeframe, city),
            bulutOrtusu: generateBulutOrtusuCommentary(data, timeframe, city),
            yagis: generateYagisCommentary(data, timeframe, city),
            ruzgar: generateRuzgarCommentary(data, timeframe, city),
            nem: generateNemCommentary(data, timeframe, city),
            uv: generateUVCommentary(data, timeframe, city),
            hki: generateHKICommentary(data, timeframe, city),
            basinc: generateBasincCommentary(data, timeframe, city),
            gun: generateGunCommentary(data, timeframe, city)
        },
        answerBlock: generateAnswerBlock(data, timeframe, city),
        timeframeBlock: generateTimeframeBlock(data, timeframe, city),
        forecastTable: generateForecastTable(data, timeframe),
        dailySummary: generateDailySummary(data, timeframe, city),
        faq: generateFAQ(data, timeframe, city)
    };
};

export default generateWeatherCommentary;
