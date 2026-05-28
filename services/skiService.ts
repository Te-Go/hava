/**
 * Ski Conditions Service
 * Fully derived from Open-Meteo weather data
 * No external ski API needed
 * 
 * Uses:
 * 1. Accumulated snowfall from precipitation + temperature
 * 2. Temperature trends for snow quality
 * 3. Wind speed for lift operations
 * 4. Weather conditions for avalanche risk estimation
 */

export interface SkiData {
    resort: string;
    snowDepth: number;        // cm (estimated/accumulated)
    freshSnow24h: number;     // cm in last 24 hours
    baseTemp: number;         // Temperature at base
    summitTemp: number;       // Temperature at summit (estimated)
    liftsOpen: number;        // Number of lifts operational
    liftsTotal: number;       // Total lifts at resort
    avalancheRisk: 'low' | 'moderate' | 'considerable' | 'high';
    snowCondition: 'powder' | 'packed' | 'icy' | 'slushy' | 'closed';
    visibility: 'good' | 'moderate' | 'poor';
    narrative: string;
    lastUpdated: number;
}

// Turkish ski resorts with metadata
export interface SkiResortInfo {
    name: string;
    city: string;
    elevation: { base: number; summit: number };  // meters
    totalLifts: number;
    seasonStart: number;  // Month (1-12)
    seasonEnd: number;
}

export const SKI_RESORTS: Record<string, SkiResortInfo> = {
    erzurum: {
        name: 'Palandöken',
        city: 'Erzurum',
        elevation: { base: 2200, summit: 3176 },
        totalLifts: 14,
        seasonStart: 11,
        seasonEnd: 4
    },
    kayseri: {
        name: 'Erciyes',
        city: 'Kayseri',
        elevation: { base: 2100, summit: 3400 },
        totalLifts: 18,
        seasonStart: 11,
        seasonEnd: 4
    },
    bursa: {
        name: 'Uludağ',
        city: 'Bursa',
        elevation: { base: 1750, summit: 2543 },
        totalLifts: 24,
        seasonStart: 12,
        seasonEnd: 3
    },
    bolu: {
        name: 'Kartalkaya',
        city: 'Bolu',
        elevation: { base: 1850, summit: 2200 },
        totalLifts: 10,
        seasonStart: 12,
        seasonEnd: 3
    },
    kars: {
        name: 'Sarıkamış',
        city: 'Kars',
        elevation: { base: 2100, summit: 2634 },
        totalLifts: 6,
        seasonStart: 11,
        seasonEnd: 4
    },
    kastamonu: {
        name: 'Ilgaz',
        city: 'Kastamonu',
        elevation: { base: 1800, summit: 2546 },
        totalLifts: 8,
        seasonStart: 12,
        seasonEnd: 3
    },
    antalya: {
        name: 'Saklıkent',
        city: 'Antalya',
        elevation: { base: 1850, summit: 2400 },
        totalLifts: 4,
        seasonStart: 12,
        seasonEnd: 3
    },
    isparta: {
        name: 'Davraz',
        city: 'Isparta',
        elevation: { base: 1650, summit: 2635 },
        totalLifts: 6,
        seasonStart: 12,
        seasonEnd: 3
    }
};

// Reverse lookup: Resort name slugs → city keys
// Allows hasSkiResort() and resolveSkiCityKey() to work with resort names too
const RESORT_TO_CITY: Record<string, string> = {
    'erciyes': 'kayseri',
    'uludag': 'bursa',
    'palandoken': 'erzurum',
    'kartalkaya': 'bolu',
    'sarikamis': 'kars',
    'ilgaz': 'kastamonu',
    'saklikent': 'antalya',
    'davraz': 'isparta',
};

/**
 * Calculate ski conditions from weather data
 */
export function calculateSkiConditions(
    cityKey: string,
    currentTemp: number,
    precipitation: number,  // mm in last 24h
    windSpeed: number,      // km/h
    cloudCover: number,     // 0-100%
    snowfallMm: number = 0  // If available from API
): SkiData | null {
    const resort = SKI_RESORTS[cityKey];
    if (!resort) return null;

    // Check if in season
    const month = new Date().getMonth() + 1;
    const inSeason = isInSeason(resort.seasonStart, resort.seasonEnd, month);

    // Calculate summit temperature (roughly -6.5°C per 1000m altitude gain)
    const elevationDiff = (resort.elevation.summit - resort.elevation.base) / 1000;
    const summitTemp = Math.round(currentTemp - (elevationDiff * 6.5));

    // Estimate snow depth based on precipitation + temperature
    // 1mm rain at freezing = ~10mm snow
    let snowDepth = 0;
    let freshSnow = 0;

    if (summitTemp <= 0 && precipitation > 0) {
        // Fresh snow estimation
        freshSnow = Math.round(precipitation * 10); // 1mm water = 10mm snow
        // Accumulated snow (simplified model - real data would accumulate over season)
        snowDepth = calculateSeasonalSnowDepth(month, resort.elevation.summit, freshSnow);
    } else if (inSeason) {
        // Default seasonal snow depth even without precipitation
        snowDepth = calculateSeasonalSnowDepth(month, resort.elevation.summit, 0);
    }

    // Calculate conditions
    const snowCondition = getSnowCondition(summitTemp, freshSnow, snowDepth, inSeason);
    const avalancheRisk = calculateAvalancheRisk(freshSnow, windSpeed, summitTemp);
    const visibility = getVisibility(cloudCover, windSpeed);

    // Calculate operational lifts based on conditions
    const liftsOpen = calculateOpenLifts(
        resort.totalLifts,
        snowDepth,
        windSpeed,
        visibility,
        snowCondition
    );

    // Generate narrative
    const narrative = generateSkiNarrative(
        resort.name,
        snowDepth,
        freshSnow,
        snowCondition,
        avalancheRisk,
        liftsOpen,
        resort.totalLifts
    );

    return {
        resort: resort.name,
        snowDepth,
        freshSnow24h: freshSnow,
        baseTemp: currentTemp,
        summitTemp,
        liftsOpen,
        liftsTotal: resort.totalLifts,
        avalancheRisk,
        snowCondition,
        visibility,
        narrative,
        lastUpdated: Date.now()
    };
}

