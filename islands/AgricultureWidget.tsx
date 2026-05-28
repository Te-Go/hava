import React from 'react';
import VitalityPulse from '../components/VitalityPulse';
import type { AgricultureData } from '../services/agricultureService';

interface AgricultureWidgetProps {
    data: AgricultureData;
    cityDisplay?: string;
    narrative?: string;
    lastUpdated: number;
}

/**
 * AgricultureWidget - Displays farming conditions for agricultural regions
 * 
 * Shows: Soil temp, moisture, irrigation need, frost risk, planting advice
 * Design: Matches TrafficWidget/MarineWidget pattern with light/dark mode
 */
const AgricultureWidget: React.FC<AgricultureWidgetProps> = ({
    data,
    cityDisplay = 'Bölge',
    narrative,
    lastUpdated
}) => {
    const getMoistureColor = (label: string) => {
        switch (label) {
            case 'Kuru': return 'text-amber-600 dark:text-amber-400';
            case 'Islak': return 'text-blue-600 dark:text-blue-400';
            default: return 'text-emerald-600 dark:text-emerald-400';
        }
    };

    const getIrrigationColor = (need: string) => {
        switch (need) {
            case 'Yüksek': return 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400';
            case 'Düşük': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
            default: return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="h-[50px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🌾</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white text-sm">Tarım Durumu</h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{cityDisplay}</span>
                    </div>
                </div>
                <VitalityPulse lastUpdated={lastUpdated} />
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-800/50">
                {/* Soil Temperature */}
                <div className="flex flex-col items-center justify-center py-4 border-r border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-xl mb-1">🌡️</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">{data.soilTemp}°</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Toprak Sıcaklığı</div>
                </div>

                {/* Soil Moisture */}
                <div className="flex flex-col items-center justify-center py-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-xl mb-1">💧</div>
                    <div className={`text-2xl font-bold ${getMoistureColor(data.moistureLabel)}`}>
                        {data.moistureLabel}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Toprak Nemi</div>
                </div>

                {/* Evapotranspiration */}
                <div className="flex flex-col items-center justify-center py-4 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-xl mb-1">☀️</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">{data.evapotranspiration}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Buharlaşma (mm)</div>
                </div>

                {/* Irrigation Need */}
                <div className="flex flex-col items-center justify-center py-4 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-xl mb-1">🚿</div>
                    <div className={`inline-block px-2 py-0.5 rounded-full text-sm font-semibold ${getIrrigationColor(data.irrigationNeed)}`}>
                        {data.irrigationNeed}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sulama İhtiyacı</div>
                </div>
            </div>

            {/* Frost Warning */}
            {data.frostRisk && (
                <div className="mx-4 mt-3 bg-sky-100 dark:bg-sky-900/40 border border-sky-300 dark:border-sky-600/50 rounded-lg p-3 flex items-center gap-2">
                    <span className="text-xl">❄️</span>
                    <div>
                        <span className="text-sky-800 dark:text-sky-200 font-medium text-sm">Don Uyarısı</span>
                        <span className="text-sky-700 dark:text-sky-300 text-xs ml-2">
                            ({data.frostNights} gece sıfırın altında)
                        </span>
                    </div>
                </div>
            )}

            {/* Planting Advice */}
            <div className="mx-4 my-3 bg-lime-100 dark:bg-lime-900/30 border border-lime-300 dark:border-lime-600/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                    <span className="text-lg">🌱</span>
                    <p className="text-lime-800 dark:text-lime-200 text-sm leading-relaxed">
                        {data.plantingAdvice}
                    </p>
                </div>
            </div>

            {/* Narrative (if provided) */}
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

export default AgricultureWidget;
