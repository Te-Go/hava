/**
 * Marine Data Service
 * Uses Open-Meteo Marine API (FREE, no API key required)
 * Provides: Sea temperature, wave height, wave period, swell data
 * 
 * IMPORTANT: The Marine API only provides wave data.
 * Sea surface temperature comes from hourly variables.
 */

const MARINE_API_BASE = 'https://marine-api.open-meteo.com/v1/marine';

export interface MarineData {
    seaTemp: number;           // Ocean surface temperature (°C)
    waveHeight: number;        // Significant wave height (m)
    wavePeriod: number;        // Wave period (seconds)
    waveDirection: number;     // Wave direction (degrees)
    swellHeight: number;       // Swell wave height (m)
    windWaveHeight: number;    // Wind-driven wave height (m)
    ferryStatus: 'normal' | 'delayed' | 'cancelled';  // Derived from conditions
    swimSafety: 'safe' | 'caution' | 'dangerous';     // Derived from conditions
    lastUpdated: number;
}

/**
 * COASTAL COORDINATES - Shifted to sea for Marine API
 * Open-Meteo Marine API requires coordinates over water (ocean grid cells).
 * These are pre-calculated points offshore from Turkish coastal cities.
 * Expanded to include all tourist resort towns.
 */
const COASTAL_COORDS: Record<string, { lat: number; lon: number }> = {
    // ===== MARMARA SEA =====
    istanbul: { lat: 40.80, lon: 28.70 },    // Sea of Marmara (west of Istanbul)
    kocaeli: { lat: 40.78, lon: 29.40 },     // Marmara Sea
    bursa: { lat: 40.55, lon: 28.70 },       // Marmara Sea (Mudanya offshore)
    yalova: { lat: 40.60, lon: 29.10 },      // Marmara Sea
    tekirdag: { lat: 40.90, lon: 27.40 },    // Marmara Sea
    balikesir: { lat: 40.20, lon: 26.80 },   // Marmara/Aegean junction
    canakkale: { lat: 39.90, lon: 26.00 },   // Aegean entrance

    // ===== AEGEAN SEA =====
    izmir: { lat: 38.20, lon: 26.20 },       // Aegean Sea (offshore İzmir)
    aydin: { lat: 37.40, lon: 26.80 },       // Aegean (Kuşadası offshore)
    mugla: { lat: 36.80, lon: 27.50 },       // Aegean (Bodrum offshore)

    // Aegean Resort Towns
    cesme: { lat: 38.30, lon: 26.10 },       // Çeşme offshore
    kusadasi: { lat: 37.80, lon: 27.10 },    // Kuşadası offshore
    didim: { lat: 37.30, lon: 27.20 },       // Didim offshore
    bodrum: { lat: 36.90, lon: 27.30 },      // Bodrum offshore
    datca: { lat: 36.70, lon: 27.60 },       // Datça peninsula

    // ===== MEDITERRANEAN =====
    antalya: { lat: 36.40, lon: 30.70 },     // Mediterranean (south of Antalya)
    mersin: { lat: 36.40, lon: 34.50 },      // Mediterranean
    adana: { lat: 36.50, lon: 35.50 },       // Mediterranean
    hatay: { lat: 35.90, lon: 35.80 },       // Mediterranean

    // Mediterranean Resort Towns
    alanya: { lat: 36.30, lon: 32.00 },      // Alanya offshore
    side: { lat: 36.50, lon: 31.40 },        // Side offshore
    belek: { lat: 36.60, lon: 31.00 },       // Belek offshore
    kemer: { lat: 36.50, lon: 30.50 },       // Kemer offshore
    kas: { lat: 36.10, lon: 29.60 },         // Kaş offshore
    kalkan: { lat: 36.20, lon: 29.40 },      // Kalkan offshore

    // Muğla Coast (Mediterranean side)
    marmaris: { lat: 36.70, lon: 28.20 },    // Marmaris offshore
    fethiye: { lat: 36.50, lon: 29.00 },     // Fethiye/Ölüdeniz offshore
    oludeniz: { lat: 36.50, lon: 29.10 },    // Ölüdeniz offshore
    dalyan: { lat: 36.70, lon: 28.60 },      // Dalyan offshore

    // ===== BLACK SEA =====
    samsun: { lat: 41.70, lon: 36.20 },      // Black Sea
    trabzon: { lat: 41.30, lon: 39.60 },     // Black Sea
    rize: { lat: 41.40, lon: 40.60 },        // Black Sea
    sinop: { lat: 42.30, lon: 35.00 },       // Black Sea
    zonguldak: { lat: 41.80, lon: 31.80 },   // Black Sea
    ordu: { lat: 41.30, lon: 37.50 },        // Black Sea
    giresun: { lat: 41.20, lon: 38.50 },     // Black Sea
    artvin: { lat: 41.50, lon: 41.30 },      // Black Sea
    bartin: { lat: 41.80, lon: 32.30 },      // Black Sea
    duzce: { lat: 41.40, lon: 31.10 },       // Black Sea (Akçakoca)
};

