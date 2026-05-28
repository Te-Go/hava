import React from 'react';
import VitalityPulse from '../components/VitalityPulse';
import type { TourismData } from '../services/tourismService';

interface TourismWidgetProps {
    data: TourismData;
    cityDisplay?: string;
    narrative?: string;
    lastUpdated: number;
}

/**
 * TourismWidget - Displays tourism comfort for historical sites
 * Design: Matches TrafficWidget/MarineWidget pattern with light/dark mode
 */
const TourismWidget: React.FC<TourismWidgetProps> = ({
    data,
    cityDisplay = 'Bölge',
    narrative,
    lastUpdated
}) => {
    const getWalkingColor = (advisory: string) => {
        switch (advisory) {
            case 'Uygun': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
            case 'Dikkatli': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400';
            case 'Kaçının': return 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400';
            default: return 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400';
        }
    };

    const getCrowdColor = (estimate: string) => {
        switch (estimate) {
            case 'Düşük': return 'text-emerald-600 dark:text-emerald-400';
            case 'Orta': return 'text-amber-600 dark:text-amber-400';
            case 'Yüksek': return 'text-red-600 dark:text-red-400';
            default: return 'text-slate-600 dark:text-slate-400';
        }
    };

    const getComfortColorClass = (color: string) => {
        // Map the dynamic color to a proper Tailwind class
        if (color.includes('emerald') || color.includes('green')) return 'text-emerald-600 dark:text-emerald-400';
        if (color.includes('amber') || color.includes('yellow')) return 'text-amber-600 dark:text-amber-400';
        if (color.includes('red')) return 'text-red-600 dark:text-red-400';
        return 'text-purple-600 dark:text-purple-400';
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            {/* Header */}
            <div className="h-[50px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🏛️</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white text-sm">Turizm Konforu</h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] block">
                            {data.siteName || cityDisplay}
                        </span>
                    </div>
                </div>
                <VitalityPulse lastUpdated={lastUpdated} />
            </div>

            {/* Comfort Index Display */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/10 p-4 text-center border-b border-slate-100 dark:border-slate-700">
                <div className={`text-4xl font-bold ${getComfortColorClass(data.comfortColor)}`}>
                    {data.comfortIndex}/10
                </div>
                <div className={`text-lg font-medium ${getComfortColorClass(data.comfortColor)}`}>
                    {data.comfortLabel}
                </div>
            </div>

            {/* Stats Grid - 3 columns */}
            <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-800/50">
                {/* Temperature */}
                <div className="flex flex-col items-center justify-center py-3 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-lg mb-0.5">🌡️</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white font-mono">{data.temperature}°</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{data.tempLabel}</div>
                </div>

                {/* Humidity */}
                <div className="flex flex-col items-center justify-center py-3 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-lg mb-0.5">💧</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white font-mono">{data.humidity}%</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{data.humidityLabel}</div>
                </div>

                {/* UV */}
                <div className="flex flex-col items-center justify-center py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-lg mb-0.5">☀️</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white font-mono">{data.uvIndex}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">UV İndeks</div>
                </div>
            </div>

            {/* Best Time & Crowd - 2 columns */}
            <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-700">
                {/* Best Time */}
                <div className="flex flex-col items-center justify-center py-3 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-lg mb-0.5">🕐</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-white">{data.bestTimeToVisit}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">En İyi Zaman</div>
                </div>

                {/* Crowd */}
                <div className="flex flex-col items-center justify-center py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-lg mb-0.5">👥</div>
                    <div className={`font-medium text-sm ${getCrowdColor(data.crowdEstimate)}`}>
                        {data.crowdEstimate}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Kalabalık</div>
                </div>
            </div>

            {/* Walking Advisory */}
            <div className={`mx-4 mt-3 rounded-lg p-3 flex items-center justify-between ${getWalkingColor(data.walkingAdvisory)}`}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">🚶</span>
                    <span className="font-medium text-sm">Yürüyüş</span>
                </div>
                <span className="font-semibold">{data.walkingAdvisory}</span>
            </div>

            {/* Tourism Advice */}
            {/* Tourism Advice - Allow growth */}
            <div className="mx-4 my-3 bg-purple-50 dark:bg-slate-700/30 border border-purple-200 dark:border-slate-600/50 rounded-lg p-3 flex-grow">
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {data.tourismAdvice}
                </p>
            </div>

            {/* Narrative */}
            {narrative && (
                <div className="px-4 pb-4">
                    <p className="text-slate-600 dark:text-slate-400 text-sm border-t border-slate-100 dark:border-slate-700 pt-3">
                        {narrative}
                    </p>
                </div>
            )}
        </div>
    );
};

export default TourismWidget;
