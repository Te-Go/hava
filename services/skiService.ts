import { toSlug } from './weatherService';

export interface SkiData {
    resort: string;
    snowDepth: number;        
    freshSnow24h: number;     
    baseTemp: number;         
    summitTemp: number;       
    liftsOpen: number;        
    liftsTotal: number;       
    avalancheRisk: 'low' | 'moderate' | 'considerable' | 'high';
    snowCondition: 'powder' | 'packed' | 'icy' | 'slushy' | 'closed';
    visibility: 'good' | 'moderate' | 'poor';
    narrative: string;
    lastUpdated: number;
}

export interface SkiResortInfo {
    name: string;
    city: string;
    elevation: { base: number; summit: number };  
    totalLifts: number;
    seasonStart: number;  
    seasonEnd: number;
}

export const SKI_RESORTS: Record<string, SkiResortInfo> = {
    erzurum: { name: 'Palandöken', city: 'Erzurum', elevation: { base: 2200, summit: 3176 }, totalLifts: 14, seasonStart: 11, seasonEnd: 4 },
    kayseri: { name: 'Erciyes', city: 'Kayseri', elevation: { base: 2100, summit: 3400 }, totalLifts: 18, seasonStart: 11, seasonEnd: 4 },
    bursa: { name: 'Uludağ', city: 'Bursa', elevation: { base: 1750, summit: 2543 }, totalLifts: 24, seasonStart: 12, seasonEnd: 3 },
    bolu: { name: 'Kartalkaya', city: 'Bolu', elevation: { base: 1850, summit: 2200 }, totalLifts: 10, seasonStart: 12, seasonEnd: 3 },
    kars: { name: 'Sarıkamış', city: 'Kars', elevation: { base: 2100, summit: 2634 }, totalLifts: 6, seasonStart: 11, seasonEnd: 4 },
    kastamonu: { name: 'Ilgaz', city: 'Kastamonu', elevation: { base: 1800, summit: 2546 }, totalLifts: 8, seasonStart: 12, seasonEnd: 3 },
    antalya: { name: 'Saklıkent', city: 'Antalya', elevation: { base: 1850, summit: 2400 }, totalLifts: 4, seasonStart: 12, seasonEnd: 3 },
    isparta: { name: 'Davraz', city: 'Isparta', elevation: { base: 1650, summit: 2635 }, totalLifts: 6, seasonStart: 12, seasonEnd: 3 }
};

const RESORT_TO_CITY: Record<string, string> = {
    'erciyes': 'kayseri', 'uludag': 'bursa', 'palandoken': 'erzurum', 'kartalkaya': 'bolu', 'sarikamis': 'kars', 'ilgaz': 'kastamonu', 'saklikent': 'antalya', 'davraz': 'isparta'
};

export function hasSkiResort(city: string): boolean {
    const fold = (s: string) => {
        let r = s.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/Ş/g, 's').replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ö/g, 'o').replace(/Ç/g, 'c');
        return r.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').trim();
    };
    return fold(city) in SKI_RESORTS || fold(city) in RESORT_TO_CITY;
}

export function resolveSkiCityKey(city: string): string {
    const fold = (s: string) => {
        let r = s.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/Ş/g, 's').replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ö/g, 'o').replace(/Ç/g, 'c');
        return r.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').trim();
    };
    const cityKey = fold(city);
    if (cityKey in SKI_RESORTS) return cityKey;
    return RESORT_TO_CITY[cityKey] || cityKey;
}

export function calculateSkiConditions(
    cityKey: string,
    currentTemp: number,
    precipitation: number,  
    windSpeed: number,      
    cloudCover: number,     
    snowfallMm: number = 0  
): SkiData | null {
    const resolvedKey = resolveSkiCityKey(cityKey);
    const resort = SKI_RESORTS[resolvedKey];
    if (!resort) return null;

    const month = new Date().getMonth() + 1;
    const inSeason = currentTemp <= 4 && (month >= 11 || month <= 4);

    const elevationDiff = (resort.elevation.summit - resort.elevation.base) / 1000;
    const summitTemp = Math.round(currentTemp - (elevationDiff * 6.5));

    let snowDepth = inSeason ? 75 : 0;
    let freshSnow = (summitTemp <= 0 && precipitation > 0) ? Math.round(precipitation * 10) : 0;
    if (freshSnow > 0) snowDepth += freshSnow;

    const snowCondition = !inSeason ? 'closed' : freshSnow > 15 ? 'powder' : currentTemp > 2 ? 'slushy' : 'packed';
    const avalancheRisk = freshSnow > 30 ? 'high' : freshSnow > 10 ? 'moderate' : 'low';
    const visibility = cloudCover > 80 ? 'poor' : cloudCover > 40 ? 'moderate' : 'good';

    let openLifts = resort.totalLifts;
    if (windSpeed > 50) openLifts = Math.round(resort.totalLifts * 0.2);
    else if (windSpeed > 30) openLifts = Math.round(resort.totalLifts * 0.6);
    if (!inSeason) openLifts = 0;

    let narrative = `${resort.name} merkezinde kar kalınlığı ${snowDepth} cm. `;
    if (inSeason) {
        narrative += `Pistler açık ve kayak için ${snowCondition === 'powder' ? 'harika bir toz kar' : 'uygun koşullar'} mevcut.`;
        if (windSpeed > 40) narrative += ' ⚠️ Kuvvetli rüzgar nedeniyle telesiyej operasyonlarında kısıtlamalar olabilir.';
    } else {
        narrative = `${resort.name} tesisleri şu an sezon dışı olması sebebiyle kapalıdır.`;
    }

    return {
        resort: resort.name,
        snowDepth,
        freshSnow24h: freshSnow,
        baseTemp: currentTemp,
        summitTemp,
        liftsOpen: openLifts,
        liftsTotal: resort.totalLifts,
        avalancheRisk,
        snowCondition,
        visibility,
        narrative,
        lastUpdated: Date.now()
    };
}
