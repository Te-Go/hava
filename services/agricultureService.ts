import { toSlug } from './weatherService';
import { fetchWithCache } from './cacheService';

export interface AgricultureData {
    soilTemp: number;           
    soilMoisture: number;       
    moistureLabel: 'Kuru' | 'Normal' | 'Islak';
    evapotranspiration: number; 
    irrigationNeed: 'Yüksek' | 'Orta' | 'Düşük';
    frostRisk: boolean;         
    frostNights: number;        
    plantingAdvice: string;     
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

export async function fetchAgricultureData(
    lat: number,
    lon: number,
    isRaining: boolean = false
): Promise<AgricultureData | null> {
    const cacheKey = `agri_v1_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    return fetchWithCache(
        cacheKey,
        async () => {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                    `&hourly=soil_temperature_0_to_7cm,soil_moisture_0_to_7cm,et0_fao_evapotranspiration` +
                    `&daily=temperature_2m_min` +
                    `&forecast_days=3` +
                    `&timezone=auto`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Agriculture API failed');
                const data: OpenMeteoSoilResponse = await response.json();
                const currentHour = new Date().getHours();
                const soilTemp = data.hourly.soil_temperature_0_to_7cm[currentHour] ?? 15;
                const soilMoisture = data.hourly.soil_moisture_0_to_7cm[currentHour] ?? 0.3;
                const evapotranspiration = data.hourly.et0_fao_evapotranspiration[currentHour] ?? 3;

                let moistureLabel: AgricultureData['moistureLabel'] = 'Normal';
                if (soilMoisture < 0.2) moistureLabel = 'Kuru';
                else if (soilMoisture > 0.5) moistureLabel = 'Islak';

                let irrigationNeed: AgricultureData['irrigationNeed'] = 'Orta';
                if (evapotranspiration > 5) irrigationNeed = 'Yüksek';
                else if (evapotranspiration < 2) irrigationNeed = 'Düşük';

                const minTemps = data.daily?.temperature_2m_min ?? [];
                const frostNights = minTemps.filter(t => t < 0).length;
                const frostRisk = frostNights > 0;
                const plantingAdvice = generatePlantingAdvice(soilTemp, moistureLabel, frostRisk, isRaining);

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
        60
    );
}

function generatePlantingAdvice(
    soilTemp: number,
    moisture: AgricultureData['moistureLabel'],
    frostRisk: boolean,
    isRaining: boolean
): string {

if (frostRisk) return 'Don riski var. Hassas bitkileri koruma altına edin.';
if (soilTemp < 5) return 'Toprak çok soğuk. Ekim için baharı bekleyin.';
if (soilTemp < 10) return 'Toprak serin. Soğuğa dayanıklı türler ekilebilir.';
if (isRaining) return 'Yağış var. Sulama yapmanıza gerek yok.';
if (moisture === 'Kuru') return 'Toprak kuru. Ekim öncesi sulama yapın.';
if (moisture === 'Islak') return 'Toprak fazla nemli. Kurumasını bekleyin.';
if (soilTemp >= 15 && soilTemp <= 25) return 'Ekim için ideal koşullar. Çoğu tür ekilebilir.';
if (soilTemp > 30) return 'Toprak çok sıcak. Öğleden sonra sulama yapın.';
return 'Tarımsal koşullar normal.';
}

export function isAgricultureRegion(cityName: string): boolean {
const fold = (s: string) => {
let r = s
.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/Ş/g, 's')
.replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ö/g, 'o')
.replace(/Ç/g, 'c');
return r.toLowerCase()
.replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
.replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
.trim();
};
const normCity = fold(cityName);
const agricultureProvinces = ['Şanlıurfa', 'Diyarbakır', 'Mardin', 'Siirt', 'Batman', 'Şırnak', 'Adıyaman', 'Malatya', 'Elazığ', 'Kilis', 'Konya', 'Aksaray', 'Karaman', 'Çorum', 'Yozgat', 'Kırşehir', 'Niğde', 'Kırıkkale', 'Sivas', 'Amasya', 'Tokat', 'Osmaniye', 'Kahramanmaraş', 'Edirne', 'Tekirdağ', 'Kırklareli', 'Adana', 'Ankara', 'Gaziantep'];
return agricultureProvinces.some(p => fold(p) === normCity);
}
