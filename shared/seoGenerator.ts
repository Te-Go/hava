/**
 * SEO Generator
 * 
 * Generates meta tags and structured data (JSON-LD) for weather pages.
 * All output is designed for PHP/WordPress pre-rendering.
 * 
 * @see SEO-BLUEPRINT.md for specification
 */

import { WeatherData } from '../types';
import { getCityRegion } from './cityData';
import { Timeframe, WeatherCommentary } from './weatherCommentary';

// ============================================================================
// TURKISH MONTH NAMES
// ============================================================================

const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// ============================================================================
// META TAG GENERATORS
// ============================================================================

/**
 * Generates SEO-optimized page title.
 * Format: {Şehir} Hava Durumu | Bugün, Yarın ve Hafta Sonu Tahmini
 */
export const generateMetaTitle = (city: string, timeframe: Timeframe = 'today'): string => {
    const region = getCityRegion(city);
    const cityDisplay = region ? `${city} (${region})` : city;

    const timeframeSuffix: Record<Timeframe, string> = {
        today: 'Bugün',
        tomorrow: 'Yarın',
        weekend: 'Hafta Sonu'
    };

    return `${cityDisplay} Hava Durumu | ${timeframeSuffix[timeframe]}, Yarın ve Hafta Sonu Tahmini`;
};

/**
 * Generates SEO-optimized meta description (155-160 chars).
 * Includes: city, current condition, temperature range, rain probability.
 */
export const generateMetaDescription = (city: string, data: WeatherData): string => {
    const condition = String(data.condition || '').toLowerCase();
    const high = Math.round(data.high);
    const low = Math.round(data.low);
    const rainProb = data.rainProb;

    const now = new Date();
    const dateStr = `${now.getDate()} ${TURKISH_MONTHS[now.getMonth()]}`;

    // Target: 155-160 characters
    let description = `${city} hava durumu ${dateStr}: ${condition}, ${low}°-${high}°. `;

    if (rainProb >= 50) {
        description += `Yüksek yağış ihtimali (%${rainProb}). `;
    } else if (rainProb >= 20) {
        description += `Yağış olabilir (%${rainProb}). `;
    } else {
        description += `Yağış beklenmiyor. `;
    }

    description += `Saatlik tahminler ve 15 günlük öngörü.`;

    // Ensure max 160 chars
    if (description.length > 160) {
        description = description.substring(0, 157) + '...';
    }

    return description;
};

// ============================================================================
// JSON-LD STRUCTURED DATA GENERATORS
// ============================================================================

interface WeatherForecastSchema {
    '@context': string;
    '@type': string;
    name: string;
    description: string;
    dateModified: string;
    validFrom: string;
    validThrough: string;
    geo: {
        '@type': string;
        name: string;
        addressCountry: string;
        addressRegion?: string;
    };
    forecast: Array<{
        '@type': string;
        name: string;
        validFrom: string;
        temperature: {
            '@type': string;
            minValue: number;
            maxValue: number;
            unitCode: string;
        };
        precipitation: {
            '@type': string;
            value: number;
            unitCode: string;
        };
    }>;
}

/**
 * Generates WeatherForecast JSON-LD schema.
 */
export const generateWeatherForecastSchema = (
    city: string,
    data: WeatherData
): WeatherForecastSchema => {
    const now = new Date();
    const region = getCityRegion(city);

    // Valid for next 7 days
    const validThrough = new Date(now);
    validThrough.setDate(validThrough.getDate() + 7);

    return {
        '@context': 'https://schema.org',
        '@type': 'WeatherForecast',
        name: `${city} Hava Durumu Tahmini`,
        description: `${city} için günlük hava durumu tahmini`,
        dateModified: now.toISOString(),
        validFrom: now.toISOString(),
        validThrough: validThrough.toISOString(),
        geo: {
            '@type': 'Place',
            name: city,
            addressCountry: 'TR',
            ...(region && { addressRegion: region })
        },
        forecast: data.daily.slice(0, 7).map((day, index) => {
            const forecastDate = new Date(now);
            forecastDate.setDate(forecastDate.getDate() + index);

            return {
                '@type': 'Forecast',
                name: day.day,
                validFrom: forecastDate.toISOString(),
                temperature: {
                    '@type': 'QuantitativeValue',
                    minValue: day.low,
                    maxValue: day.high,
                    unitCode: 'CEL'
                },
                precipitation: {
                    '@type': 'QuantitativeValue',
                    value: day.rainProb,
                    unitCode: 'P1'  // Percentage
                }
            };
        })
    };
};

interface PlaceSchema {
    '@context': string;
    '@type': string;
    name: string;
    address: {
        '@type': string;
        addressLocality: string;
        addressRegion?: string;
        addressCountry: string;
    };
}

/**
 * Generates Place JSON-LD schema for city entity.
 */
export const generatePlaceSchema = (city: string): PlaceSchema => {
    const region = getCityRegion(city);

    return {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: city,
        address: {
            '@type': 'PostalAddress',
            addressLocality: city,
            ...(region && { addressRegion: region }),
            addressCountry: 'Türkiye'
        }
    };
};

interface FAQPageSchema {
    '@context': string;
    '@type': string;
    mainEntity: Array<{
        '@type': string;
        name: string;
        acceptedAnswer: {
            '@type': string;
            text: string;
        };
    }>;
}

/**
 * Generates FAQPage JSON-LD schema.
 * Only generates if 2+ questions are available.
 */
export const generateFAQPageSchema = (
    faq: Array<{ question: string; answer: string }>
): FAQPageSchema | null => {
    // Only generate if 2+ questions
    if (faq.length < 2) {
        return null;
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
            }
        }))
    };
};

// ============================================================================
// COMBINED SEO OUTPUT
// ============================================================================

export interface SEOOutput {
    meta: {
        title: string;
        description: string;
    };
    schemas: {
        weatherForecast: WeatherForecastSchema;
        place: PlaceSchema;
        faq: FAQPageSchema | null;
    };
    canonical: string;
}

/**
 * Generates complete SEO output for a city weather page.
 */
export const generateSEOOutput = (
    city: string,
    data: WeatherData,
    commentary: WeatherCommentary,
    timeframe: Timeframe = 'today'
): SEOOutput => {
    // Generate canonical URL
    const citySlug = city
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, '-');

    const timeframePath = timeframe === 'today' ? '' : `/${timeframe === 'tomorrow' ? 'yarin' : 'hafta-sonu'}`;
    const canonical = `/hava-durumu/${citySlug}${timeframePath}/`;

    return {
        meta: {
            title: generateMetaTitle(city, timeframe),
            description: generateMetaDescription(city, data)
        },
        schemas: {
            weatherForecast: generateWeatherForecastSchema(city, data),
            place: generatePlaceSchema(city),
            faq: generateFAQPageSchema(commentary.faq)
        },
        canonical
    };
};

/**
 * Logs SEO output to console (for PHP porting reference).
 */
export const logSEOOutput = (output: SEOOutput): void => {
    console.group('📊 SEO Output (for PHP reference)');
    console.log('Meta Title:', output.meta.title);
    console.log('Meta Description:', output.meta.description);
    console.log('Canonical URL:', output.canonical);
    console.log('WeatherForecast Schema:', JSON.stringify(output.schemas.weatherForecast, null, 2));
    console.log('Place Schema:', JSON.stringify(output.schemas.place, null, 2));
    if (output.schemas.faq) {
        console.log('FAQ Schema:', JSON.stringify(output.schemas.faq, null, 2));
    }
    console.groupEnd();
};

export default generateSEOOutput;
