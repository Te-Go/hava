/**
 * Weather Commentary Grid Component
 * 
 * Displays MSN-style weather commentary with metric cards and FAQ section.
 * Consumes data from the weatherCommentary generator.
 */

import React, { useMemo, useState } from 'react';
import { WeatherData } from '../types';
import { generateWeatherCommentary, WeatherCommentary, MetricCommentary, Timeframe } from '../shared/weatherCommentary';
import { getForecastAccuracy, AccuracyResult } from '../shared/forecastAccuracy';
import GlassCard from './GlassCard';
import { Icon } from './Icons';

// ============================================================================
// STATUS COLOR MAPPING
// ============================================================================

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    green: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-700'
    },
    yellow: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-700'
    },
    orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-700'
    },
    red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-700'
    },
    purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-700'
    },
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-700'
    },
    gray: {
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700'
    }
};

// ============================================================================
// ICON MAPPING
// ============================================================================

const ICON_MAP: Record<string, React.ReactNode> = {
    'thermometer': <Icon.Thermometer className="w-5 h-5" />,
    'thermometer-sun': <Icon.Thermometer className="w-5 h-5" />,
    'cloud': <Icon.Cloud className="w-5 h-5" />,
    'cloud-rain': <Icon.CloudRain className="w-5 h-5" />,
    'wind': <Icon.Wind className="w-5 h-5" />,
    'droplets': <Icon.Droplets className="w-5 h-5" />,
    'sun': <Icon.Sun className="w-5 h-5" />,
    'gauge': <Icon.Gauge className="w-5 h-5" />,
    'sunrise': <Icon.Sunrise className="w-5 h-5" />
};

// ============================================================================
// COMMENTARY METRIC CARD
// ============================================================================

interface CommentaryCardProps {
    metric: MetricCommentary;
}

const CommentaryCard: React.FC<CommentaryCardProps> = ({ metric }) => {
    const colors = STATUS_COLORS[metric.statusColor] || STATUS_COLORS.gray;
    const icon = ICON_MAP[metric.icon] || <Icon.Info className="w-5 h-5" />;

    return (
        <GlassCard className="flex flex-col h-full min-h-[200px] hover:shadow-lg transition-shadow duration-300">
            {/* Row 1: Icon + Title */}
            <div className="flex items-center gap-2 mb-1">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} flex-shrink-0`}>
                    {icon}
                </div>
                <span className="text-sm font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wide">
                    {metric.label}
                </span>
            </div>

            {/* Row 2: Status Badge */}
            <div className="mb-2">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} ${colors.border} border inline-block`}>
                    {metric.status}
                </span>
            </div>

            {/* Row 3: Value - Prominent */}
            <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-3xl font-bold text-slate-700 dark:text-slate-100">
                    {metric.value}
                </span>
                {metric.unit && (
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                        {metric.unit}
                    </span>
                )}
            </div>

            {/* Row 4: Description - Full text, no truncation */}
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {metric.description}
            </p>
        </GlassCard>
    );
};

// ============================================================================
// DAILY SUMMARY CARD
// ============================================================================

interface DailySummaryProps {
    summary: string;
    city: string;
    timeframe: Timeframe;
    displayDate?: string;
}

const DailySummary: React.FC<DailySummaryProps> = ({ summary, city, timeframe, displayDate }) => {
    const timeframeLabels: Record<Timeframe, string> = {
        today: 'Bugün',
        tomorrow: 'Yarın',
        weekend: 'Hafta Sonu'
    };

    return (
        <GlassCard className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800">
            <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg">
                    <Icon.FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                            {city} - {timeframeLabels[timeframe]} Özeti
                        </h3>
                        {displayDate && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                                <Icon.Clock className="w-3.5 h-3.5" />
                                <span>Son güncelleme: {displayDate}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {summary}
                    </p>
                </div>
            </div>
        </GlassCard>
    );
};

// ============================================================================
// FAQ SECTION
// ============================================================================

interface FAQProps {
    faq: Array<{ question: string; answer: string }>;
    city: string;
}

const FAQSection: React.FC<FAQProps> = ({ faq, city }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    if (!faq || faq.length === 0) return null;

    return (
        <GlassCard>
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                    Sık Sorulan Sorular - {city}
                </h3>
            </div>

            <div className="space-y-2">
                {faq.map((item, index) => (
                    <div
                        key={index}
                        className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden"
                    >
                        {/* Question */}
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                                {item.question}
                            </span>
                            <Icon.ChevronDown
                                className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {/* Answer */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            <div className="px-4 pb-4 pt-0">
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Schema.org FAQPage markup (invisible) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faq.map(item => ({
                            "@type": "Question",
                            "name": item.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": item.answer
                            }
                        }))
                    })
                }}
            />
        </GlassCard>
    );
};

