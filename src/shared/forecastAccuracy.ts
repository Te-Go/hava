/**
 * Forecast Accuracy Module
 * 
 * Tracks yesterday's forecast vs actual weather to generate
 * accountability commentary - an EEAT "Gold" feature.
 * 
 * This shows editorial accountability and expertise by
 * acknowledging when forecasts were off.
 * 
 * @version 1.0.0
 */

import { WeatherData, DailyForecast } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface StoredForecast {
    city: string;
    date: string;           // YYYY-MM-DD
    forecastHigh: number;
    forecastLow: number;
    forecastRainProb: number;
    forecastCondition: string;
    storedAt: string;       // ISO timestamp
}

export interface ActualWeather {
    date: string;           // YYYY-MM-DD
    actualHigh: number;
    actualLow: number;
    hadRain: boolean;
    actualCondition: string;
}

export interface ForecastComparison {
    date: string;
    city: string;
    highVariance: number;   // actual - forecast (positive = warmer than expected)
    lowVariance: number;
    rainAccuracy: 'hit' | 'miss-positive' | 'miss-negative' | 'unknown';
    commentary: string | null;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEY_PREFIX = 'weather_forecast_';

/**
 * Normalize Turkish characters to ASCII for consistent storage keys.
 * İ/ı → i, Ğ/ğ → g, Ş/ş → s, Ü/ü → u, Ö/ö → o, Ç/ç → c
 */
const normalizeTurkishString = (str: string): string => {
    return str
        .toLowerCase()
        .replace(/İ/gi, 'i')  // Turkish capital I with dot
        .replace(/ı/g, 'i')    // Turkish lowercase dotless i
        .replace(/ğ/g, 'g')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        // Handle combining characters that may result from normalization
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
        .replace(/\s+/g, '_');
};

const getStorageKey = (city: string, date: string): string => {
    const normalizedCity = normalizeTurkishString(city);
    return `${STORAGE_KEY_PREFIX}${normalizedCity}_${date}`;
};

// ============================================================================
// DATE HELPERS
// ============================================================================

const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
};

const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

/**
 * Store today's forecast for tomorrow (to compare tomorrow)
 */
export const storeTomorrowForecast = (data: WeatherData): void => {
    const tomorrow = data.daily[1];
    if (!tomorrow) return;

    const forecast: StoredForecast = {
        city: data.city,
        date: getTomorrowDate(),
        forecastHigh: Math.round(tomorrow.high),
        forecastLow: Math.round(tomorrow.low),
        forecastRainProb: tomorrow.rainProb,
        forecastCondition: tomorrow.condition,
        storedAt: new Date().toISOString()
    };

    try {
        const key = getStorageKey(data.city, forecast.date);
        localStorage.setItem(key, JSON.stringify(forecast));
    } catch (e) {
        console.warn('Failed to store forecast:', e);
    }
};

/**
 * Retrieve yesterday's stored forecast
 */
export const getYesterdayForecast = (city: string): StoredForecast | null => {
    try {
        const key = getStorageKey(city, getTodayDate()); // Yesterday's "tomorrow" = today
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        return JSON.parse(stored) as StoredForecast;
    } catch (e) {
        console.warn('Failed to retrieve forecast:', e);
        return null;
    }
};

/**
 * Clean up old forecasts (older than 7 days)
 */
export const cleanupOldForecasts = (): void => {
    try {
        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
        const cutoffDate = cutoff.toISOString().split('T')[0];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
                // Extract date from key
                const parts = key.split('_');
                const dateStr = parts[parts.length - 1];
                if (dateStr < cutoffDate) {
                    localStorage.removeItem(key);
                }
            }
        }
    } catch (e) {
        console.warn('Failed to cleanup forecasts:', e);
    }
};

// ============================================================================
// COMPARISON LOGIC
// ============================================================================

/**
 * Compare yesterday's forecast with today's actual weather.
 * 
 * Note: We compare yesterday's "tomorrow forecast" with today's actual values.
 * The actual values come from today's WeatherData (the current conditions).
 */
