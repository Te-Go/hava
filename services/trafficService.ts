/**
 * Traffic Estimation Service
 * Fully algorithmic - no external API required
 * 
 * Uses:
 * 1. Time-of-day patterns (rush hour curves)
 * 2. Day-of-week patterns (weekday vs weekend)
 * 3. Weather conditions (rain increases congestion)
 * 4. City-specific calibration (Istanbul heavier than Ankara)
 */

export interface TrafficData {
    congestionLevel: 'low' | 'medium' | 'high' | 'severe';
    congestionPercent: number;  // 0-100
    mainRoutes: Array<{
        name: string;
        delay: number;  // minutes
        status: 'normal' | 'slow' | 'congested';
    }>;
    averageSpeed: number;  // km/h
    narrative: string;
    lastUpdated: number;
}

// Rush hour curves by hour (0-23)
// Values represent base congestion level 0-100
const WEEKDAY_PATTERN: number[] = [
    5, 5, 5, 5, 10, 25, // 00-05: Night
    45, 75, 85, 60, 40, 35, // 06-11: Morning rush
    40, 45, 40, 45, 55, 80, // 12-17: Afternoon
    90, 75, 55, 35, 20, 10  // 18-23: Evening rush
];

const WEEKEND_PATTERN: number[] = [
    5, 5, 5, 5, 5, 10, // 00-05: Night
    15, 20, 30, 45, 55, 60, // 06-11: Late morning
    55, 50, 45, 50, 55, 60, // 12-17: Afternoon shopping
    55, 45, 35, 25, 15, 10  // 18-23: Evening
];

// City-specific multipliers (Istanbul baseline = 1.0)
const CITY_MULTIPLIERS: Record<string, number> = {
    istanbul: 1.0,
    ankara: 0.7,
    izmir: 0.65,
    bursa: 0.55,
    antalya: 0.5,
    // Other metro cities
    kocaeli: 0.6,
    gaziantep: 0.5,
    adana: 0.45,
};

// Major routes per city
const CITY_ROUTES: Record<string, string[]> = {
    istanbul: [
        'E-5 (Avcılar-Bakırköy)',
        'FSM Köprüsü',
        'D-100 (Kadıköy-Kartal)',
        '15 Temmuz Köprüsü',
        'TEM (Seyrantepe)',
        'Bağdat Caddesi',
        'Fatih Sultan Mehmet Köprüsü Bağlantısı',
        'Haliç Köprüsü'
    ],
    ankara: [
        'Eskişehir Yolu',
        'Konya Yolu',
        'Samsun Yolu',
        'İstanbul Yolu',
        'Çankaya-Kızılay',
        'Atatürk Bulvarı'
    ],
    izmir: [
        'Altınyol',
        'Konak-Bornova',
        'Çeşme Otoyolu',
        'Karşıyaka Sahil',
        'Mavişehir-Alsancak'
    ],
    bursa: [
        'İstanbul Yolu',
        'Yalova Yolu',
        'Mudanya Yolu',
        'FSM Bulvarı'
    ],
    antalya: [
        'D-400 (Lara)',
        'Akdeniz Bulvarı',
        'Aspendos Bulvarı',
        'Konyaaltı Caddesi'
    ],
};

/**
 * Generate realistic traffic data based on time, weather, and city
 */
export function estimateTraffic(
    city: string,
    isRaining: boolean = false,
    isHoliday: boolean = false,
    currentHour?: number
): TrafficData {
    const now = new Date();
    const hour = currentHour ?? now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const cityKey = city.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

    // 1. Get base congestion from time pattern
    const pattern = (isWeekend || isHoliday) ? WEEKEND_PATTERN : WEEKDAY_PATTERN;
    let baseCongestion = pattern[hour];

    // 2. Apply city multiplier
    const cityMultiplier = CITY_MULTIPLIERS[cityKey] || 0.4;
    baseCongestion *= cityMultiplier;

    // 3. Weather adjustment (rain increases traffic by 20-40%)
    if (isRaining) {
        baseCongestion *= 1.3;
    }

    // 4. Add some randomness (±10%)
    const variance = (Math.random() - 0.5) * 20;
    baseCongestion = Math.max(0, Math.min(100, baseCongestion + variance));

    // 5. Determine congestion level
    const congestionLevel = getCongestionLevel(baseCongestion);

    // 6. Generate route delays
    const routes = generateRouteDelays(cityKey, baseCongestion);

    // 7. Calculate average speed
    const averageSpeed = calculateAverageSpeed(baseCongestion);

    // 8. Generate narrative
    const narrative = generateTrafficNarrative(city, congestionLevel, isRaining, isWeekend, hour);

    return {
        congestionLevel,
        congestionPercent: Math.round(baseCongestion),
        mainRoutes: routes,
        averageSpeed,
        narrative,
        lastUpdated: Date.now()
    };
}

function getCongestionLevel(percent: number): 'low' | 'medium' | 'high' | 'severe' {
    if (percent < 25) return 'low';
    if (percent < 50) return 'medium';
    if (percent < 75) return 'high';
    return 'severe';
}

function generateRouteDelays(cityKey: string, baseCongestion: number): TrafficData['mainRoutes'] {
    const routeNames = CITY_ROUTES[cityKey] || CITY_ROUTES.istanbul.slice(0, 4);

    return routeNames.slice(0, 6).map((name, index) => {
        // Each route has slightly different congestion
        const routeVariance = (Math.random() - 0.3) * 30;
        const routeCongestion = Math.max(0, Math.min(100, baseCongestion + routeVariance));

        // Delay calculation: 0-60 minutes based on congestion
        const delay = Math.round((routeCongestion / 100) * 45);

        // Status based on delay
        let status: 'normal' | 'slow' | 'congested' = 'normal';
        if (delay > 20) status = 'congested';
        else if (delay > 10) status = 'slow';

        return { name, delay, status };
    }).sort((a, b) => b.delay - a.delay); // Sort by delay descending
}

function calculateAverageSpeed(congestion: number): number {
    // Normal traffic: ~50 km/h in city
    // Heavy traffic: ~15 km/h
    const baseSpeed = 50;
    const minSpeed = 15;
    return Math.round(baseSpeed - (congestion / 100) * (baseSpeed - minSpeed));
}

function generateTrafficNarrative(
    city: string,
    level: 'low' | 'medium' | 'high' | 'severe',
    isRaining: boolean,
    isWeekend: boolean,
    hour: number
): string {
    const dayType = isWeekend ? 'Hafta sonu' : getDayName();

    // Time of day context
    let timeContext = '';
    if (hour >= 7 && hour <= 9) timeContext = 'sabah';
    else if (hour >= 17 && hour <= 19) timeContext = 'akşam';
    else if (hour >= 12 && hour <= 14) timeContext = 'öğle';

    // Build narrative
    const levelDescriptions: Record<string, string> = {
        low: 'akıcı',
        medium: 'yoğun',
        high: 'çok yoğun',
        severe: 'kilitli'
    };

    let narrative = `${city} trafiği ${timeContext ? timeContext + ' saatlerinde ' : ''}${levelDescriptions[level]} seyrediyor.`;

    if (isRaining) {
        narrative += ' Yağmur nedeniyle sürüş süresi artabilir.';
    }

    if (level === 'severe') {
        narrative += ' Ana arterlerde ciddi gecikmeler var.';
    }

    return narrative;
}

function getDayName(): string {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[new Date().getDay()];
}

/**
 * Check if a city has traffic widget enabled
 */
export function isMetroCity(city: string): boolean {
    const cityKey = city.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g');
    return Object.keys(CITY_MULTIPLIERS).includes(cityKey);
}
