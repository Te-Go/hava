/**
 * Tourism Comfort Service
 * 
 * Calculates tourism comfort index for historical/cultural sites.
 * Provides best time to visit and walking advisories.
 */

export interface TourismData {
    comfortIndex: number;       // 1-10 scale
    comfortLabel: 'Mükemmel' | 'İyi' | 'Normal' | 'Zorlayıcı' | 'Uygun Değil';
    comfortColor: string;       // Tailwind color class
    temperature: number;        // °C
    tempLabel: string;          // "Sıcak" / "Serin" etc.
    humidity: number;           // %
    humidityLabel: string;      // "Yapışkan" / "Konforlu"
    uvIndex: number;
    bestTimeToVisit: 'Sabah' | 'Öğleden Sonra' | 'Akşam';
    walkingAdvisory: 'Uygun' | 'Dikkatli' | 'Kaçının';
    crowdEstimate: 'Düşük' | 'Orta' | 'Yüksek';
    tourismAdvice: string;      // Dynamic Turkish advice
    siteName?: string;          // Historical site name
    lastUpdated: number;
}

// Famous historical sites and attractions by province
const HISTORICAL_SITES: Record<string, string> = {
    // UNESCO World Heritage & Major Historical Sites
    'İstanbul': 'Ayasofya ve Topkapı Sarayı',
    'Nevşehir': 'Kapadokya',
    'İzmir': 'Efes Antik Kenti',
    'Denizli': 'Pamukkale ve Hierapolis',
    'Çanakkale': 'Truva Antik Kenti',
    'Şanlıurfa': 'Göbeklitepe',
    'Mardin': 'Mardin Taş Evleri',
    'Hatay': 'Antakya Mozaik Müzesi',
    'Konya': 'Mevlana Müzesi',
    'Bursa': 'Ulu Cami ve Osmanlı Mirası',
    'Edirne': 'Selimiye Camii',
    'Sivas': 'Divriği Ulu Camii',
    'Diyarbakır': 'Sur ve Hevsel Bahçeleri',
    'Adıyaman': 'Nemrut Dağı',

    // Coastal Tourism Hotspots
    'Antalya': 'Aspendos ve Kaleiçi',
    'Muğla': 'Bodrum Kalesi ve Marmaris',
    'Aydın': 'Kuşadası ve Didim',

    // Cultural & Natural Attractions
    'Trabzon': 'Sümela Manastırı',
    'Karabük': 'Safranbolu Evleri',
    'Amasya': 'Kral Kaya Mezarları',
    'Afyonkarahisar': 'Frigya Vadisi',

    // Resort Towns (for secondary lookup)
    'Alanya': 'Alanya Kalesi',
    'Marmaris': 'Marmaris Kalesi',
    'Bodrum': 'Bodrum Kalesi',
    'Fethiye': 'Ölüdeniz ve Kayaköy',
    'Side': 'Side Antik Tiyatrosu',
    'Kaş': 'Antik Lykia',
};

/**
 * Turkish character normalization (ASCII folding)
 * Important: Replace uppercase Turkish chars BEFORE toLowerCase()
 * to avoid locale-dependent issues with İ→i conversion
 */
const toAscii = (s: string) => {
    // First replace uppercase Turkish chars (before toLowerCase)
    let result = s
        .replace(/İ/g, 'i')  // Turkish uppercase I with dot
        .replace(/I/g, 'i')  // Regular I → i (not ı)
        .replace(/Ğ/g, 'g')
        .replace(/Ş/g, 's')
        .replace(/Ü/g, 'u')
        .replace(/Ö/g, 'o')
        .replace(/Ç/g, 'c');

    // Then lowercase and replace remaining Turkish chars
    return result
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/ı/g, 'i');  // Turkish lowercase dotless i
};

/**
 * Get historical site name with Turkish char normalization
 */
function getSiteName(cityName: string): string | undefined {
    // Direct lookup first
    if (HISTORICAL_SITES[cityName]) return HISTORICAL_SITES[cityName];

    // ASCII-folded lookup
    const normalizedCity = toAscii(cityName.trim());
    for (const [province, site] of Object.entries(HISTORICAL_SITES)) {
        if (toAscii(province) === normalizedCity) return site;
    }
    return undefined;
}

/**
 * Calculate tourism comfort from weather conditions
 */
