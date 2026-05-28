import React from 'react';
import VitalityPulse from '../components/VitalityPulse';

interface SkiData {
    resort: string;
    snowDepth: number;
    liftsOpen: number;
    liftsTotal: number;
    avalancheRisk: 'low' | 'moderate' | 'considerable' | 'high';
}

interface Props {
    data?: SkiData;
    narrative?: string;
    lastUpdated: number;
}

/**
 * Ski Conditions Widget (Mountain Cities Only)
 * Shows snow depth, lift status, and avalanche risk
 * Fixed Slot Contract: 240px height
 */
const SkiConditions: React.FC<Props> = ({ data, narrative, lastUpdated }) => {
    const avalancheConfig: Record<string, { color: string; bgColor: string; darkColor: string; darkBgColor: string; label: string }> = {
        low: {
            color: 'text-green-600', bgColor: 'bg-green-50',
            darkColor: 'text-green-400', darkBgColor: 'dark:bg-green-500/20',
            label: 'Düşük'
        },
        moderate: {
            color: 'text-amber-600', bgColor: 'bg-amber-50',
            darkColor: 'text-yellow-400', darkBgColor: 'dark:bg-yellow-500/20',
            label: 'Orta'
        },
        considerable: {
            color: 'text-orange-600', bgColor: 'bg-orange-50',
            darkColor: 'text-orange-400', darkBgColor: 'dark:bg-orange-500/20',
            label: 'Yüksek'
        },
        high: {
            color: 'text-red-600', bgColor: 'bg-red-50',
            darkColor: 'text-red-400', darkBgColor: 'dark:bg-red-500/20',
            label: 'Çok Yüksek'
        },
    };

    const avalanche = avalancheConfig[data?.avalancheRisk || 'low'];

    return (
        <div
            className="sinan-ski-widget bg-white dark:bg-gradient-to-r dark:from-slate-700 dark:to-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-lg border border-slate-100 dark:border-none"
            style={{ minHeight: 'var(--sinan-slot-height, 240px)' }}
        >
            {/* Header: 50px */}
            <div className="h-[50px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 dark:bg-white/10 text-blue-500 dark:text-white rounded-lg flex items-center justify-center">
                        <span className="text-lg">⛷️</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-700 dark:text-white text-sm">Kayak Durumu</h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{data?.resort || 'Kayak Merkezi'}</span>
                    </div>
                </div>
                <VitalityPulse lastUpdated={lastUpdated} />
            </div>

            {/* Narrative: 50px */}
            <div className="h-[50px] px-4 py-2 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-white/90 overflow-hidden flex items-center border-l-4 border-blue-400 mx-4 mt-3 mb-1 rounded">
                <p className="line-clamp-2">{narrative || 'Kayak verisi yükleniyor...'}</p>
            </div>

            {/* Stats Grid: 120px */}
            <div className="grid grid-cols-3 h-[110px] items-center px-2">
                {/* Snow Depth */}
                <div className="flex flex-col items-center justify-center text-slate-700 dark:text-white">
                    <div className="text-3xl font-bold">{data?.snowDepth ?? '--'}</div>
                    <div className="text-xs text-slate-500 dark:text-white/70">cm kar</div>
                </div>

                {/* Lifts Status */}
                <div className="flex flex-col items-center justify-center text-slate-700 dark:text-white border-x border-slate-100 dark:border-white/10 h-16">
                    <div className="text-3xl font-bold flex items-baseline gap-0.5">
                        <span className="text-green-600 dark:text-green-400">{data?.liftsOpen ?? '-'}</span>
                        <span className="text-lg text-slate-400">/{data?.liftsTotal ?? '-'}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-white/70">Açık Pist</div>
                </div>

                {/* Avalanche Risk */}
                <div className="flex flex-col items-center justify-center">
                    <div className={`px-3 py-1 rounded-lg ${avalanche.bgColor} ${avalanche.darkBgColor}`}>
                        <span className={`text-lg font-bold ${avalanche.color} ${avalanche.darkColor}`}>
                            {avalanche.label}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-white/70 mt-1">Çığ Riski</div>
                </div>
            </div>

            {/* Bottom Indicator */}
            <div className="h-[20px] flex items-center justify-center border-t border-slate-50 dark:border-white/5">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Sezon Açık</span>
                </div>
            </div>
        </div>
    );
};

export default SkiConditions;
