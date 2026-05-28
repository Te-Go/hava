/**
 * Agriculture Service
 * 
 * Fetches soil and agricultural data from Open-Meteo Soil API
 * for farming regions in Turkey.
 * 
 * Data points:
 * - Soil temperature (0-7cm depth)
 * - Soil moisture
 * - Evapotranspiration (irrigation need)
 * - Frost risk calculation
 */

export interface AgricultureData {
    soilTemp: number;           // °C at 0-7cm depth
    soilMoisture: number;       // m³/m³ (0-1 range)
    moistureLabel: 'Kuru' | 'Normal' | 'Islak';
    evapotranspiration: number; // mm/day
    irrigationNeed: 'Yüksek' | 'Orta' | 'Düşük';
    frostRisk: boolean;         // Next 3 days
    frostNights: number;        // Count of frost nights in next 3 days
    plantingAdvice: string;     // Dynamic Turkish advice
    lastUpdated: number;
}

interface OpenMeteoSoilResponse {
    hourly: {
        time: string[];
        soil_temperature_0_to_7cm: number[];
        soil_moisture_0_to_7cm: number[];
        et0_fao_evapotranspiration: number[];
    };
    daily?: {
        time: string[];
        temperature_2m_min: number[];
    };
}

import { fetchWithCache } from './cacheService';

/**
 * Fetch agriculture data for a given location
 */
export async function fetchAgricultureData(
    lat: number,
    lon: number,
    isRaining: boolean = false
): Promise<AgricultureData | null> {
    // Generate cache key
    // Round coordinates to 4 decimals (~11m precision) for cache hits
    const cacheKey = `agri_v1_${lat.toFixed(4)}_${lon.toFixed(4)}`;

    return fetchWithCache(
        cacheKey,
        async () => {
            try {
                // Open-Meteo Soil API endpoint
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                    `&hourly=soil_temperature_0_to_7cm,soil_moisture_0_to_7cm,et0_fao_evapotranspiration` +
                    `&daily=temperature_2m_min` +
                    `&forecast_days=3` +
                    `&timezone=auto`;

                const response = await fetch(url);
                if (!response.ok) throw new Error('Agriculture API failed');

                const data: OpenMeteoSoilResponse = await response.json();

                // Get current hour's data (first entry is most recent)
                const currentHour = new Date().getHours();
                const soilTemp = data.hourly.soil_temperature_0_to_7cm[currentHour] ?? 15;
                const soilMoisture = data.hourly.soil_moisture_0_to_7cm[currentHour] ?? 0.3;
                const evapotranspiration = data.hourly.et0_fao_evapotranspiration[currentHour] ?? 3;

                // Calculate moisture label
                let moistureLabel: AgricultureData['moistureLabel'] = 'Normal';
                if (soilMoisture < 0.2) moistureLabel = 'Kuru';
                else if (soilMoisture > 0.5) moistureLabel = 'Islak';

                // Calculate irrigation need based on evapotranspiration
                let irrigationNeed: AgricultureData['irrigationNeed'] = 'Orta';
                if (evapotranspiration > 5) irrigationNeed = 'Yüksek';
                else if (evapotranspiration < 2) irrigationNeed = 'Düşük';

                // Check frost risk (min temp < 0 in next 3 days)
                const minTemps = data.daily?.temperature_2m_min ?? [];
                const frostNights = minTemps.filter(t => t < 0).length;
                const frostRisk = frostNights > 0;

                // Generate planting advice
                const plantingAdvice = generatePlantingAdvice(soilTemp, moistureLabel, frostRisk, isRaining);

                console.log(`[Agriculture] Fresh data for ${lat},${lon}`);

                return {
                    soilTemp: Math.round(soilTemp * 10) / 10,
                    soilMoisture: Math.round(soilMoisture * 100) / 100,
                    moistureLabel,
                    evapotranspiration: Math.round(evapotranspiration * 10) / 10,
                    irrigationNeed,
                    frostRisk,
                    frostNights,
                    plantingAdvice,
                    lastUpdated: Date.now(),
                };
            } catch (error) {
                console.error('Failed to fetch agriculture data:', error);
                return null;
            }
        },
        60 // 1 Hour TTL
    );
}

/**
 * Generate Turkish planting advice based on conditions
 */
function generatePlantingAdvice(
    soilTemp: number,
    moisture: AgricultureData['moistureLabel'],
    frostRisk: boolean,
    isRaining: boolean
): string {
    if (frostRisk) {
        return 'Don riski var. Hassas bitkileri koruma altına alın.';
    }

    if (soilTemp < 5) {
        return 'Toprak çok soğuk. Ekim için baharı bekleyin.';
    }

    if (soilTemp < 10) {
        return 'Toprak serin. Soğuğa dayanıklı türler ekilebilir.';
    }

    if (isRaining) {
        return 'Yağış var. Sulama yapmanıza gerek yok.';
    }

    if (moisture === 'Kuru') {
        return 'Toprak kuru. Ekim öncesi sulama yapın.';
    }

    if (moisture === 'Islak') {
        return 'Toprak fazla nemli. Kurumasını bekleyin.';
    }

    if (soilTemp >= 15 && soilTemp <= 25) {
        return 'Ekim için ideal koşullar. Çoğu tür ekilebilir.';
    }

    if (soilTemp > 30) {
        return 'Toprak çok sıcak. Öğleden sonra sulama yapın.';
    }

    return 'Tarımsal koşullar normal.';
}

/**
 * Check if a city is an agricultural region
 */
export function isAgricultureRegion(cityName: string): boolean {
    const agricultureProvinces = [
        'Şanlıurfa', 'Diyarbakır', 'Mardin', 'Siirt', 'Batman', 'Şırnak',
        'Adıyaman', 'Malatya', 'Elazığ', 'Kilis', 'Konya', 'Aksaray',
        'Karaman', 'Çorum', 'Yozgat', 'Kırşehir', 'Niğde', 'Kırıkkale',
        'Sivas', 'Amasya', 'Tokat', 'Osmaniye', 'Kahramanmaraş', 'Edirne',
        'Tekirdağ', 'Kırklareli', 'Adana', 'Ankara', 'Gaziantep'
        // Note: Nevşehir excluded - it's a tourism region (Cappadocia)
    ];

    return agricultureProvinces.some(p =>
        p.toLowerCase() === cityName.toLowerCase() ||
        cityName.toLowerCase().includes(p.toLowerCase())
    );
}
