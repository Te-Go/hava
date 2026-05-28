import React, { useState } from 'react';
import { Icon } from './Icons';
import { SeaTempLocation, SEA_REGIONS, SeaRegion, generateRegionSummary } from '../services/marineService';
import { toSlug } from '../services/weatherService';

interface SeaRegionCardProps {
    region: SeaRegion;
    locations: SeaTempLocation[];
    onLocationClick?: (city: string) => void;
}

/**
 * SeaRegionCard - Accordion card for each sea region
 * Shows horizontal scrollable location cards with sea temps
 */
const SeaRegionCard: React.FC<SeaRegionCardProps> = ({ region, locations, onLocationClick }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const regionInfo = SEA_REGIONS[region];
    const regionLocations = locations.filter(l => l.region === region);

    // Calculate temp range
    const temps = regionLocations.map(l => l.seaTemp);
    const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
    const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;

    const getSwimSafetyBadge = (safety: 'safe' | 'caution' | 'dangerous') => {
        switch (safety) {
            case 'safe':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">✓ Uygun</span>;
            case 'caution':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">⚠ Dikkat</span>;
            case 'dangerous':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">✕ Tehlike</span>;
        }
    };

    const getTempColor = (temp: number) => {
        if (temp >= 24) return 'text-orange-500 dark:text-orange-400';
        if (temp >= 20) return 'text-emerald-500 dark:text-emerald-400';
        if (temp >= 16) return 'text-cyan-500 dark:text-cyan-400';
        return 'text-blue-500 dark:text-blue-400';
    };

    const summary = generateRegionSummary(region, locations);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header - Accordion Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{regionInfo.emoji}</span>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-800 dark:text-white">{regionInfo.name}</h3>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {minTemp}° — {maxTemp}°C • {regionLocations.length} konum
                        </span>
                    </div>
                </div>
                <Icon.ChevronDown
                    size={20}
                    className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-700">
                    {/* Horizontal Scroll Cards */}
                    <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
                        <div className="flex gap-3 p-4" style={{ minWidth: 'max-content' }}>
                            {regionLocations.map((location) => (
                                <div
                                    key={location.city}
                                    onClick={() => onLocationClick?.(location.displayName)}
                                    className="flex-shrink-0 w-[120px] bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-105 border border-slate-200 dark:border-slate-600"
                                >
                                    {/* City Name */}
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate mb-2">
                                        {location.displayName}
                                    </div>

                                    {/* Temperature */}
                                    <div className={`text-2xl font-bold font-mono ${getTempColor(location.seaTemp)}`}>
                                        {location.seaTemp}°
                                    </div>

                                    {/* Wave + Safety */}
                                    <div className="mt-2 space-y-1">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            🌊 {location.waveHeight}m
                                        </div>
                                        {getSwimSafetyBadge(location.swimSafety)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Region Summary */}
                    <div className="px-4 pb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3">
                            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                📝 {summary}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeaRegionCard;