/**
 * Normalize city name for lookup
 */
function normalizeCity(city: string): string {
    return city.toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
}

/**
 * Get marine-friendly coordinates for a city
 */
function getMarineCoords(city: string): { lat: number; lon: number } | null {
    const cityKey = normalizeCity(city);
    return COASTAL_COORDS[cityKey] || null;
}

/**
 * Check if a city is coastal
 */
export function isCoastalCity(city: string): boolean {
    const cityKey = normalizeCity(city);
    return cityKey in COASTAL_COORDS;
}

/**
 * Fetch marine data from Open-Meteo Marine API
 * Uses coastal-shifted coordinates for accurate data
 * 
 * @param city - City name (will use pre-defined coastal coords)
 */
import { fetchWithCache } from './cacheService';

/**
 * Fetch marine data from Open-Meteo Marine API
 * Uses coastal-shifted coordinates for accurate data
 * 
 * @param city - City name (will use pre-defined coastal coords)
 */
export async function fetchMarineData(city: string): Promise<MarineData | null> {
    const coords = getMarineCoords(city);

    if (!coords) {
        console.log(`Marine API: ${city} is not a coastal city in our database`);
        return null;
    }

    const cityKey = normalizeCity(city);

    // CACHE WRAPPER: 60 Minutes (Standard Weather Update Cycle)
    return fetchWithCache(
        `marine_v2_${cityKey}`,
        async () => {
            // Note: Open-Meteo Marine API uses different variable names
            // - current: wave_height, wave_direction, wave_period
            // - hourly: sea_surface_temperature (only available as hourly!)
            const params = new URLSearchParams({
                latitude: coords.lat.toString(),
                longitude: coords.lon.toString(),
                current: [
                    'wave_height',
                    'wave_direction',
                    'wave_period',
                    'wind_wave_height',
                    'swell_wave_height'
                ].join(','),
                hourly: 'sea_surface_temperature',  // SST is only hourly
                forecast_days: '1',
                timezone: 'Europe/Istanbul'
            });

            console.log(`Marine API: Fetching data for ${city} at ${coords.lat}, ${coords.lon}`);
            const response = await fetch(`${MARINE_API_BASE}?${params}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Marine API error ${response.status}:`, errorText);

                if (response.status === 400) {
                    console.log(`Marine API: Coordinates for ${city} still not over water - needs further adjustment`);
                    return null;
                }
                throw new Error(`Marine API error: ${response.status}`);
            }

            const data = await response.json();
            const current = data.current;

            // Get current hour's sea surface temperature from hourly data
            const currentHour = new Date().getHours();
            const seaTemp = data.hourly?.sea_surface_temperature?.[currentHour] ?? 18;

            // Derive ferry status from wave height
            const waveHeight = current?.wave_height || 0;
            const ferryStatus = deriveFerryStatus(waveHeight);

            // Derive swim safety from conditions
            const swimSafety = deriveSwimSafety(waveHeight, seaTemp);

            console.log(`Marine API: Success for ${city} - SeaTemp: ${seaTemp}°C, Waves: ${waveHeight}m`);

            return {
                seaTemp: Math.round(seaTemp * 10) / 10,
                waveHeight: Math.round((current?.wave_height || 0) * 10) / 10,
                wavePeriod: Math.round(current?.wave_period || 0),
                waveDirection: current?.wave_direction || 0,
                swellHeight: Math.round((current?.swell_wave_height || 0) * 10) / 10,
                windWaveHeight: Math.round((current?.wind_wave_height || 0) * 10) / 10,
                ferryStatus,
                swimSafety,
                lastUpdated: Date.now()
            };
        },
        60 // 1 Hour TTL
    );
}

