/**
 * MGM Weather Alerts Service
 * 
 * Fetches weather alerts from Turkish Meteorological Service (Meteoroloji Genel Müdürlüğü)
 * via WordPress proxy endpoint to avoid CORS issues.
 * 
 * @see https://www.mgm.gov.tr/meteouyari/turkiye.aspx
 */

import { TedderConfig } from '../types';

// Alert severity levels matching MGM color codes
export type AlertSeverity = 'yellow' | 'orange' | 'red' | 'none';

// Weather alert types from MGM
export type AlertType =
    | 'storm'      // Fırtına
    | 'rain'       // Yağış
    | 'snow'       // Kar
    | 'frost'      // Don
    | 'heat'       // Sıcak Hava Dalgası
    | 'cold'       // Soğuk Hava Dalgası
    | 'wind'       // Kuvvetli Rüzgar
    | 'fog'        // Yoğun Sis
    | 'avalanche'  // Çığ
    | 'thunderstorm' // Gök Gürültülü Sağanak
    | 'hail'       // Dolu
    | 'dust'       // Toz Fırtınası
    | 'flood';     // Sel/Su Baskını

export interface WeatherAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    cities: string[];        // Affected cities (Turkish names)
    validFrom: string;       // ISO date
    validUntil: string;      // ISO date
    source: 'mgm' | 'local'; // MGM = official, local = app-generated
    url?: string;            // Link to MGM page for details
}

export interface AlertsResponse {
    alerts: WeatherAlert[];
    lastUpdated: string;
    error?: string;
}

// Alert type mappings for display
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
    storm: 'Fırtına',
    rain: 'Kuvvetli Yağış',
    snow: 'Yoğun Kar',
    frost: 'Don',
    heat: 'Sıcak Hava Dalgası',
    cold: 'Soğuk Hava Dalgası',
    wind: 'Kuvvetli Rüzgar',
    fog: 'Yoğun Sis',
    avalanche: 'Çığ Tehlikesi',
    thunderstorm: 'Gök Gürültülü Sağanak',
    hail: 'Dolu',
    dust: 'Toz Fırtınası',
    flood: 'Sel/Su Baskını'
};

export const ALERT_SEVERITY_CONFIG: Record<AlertSeverity, {
    bgClass: string;
    borderClass: string;
    textClass: string;
    iconColor: string;
    label: string;
}> = {
    yellow: {
        bgClass: 'bg-yellow-50 dark:bg-yellow-900/30',
        borderClass: 'border-yellow-200 dark:border-yellow-800',
        textClass: 'text-yellow-800 dark:text-yellow-200',
        iconColor: '#eab308',
        label: 'Dikkat'
    },
    orange: {
        bgClass: 'bg-orange-50 dark:bg-orange-900/30',
        borderClass: 'border-orange-200 dark:border-orange-800',
        textClass: 'text-orange-800 dark:text-orange-200',
        iconColor: '#f97316',
        label: 'Uyarı'
    },
    red: {
        bgClass: 'bg-red-50 dark:bg-red-900/30',
        borderClass: 'border-red-200 dark:border-red-800',
        textClass: 'text-red-800 dark:text-red-200',
        iconColor: '#ef4444',
        label: 'Acil Uyarı'
    },
    none: {
        bgClass: 'bg-slate-50 dark:bg-slate-900/30',
        borderClass: 'border-slate-200 dark:border-slate-800',
        textClass: 'text-slate-800 dark:text-slate-200',
        iconColor: '#64748b',
        label: ''
    }
};

// Get config at runtime
const getConfig = (): TedderConfig => {
    if (typeof window !== 'undefined' && window.TedderConfig) {
        return window.TedderConfig;
    }
    return { isProduction: false };
};

/**
 * Fetch weather alerts from WordPress proxy
 * The proxy endpoint fetches from MGM and caches for 30 minutes
 */
export const fetchWeatherAlerts = async (city?: string): Promise<AlertsResponse> => {
    const config = getConfig();

    // Production: use WordPress proxy
    if (config.apiUrl && config.isProduction) {
        try {
            const endpoint = city
                ? `${config.apiUrl}/alerts?city=${encodeURIComponent(city)}`
                : `${config.apiUrl}/alerts`;

            const response = await fetch(endpoint, {
                headers: config.nonce ? { 'X-WP-Nonce': config.nonce } : {}
            });

            if (!response.ok) throw new Error('MGM proxy request failed');

            const data = await response.json();
            return {
                alerts: data.alerts || [],
                lastUpdated: data.lastUpdated || new Date().toISOString()
            };
        } catch (error) {
            console.warn('MGM alerts fetch failed, using local fallback:', error);
            return { alerts: [], lastUpdated: new Date().toISOString(), error: 'Fetch failed' };
        }
    }

    // Development: return empty (alerts will be generated locally from weather data)
    return { alerts: [], lastUpdated: new Date().toISOString() };
};

/**
 * Generate local alerts from current weather data
 * These supplement MGM alerts when official data is unavailable
 */
