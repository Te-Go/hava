import React from 'react';

interface Props {
    narrative: string;
    cityDisplay?: string;
}

/**
 * Regional Summary Widget (Default Fallback)
 * Shows general Turkey/regional weather summary for unknown cities
 * Fixed Slot Contract: 140px height
 */
const RegionalSummary: React.FC<Props> = ({ narrative, cityDisplay }) => {
    return (
        <div
            className="sinan-regional-summary bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            style={{ minHeight: 'var(--sinan-slot-height, 140px)' }}
        >
            <div className="p-6 h-full flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🇹🇷</span>
                    <div>
                        <h3 className="font-bold text-slate-700 dark:text-white">
                            {cityDisplay ? `${cityDisplay} Bölgesi` : 'Türkiye Geneli'}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Hava Durumu Özeti</span>
                    </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {narrative}
                </p>
            </div>
        </div>
    );
};

export default RegionalSummary;