export const compareForecastToActual = (
    storedForecast: StoredForecast,
    actualHigh: number,
    actualLow: number,
    hadRain: boolean
): ForecastComparison => {
    const highVariance = Math.round(actualHigh) - storedForecast.forecastHigh;
    const lowVariance = Math.round(actualLow) - storedForecast.forecastLow;

    // Rain accuracy
    const predictedRain = storedForecast.forecastRainProb >= 50;
    let rainAccuracy: ForecastComparison['rainAccuracy'] = 'unknown';

    if (predictedRain && hadRain) {
        rainAccuracy = 'hit';
    } else if (!predictedRain && !hadRain) {
        rainAccuracy = 'hit';
    } else if (predictedRain && !hadRain) {
        rainAccuracy = 'miss-positive'; // Predicted rain but didn't rain
    } else if (!predictedRain && hadRain) {
        rainAccuracy = 'miss-negative'; // Didn't predict but rained
    }

    return {
        date: storedForecast.date,
        city: storedForecast.city,
        highVariance,
        lowVariance,
        rainAccuracy,
        commentary: null // Will be filled by generateAccuracyCommentary
    };
};

// ============================================================================
// COMMENTARY GENERATION
// ============================================================================

/**
 * Generate Turkish accountability commentary based on forecast comparison.
 * Returns null if the variance is not notable (±1°).
 */
export const generateAccuracyCommentary = (
    comparison: ForecastComparison
): string | null => {
    const { highVariance, lowVariance, rainAccuracy, city } = comparison;
    const parts: string[] = [];

    // Temperature commentary (only if variance >= 2°)
    if (Math.abs(highVariance) >= 2) {
        if (highVariance > 0) {
            parts.push(`Dünkü tahminlere göre en yüksek sıcaklık ${highVariance}° daha yüksek gerçekleşti.`);
        } else {
            parts.push(`Dünkü tahminlere göre en yüksek sıcaklık ${Math.abs(highVariance)}° daha düşük gerçekleşti.`);
        }
    } else if (Math.abs(lowVariance) >= 2) {
        if (lowVariance > 0) {
            parts.push(`Dünkü tahmindeki en düşük sıcaklık ${lowVariance}° daha yüksek gerçekleşti.`);
        } else {
            parts.push(`Dünkü tahmindeki en düşük sıcaklık ${Math.abs(lowVariance)}° daha düşük gerçekleşti.`);
        }
    }

    // Rain commentary (only for misses)
    if (rainAccuracy === 'miss-positive') {
        parts.push('Yağış bekleniyordu ancak yağmadı.');
    } else if (rainAccuracy === 'miss-negative') {
        parts.push('Beklenmedik yağış yaşandı.');
    }

    // No notable variance
    if (parts.length === 0) {
        return null;
    }

    return parts.join(' ');
};

// ============================================================================
// MAIN INTEGRATION FUNCTION
// ============================================================================

export interface AccuracyResult {
    hasData: boolean;
    comparison: ForecastComparison | null;
    commentary: string | null;
}

/**
 * Main function to get forecast accuracy for the current city.
 * 
 * Flow:
 * 1. Store tomorrow's forecast for future comparison
 * 2. Get yesterday's stored forecast
 * 3. Compare with today's actual weather
 * 4. Generate commentary if notable variance
 */
export const getForecastAccuracy = (data: WeatherData): AccuracyResult => {
    // Step 1: Store tomorrow's forecast for future comparison
    storeTomorrowForecast(data);

    // Step 2: Clean up old forecasts
    cleanupOldForecasts();

    // Step 3: Get yesterday's prediction (which was for today)
    const storedForecast = getYesterdayForecast(data.city);

    if (!storedForecast) {
        return {
            hasData: false,
            comparison: null,
            commentary: null
        };
    }

    // Step 4: Compare with today's actual weather
    // Use today's high/low from the daily forecast (index 0)
    const today = data.daily[0];
    const actualHigh = today?.high || data.high;
    const actualLow = today?.low || data.low;
    const hadRain = data.rainVolume > 0 || data.rainProb > 80;

    const comparison = compareForecastToActual(
        storedForecast,
        actualHigh,
        actualLow,
        hadRain
    );

    // Step 5: Generate commentary
    const commentary = generateAccuracyCommentary(comparison);
    comparison.commentary = commentary;

    return {
        hasData: true,
        comparison,
        commentary
    };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default getForecastAccuracy;
