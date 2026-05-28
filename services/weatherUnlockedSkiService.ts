import { SkiData, SKI_RESORTS, calculateSkiConditions } from './skiService';

// Resort Map (User Provided IDs) - keyed by RESORT name
const RESORT_IDS: Record<string, string> = {
    'uludag': '54887323',
    'erciyes': '54887317',
    'palandoken': '54887319',
    'kartalkaya': '54887315',
    'sarikamis': '54888529',
    'davraz': '54888519',
    'saklikent': '54888733',
    'ilgaz': '54888525',
    'konakli': '54888527',
    'spil': '54887321', // Spil Mountain
};

// Map CITY names to RESORT names (for hasSkiResort() compatibility)
const CITY_TO_RESORT: Record<string, string> = {
    'bursa': 'uludag',
    'kayseri': 'erciyes',
    'erzurum': 'palandoken',
    'bolu': 'kartalkaya',
    'kars': 'sarikamis',
    'isparta': 'davraz',
    'antalya': 'saklikent',
    'kastamonu': 'ilgaz',
    'manisa': 'spil',
};

// Normalize Turkish characters
function normalizeKey(str: string): string {
    return str.toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
}

import { fetchWithCache } from './cacheService';

export async function fetchWeatherUnlockedSki(city: string): Promise<SkiData | null> {
    const cityKey = normalizeKey(city);

    // First, try direct resort lookup (e.g., 'uludag' passed directly)
    let resortKey = RESORT_IDS[cityKey] ? cityKey : null;

    // If not found, try city-to-resort mapping (e.g., 'bursa' → 'uludag')
    if (!resortKey && CITY_TO_RESORT[cityKey]) {
        resortKey = CITY_TO_RESORT[cityKey];
    }

    // If still not found, return null
    if (!resortKey) {
        console.log(`[Ski] No resort mapping for: ${cityKey}`);
        return null;
    }

    const resortId = RESORT_IDS[resortKey];
    if (!resortId) {
        console.log(`[Ski] No API ID for resort: ${resortKey}`);
        return null;
    }

    // CACHE WRAPPER: 12 Hours (720 minutes)
    return fetchWithCache(
        `ski_resort_${resortId}`,
        async () => {
            const url = `/wp-json/sinan/v1/ski?id=${resortId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Proxy error');

            const data = await response.json();
            const forecast = data.forecast?.[0]; // Today's forecast
            if (!forecast) throw new Error('No forecast data');

            // Map forecast data to SkiData model
            const baseTemp = forecast.base?.temp_c ?? 0;
            const freshSnow = forecast.base?.fresh_snow_cm ?? 0;
            const weatherCode = forecast.base?.wx_code ?? 0;
            const conditions = getWeatherCondition(weatherCode);

            return {
                resort: getProjectedResortName(resortKey!), // assert non-null
                snowDepth: freshSnow, // API gives fresh snow, assume baseline
                freshSnow24h: freshSnow,
                baseTemp: baseTemp,
                summitTemp: baseTemp - 6, // Estimate
                liftsOpen: 0,
                liftsTotal: SKI_RESORTS[cityKey]?.totalLifts || 10,
                avalancheRisk: 'moderate',
                snowCondition: freshSnow > 10 ? 'powder' : 'packed',
                visibility: 'good',
                narrative: `${getProjectedResortName(resortKey!)}: ${freshSnow}cm taze kar. ${conditions.text}.`,
                lastUpdated: Date.now()
            };
        },
        720 // 12 Hours TTL
    ).catch(e => {
        console.warn('[Ski] API fetch failed, using calculated fallback:', e);
        // FALLBACK
        const resort = SKI_RESORTS[cityKey];
        if (resort) {
            return calculateSkiConditions(
                cityKey, -5, 5, 20, 50, 10
            );
        }
        return null;
    });
}

function getProjectedResortName(key: string): string {
    const names: Record<string, string> = {
        'uludag': 'Uludağ',
        'erciyes': 'Erciyes',
        'palandoken': 'Palandöken',
        'kartalkaya': 'Kartalkaya',
        'sarikamis': 'Sarıkamış',
        'davraz': 'Davraz',
        'saklikent': 'Saklıkent',
        'ilgaz': 'Ilgaz',
    };
    return names[key] || key;
}

function getWeatherCondition(code: number): { text: string; icon: any } {
    // Basic mapping for Weather Unlocked codes (0-3 clear, 50+ snow)
    if (code >= 50) return { text: 'Kar Yağışlı', icon: 'snow' };
    if (code >= 20) return { text: 'Bulutlu', icon: 'cloud' };
    return { text: 'Açık', icon: 'sun' };
}

