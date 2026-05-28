/**
 * TomTom Traffic Service
 * Uses TomTom Flow Segment Data API (REAL traffic data)
 * 
 * Free tier: 2,500 requests/day
 * With 10-min caching for 8 cities = ~1,150 requests/day
 */

// API Key should be stored securely - for now passed via config
const TOMTOM_API_BASE = 'https://api.tomtom.com/traffic/services/4/flowSegmentData';

export interface TomTomTrafficData {
    city: string;
    currentSpeed: number;      // km/h
    freeFlowSpeed: number;     // km/h (expected without traffic)
    currentTravelTime: number; // seconds
    freeFlowTravelTime: number;// seconds
    confidence: number;        // 0-1
    roadClosure: boolean;
    congestionLevel: 'low' | 'medium' | 'high' | 'severe';
    congestionPercent: number; // 0-100
    mainRoutes: Array<{
        name: string;
        delay: number;  // minutes
        status: 'normal' | 'slow' | 'congested';
    }>;
    narrative: string;
    lastUpdated: number;
}

// Key traffic points for each city (monitoring points)
// Each point is a major road/intersection coordinate
// Expanded to top 25 Turkish cities by population
const CITY_TRAFFIC_POINTS: Record<string, Array<{ name: string; lat: number; lon: number }>> = {
    // ===== TOP 10 =====
    istanbul: [
        { name: 'E-5 (Bakırköy)', lat: 40.9867, lon: 28.8508 },
        { name: 'FSM Köprüsü', lat: 41.0917, lon: 29.0678 },
        { name: 'D-100 (Kartal)', lat: 40.8922, lon: 29.1967 },
        { name: '15 Temmuz Köprüsü', lat: 41.0458, lon: 29.0342 },
        { name: 'TEM (Seyrantepe)', lat: 41.1064, lon: 28.9925 },
        { name: 'Haliç Köprüsü', lat: 41.0342, lon: 28.9692 },
    ],
    ankara: [
        { name: 'Eskişehir Yolu', lat: 39.9167, lon: 32.7833 },
        { name: 'Konya Yolu', lat: 39.8833, lon: 32.8667 },
        { name: 'İstanbul Yolu', lat: 39.9667, lon: 32.6833 },
        { name: 'Çankaya-Kızılay', lat: 39.9272, lon: 32.8644 },
    ],
    izmir: [
        { name: 'Altınyol', lat: 38.4192, lon: 27.1287 },
        { name: 'Konak-Bornova', lat: 38.4219, lon: 27.1389 },
        { name: 'Çeşme Otoyolu', lat: 38.4331, lon: 27.0892 },
    ],
    bursa: [
        { name: 'İstanbul Yolu', lat: 40.2056, lon: 28.9500 },
        { name: 'Mudanya Yolu', lat: 40.2667, lon: 28.8667 },
        { name: 'Yalova Yolu', lat: 40.2333, lon: 29.0167 },
    ],
    antalya: [
        { name: 'D-400 (Lara)', lat: 36.8533, lon: 30.7267 },
        { name: 'Akdeniz Bulvarı', lat: 36.8867, lon: 30.6983 },
        { name: 'Aspendos Bulvarı', lat: 36.8950, lon: 30.7117 },
    ],
    konya: [
        { name: 'Ankara Yolu', lat: 37.9500, lon: 32.4833 },
        { name: 'Meram Çevreyolu', lat: 37.8500, lon: 32.4500 },
        { name: 'Karaman Yolu', lat: 37.8200, lon: 32.5000 },
    ],
    adana: [
        { name: 'Turhan Cemal Beriker', lat: 37.0017, lon: 35.3289 },
        { name: 'D-400 Mersin', lat: 36.9850, lon: 35.2900 },
        { name: 'Tarsus Otoyolu', lat: 36.9917, lon: 35.3500 },
    ],
    sanliurfa: [
        { name: 'Diyarbakır Yolu', lat: 37.1700, lon: 38.8000 },
        { name: 'Mardin Yolu', lat: 37.1500, lon: 38.8200 },
    ],
    gaziantep: [
        { name: 'İstasyon Caddesi', lat: 37.0628, lon: 37.3783 },
        { name: 'Suburcu Kavşağı', lat: 37.0567, lon: 37.3650 },
        { name: 'Adana Otoyolu', lat: 37.0500, lon: 37.4000 },
    ],
    kocaeli: [
        { name: 'TEM Köprüsü', lat: 40.7658, lon: 29.9308 },
        { name: 'Gebze Çıkışı', lat: 40.8028, lon: 29.4308 },
        { name: 'D-100 Merkez', lat: 40.7650, lon: 29.9200 },
    ],

    // ===== 11-20 =====
    mersin: [
        { name: 'D-400 Merkez', lat: 36.7950, lon: 34.6200 },
        { name: 'Tarsus Yolu', lat: 36.8100, lon: 34.6500 },
    ],
    diyarbakir: [
        { name: 'Elazığ Yolu', lat: 37.9200, lon: 40.2000 },
        { name: 'Mardin Yolu', lat: 37.8800, lon: 40.2200 },
    ],
    hatay: [
        { name: 'Antakya Merkez', lat: 36.2000, lon: 36.1600 },
        { name: 'İskenderun Yolu', lat: 36.5800, lon: 36.1700 },
    ],
    manisa: [
        { name: 'İzmir Yolu', lat: 38.6200, lon: 27.4000 },
        { name: 'Merkez Kavşak', lat: 38.6150, lon: 27.4300 },
    ],
    kayseri: [
        { name: 'Sivas Yolu', lat: 38.7500, lon: 35.5000 },
        { name: 'Erciyes Yolu', lat: 38.7200, lon: 35.4500 },
    ],
    samsun: [
        { name: 'Sahil Yolu', lat: 41.2900, lon: 36.3300 },
        { name: 'Ankara Yolu', lat: 41.2700, lon: 36.3500 },
    ],
    balikesir: [
        { name: 'Bursa Yolu', lat: 39.6500, lon: 27.9000 },
        { name: 'İzmir Yolu', lat: 39.6400, lon: 27.8500 },
    ],
    tekirdag: [
        { name: 'İstanbul Yolu', lat: 41.0000, lon: 27.5500 },
        { name: 'Çorlu Kavşağı', lat: 41.1500, lon: 27.8000 },
    ],
    aydin: [
        { name: 'İzmir Yolu', lat: 37.8500, lon: 27.8200 },
        { name: 'Denizli Yolu', lat: 37.8400, lon: 27.8600 },
    ],
    van: [
        { name: 'Erciş Yolu', lat: 38.5200, lon: 43.3500 },
        { name: 'İran Sınırı Yolu', lat: 38.5000, lon: 43.4500 },
    ],

    // ===== 21-25 =====
    kahramanmaras: [
        { name: 'Gaziantep Yolu', lat: 37.5800, lon: 36.9300 },
        { name: 'Adana Yolu', lat: 37.5600, lon: 36.9500 },
    ],
    sakarya: [
        { name: 'TEM Otoyolu', lat: 40.7400, lon: 30.3500 },
        { name: 'İstanbul Yolu', lat: 40.7500, lon: 30.4000 },
    ],
    mugla: [
        { name: 'Bodrum Yolu', lat: 37.2100, lon: 28.3500 },
        { name: 'Fethiye Yolu', lat: 37.2200, lon: 28.3800 },
    ],
    denizli: [
        { name: 'İzmir Yolu', lat: 37.7800, lon: 29.0700 },
        { name: 'Antalya Yolu', lat: 37.7700, lon: 29.1000 },
    ],
    eskisehir: [
        { name: 'Ankara Yolu', lat: 39.7800, lon: 30.5500 },
        { name: 'Bursa Yolu', lat: 39.7700, lon: 30.5000 },
    ],

    // ===== TOURIST TOWNS (bonus) =====
    alanya: [
        { name: 'D-400 Kaleiçi', lat: 36.5400, lon: 32.0000 },
    ],
    bodrum: [
        { name: 'Turgutreis Yolu', lat: 37.0300, lon: 27.4200 },
    ],
    marmaris: [
        { name: 'İçmeler Yolu', lat: 36.8500, lon: 28.2700 },
    ],
    fethiye: [
        { name: 'Ölüdeniz Yolu', lat: 36.6500, lon: 29.1200 },
    ],
};