export function calculateTourismComfort(
    temp: number,
    humidity: number,
    uvIndex: number,
    cityName: string
): TourismData {
    // Defensive type coercion to handle undefined/string values
    // Use ?? instead of || to preserve 0 and negative temperatures
    const numTemp = Number(temp);
    const numHumidity = Number(humidity);
    const numUV = Number(uvIndex);
    const safeTemp = isNaN(numTemp) ? 20 : numTemp;
    const safeHumidity = isNaN(numHumidity) ? 50 : numHumidity;
    const safeUV = isNaN(numUV) ? 5 : numUV;


    // Comfort Index Formula:
    // Score = 10 - |Temp - 22| × 0.3 - Humidity × 0.02 - UV × 0.5
    // 22°C is ideal tourist temperature

    let comfortScore = 10;
    comfortScore -= Math.abs(safeTemp - 22) * 0.3;
    comfortScore -= safeHumidity * 0.02;
    comfortScore -= safeUV * 0.3;
    comfortScore = Math.max(1, Math.min(10, comfortScore));

    const comfortIndex = Math.round(comfortScore);

    // Comfort label and color
    let comfortLabel: TourismData['comfortLabel'];
    let comfortColor: string;

    if (comfortIndex >= 8) {
        comfortLabel = 'Mükemmel';
        comfortColor = 'text-emerald-400';
    } else if (comfortIndex >= 6) {
        comfortLabel = 'İyi';
        comfortColor = 'text-green-400';
    } else if (comfortIndex >= 4) {
        comfortLabel = 'Normal';
        comfortColor = 'text-yellow-400';
    } else if (comfortIndex >= 2) {
        comfortLabel = 'Zorlayıcı';
        comfortColor = 'text-orange-400';
    } else {
        comfortLabel = 'Uygun Değil';
        comfortColor = 'text-red-400';
    }

    // Temperature label
    let tempLabel: string;
    if (safeTemp >= 35) tempLabel = 'Çok Sıcak';
    else if (safeTemp >= 28) tempLabel = 'Sıcak';
    else if (safeTemp >= 20) tempLabel = 'Ilık';
    else if (safeTemp >= 12) tempLabel = 'Serin';
    else if (safeTemp >= 5) tempLabel = 'Soğuk';
    else tempLabel = 'Dondurucu';

    // Humidity label
    let humidityLabel: string;
    if (safeHumidity >= 70) humidityLabel = 'Yapışkan';
    else if (safeHumidity >= 50) humidityLabel = 'Nemli';
    else if (safeHumidity >= 30) humidityLabel = 'Konforlu';
    else humidityLabel = 'Kuru';

    // Best time to visit
    let bestTimeToVisit: TourismData['bestTimeToVisit'];
    if (safeTemp >= 30 || safeUV >= 8) {
        bestTimeToVisit = 'Sabah';
    } else if (safeTemp >= 25 || safeUV >= 5) {
        bestTimeToVisit = 'Akşam';
    } else {
        bestTimeToVisit = 'Öğleden Sonra';
    }

    // Walking advisory
    let walkingAdvisory: TourismData['walkingAdvisory'];
    if (safeTemp >= 38 || safeUV >= 10) {
        walkingAdvisory = 'Kaçının';
    } else if (safeTemp >= 32 || safeUV >= 7 || safeTemp <= 0) {
        walkingAdvisory = 'Dikkatli';
    } else {
        walkingAdvisory = 'Uygun';
    }

    // Crowd estimate (seasonal)
    const month = new Date().getMonth();
    let crowdEstimate: TourismData['crowdEstimate'];
    if (month >= 5 && month <= 8) { // June-September
        crowdEstimate = 'Yüksek';
    } else if (month >= 3 && month <= 10) { // April-November
        crowdEstimate = 'Orta';
    } else {
        crowdEstimate = 'Düşük';
    }

    // Get historical site name (with Turkish char normalization)
    const siteName = getSiteName(cityName);

    // Generate tourism advice
    const tourismAdvice = generateTourismAdvice(
        comfortLabel, bestTimeToVisit, walkingAdvisory, siteName
    );

    return {
        comfortIndex,
        comfortLabel,
        comfortColor,
        temperature: Math.round(safeTemp),
        tempLabel,
        humidity: Math.round(safeHumidity),
        humidityLabel,
        uvIndex: Math.round(safeUV),
        bestTimeToVisit,
        walkingAdvisory,
        crowdEstimate,
        tourismAdvice,
        siteName,
        lastUpdated: Date.now(),
    };
}

/**
 * Generate Turkish tourism advice
 */
function generateTourismAdvice(
    comfort: TourismData['comfortLabel'],
    bestTime: TourismData['bestTimeToVisit'],
    walking: TourismData['walkingAdvisory'],
    site?: string
): string {
    const siteMention = site ? `${site} için ` : 'Tarihi alanlar için ';

    if (comfort === 'Mükemmel') {
        return `${siteMention}mükemmel hava! Gün boyu gezebilirsiniz.`;
    }

    if (comfort === 'Uygun Değil') {
        return `${siteMention}hava uygun değil. Başka bir gün planlayın.`;
    }

    if (walking === 'Kaçının') {
        return `${siteMention}aşırı sıcak. Öğle saatlerinde gölgede kalın.`;
    }

    if (bestTime === 'Sabah') {
        return `${siteMention}sabah erken saatler en uygun. 06:00-10:00 arası gidin.`;
    }

    if (bestTime === 'Akşam') {
        return `${siteMention}akşam saatleri ideal. 16:00 sonrası gezin.`;
    }

    return `${siteMention}koşullar uygun. Bol su için ve şapka takın.`;
}

/**
 * Check if a city is a tourism hotspot
 */
export function isTourismRegion(cityName: string): boolean {
    const normalizedCity = toAscii(cityName.trim());

    return Object.keys(HISTORICAL_SITES).some(province => {
        // Try exact lowercase match first
        if (province.toLowerCase() === cityName.toLowerCase()) return true;
        // Try ASCII-folded match (e.g., 'Istanbul' matches 'İstanbul')
        if (toAscii(province) === normalizedCity) return true;
        return false;
    });
}
