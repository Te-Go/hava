/**
 * Mock SinanWeatherPayload for local development
 * This simulates what WordPress will inject via wp_localize_script
 */

export interface SinanPayload {
    context: {
        city: string;
        cityDisplay: string;
        district: string;
        districtDisplay: string;
        timeframe: string;
        categories: string[];
    };
    modules: {
        showTraffic: boolean;
        showMarine: boolean;
        showSkiConditions: boolean;
        showAgriculture: boolean;
        showAirQuality: boolean;
        showUVIndex: boolean;
        showRegionalSummary: boolean;
    };
    narratives: {
        traffic?: string;
        marine?: string;
        ski?: string;
        agriculture?: string;
        regional?: string;
    };
    current: {
        temp: number;
        condition: string;
        humidity: number;
        windSpeed: number;
    };
    traffic?: {
        congestionLevel: 'low' | 'medium' | 'high' | 'severe';
        mainRoutes: Array<{ name: string; delay: number }>;
    };
    marine?: {
        seaTemp: number;
        waveHeight: number;
        windSpeed: number;
        ferryStatus: 'normal' | 'delayed' | 'cancelled';
    };
    ski?: {
        resort: string;
        snowDepth: number;
        liftsOpen: number;
        liftsTotal: number;
        avalancheRisk: 'low' | 'moderate' | 'considerable' | 'high';
    };
    agriculture?: {
        frostRisk: 'low' | 'medium' | 'high';
        irrigationNeeds: string;
        harvestWindow: string;
    };
    lastUpdated: number;
}

// Mock data for Istanbul (Metro + Coastal)
export const MOCK_ISTANBUL: SinanPayload = {
    context: {
        city: 'istanbul',
        cityDisplay: 'İstanbul',
        district: 'kadikoy',
        districtDisplay: 'Kadıköy',
        timeframe: 'bugun',
        categories: ['metro', 'coastal'],
    },
    modules: {
        showTraffic: true,
        showMarine: true,
        showSkiConditions: false,
        showAgriculture: false,
        showAirQuality: true,
        showUVIndex: false,
        showRegionalSummary: false,
    },
    narratives: {
        traffic: 'Salı akşam trafiği normalden %15 daha yoğun. E-5 ve FSM köprüsünde ciddi gecikme.',
        marine: 'Deniz yüzmeye uygun! Su sıcaklığı 22°C, dalgalar sakin.',
    },
    current: {
        temp: 18,
        condition: 'Parçalı Bulutlu',
        humidity: 65,
        windSpeed: 15,
    },
    traffic: {
        congestionLevel: 'high',
        mainRoutes: [
            { name: 'E-5 (Avcılar-Bakırköy)', delay: 25 },
            { name: 'FSM Köprüsü', delay: 35 },
            { name: 'D-100 (Kadıköy)', delay: 15 },
            { name: '15 Temmuz Köprüsü', delay: 20 },
            { name: 'Bağdat Caddesi', delay: 10 },
            { name: 'TEM (Seyrantepe)', delay: 30 },
        ],
    },
    marine: {
        seaTemp: 22,
        waveHeight: 0.5,
        windSpeed: 12,
        ferryStatus: 'normal',
    },
    lastUpdated: Date.now(),
};

// Mock data for Antalya (Coastal + Tourism)
export const MOCK_ANTALYA: SinanPayload = {
    context: {
        city: 'antalya',
        cityDisplay: 'Antalya',
        district: 'alanya',
        districtDisplay: 'Alanya',
        timeframe: 'bugun',
        categories: ['coastal', 'tourism'],
    },
    modules: {
        showTraffic: false,
        showMarine: true,
        showSkiConditions: false,
        showAgriculture: false,
        showAirQuality: false,
        showUVIndex: true,
        showRegionalSummary: false,
    },
    narratives: {
        marine: 'Mükemmel plaj günü! Deniz 26°C, dalgalar yok denecek kadar az.',
    },
    current: {
        temp: 28,
        condition: 'Güneşli',
        humidity: 55,
        windSpeed: 8,
    },
    marine: {
        seaTemp: 26,
        waveHeight: 0.2,
        windSpeed: 8,
        ferryStatus: 'normal',
    },
    lastUpdated: Date.now(),
};

// Mock data for Erzurum (Mountain)
export const MOCK_ERZURUM: SinanPayload = {
    context: {
        city: 'erzurum',
        cityDisplay: 'Erzurum',
        district: 'palandoken',
        districtDisplay: 'Palandöken',
        timeframe: 'bugun',
        categories: ['mountain'],
    },
    modules: {
        showTraffic: false,
        showMarine: false,
        showSkiConditions: true,
        showAgriculture: false,
        showAirQuality: false,
        showUVIndex: false,
        showRegionalSummary: false,
    },
    narratives: {
        ski: 'Kar kalınlığı 180 cm. Pistler mükemmel durumda, tüm teleferikler açık.',
    },
    current: {
        temp: -5,
        condition: 'Kar Yağışlı',
        humidity: 80,
        windSpeed: 20,
    },
    ski: {
        resort: 'Palandöken',
        snowDepth: 180,
        liftsOpen: 12,
        liftsTotal: 14,
        avalancheRisk: 'low',
    },
    lastUpdated: Date.now(),
};

// Mock data for unknown city (Default fallback)
export const MOCK_DEFAULT: SinanPayload = {
    context: {
        city: 'siirt',
        cityDisplay: 'Siirt',
        district: 'merkez',
        districtDisplay: 'Merkez',
        timeframe: 'bugun',
        categories: ['inland'],
    },
    modules: {
        showTraffic: false,
        showMarine: false,
        showSkiConditions: false,
        showAgriculture: false,
        showAirQuality: false,
        showUVIndex: false,
        showRegionalSummary: true,
    },
    narratives: {
        regional: 'Güneydoğu Anadolu genelinde sıcak ve kurak hava bekleniyor. Gece sıcaklıkları 15°C civarında.',
    },
    current: {
        temp: 25,
        condition: 'Açık',
        humidity: 40,
        windSpeed: 10,
    },
    lastUpdated: Date.now(),
};

// Get mock data based on city
export function getMockPayload(city: string): SinanPayload {
    switch (city) {
        case 'istanbul':
            return { ...MOCK_ISTANBUL, lastUpdated: Date.now() };
        case 'antalya':
            return { ...MOCK_ANTALYA, lastUpdated: Date.now() };
        case 'erzurum':
            return { ...MOCK_ERZURUM, lastUpdated: Date.now() };
        default:
            return { ...MOCK_DEFAULT, lastUpdated: Date.now() };
    }
}

// Inject mock payload into window for development
export function injectMockPayload(city: string = 'istanbul'): void {
    (window as any).SinanWeatherPayload = getMockPayload(city);
    console.log('📦 Mock SinanWeatherPayload injected for:', city);
}
