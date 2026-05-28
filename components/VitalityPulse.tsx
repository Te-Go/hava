import React from 'react';

interface Props {
    lastUpdated: number;
    staleThreshold?: number; // milliseconds, default 10 minutes
}

/**
 * Vitality Pulse Component
 * Shows "CANLI" (LIVE) indicator when data is fresh
 * Shows timestamp when data is stale
 */
const VitalityPulse: React.FC<Props> = ({
    lastUpdated,
    staleThreshold = 600000 // 10 minutes
}) => {
    const isStale = Date.now() - lastUpdated > staleThreshold;

    if (isStale) {
        const minutesAgo = Math.floor((Date.now() - lastUpdated) / 60000);
        return (
            <span className="text-xs text-slate-400 dark:text-slate-500">
                {minutesAgo} dk önce
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">CANLI</span>
        </span>
    );
};

export default VitalityPulse;