export const generateLocalAlerts = (
    city: string,
    currentTemp: number,
    windSpeed: number,
    uvIndex: number,
    rainProb: number,
    weatherCode: string
): WeatherAlert[] => {
    const alerts: WeatherAlert[] = [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Storm alert from weather code
    if (weatherCode === 'storm') {
        alerts.push({
            id: `local-storm-${city}`,
            type: 'storm',
            severity: 'red',
            title: 'Fırtına Uyarısı',
            description: 'Şiddetli hava koşulları bekleniyor. Dışarı çıkmaktan kaçının.',
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    }

    // High wind alert
    if (windSpeed >= 50) {
        alerts.push({
            id: `local-wind-${city}`,
            type: 'wind',
            severity: windSpeed >= 70 ? 'red' : 'orange',
            title: 'Kuvvetli Rüzgar Uyarısı',
            description: `${Math.round(windSpeed)} km/h hızında rüzgar bekleniyor. Balkondaki eşyaları alın.`,
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    } else if (windSpeed >= 40) {
        alerts.push({
            id: `local-wind-${city}`,
            type: 'wind',
            severity: 'yellow',
            title: 'Orta Şiddette Rüzgar',
            description: `${Math.round(windSpeed)} km/h hızında rüzgar bekleniyor.`,
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    }

    // Extreme UV alert
    if (uvIndex >= 11) {
        alerts.push({
            id: `local-uv-${city}`,
            type: 'heat',
            severity: 'red',
            title: 'Aşırı UV Uyarısı',
            description: `UV indeksi ${uvIndex}! Güneşe çıkmayın, yanma süresi 10 dakikadan az.`,
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    } else if (uvIndex >= 8) {
        alerts.push({
            id: `local-uv-${city}`,
            type: 'heat',
            severity: 'orange',
            title: 'Çok Yüksek UV Uyarısı',
            description: `UV indeksi ${uvIndex}. 11:00-16:00 arası güneşten kaçının. SPF50+ kullanın.`,
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    }

    // Extreme cold alert
    if (currentTemp <= -10) {
        alerts.push({
            id: `local-cold-${city}`,
            type: 'cold',
            severity: 'red',
            title: 'Aşırı Soğuk Uyarısı',
            description: `Sıcaklık ${currentTemp}°. Donma tehlikesi var, mümkünse evde kalın.`,
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    } else if (currentTemp <= -5) {
        alerts.push({
            id: `local-frost-${city}`,
            type: 'frost',
            severity: 'orange',
            title: 'Don Tehlikesi',
            description: `Sıcaklık ${currentTemp}°. Yollarda buzlanmaya dikkat edin.`,
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    }

    // Extreme heat alert
    if (currentTemp >= 40) {
        alerts.push({
            id: `local-heat-${city}`,
            type: 'heat',
            severity: 'red',
            title: 'Aşırı Sıcak Uyarısı',
            description: `Sıcaklık ${currentTemp}°! Güneş çarpması riski. Bol sıvı tüketin, evde kalın.`,
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    } else if (currentTemp >= 35) {
        alerts.push({
            id: `local-heat-${city}`,
            type: 'heat',
            severity: 'orange',
            title: 'Sıcak Hava Dalgası',
            description: `Sıcaklık ${currentTemp}°. Gölgede kalın, bol sıvı tüketin.`,
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    }

    // Heavy rain alert
    if (rainProb >= 80 && (weatherCode === 'rain' || weatherCode === 'storm')) {
        alerts.push({
            id: `local-rain-${city}`,
            type: 'rain',
            severity: 'orange',
            title: 'Yoğun Yağış Uyarısı',
            description: `%${rainProb} yağış olasılığı. Su baskını riski olabilir.`,
            cities: [city],
            validFrom: now.toISOString(),
            validUntil: tomorrow.toISOString(),
            source: 'local'
        });
    }

    return alerts;
};

/**
 * Get alerts for a specific city (combines MGM + local)
 */
export const getAlertsForCity = async (
    city: string,
    weatherData?: {
        currentTemp: number;
        windSpeed: number;
        uvIndex: number;
        rainProb: number;
        icon: string;
    }
): Promise<WeatherAlert[]> => {
    // 1. Try to fetch MGM alerts
    const mgmResponse = await fetchWeatherAlerts(city);
    let alerts = mgmResponse.alerts.filter(alert =>
        alert.cities.some(c => c.toLowerCase() === city.toLowerCase())
    );

    // 2. Add local alerts from weather data
    if (weatherData) {
        const localAlerts = generateLocalAlerts(
            city,
            weatherData.currentTemp,
            weatherData.windSpeed,
            weatherData.uvIndex,
            weatherData.rainProb,
            weatherData.icon
        );

        // Merge without duplicates (prefer MGM alerts)
        const mgmTypes = new Set(alerts.map(a => a.type));
        const uniqueLocalAlerts = localAlerts.filter(a => !mgmTypes.has(a.type));
        alerts = [...alerts, ...uniqueLocalAlerts];
    }

    // 3. Sort by severity (red > orange > yellow)
    const severityOrder: Record<AlertSeverity, number> = { red: 0, orange: 1, yellow: 2, none: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
};

export default {
    fetchWeatherAlerts,
    generateLocalAlerts,
    getAlertsForCity,
    ALERT_TYPE_LABELS,
    ALERT_SEVERITY_CONFIG
};
