/**
 * Province → Island Category Mapping
 * 
 * Each Turkish province is mapped to its PRIMARY island category.
 * Priority order: Traffic > Marine > Ski > Agriculture > Altitude > FireRisk > Tourism
 * 
 * Categories:
 * - traffic: Metro cities with TomTom traffic monitoring
 * - marine: Coastal cities with sea access
 * - ski: Mountain resort cities
 * - agriculture: Farming regions (GAP, Central Anatolia, Çukurova)
 * - altitude: High plateau cities (>1500m avg elevation)
 * - fireRisk: Forest-heavy regions (May-October only)
 * - tourism: Historical/cultural tourism sites
 */

export type IslandCategory =
    | 'traffic'
    | 'marine'
    | 'ski'
    | 'agriculture'
    | 'altitude'
    | 'fireRisk'
    | 'tourism';

interface ProvinceIslandConfig {
    primary: IslandCategory;
    secondary?: IslandCategory;
    elevation?: number; // Average elevation in meters
    hubCity?: string;   // For spoke cities, their regional hub
}

/**
 * Complete mapping of all 81 Turkish provinces to island categories
 */
export const PROVINCE_ISLAND_MAP: Record<string, ProvinceIslandConfig> = {
    // =====================
    // 🚗 TRAFFIC (Metro - 8)
    // =====================
    'İstanbul': { primary: 'traffic', secondary: 'marine' },
    'Ankara': { primary: 'traffic', secondary: 'agriculture' },
    'İzmir': { primary: 'traffic', secondary: 'marine' },
    'Bursa': { primary: 'traffic', secondary: 'marine' },
    'Antalya': { primary: 'traffic', secondary: 'marine' },
    'Adana': { primary: 'traffic', secondary: 'agriculture' },
    'Konya': { primary: 'traffic', secondary: 'agriculture' },
    'Gaziantep': { primary: 'traffic', secondary: 'agriculture' },

    // =====================
    // 🌊 MARINE (Coastal - 20)
    // =====================
    // Aegean
    'Aydın': { primary: 'marine', secondary: 'fireRisk' },
    'Muğla': { primary: 'marine', secondary: 'fireRisk' },
    'Çanakkale': { primary: 'marine', secondary: 'tourism' },
    'Balıkesir': { primary: 'marine', secondary: 'fireRisk' },

    // Mediterranean
    'Mersin': { primary: 'marine', secondary: 'agriculture' },
    'Hatay': { primary: 'marine', secondary: 'tourism' },

    // Black Sea
    'Trabzon': { primary: 'marine', secondary: 'altitude' },
    'Rize': { primary: 'marine', secondary: 'altitude' },
    'Artvin': { primary: 'marine', secondary: 'altitude' },
    'Giresun': { primary: 'marine' },
    'Ordu': { primary: 'marine' },
    'Samsun': { primary: 'marine' },
    'Sinop': { primary: 'marine' },
    'Kastamonu': { primary: 'marine' },
    'Zonguldak': { primary: 'marine' },
    'Bartın': { primary: 'marine' },
    'Düzce': { primary: 'marine' },

    // Marmara
    'Kocaeli': { primary: 'marine', hubCity: 'İstanbul' },
    'Sakarya': { primary: 'marine', hubCity: 'İstanbul' },
    'Tekirdağ': { primary: 'marine', secondary: 'agriculture' },
    'Edirne': { primary: 'agriculture', secondary: 'marine' },
    'Kırklareli': { primary: 'agriculture', secondary: 'marine' },
    'Yalova': { primary: 'marine', hubCity: 'İstanbul' },

    // =====================
    // ⛷️ SKI (Mountain Resorts - 6)
    // =====================
    'Bolu': { primary: 'ski', elevation: 1300 },
    'Erzurum': { primary: 'ski', secondary: 'altitude', elevation: 1900 },
    'Kayseri': { primary: 'ski', secondary: 'agriculture', elevation: 1050 },
    'Erzincan': { primary: 'ski', secondary: 'altitude', elevation: 1185 },
    'Kars': { primary: 'ski', secondary: 'altitude', elevation: 1750 },

    // =====================
    // 🌾 AGRICULTURE (Farming - 25)
    // =====================
    // GAP Region
    'Şanlıurfa': { primary: 'agriculture', secondary: 'tourism' },
    'Diyarbakır': { primary: 'agriculture', secondary: 'tourism' },
    'Mardin': { primary: 'agriculture', secondary: 'tourism' },
    'Siirt': { primary: 'agriculture', elevation: 900 },
    'Batman': { primary: 'agriculture' },
    'Şırnak': { primary: 'agriculture', secondary: 'altitude', elevation: 1400 },
    'Adıyaman': { primary: 'agriculture', secondary: 'tourism' },
    'Malatya': { primary: 'agriculture', elevation: 950 },
    'Elazığ': { primary: 'agriculture', elevation: 1067 },
    'Kilis': { primary: 'agriculture' },

    // Central Anatolia
    'Aksaray': { primary: 'agriculture', secondary: 'tourism' },
    'Karaman': { primary: 'agriculture' },
    'Çorum': { primary: 'agriculture' },
    'Yozgat': { primary: 'agriculture', elevation: 1300 },
    'Kırşehir': { primary: 'agriculture' },
    'Nevşehir': { primary: 'tourism', secondary: 'agriculture' }, // Cappadocia
    'Niğde': { primary: 'agriculture', elevation: 1200 },
    'Kırıkkale': { primary: 'agriculture', hubCity: 'Ankara' },
    'Sivas': { primary: 'agriculture', secondary: 'altitude', elevation: 1285 },
    'Amasya': { primary: 'agriculture' },
    'Tokat': { primary: 'agriculture' },

    // Thrace
    // (Edirne, Tekirdağ, Kırklareli already listed under Marine)

    // Çukurova
    'Osmaniye': { primary: 'agriculture', hubCity: 'Adana' },
    'Kahramanmaraş': { primary: 'agriculture', elevation: 560 },

    // =====================
    // 🏔️ ALTITUDE/COLD (High Plateaus - 12)
    // =====================
    'Van': { primary: 'altitude', elevation: 1725 },
    'Ağrı': { primary: 'altitude', elevation: 1650 },
    'Iğdır': { primary: 'altitude', elevation: 858 },
    'Ardahan': { primary: 'altitude', elevation: 1829 },
    'Hakkari': { primary: 'altitude', elevation: 1720 },
    'Muş': { primary: 'altitude', secondary: 'agriculture', elevation: 1350 },
    'Bitlis': { primary: 'altitude', elevation: 1545 },
    'Bingöl': { primary: 'altitude', elevation: 1150 },
    'Tunceli': { primary: 'altitude', elevation: 930 },
    'Gümüşhane': { primary: 'altitude', elevation: 1210 },
    'Bayburt': { primary: 'altitude', elevation: 1550 },

    // =====================
    // 🔥 FIRE RISK (Forest Regions - 12)
    // =====================
    // (Primary category only for inner regions; coastal ones have marine as primary)
    'Burdur': { primary: 'fireRisk', secondary: 'agriculture' },
    'Isparta': { primary: 'fireRisk', secondary: 'agriculture' },
    'Denizli': { primary: 'fireRisk', secondary: 'tourism' },
    'Afyonkarahisar': { primary: 'fireRisk', secondary: 'agriculture' },
    'Uşak': { primary: 'fireRisk' },
    'Kütahya': { primary: 'fireRisk' },
    'Bilecik': { primary: 'fireRisk' },
    'Eskişehir': { primary: 'fireRisk', secondary: 'agriculture' },
    'Çankırı': { primary: 'fireRisk', secondary: 'agriculture' },
    'Karabük': { primary: 'fireRisk' },

    // =====================
    // 🏛️ TOURISM (Historical Sites - 8)
    // =====================
    // (Nevşehir already listed with tourism primary)
    // Other provinces have tourism as secondary
    'Manisa': { primary: 'agriculture', secondary: 'tourism' },
};

