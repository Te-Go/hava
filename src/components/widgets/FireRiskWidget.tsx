import React from 'react';
import VitalityPulse from '../VitalityPulse';
import type { FireRiskData } from '../../services/fireRiskService';

interface FireRiskWidgetProps {
    data: FireRiskData;
    cityDisplay?: string;
    narrative?: string;
    lastUpdated: number;
}

/**
 * FireRiskWidget - Displays fire danger index for forest regions
 * Design: Matches TrafficWidget/MarineWidget pattern with light/dark mode
 */
const FireRiskWidget: React.FC<FireRiskWidgetProps> = ({
    data,
    cityDisplay = 'Bölge',
    narrative,
    lastUpdated
}) => {
    const getRiskBarWidth = (index: number) => `${index * 20}%`;

    const getRiskBgColor = (level: string) => {
        switch (level) {
            case 'Düşük': return 'bg-emerald-500';
            case 'Orta': return 'bg-yellow-500';
            case 'Yüksek': return 'bg-orange-500';
            case 'Çok Yüksek': return 'bg-red-500';
            case 'Aşırı': return 'bg-red-600';
            default: return 'bg-slate-500';
        }
    };

    const getRiskTextColor = (level: string) => {
        switch (level) {
            case 'Düşük': return 'text-emerald-600 dark:text-emerald-400';
            case 'Orta': return 'text-yellow-600 dark:text-yellow-400';
            case 'Yüksek': return 'text-orange-600 dark:text-orange-400';
            case 'Çok Yüksek': return 'text-red-600 dark:text-red-400';
            case 'Aşırı': return 'text-red-700 dark:text-red-400';
            default: return 'text-slate-600 dark:text-slate-400';
        }
    };

    // Off-season display
    if (!data.isFireSeason) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="h-[50px] px-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        <span className="text-lg opacity-50">🔥</span>
                    </div>
                    <h2 className="font-bold text-slate-800 dark:text-white text-sm">Yangın Riski</h2>
                </div>
                <div className="p-4">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Yangın sezonu dışında (Kasım-Nisan). Risk izleme aktif değil.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="h-[50px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🔥</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white text-sm">Yangın Riski</h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{cityDisplay}</span>
                    </div>
                </div>
                <VitalityPulse lastUpdated={lastUpdated} />
            </div>

            {/* Risk Level Display */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 dark:text-slate-400 text-sm">Risk Seviyesi</span>
                    <span className={`font-bold text-lg ${getRiskTextColor(data.riskLevel)}`}>
                        {data.riskLevel}
                    </span>
                </div>

                {/* Risk Bar */}
                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getRiskBgColor(data.riskLevel)} transition-all duration-500`}
                        style={{ width: getRiskBarWidth(data.fireIndex) }}
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                </div>
            </div>

            {/* Stats Grid - 3 columns */}
            <div className="grid grid-cols-3 bg-white dark:bg-slate-800">
                {/* Humidity */}
                <div className="flex flex-col items-center justify-center py-3 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-lg mb-0.5">💧</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white font-mono">{data.humidity}%</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Nem</div>
                </div>

                {/* Wind */}
                <div className="flex flex-col items-center justify-center py-3 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-lg mb-0.5">💨</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white font-mono">{data.windSpeed}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">km/sa</div>
                </div>

                {/* Precip */}
                <div className="flex flex-col items-center justify-center py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-lg mb-0.5">🌧️</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white font-mono">{data.precipLast7Days}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">mm/7gün</div>
                </div>
            </div>

            {/* Drought Warning */}
            {data.droughtIndicator && (
                <div className="mx-4 mt-3 bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <span className="text-amber-700 dark:text-amber-300 text-sm">Kuraklık - 7 gündür yağış yok</span>
                </div>
            )}

            {/* Fire Advice */}
            <div className={`mx-4 my-3 rounded-lg p-3 ${data.riskLevel === 'Aşırı' || data.riskLevel === 'Çok Yüksek'
                    ? 'bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30'
                    : 'bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600/30'
                }`}>
                <p className={`text-sm leading-relaxed ${data.riskLevel === 'Aşırı' || data.riskLevel === 'Çok Yüksek'
                        ? 'text-red-700 dark:text-red-200'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                    {data.fireAdvice}
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

export default FireRiskWidget;
