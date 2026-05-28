import React from 'react';
import VitalityPulse from '../components/VitalityPulse';
import type { AltitudeData } from '../services/altitudeService';

interface AltitudeWidgetProps {
    data: AltitudeData;
    cityDisplay?: string;
    narrative?: string;
    lastUpdated: number;
}

/**
 * AltitudeWidget - Displays high altitude conditions for plateau regions
 * Design: Matches TrafficWidget/MarineWidget pattern with light/dark mode
 */
const AltitudeWidget: React.FC<AltitudeWidgetProps> = ({
    data,
    cityDisplay = 'Bölge',
    narrative,
    lastUpdated
}) => {
    const getRoadColor = (condition: string) => {
        switch (condition) {
            case 'Kar Var': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
            case 'Buzlanma Riski': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400';
            default: return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="h-[50px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🏔️</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white text-sm">Yüksek İrtifa</h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{cityDisplay} • {data.elevationLabel}</span>
                    </div>
                </div>
                <VitalityPulse lastUpdated={lastUpdated} />
            </div>

            {/* Elevation Badge */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-500/10 dark:to-blue-500/10 p-4 text-center border-b border-slate-100 dark:border-slate-700">
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-300 font-mono">{data.elevation}m</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Deniz Seviyesinden Yükseklik</div>
            </div>

            {/* Stats Grid - 2 columns */}
            <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-800/50">
                {/* Feels Like */}
                <div className="flex flex-col items-center justify-center py-4 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-xl mb-1">🌡️</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">
                        {(typeof data.feelsLike === 'number' && !isNaN(data.feelsLike)) ? `${data.feelsLike}°` : '--'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Hissedilen</div>
                </div>

                {/* Min Temp Tonight */}
                <div className="flex flex-col items-center justify-center py-4 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-xl mb-1">🌙</div>
                    <div className={`text-2xl font-bold font-mono ${data.freezeWarning ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                        {(typeof data.minTempTonight === 'number' && !isNaN(data.minTempTonight)) ? `${data.minTempTonight}°` : '--'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Bu Gece Min</div>
                </div>
            </div>

            {/* Road Condition */}
            <div className={`mx-4 mt-3 rounded-lg p-3 flex items-center justify-between ${getRoadColor(data.roadCondition)}`}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">🛣️</span>
                    <span className="font-medium text-sm">Yol Durumu</span>
                </div>
                <span className="font-semibold">{data.roadCondition}</span>
            </div>

            {/* Thin Air Warning */}
            {data.thinAirWarning && (
                <div className="mx-4 mt-3 bg-purple-50 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 rounded-lg p-3 flex items-center gap-2">
                    <span className="text-xl">🫁</span>
                    <div>
                        <span className="text-purple-700 dark:text-purple-300 font-medium text-sm">İnce Hava</span>
                        <p className="text-purple-600 dark:text-purple-200 text-xs mt-0.5">{data.oxygenNote}</p>
                    </div>
                </div>
            )}

            {/* Freeze Warning */}
            {data.freezeWarning && (
                <div className="mx-4 mt-3 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-3 flex items-center gap-2">
                    <span className="text-xl">❄️</span>
                    <span className="text-blue-700 dark:text-blue-300 text-sm">Bu gece sıfırın altına düşecek.</span>
                </div>
            )}

            {/* Cold Advice */}
            <div className="mx-4 my-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600/30 rounded-lg p-3">
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {data.coldAdvice}
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

export default AltitudeWidget;