/**
 * Derive ferry operational status from wave conditions
 * Based on typical Turkish ferry suspension thresholds
 */
function deriveFerryStatus(waveHeight: number): 'normal' | 'delayed' | 'cancelled' {
    // IDO (Istanbul ferries) typically suspend at 2+ meter waves
    if (waveHeight >= 2.0) return 'cancelled';
    if (waveHeight >= 1.2) return 'delayed';
    return 'normal';
}

/**
 * Derive swimming safety from conditions
 */
function deriveSwimSafety(waveHeight: number, seaTemp: number): 'safe' | 'caution' | 'dangerous' {
    // Safety based on waves
    if (waveHeight >= 1.5) return 'dangerous';
    if (waveHeight >= 0.8) return 'caution';

    // Temperature check
    if (seaTemp < 16) return 'caution'; // Too cold

    return 'safe';
}

/**
 * Generate narrative text for marine conditions
 */
export function generateMarineNarrative(data: MarineData): string {
    const { seaTemp, waveHeight, ferryStatus } = data;

    // Temperature assessment
    let tempDesc = '';
    if (seaTemp >= 24) tempDesc = 'Deniz yüzmeye çok uygun! ';
    else if (seaTemp >= 20) tempDesc = 'Deniz sıcaklığı ideal. ';
    else if (seaTemp >= 16) tempDesc = 'Deniz biraz serin. ';
    else tempDesc = 'Deniz yüzme için soğuk. ';

    // Wave assessment
    let waveDesc = '';
    if (waveHeight < 0.3) waveDesc = 'Dalgalar yok denecek kadar az.';
    else if (waveHeight < 0.8) waveDesc = 'Hafif dalgalar var.';
    else if (waveHeight < 1.5) waveDesc = 'Orta şiddette dalgalar var.';
    else waveDesc = 'Dalgalar yüksek, dikkatli olun.';

    // Ferry alert
    let ferryAlert = '';
    if (ferryStatus === 'cancelled') {
        ferryAlert = ' ⚠️ Vapur seferleri iptal edildi.';
    } else if (ferryStatus === 'delayed') {
        ferryAlert = ' Vapur seferlerinde gecikme olabilir.';
    }

    return `${tempDesc}Su sıcaklığı ${seaTemp}°C. ${waveDesc}${ferryAlert}`;
}

/**
 * Get beach score (0-10) based on conditions
 */
export function calculateBeachScore(data: MarineData, uvIndex: number, airTemp: number): number {
    let score = 10;

    // Wave penalty
    if (data.waveHeight > 1.5) score -= 4;
    else if (data.waveHeight > 0.8) score -= 2;
    else if (data.waveHeight > 0.5) score -= 1;

    // Temperature factors
    if (data.seaTemp < 18) score -= 2;
    if (airTemp < 22) score -= 1;
    if (airTemp > 35) score -= 1; // Too hot

    // UV penalty (severe UV)
    if (uvIndex > 10) score -= 2;
    else if (uvIndex > 8) score -= 1;

    // Ferry issues indicate bad weather
    if (data.ferryStatus === 'cancelled') score -= 3;

    return Math.max(0, Math.min(10, score));
}

// ============================================================
// SEA TEMPERATURE PAGE - New exports for /deniz-suyu-sicakligi
// ============================================================