function isInSeason(start: number, end: number, current: number): boolean {
    if (start <= end) {
        return current >= start && current <= end;
    }
    // Season spans New Year (e.g., Nov-Apr)
    return current >= start || current <= end;
}

function calculateSeasonalSnowDepth(month: number, elevation: number, freshSnow: number): number {
    // Base snow depth by month and elevation
    const monthFactors: Record<number, number> = {
        11: 0.3, // November: early season
        12: 0.6, // December: building
        1: 1.0,  // January: peak
        2: 1.0,  // February: peak
        3: 0.7,  // March: melting starts
        4: 0.3,  // April: spring skiing
    };

    const factor = monthFactors[month] || 0;
    const elevationBonus = Math.max(0, (elevation - 2000) / 10); // +1cm per 10m above 2000m

    // Base depth: 50-200cm depending on elevation and month
    const baseDepth = (50 + elevationBonus) * factor;

    return Math.round(baseDepth + freshSnow);
}

function getSnowCondition(
    temp: number,
    freshSnow: number,
    totalSnow: number,
    inSeason: boolean
): SkiData['snowCondition'] {
    if (!inSeason || totalSnow < 30) return 'closed';
    if (freshSnow > 20 && temp < -5) return 'powder';
    if (temp > 0) return 'slushy';
    if (temp < -15) return 'icy';
    return 'packed';
}

function calculateAvalancheRisk(
    freshSnow: number,
    windSpeed: number,
    temp: number
): SkiData['avalancheRisk'] {
    let riskScore = 0;

    // Fresh snow increases risk
    if (freshSnow > 50) riskScore += 3;
    else if (freshSnow > 30) riskScore += 2;
    else if (freshSnow > 15) riskScore += 1;

    // High wind increases risk (wind loading)
    if (windSpeed > 50) riskScore += 2;
    else if (windSpeed > 30) riskScore += 1;

    // Temperature near 0 increases instability
    if (temp > -3 && temp < 2) riskScore += 1;

    if (riskScore >= 4) return 'high';
    if (riskScore >= 3) return 'considerable';
    if (riskScore >= 1) return 'moderate';
    return 'low';
}

function getVisibility(cloudCover: number, windSpeed: number): SkiData['visibility'] {
    if (cloudCover > 80 || windSpeed > 50) return 'poor';
    if (cloudCover > 50 || windSpeed > 30) return 'moderate';
    return 'good';
}

function calculateOpenLifts(
    total: number,
    snowDepth: number,
    windSpeed: number,
    visibility: string,
    condition: string
): number {
    if (condition === 'closed') return 0;

    let openPercent = 1.0;

    // Reduce for poor conditions
    if (snowDepth < 50) openPercent *= 0.5;
    if (windSpeed > 60) openPercent *= 0.3;  // Most lifts close
    else if (windSpeed > 40) openPercent *= 0.6;
    if (visibility === 'poor') openPercent *= 0.7;

    return Math.max(1, Math.round(total * openPercent));
}

function generateSkiNarrative(
    resortName: string,
    snowDepth: number,
    freshSnow: number,
    condition: string,
    avalanche: string,
    liftsOpen: number,
    liftsTotal: number
): string {
    if (condition === 'closed') {
        return `${resortName} şu an kapalı. Yeterli kar yok.`;
    }

    let narrative = `Kar kalınlığı ${snowDepth} cm. `;

    if (freshSnow > 10) {
        narrative += `Son 24 saatte ${freshSnow} cm taze kar yağdı! `;
    }

    const conditionDescriptions: Record<string, string> = {
        powder: 'Pistler mükemmel durumda, toz kar var.',
        packed: 'Pistler iyi durumda.',
        icy: 'Buzlanma var, dikkatli kayın.',
        slushy: 'Kar erimeye başladı, sabah saatleri ideal.'
    };

    narrative += conditionDescriptions[condition] || '';

    if (liftsOpen < liftsTotal) {
        narrative += ` ${liftsOpen}/${liftsTotal} teleferik açık.`;
    } else {
        narrative += ' Tüm teleferikler açık.';
    }

    if (avalanche === 'high') {
        narrative += ' ⚠️ Çığ riski yüksek!';
    }

    return narrative;
}

// Normalize Turkish characters for key lookup
function normalizeSkiKey(str: string): string {
    return str.toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
}

/**
 * Check if city (or resort name) has a ski resort
 */
export function hasSkiResort(city: string): boolean {
    const cityKey = normalizeSkiKey(city);
    return cityKey in SKI_RESORTS || cityKey in RESORT_TO_CITY;
}

/**
 * Resolve a resort name slug (e.g. 'erciyes') to its city key (e.g. 'kayseri')
 * If already a city key, returns it as-is.
 */
export function resolveSkiCityKey(city: string): string {
    const cityKey = normalizeSkiKey(city);
    if (cityKey in SKI_RESORTS) return cityKey;
    return RESORT_TO_CITY[cityKey] || cityKey;
}
