
import React from 'react';
import { WeatherData } from '../types';
import { CONFIG } from '../services/weatherService';
import { Icon } from './Icons';
import { sanitizeHtmlLight } from '../shared/sanitizeHtml';

interface WeatherTriggeredAdProps {
    weatherData: WeatherData | null;
}

// Weather-Triggered Ad Campaign Definitions
interface WeatherAdCampaign {
    trigger: 'snow' | 'rain' | 'sunny' | 'hot' | 'cold' | 'default';
    headline: string;
    subheadline: string;
    ctaText: string;
    category: string;
    gradient: string;
    image: string;
}

// Ad campaigns keyed by weather trigger
const AD_CAMPAIGNS: Record<string, WeatherAdCampaign> = {
    snow: {
        trigger: 'snow',
        headline: 'Kış Lastikleri ile Güvende Olun',
        subheadline: 'Kar ve buzda %40 daha iyi yol tutuş. Ücretsiz montaj!',
        ctaText: 'Fiyatları Gör',
        category: 'Oto Lastik',
        gradient: 'from-cyan-900/90 via-blue-800/60 to-transparent',
        image: 'https://picsum.photos/800/200?random=snow'
    },
    rain: {
        trigger: 'rain',
        headline: 'Yağmurda Evde Kal, Yemek Sana Gelsin',
        subheadline: 'İlk siparişinize %30 indirim. Hızlı teslimat garantisi.',
        ctaText: 'Sipariş Ver',
        category: 'Yemek Siparişi',
        gradient: 'from-slate-900/90 via-slate-700/60 to-transparent',
        image: 'https://picsum.photos/800/200?random=food'
    },
    sunny: {
        trigger: 'sunny',
        headline: 'Güneşe Hazır mısınız?',
        subheadline: 'SPF 50+ güneş kremleri ve şık güneş gözlükleri %25 indirimli.',
        ctaText: 'Keşfet',
        category: 'Güneş Koruma',
        gradient: 'from-orange-900/90 via-amber-700/60 to-transparent',
        image: 'https://picsum.photos/800/200?random=sunny'
    },
    hot: {
        trigger: 'hot',
        headline: 'Klimanız Yaza Hazır mı?',
        subheadline: 'Profesyonel klima bakımı ile serinleyin. İlk müşteriye %15 indirim.',
        ctaText: 'Randevu Al',
        category: 'Klima Servisi',
        gradient: 'from-red-900/90 via-orange-700/60 to-transparent',
        image: 'https://picsum.photos/800/200?random=ac'
    },
    cold: {
        trigger: 'cold',
        headline: 'Kombiniz Kışa Hazır mı?',
        subheadline: 'Kombi bakımı yaptırın, kışı sıcacık geçirin. %20 indirim fırsatı.',
        ctaText: 'Hemen Ara',
        category: 'Isıtma Servisi',
        gradient: 'from-indigo-900/90 via-purple-800/60 to-transparent',
        image: 'https://picsum.photos/800/200?random=heating'
    },
    default: {
        trigger: 'default',
        headline: 'Aracınız Kışa Hazır mı?',
        subheadline: 'Kasko teklifi alın, %20 indirim kazanın.',
        ctaText: 'Fiyat Gör',
        category: 'Araç Sigortası',
        gradient: 'from-blue-900/90 via-blue-800/60 to-transparent',
        image: 'https://picsum.photos/800/200?random=car'
    }
};

// WMO Code Categories
const SNOW_CODES = [71, 73, 75, 77, 85, 86, 56, 57, 66, 67];
const RAIN_CODES = [51, 53, 55, 61, 63, 65, 80, 81, 82];
const CLEAR_CODES = [0, 1];

/**
 * Determines the appropriate ad trigger based on weather conditions
 */
const getAdTrigger = (weatherData: WeatherData | null): string => {
    if (!weatherData) return 'default';

    // Get WMO code from condition (reverse lookup needed)
    // For simplicity, we'll use pattern matching on condition text + temp/UV
    const condition = weatherData.condition.toLowerCase();
    const temp = weatherData.currentTemp;
    const uv = weatherData.uvIndex || 0;

    // Check for snow/ice conditions
    if (condition.includes('kar') || condition.includes('don') || condition.includes('buz')) {
        return 'snow';
    }

    // Check for rain conditions
    if (condition.includes('yağmur') || condition.includes('sağanak') || condition.includes('çiseleme')) {
        return 'rain';
    }

    // Check for hot conditions (sunny + high temp)
    if (temp > 30 && (condition.includes('açık') || condition.includes('güneş'))) {
        return 'hot';
    }

    // Check for sunny with high UV (sunscreen ads)
    if (uv > 5 && (condition.includes('açık') || condition.includes('güneş'))) {
        return 'sunny';
    }

    // Check for cold conditions
    if (temp < 5) {
        return 'cold';
    }

    // Default fallback
    return 'default';
};

const WeatherTriggeredAd: React.FC<WeatherTriggeredAdProps> = ({ weatherData }) => {
    // Determine which ad to show based on weather
    const trigger = getAdTrigger(weatherData);
    const campaign = AD_CAMPAIGNS[trigger] || AD_CAMPAIGNS.default;

    return (
        <div className="w-full mt-6 mb-8 relative group overflow-hidden rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {CONFIG.ads?.horizontal ? (
                // Production: Inject real ad code (sanitized for XSS protection)
                <div
                    className="w-full min-h-[100px] flex items-center justify-center bg-slate-50 dark:bg-slate-900"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlLight(CONFIG.ads.horizontal) }}
                />
            ) : (
                // Development: Show weather-triggered mock ad
                <div className="relative w-full h-24 md:h-32 cursor-pointer">
                    <img
                        src={campaign.image}
                        alt={campaign.category}
                        className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                    />
                    {/* Gradient Overlay - Dynamic based on weather */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${campaign.gradient} flex items-center px-6 md:px-10`}>
                        <div className="flex flex-col items-start text-white">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold bg-white text-slate-900 px-1.5 py-0.5 rounded shadow-sm">
                                    SPONSORLU
                                </span>
                                <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">
                                    {campaign.category}
                                </span>
                                {/* Weather trigger badge */}
                                <span className="text-[8px] font-medium bg-white/20 text-white/90 px-1.5 py-0.5 rounded-full border border-white/30">
                                    🎯 Hava Durumuna Göre
                                </span>
                            </div>
                            <h4 className="text-lg md:text-xl font-bold leading-tight drop-shadow-md">
                                {campaign.headline}
                            </h4>
                            <p className="text-xs md:text-sm text-white/90 mt-0.5 font-light">
                                {campaign.subheadline}
                            </p>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg hidden sm:flex items-center group-hover:bg-slate-50 transition-colors">
                        {campaign.ctaText} <Icon.ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeatherTriggeredAd;