/**
 * Sea regions with their cities (Turkish names for display)
 */
export type SeaRegion = 'akdeniz' | 'ege' | 'marmara' | 'karadeniz';

export const SEA_REGIONS: Record<SeaRegion, { name: string; emoji: string; cities: string[] }> = {
    akdeniz: {
        name: 'Akdeniz',
        emoji: '',
        cities: ['Antalya', 'Alanya', 'Side', 'Belek', 'Kemer', 'Kaş', 'Kalkan', 'Mersin', 'Adana', 'Hatay', 'Marmaris', 'Fethiye', 'Ölüdeniz', 'Dalyan']
    },
    ege: {
        name: 'Ege Denizi',
        emoji: '',
        cities: ['İzmir', 'Çeşme', 'Kuşadası', 'Didim', 'Bodrum', 'Datça', 'Aydın', 'Muğla']
    },
    marmara: {
        name: 'Marmara Denizi',
        emoji: '',
        cities: ['İstanbul', 'Kocaeli', 'Bursa', 'Yalova', 'Tekirdağ', 'Balıkesir', 'Çanakkale']
    },
    karadeniz: {
        name: 'Karadeniz',
        emoji: '',
        cities: ['Samsun', 'Trabzon', 'Rize', 'Sinop', 'Zonguldak', 'Ordu', 'Giresun', 'Artvin', 'Bartın', 'Düzce']
    }
};

/**
 * Location data for the sea temp page
 */
export interface SeaTempLocation {
    city: string;
    displayName: string;
    region: SeaRegion;
    lat: number;
    lon: number;
    seaTemp: number;
    waveHeight: number;
    swimSafety: 'safe' | 'caution' | 'dangerous';
    ferryStatus: 'normal' | 'delayed' | 'cancelled';
}

/**
 * Get display name (with Turkish characters)
 */
function getDisplayName(cityKey: string): string {
    const displayNames: Record<string, string> = {
        istanbul: 'İstanbul', izmir: 'İzmir', antalya: 'Antalya', mersin: 'Mersin',
        adana: 'Adana', hatay: 'Hatay', alanya: 'Alanya', side: 'Side', belek: 'Belek',
        kemer: 'Kemer', kas: 'Kaş', kalkan: 'Kalkan', marmaris: 'Marmaris',
        fethiye: 'Fethiye', oludeniz: 'Ölüdeniz', dalyan: 'Dalyan', bodrum: 'Bodrum',
        datca: 'Datça', didim: 'Didim', kusadasi: 'Kuşadası', cesme: 'Çeşme',
        aydin: 'Aydın', mugla: 'Muğla', kocaeli: 'Kocaeli', bursa: 'Bursa',
        yalova: 'Yalova', tekirdag: 'Tekirdağ', balikesir: 'Balıkesir',
        canakkale: 'Çanakkale', samsun: 'Samsun', trabzon: 'Trabzon', rize: 'Rize',
        sinop: 'Sinop', zonguldak: 'Zonguldak', ordu: 'Ordu', giresun: 'Giresun',
        artvin: 'Artvin', bartin: 'Bartın', duzce: 'Düzce'
    };
    return displayNames[cityKey] || cityKey.charAt(0).toUpperCase() + cityKey.slice(1);
}

/**
 * Get region for a city key
 */
function getCityRegion(cityKey: string): SeaRegion {
    const regionMap: Record<string, SeaRegion> = {
        // Akdeniz
        antalya: 'akdeniz', alanya: 'akdeniz', side: 'akdeniz', belek: 'akdeniz',
        kemer: 'akdeniz', kas: 'akdeniz', kalkan: 'akdeniz', mersin: 'akdeniz',
        adana: 'akdeniz', hatay: 'akdeniz', marmaris: 'akdeniz', fethiye: 'akdeniz',
        oludeniz: 'akdeniz', dalyan: 'akdeniz',
        // Ege
        izmir: 'ege', cesme: 'ege', kusadasi: 'ege', didim: 'ege', bodrum: 'ege',
        datca: 'ege', aydin: 'ege', mugla: 'ege',
        // Marmara
        istanbul: 'marmara', kocaeli: 'marmara', bursa: 'marmara', yalova: 'marmara',
        tekirdag: 'marmara', balikesir: 'marmara', canakkale: 'marmara',
        // Karadeniz
        samsun: 'karadeniz', trabzon: 'karadeniz', rize: 'karadeniz', sinop: 'karadeniz',
        zonguldak: 'karadeniz', ordu: 'karadeniz', giresun: 'karadeniz',
        artvin: 'karadeniz', bartin: 'karadeniz', duzce: 'karadeniz'
    };
    return regionMap[cityKey] || 'akdeniz';
}

