import React, { useState } from 'react';
import { WeatherData } from '../types';
import GlassCard from './GlassCard';

interface SEOFAQSectionProps {
    cityName: string;
    data: WeatherData;
    className?: string;
}

/**
 * SEO FAQ Accordion Component
 * Displays structured FAQ content matching FAQPage schema
 */
const SEOFAQSection: React.FC<SEOFAQSectionProps> = ({ cityName, data, className = '' }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    // Generate FAQ content (mirrors seoSchemaService.ts)
    const today = new Date();
    const tomorrow = data.daily[1];

    // Find Saturday and Sunday within the 15-day forecast
    const weekendDays = data.daily.slice(0, 15).filter((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d.getDay() === 6 || d.getDay() === 0; // Saturday or Sunday
    });

    // Get the first weekend day with valid data
    const saturday = weekendDays.find((_, i) => {
        const d = new Date(today);
        let dayIndex = 0;
        for (let j = 0; j < 15; j++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() + j);
            if (checkDate.getDay() === 6) { dayIndex = j; break; }
        }
        return data.daily[dayIndex]?.high !== undefined;
    }) || weekendDays[0];

    const sunday = weekendDays.find((d, i) => i > 0) || weekendDays[1];

    // Use correct property names: high/low from DailyForecast
    const validDays = data.daily.slice(0, 15).filter(d => !isNaN(d.high) && !isNaN(d.low));
    const avgTemp = validDays.length > 0
        ? Math.round(validDays.reduce((sum, d) => sum + (d.high + d.low) / 2, 0) / validDays.length)
        : 15;

    const firstWeekDays = data.daily.slice(0, 7).filter(d => !isNaN(d.high));
    const secondWeekDays = data.daily.slice(7, 14).filter(d => !isNaN(d.high));
    const firstWeekAvg = firstWeekDays.length > 0 ? firstWeekDays.reduce((sum, d) => sum + d.high, 0) / firstWeekDays.length : 15;
    const secondWeekAvg = secondWeekDays.length > 0 ? secondWeekDays.reduce((sum, d) => sum + d.high, 0) / secondWeekDays.length : 15;
    const trendText = secondWeekAvg > firstWeekAvg + 2
        ? 'ısınma trendi'
        : secondWeekAvg < firstWeekAvg - 2
            ? 'soğuma trendi'
            : 'stabil seyir';

    // Build weekend answer with actual data
    const buildWeekendAnswer = () => {
        if (weekendDays.length === 0) {
            return `Hafta sonu hava durumu bilgisi için 15 günlük tahmini inceleyin.`;
        }

        // Calculate weekend temperature range from available weekend days
        const weekendHighs = weekendDays.filter(d => !isNaN(d.high)).map(d => d.high);
        const weekendLows = weekendDays.filter(d => !isNaN(d.low)).map(d => d.low);

        if (weekendHighs.length === 0 || weekendLows.length === 0) {
            return `Hafta sonu hava durumu bilgisi için 15 günlük tahmini inceleyin.`;
        }

        const minLow = Math.round(Math.min(...weekendLows));
        const maxHigh = Math.round(Math.max(...weekendHighs));
        const weekendCondition = weekendDays[0]?.condition?.toLowerCase() || 'değişken';
        const hasRain = weekendDays.some(d => (d.rainProb || 0) > 30);

        let answer = `Hafta sonu ${cityName}'da ${weekendCondition} bekleniyor. Sıcaklık ${minLow}°C ile ${maxHigh}°C arasında olacak.`;
        if (hasRain) {
            answer += ` Yağış ihtimali mevcut.`;
        }
        return answer;
    };

    const faqs = [
        {
            question: `${cityName}'da bugün hava nasıl?`,
            answer: `${cityName}'da bugün hava ${data.condition.toLowerCase()}, sıcaklık ${Math.round(data.currentTemp)}°C. Yüksek ${Math.round(data.high)}°C, düşük ${Math.round(data.low)}°C bekleniyor.`
        },
        {
            question: `${cityName}'da yarın hava nasıl olacak?`,
            answer: tomorrow && !isNaN(tomorrow.low) && !isNaN(tomorrow.high)
                ? `Yarın ${cityName}'da ${tomorrow.condition?.toLowerCase() || 'değişken'} bekleniyor. Sıcaklık ${Math.round(tomorrow.low)}°C ile ${Math.round(tomorrow.high)}°C arasında olacak.`
                : `${cityName} yarınki hava durumu tahmini için sayfayı ziyaret edin.`
        },
        {
            question: `${cityName}'da 15 günlük hava durumu nasıl?`,
            answer: `${cityName} için önümüzdeki 15 günde ortalama sıcaklık ${avgTemp}°C civarında. Genel olarak ${trendText} bekleniyor.`
        },
        {
            question: `${cityName}'da hafta sonu hava nasıl olacak?`,
            answer: buildWeekendAnswer()
        },
        {
            question: `${cityName}'da yağmur yağacak mı?`,
            answer: data.daily.slice(0, 7).some(d => (d.rainProb || 0) > 30)
                ? `Evet, önümüzdeki hafta ${cityName}'da yağış bekleniyor. Detaylar için günlük tahminleri inceleyin.`
                : `Önümüzdeki hafta ${cityName}'da önemli yağış beklenmiyor.`
        }
    ];

    return (
        <GlassCard className={`${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Sıkça Sorulan Sorular
                </h2>
            </div>

            <div className="space-y-2">
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className="border border-slate-200/50 dark:border-slate-700/50 rounded-xl overflow-hidden"
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                            aria-expanded={openIndex === index}
                        >
                            <span className="font-medium text-slate-700 dark:text-slate-200 text-sm pr-4">
                                {faq.question}
                            </span>
                            <svg
                                className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {openIndex === index && (
                            <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 pt-3">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

export default SEOFAQSection;