/**
 * Get the island category for a given city/province name
 */
export function getIslandCategory(cityName: string): ProvinceIslandConfig {
    // Normalize the city name
    const normalized = cityName.trim();

    // Direct match
    if (PROVINCE_ISLAND_MAP[normalized]) {
        return PROVINCE_ISLAND_MAP[normalized];
    }

    // Turkish character normalization (ASCII folding)
    // Important: Replace uppercase Turkish chars BEFORE toLowerCase()
    const toAscii = (s: string) => {
        let result = s
            .replace(/İ/g, 'i')  // Turkish uppercase I with dot
            .replace(/I/g, 'i')  // Regular I → i (not ı)
            .replace(/Ğ/g, 'g')
            .replace(/Ş/g, 's')
            .replace(/Ü/g, 'u')
            .replace(/Ö/g, 'o')
            .replace(/Ç/g, 'c');

        return result
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ş/g, 's')
            .replace(/ü/g, 'u')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/ı/g, 'i');
    };

    const normalizedAscii = toAscii(normalized);

    // Try lowercase and ASCII-normalized matching
    for (const [province, config] of Object.entries(PROVINCE_ISLAND_MAP)) {
        if (province.toLowerCase() === normalized.toLowerCase()) {
            return config;
        }
        // ASCII-folded match (e.g., 'Nevsehir' matches 'Nevşehir')
        if (toAscii(province) === normalizedAscii) {
            return config;
        }
    }

    // Default fallback: agriculture (most common)
    return { primary: 'agriculture' };
}

/**
 * Check if fire risk should be active (May-October only)
 */
export function isFireRiskSeason(): boolean {
    const month = new Date().getMonth(); // 0-11
    return month >= 4 && month <= 9; // May (4) to October (9)
}

/**
 * Get all provinces for a specific category
 */
export function getProvincesByCategory(category: IslandCategory): string[] {
    return Object.entries(PROVINCE_ISLAND_MAP)
        .filter(([_, config]) => config.primary === category || config.secondary === category)
        .map(([province]) => province);
}

/**
 * Island category display names (Turkish)
 */
export const ISLAND_CATEGORY_NAMES: Record<IslandCategory, string> = {
    traffic: 'Trafik Durumu',
    marine: 'Deniz Durumu',
    ski: 'Kayak Koşulları',
    agriculture: 'Tarım Durumu',
    altitude: 'Yüksek İrtifa',
    fireRisk: 'Yangın Riski',
    tourism: 'Turizm Konforu',
};

/**
 * Island category icons (emoji)
 */
export const ISLAND_CATEGORY_ICONS: Record<IslandCategory, string> = {
    traffic: '🚗',
    marine: '🌊',
    ski: '⛷️',
    agriculture: '🌾',
    altitude: '🏔️',
    fireRisk: '🔥',
    tourism: '🏛️',
};