/**
 * Fetch all sea temperatures for the sea temp page
 * Batches requests with a small delay to avoid rate limiting
 */
export async function fetchAllSeaTemperatures(): Promise<SeaTempLocation[]> {
    const results: SeaTempLocation[] = [];
    const cityKeys = Object.keys(COASTAL_COORDS);

    // Batch fetch with Promise.allSettled to handle failures gracefully
    const fetchPromises = cityKeys.map(async (cityKey, index) => {
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 50));

        const coords = COASTAL_COORDS[cityKey];
        const params = new URLSearchParams({
            latitude: coords.lat.toString(),
            longitude: coords.lon.toString(),
            current: 'wave_height,wave_direction,wave_period',
            hourly: 'sea_surface_temperature',
            forecast_days: '1',
            timezone: 'Europe/Istanbul'
        });

        try {
            const response = await fetch(`${MARINE_API_BASE}?${params}`);
            if (!response.ok) return null;

            const data = await response.json();
            const currentHour = new Date().getHours();
            const seaTemp = data.hourly?.sea_surface_temperature?.[currentHour] ?? 18;
            const waveHeight = data.current?.wave_height ?? 0;

            return {
                city: cityKey,
                displayName: getDisplayName(cityKey),
                region: getCityRegion(cityKey),
                lat: coords.lat,
                lon: coords.lon,
                seaTemp: Math.round(seaTemp * 10) / 10,
                waveHeight: Math.round(waveHeight * 10) / 10,
                swimSafety: deriveSwimSafety(waveHeight, seaTemp),
                ferryStatus: deriveFerryStatus(waveHeight)
            } as SeaTempLocation;
        } catch {
            return null;
        }
    });

    const settled = await Promise.allSettled(fetchPromises);
    for (const result of settled) {
        if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
        }
    }

    return results;
}

/**
 * Generate summary text for a sea region
 */
export function generateRegionSummary(region: SeaRegion, locations: SeaTempLocation[]): string {
    const regionLocations = locations.filter(l => l.region === region);
    if (regionLocations.length === 0) return 'Veri yükleniyor...';

    const temps = regionLocations.map(l => l.seaTemp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);

    const safeCount = regionLocations.filter(l => l.swimSafety === 'safe').length;
    const totalCount = regionLocations.length;

    const regionInfo = SEA_REGIONS[region];

    // Temperature assessment
    let tempText: string;
    if (avgTemp >= 24) {
        tempText = `${regionInfo.name} şu an yüzme için ideal sıcaklıkta.`;
    } else if (avgTemp >= 20) {
        tempText = `${regionInfo.name}'de deniz sıcaklığı konforlu.`;
    } else if (avgTemp >= 16) {
        tempText = `${regionInfo.name}'de deniz suyu serin.`;
    } else {
        tempText = `${regionInfo.name}'de deniz suyu soğuk, yüzme için uygun değil.`;
    }

    // Safety assessment
    const safetyText = safeCount === totalCount
        ? 'Tüm bölgelerde yüzme güvenli.'
        : safeCount > totalCount / 2
            ? `${safeCount}/${totalCount} bölgede yüzme güvenli.`
            : 'Dalgalı koşullar nedeniyle denize girerken dikkatli olun.';

    return `${tempText} Sıcaklık ${minTemp}°-${maxTemp}°C arasında. ${safetyText}`;
}
