/**
 * Altitude Service
 * 
 * Provides altitude-aware weather data for high plateau regions.
 * Calculates thin air warnings, extreme cold alerts, and road conditions.
 */

export interface AltitudeData {
    elevation: number;          // Meters above sea level
    elevationLabel: string;     // "Yüksek Yayla" / "Dağlık Bölge"
    feelsLike: number;          // °C with wind chill
    minTempTonight: number;     // °C
    freezeWarning: boolean;     // Below 0°C tonight
    thinAirWarning: boolean;    // Altitude > 2000m
    oxygenNote: string;         // Thin air advisory text
    roadCondition: 'Normal' | 'Buzlanma Riski' | 'Kar Var';
    coldAdvice: string;         // Dynamic Turkish advice
    lastUpdated: number;
}

/**
 * Calculate altitude data from weather and elevation
 */
export function calculateAltitudeData(
    elevation: number,
    currentTemp: number,
    feelsLike: number,
    minTempForecast: number[],
    windSpeed: number,
    precipitation: number
): AltitudeData {
    // Get tonight's minimum temperature - handle undefined/NaN values
    const rawMinTemp = minTempForecast[0];
    const minTempTonight = (typeof rawMinTemp === 'number' && !isNaN(rawMinTemp))
        ? rawMinTemp
        : currentTemp - 5;

    // Elevation label
    let elevationLabel = 'Orta Yükseklik';
    if (elevation >= 2000) elevationLabel = 'Yüksek Dağ';
    else if (elevation >= 1500) elevationLabel = 'Yüksek Yayla';
    else if (elevation >= 1000) elevationLabel = 'Yayla';

    // Freeze warning
    const freezeWarning = minTempTonight < 0;

    // Thin air warning (above 2000m)
    const thinAirWarning = elevation >= 2000;
    const oxygenNote = thinAirWarning
        ? `${elevation}m yükseklikte oksijen azalır. Aktiviteye dikkat.`
        : `${elevation}m yükseklikte standart koşullar.`;

    // Road condition based on temp and precipitation
    let roadCondition: AltitudeData['roadCondition'] = 'Normal';
    if (currentTemp < 0 && precipitation > 0) {
        roadCondition = 'Kar Var';
    } else if (currentTemp >= -2 && currentTemp <= 4 && (precipitation > 0 || windSpeed > 20)) {
        roadCondition = 'Buzlanma Riski';
    }

    // Generate cold advice
    const coldAdvice = generateColdAdvice(currentTemp, minTempTonight, elevation, roadCondition);

    return {
        elevation,
        elevationLabel,
        feelsLike: Math.round(feelsLike),
        minTempTonight: Math.round(minTempTonight),
        freezeWarning,
        thinAirWarning,
        oxygenNote,
        roadCondition,
        coldAdvice,
        lastUpdated: Date.now(),
    };
}

/**
 * Generate Turkish cold weather advice
 */
function generateColdAdvice(
    temp: number,
    minTemp: number,
    elevation: number,
    roadCondition: AltitudeData['roadCondition']
): string {
    if (roadCondition === 'Kar Var') {
        return 'Yollarda kar var. Kış lastiği zorunlu, zincir tavsiye edilir.';
    }

    if (roadCondition === 'Buzlanma Riski') {
        return 'Buzlanma riski var. Erken saatlerde dikkatli sürün.';
    }

    if (minTemp < -15) {
        return 'Aşırı soğuk! Dışarı çıkmak tehlikeli olabilir.';
    }

    if (minTemp < -5) {
        return 'Dondurucu soğuk. Kat kat giyinin, uzun süre dışarıda kalmayın.';
    }

    if (minTemp < 0) {
        return 'Gece dondurucu. Borularınızı koruyun, arabanızı kapatmayın.';
    }

    if (elevation >= 2000) {
        return 'Yüksek irtifada hava soğuk ve oksijen düşük. Ağır aktivitelerden kaçının.';
    }

    if (temp < 5) {
        return 'Hava serin. Sıcak giyinin.';
    }

    return 'Yüksek irtifa koşulları normal.';
}

/**
 * Check if a city is a high altitude region
 */
export function isAltitudeRegion(cityName: string): boolean {
    const altitudeProvinces = [
        'Van', 'Kars', 'Ağrı', 'Iğdır', 'Ardahan', 'Erzurum', 'Hakkari',
        'Muş', 'Bitlis', 'Bingöl', 'Tunceli', 'Gümüşhane', 'Bayburt'
    ];

    return altitudeProvinces.some(p =>
        p.toLowerCase() === cityName.toLowerCase()
    );
}

/**
 * Get base elevation for known provinces
 */
export function getProvinceElevation(cityName: string): number {
    const elevations: Record<string, number> = {
        'Van': 1725,
        'Kars': 1750,
        'Ağrı': 1650,
        'Iğdır': 858,
        'Ardahan': 1829,
        'Erzurum': 1900,
        'Hakkari': 1720,
        'Muş': 1350,
        'Bitlis': 1545,
        'Bingöl': 1150,
        'Tunceli': 930,
        'Gümüşhane': 1210,
        'Bayburt': 1550,
    };

    return elevations[cityName] ?? 1000;
}