// ============================================================================
// ANSWER SUMMARY BAR - Thin horizontal component for between City Rail and Hero
// ============================================================================

interface AnswerSummaryBarProps {
    city: string;
    summary: string;
    comparison?: 'artıyor' | 'azalıyor' | 'benzer';
}

export const AnswerSummaryBar: React.FC<AnswerSummaryBarProps> = ({ city, summary, comparison }) => {
    return (
        <div className="max-w-4xl mx-auto px-4 mb-2">
            <div className="bg-white/60 dark:bg-blue-900/40 backdrop-blur-md rounded-xl px-4 py-3 border border-slate-200/60 dark:border-blue-700/60 shadow-sm hover:shadow-md hover:bg-white/80 dark:hover:bg-blue-900/60 transition-all duration-300 cursor-default">
                <div className="flex items-start gap-3">
                    {/* Title + Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-slate-700 dark:text-blue-200">Hava Özeti</span>
                        {comparison && (
                            <span className={`
                                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                ${comparison === 'artıyor' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                                ${comparison === 'azalıyor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                                ${comparison === 'benzer' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' : ''}
                            `}>
                                {comparison === 'artıyor' && '↑'}
                                {comparison === 'azalıyor' && '↓'}
                                {comparison === 'benzer' && '→'}
                            </span>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="w-px h-5 bg-slate-300 dark:bg-blue-600/50 flex-shrink-0" />

                    {/* Summary Text */}
                    <p id="weather-summary-text" className="text-sm text-slate-700 dark:text-blue-100 leading-relaxed">
                        {summary}
                    </p>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// TIMEFRAME SELECTOR
// ============================================================================

interface TimeframeSelectorProps {
    active: Timeframe;
    onChange: (timeframe: Timeframe) => void;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({ active, onChange }) => {
    const options: { id: Timeframe; label: string }[] = [
        { id: 'today', label: 'Bugün' },
        { id: 'tomorrow', label: 'Yarın' },
        { id: 'weekend', label: 'Hafta Sonu' }
    ];

    return (
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {options.map(option => (
                <button
                    key={option.id}
                    onClick={() => onChange(option.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${active === option.id
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

// ============================================================================
// FORECAST ACCURACY BANNER (EEAT Gold)
// ============================================================================

interface ForecastAccuracyBannerProps {
    commentary: string | null;
    city: string;
}

const ForecastAccuracyBanner: React.FC<ForecastAccuracyBannerProps> = ({ commentary, city }) => {
    if (!commentary) return null;

    return (
        <div className="relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-700/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)' }} />
            </div>

            <div className="relative flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800/30 flex-shrink-0">
                    <Icon.AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                            Tahmin Doğruluğu
                        </h4>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-400">
                            {city}
                        </span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300/90 leading-relaxed">
                        {commentary}
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-1.5 italic">
                        Bu tahmin, açık meteorolojik modeller ve otomatik analiz sistemleri kullanılarak hazırlanmıştır.
                    </p>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// FORECAST METADATA BANNER (EEAT - Update Timestamp & Source)
// ============================================================================

interface ForecastMetadataBannerProps {
    displayDate: string;
    dateModified: string;
}

const ForecastMetadataBanner: React.FC<ForecastMetadataBannerProps> = ({ displayDate, dateModified }) => {
    return (
        <div
            className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-xs"
            itemScope
            itemType="https://schema.org/WebPage"
        >
            <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Icon.Clock className="w-3.5 h-3.5" />
                    <time dateTime={dateModified} itemProp="dateModified">
                        Güncelleme: {displayDate}
                    </time>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                    Meteorolojik Model Verisi
                </span>
            </div>
            <span className="text-slate-400 dark:text-slate-500 italic">
                Tahminler kısa süreli değişiklikler gösterebilir.
            </span>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface WeatherCommentaryGridProps {
    weatherData: WeatherData;
    initialTimeframe?: Timeframe;
    showTimeframeSelector?: boolean;
    showFAQ?: boolean;
    showDailySummary?: boolean;
    className?: string;
}

const WeatherCommentaryGrid: React.FC<WeatherCommentaryGridProps> = ({
    weatherData,
    initialTimeframe = 'today',
    showTimeframeSelector = true,
    showFAQ = true,
    showDailySummary = true,
    className = ''
}) => {
    const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);

    // Sync timeframe state with prop when it changes (view switching)
    React.useEffect(() => {
        setTimeframe(initialTimeframe);
    }, [initialTimeframe]);

    // Generate commentary based on current timeframe
    const commentary = useMemo<WeatherCommentary>(() => {
        return generateWeatherCommentary(weatherData, timeframe);
    }, [weatherData, timeframe]);

    // Get metrics array for grid display
    const metricsArray = useMemo(() => {
        const metrics = commentary.metrics;
        return [
            metrics.sicaklik,
            metrics.hissedilen,
            metrics.yagis,
            metrics.ruzgar,
            metrics.nem,
            metrics.uv,
            metrics.hki,
            metrics.basinc,
            metrics.bulutOrtusu,
            metrics.gun
        ];
    }, [commentary]);

    // Get forecast accuracy (only meaningful for 'today' view)
    const accuracy = useMemo<AccuracyResult>(() => {
        return getForecastAccuracy(weatherData);
    }, [weatherData]);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Timeframe Selector */}
            {showTimeframeSelector && (
                <div className="flex justify-end">
                    <TimeframeSelector active={timeframe} onChange={setTimeframe} />
                </div>
            )}

            {/* ============================================================ */}
            {/* TAHMIN ÖZETI - Moved to bottom grid                          */}
            {/* ============================================================ */}
            {/* Note: Answer Summary is now a separate component in App.tsx  */}
            {/* This section is intentionally empty - Tahmin Özeti moved below */}


            {/* Forecast Accuracy Banner - Only show on 'today' when we have accuracy data */}
            {timeframe === 'today' && accuracy.commentary && (
                <ForecastAccuracyBanner
                    commentary={accuracy.commentary}
                    city={commentary.city}
                />
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {metricsArray.map((metric) => (
                    <CommentaryCard key={metric.id} metric={metric} />
                ))}
            </div>

            {/* ============================================================ */}
            {/* BOTTOM SECTION - FAQ + Tahmin Özeti Side by Side (50% each)  */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: FAQ Section (50% width) */}
                {showFAQ && commentary.faq.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-6 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full" />
                            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                                Sık Sorulan Sorular
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {commentary.faq.slice(0, 3).map((item, index) => (
                                <div key={index} className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50">
                                        <span className="font-medium text-slate-700 dark:text-slate-200 text-sm block">
                                            {item.question}
                                        </span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                            {item.answer}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Schema.org FAQPage markup (invisible) */}
                        <script
                            type="application/ld+json"
                            dangerouslySetInnerHTML={{
                                __html: JSON.stringify({
                                    "@context": "https://schema.org",
                                    "@type": "FAQPage",
                                    "mainEntity": commentary.faq.map(item => ({
                                        "@type": "Question",
                                        "name": item.question,
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text": item.answer
                                        }
                                    }))
                                })
                            }}
                        />
                    </div>
                )}

                {/* Right Card: Tahmin Özeti (Takes full width if FAQ is hidden) */}
                <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 ${(!showFAQ || commentary.faq.length === 0) ? 'md:col-span-2' : ''}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full" />
                        <span className="text-base font-bold text-slate-700 dark:text-slate-200">
                            Tahmin Özeti
                        </span>
                    </div>
                    {/* Grid adapts based on width */}
                    <div className={`grid gap-3 ${(!showFAQ || commentary.faq.length === 0) ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
                        {commentary.forecastTable.map((row) => (
                            <div
                                key={row.metric}
                                className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-3"
                            >
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                                    {row.metric}
                                </span>
                                <span className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Forecast Metadata Banner - EEAT Trust Signal */}
            <ForecastMetadataBanner
                displayDate={commentary.metadata.displayDate}
                dateModified={commentary.metadata.dateModified}
            />
        </div>
    );
};

export default WeatherCommentaryGrid;
