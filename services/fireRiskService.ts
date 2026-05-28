/**
 * Fire Risk Service
 * 
 * Calculates Fire Weather Index (FWI) for forest-heavy regions.
 * Active only during fire season: May - October.
 */

export interface FireRiskData {
    fireIndex: number;          // 1-5 scale
    riskLevel: 'Düşük' | 'Orta' | 'Yüksek' | 'Çok Yüksek' | 'Aşırı';
    riskColor: string;          // Tailwind color class
    humidity: number;           // %
    windSpeed: number;          // km/h
    precipLast7Days: number;    // mm
    droughtIndicator: boolean;  // No rain in 7 days
    isFireSeason: boolean;      // May-October
    fireAdvice: string;         // Dynamic Turkish advice
    lastUpdated: number;
}

/**
 * Calculate fire risk from weather conditions
 */
export function calculateFireRisk(
    humidity: number,
    windSpeed: number,
    temp: number,
    precipLast7Days: number
): FireRiskData {
    // Check if fire season (May-October)
    const month = new Date().getMonth();
    const isFireSeason = month >= 4 && month <= 9;

    // Calculate raw fire index (0-100)
    // Higher temp, lower humidity, higher wind, less rain = higher risk
    let rawIndex = 0;

    // Temperature factor (0-30)
    rawIndex += Math.min(30, Math.max(0, (temp - 15) * 1.5));

    // Humidity factor (0-30) - inverted
    rawIndex += Math.max(0, 30 - (humidity * 0.4));

    // Wind factor (0-20)
    rawIndex += Math.min(20, windSpeed * 0.5);

    // Drought factor (0-20)
    if (precipLast7Days === 0) rawIndex += 20;
    else if (precipLast7Days < 2) rawIndex += 15;
    else if (precipLast7Days < 5) rawIndex += 10;
    else if (precipLast7Days < 10) rawIndex += 5;

    // Convert to 1-5 scale
    let fireIndex: number;
    let riskLevel: FireRiskData['riskLevel'];
    let riskColor: string;

    if (rawIndex >= 80) {
        fireIndex = 5;
        riskLevel = 'Aşırı';
        riskColor = 'text-red-600';
    } else if (rawIndex >= 60) {
        fireIndex = 4;
        riskLevel = 'Çok Yüksek';
        riskColor = 'text-red-500';
    } else if (rawIndex >= 40) {
        fireIndex = 3;
        riskLevel = 'Yüksek';
        riskColor = 'text-orange-500';
    } else if (rawIndex >= 20) {
        fireIndex = 2;
        riskLevel = 'Orta';
        riskColor = 'text-yellow-500';
    } else {
        fireIndex = 1;
        riskLevel = 'Düşük';
        riskColor = 'text-emerald-500';
    }

    // Drought indicator
    const droughtIndicator = precipLast7Days < 1;

    // Generate fire advice
    const fireAdvice = generateFireAdvice(riskLevel, droughtIndicator, windSpeed, isFireSeason);

    return {
        fireIndex,
        riskLevel,
        riskColor,
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeed),
        precipLast7Days: Math.round(precipLast7Days * 10) / 10,
        droughtIndicator,
        isFireSeason,
        fireAdvice,
        lastUpdated: Date.now(),
    };
}

/**
 * Generate Turkish fire safety advice
 */
function generateFireAdvice(
    riskLevel: FireRiskData['riskLevel'],
    drought: boolean,
    wind: number,
    isSeason: boolean
): string {
    if (!isSeason) {
        return 'Yangın sezonu dışında. Risk düşük.';
    }

    if (riskLevel === 'Aşırı') {
        return 'AŞIRI YANGIN RİSKİ! Ormanlara girmek yasak. Ateş yakmak kesinlikle yasak.';
    }

    if (riskLevel === 'Çok Yüksek') {
        return 'Çok yüksek risk! Orman alanlarından uzak durun. Sigara atmayın.';
    }

    if (riskLevel === 'Yüksek') {
        if (wind > 30) {
            return 'Rüzgar yangın yayılmasını hızlandırabilir. Dikkatli olun.';
        }
        return 'Yüksek risk. Açık ateş yakmayın, cam atıkları bırakmayın.';
    }

    if (drought) {
        return 'Kuraklık var. Orman alanlarında dikkatli olun.';
    }

    if (riskLevel === 'Orta') {
        return 'Orta düzey risk. Ateşle dikkatli olun.';
    }

    return 'Düşük yangın riski. Yine de dikkatli olun.';
}

/**
 * Check if a city is a fire-risk region
 */
export function isFireRiskRegion(cityName: string): boolean {
    const fireRiskProvinces = [
        'Muğla', 'Antalya', 'Aydın', 'İzmir', 'Çanakkale', 'Balıkesir',
        'Burdur', 'Isparta', 'Denizli', 'Mersin', 'Hatay', 'Adana',
        'Afyonkarahisar', 'Uşak', 'Kütahya', 'Bilecik', 'Eskişehir',
        'Çankırı', 'Karabük'
    ];

    return fireRiskProvinces.some(p =>
        p.toLowerCase() === cityName.toLowerCase()
    );
}

/**
 * Check if fire risk should be shown (seasonal)
 */
export function shouldShowFireRisk(): boolean {
    const month = new Date().getMonth();
    return month >= 4 && month <= 9; // May-October
}