/**
 * Fetch traffic data from TomTom Flow Segment Data API
 */
async function fetchTomTomFlowData(
    lat: number,
    lon: number,
    apiKey: string
): Promise<{
    currentSpeed: number;
    freeFlowSpeed: number;
    currentTravelTime: number;
    freeFlowTravelTime: number;
    confidence: number;
    roadClosure: boolean;
} | null> {
    try {
        // TomTom Flow Segment Data endpoint
        // Style: absolute | relative | relative-delay
        // Zoom: 10 for city-level
        const url = `${TOMTOM_API_BASE}/absolute/10/json?key=${apiKey}&point=${lat},${lon}&unit=KMPH`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`TomTom API error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const flow = data.flowSegmentData;

        return {
            currentSpeed: flow.currentSpeed || 0,
            freeFlowSpeed: flow.freeFlowSpeed || 50,
            currentTravelTime: flow.currentTravelTime || 0,
            freeFlowTravelTime: flow.freeFlowTravelTime || 0,
            confidence: flow.confidence || 0,
            roadClosure: flow.roadClosure || false,
        };
    } catch (error) {
        console.error('TomTom fetch failed:', error);
        return null;
    }
}

/**
 * Get traffic data for a city by sampling multiple points
 */
import { fetchWithCache } from './cacheService';

/**
 * Get traffic data for a city by sampling multiple points
 */
export async function fetchTrafficData(
    city: string,
    apiKey: string
): Promise<TomTomTrafficData | null> {
    const cityKey = city.toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');

    const points = CITY_TRAFFIC_POINTS[cityKey];
    if (!points || points.length === 0) {
        console.log(`TomTom: ${city} is not a monitored city`);
        return null;
    }

    // CACHE WRAPPER: 15 Minutes (Balance freshness vs Cost)
    return fetchWithCache(
        `traffic_v2_${cityKey}`,
        async () => {
            console.log(`TomTom: Fetching traffic for ${city} (${points.length} points)`);

            // Fetch data for all monitoring points
            const results = await Promise.all(
                points.map(async (point) => {
                    const data = await fetchTomTomFlowData(point.lat, point.lon, apiKey);
                    return { name: point.name, data };
                })
            );

            // Calculate aggregate statistics
            let totalCurrentSpeed = 0;
            let totalFreeFlowSpeed = 0;
            let validPoints = 0;

            const mainRoutes: TomTomTrafficData['mainRoutes'] = [];

            for (const result of results) {
                if (result.data) {
                    validPoints++;
                    totalCurrentSpeed += result.data.currentSpeed;
                    totalFreeFlowSpeed += result.data.freeFlowSpeed;

                    // Calculate delay for this route
                    const delaySeconds = result.data.currentTravelTime - result.data.freeFlowTravelTime;
                    const delayMinutes = Math.max(0, Math.round(delaySeconds / 60));

                    // Determine status
                    const speedRatio = result.data.currentSpeed / result.data.freeFlowSpeed;
                    let status: 'normal' | 'slow' | 'congested' = 'normal';
                    if (speedRatio < 0.3) status = 'congested';
                    else if (speedRatio < 0.6) status = 'slow';

                    mainRoutes.push({
                        name: result.name,
                        delay: delayMinutes,
                        status
                    });
                }
            }

            if (validPoints === 0) {
                console.error(`TomTom: No valid data for ${city}`);
                return null;
            }

            // Calculate averages
            const avgCurrentSpeed = totalCurrentSpeed / validPoints;
            const avgFreeFlowSpeed = totalFreeFlowSpeed / validPoints;

            // Calculate congestion level
            const speedRatio = avgCurrentSpeed / avgFreeFlowSpeed;
            const congestionPercent = Math.round((1 - speedRatio) * 100);

            let congestionLevel: 'low' | 'medium' | 'high' | 'severe';
            if (speedRatio >= 0.75) congestionLevel = 'low';
            else if (speedRatio >= 0.5) congestionLevel = 'medium';
            else if (speedRatio >= 0.25) congestionLevel = 'high';
            else congestionLevel = 'severe';

            // Sort routes by delay (worst first)
            mainRoutes.sort((a, b) => b.delay - a.delay);

            // Generate narrative
            const narrative = generateTrafficNarrative(city, congestionLevel, mainRoutes);

            console.log(`TomTom: ${city} - ${congestionLevel} (${congestionPercent}% congestion)`);

            return {
                city,
                currentSpeed: Math.round(avgCurrentSpeed),
                freeFlowSpeed: Math.round(avgFreeFlowSpeed),
                currentTravelTime: 0,
                freeFlowTravelTime: 0,
                confidence: 0.9,
                roadClosure: false,
                congestionLevel,
                congestionPercent: Math.max(0, Math.min(100, congestionPercent)),
                mainRoutes: mainRoutes.slice(0, 6), // Top 6 routes
                narrative,
                lastUpdated: Date.now()
            };
        },
        15 // 15 Min TTL
    );
}

/**
 * Generate Turkish traffic narrative
 */
function generateTrafficNarrative(
    city: string,
    level: 'low' | 'medium' | 'high' | 'severe',
    routes: TomTomTrafficData['mainRoutes']
): string {
    const levelDescriptions: Record<string, string> = {
        low: 'akıcı',
        medium: 'yoğun',
        high: 'çok yoğun',
        severe: 'kilitli durumda'
    };

    let narrative = `${city} trafiği ${levelDescriptions[level]}.`;

    // Add worst route info
    const worstRoute = routes[0];
    if (worstRoute && worstRoute.delay > 5) {
        narrative += ` ${worstRoute.name} güzergahında ${worstRoute.delay} dakika gecikme var.`;
    }

    // Count congested routes
    const congestedCount = routes.filter(r => r.status === 'congested').length;
    if (congestedCount > 1) {
        narrative += ` ${congestedCount} ana güzergahta yoğunluk mevcut.`;
    }

    return narrative;
}

/**
 * Check if a city has traffic monitoring
 */
export function hasTrafficMonitoring(city: string): boolean {
    const cityKey = city.toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    return cityKey in CITY_TRAFFIC_POINTS;
}

/**
 * Get list of monitored cities
 */
export function getMonitoredCities(): string[] {
    return Object.keys(CITY_TRAFFIC_POINTS);
}
