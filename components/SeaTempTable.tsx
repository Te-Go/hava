import React, { useState, useMemo } from 'react';
import { Icon } from './Icons';
import { SeaTempLocation } from '../services/marineService';
import { toSlug } from '../services/weatherService';

interface SeaTempTableProps {
    locations: SeaTempLocation[];
    onLocationClick?: (city: string) => void;
}

type SortKey = 'displayName' | 'seaTemp' | 'waveHeight' | 'swimSafety';
type SortDirection = 'asc' | 'desc';

/**
 * SeaTempTable - Searchable, sortable table of all sea temperatures
 */
const SeaTempTable: React.FC<SeaTempTableProps> = ({ locations, onLocationClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('seaTemp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const filteredAndSortedLocations = useMemo(() => {
        let result = [...locations];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.displayName.toLowerCase().includes(query) ||
                l.city.toLowerCase().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortKey) {
                case 'displayName':
                    comparison = a.displayName.localeCompare(b.displayName, 'tr');
                    break;
                case 'seaTemp':
                    comparison = a.seaTemp - b.seaTemp;
                    break;
                case 'waveHeight':
                    comparison = a.waveHeight - b.waveHeight;
                    break;
                case 'swimSafety':
                    const safetyOrder = { safe: 0, caution: 1, dangerous: 2 };
                    comparison = safetyOrder[a.swimSafety] - safetyOrder[b.swimSafety];
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [locations, searchQuery, sortKey, sortDirection]);

    const getSwimSafetyBadge = (safety: 'safe' | 'caution' | 'dangerous') => {
        switch (safety) {
            case 'safe':
                return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">✓ Uygun</span>;
            case 'caution':
                return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">⚠ Dikkat</span>;
            case 'dangerous':
                return <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">✕ Tehlike</span>;
        }
    };

    const getTempColor = (temp: number) => {
        if (temp >= 24) return 'text-orange-600 dark:text-orange-400';
        if (temp >= 20) return 'text-emerald-600 dark:text-emerald-400';
        if (temp >= 16) return 'text-cyan-600 dark:text-cyan-400';
        return 'text-blue-600 dark:text-blue-400';
    };

    const SortIcon = ({ field }: { field: SortKey }) => {
        if (sortKey !== field) return <Icon.ChevronDown size={14} className="text-slate-300 dark:text-slate-600" />;
        return sortDirection === 'asc'
            ? <Icon.ChevronUp size={14} className="text-blue-500" />
            : <Icon.ChevronDown size={14} className="text-blue-500" />;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Search Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <div className="relative">
                    <Icon.Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Konum ara... (ör: Alanya)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th
                                onClick={() => handleSort('displayName')}
                                className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                            >
                                <div className="flex items-center gap-1">
                                    Konum <SortIcon field="displayName" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('seaTemp')}
                                className="px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                            >
                                <div className="flex items-center justify-center gap-1">
                                    °C <SortIcon field="seaTemp" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('waveHeight')}
                                className="px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Dalga <SortIcon field="waveHeight" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('swimSafety')}
                                className="px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Durum <SortIcon field="swimSafety" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredAndSortedLocations.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                    {searchQuery ? 'Konum bulunamadı' : 'Veri yükleniyor...'}
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedLocations.map((location) => (
                                <tr
                                    key={location.city}
                                    onClick={() => onLocationClick?.(location.displayName)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                            {location.displayName}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`font-bold font-mono ${getTempColor(location.seaTemp)}`}>
                                            {location.seaTemp}°
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {location.waveHeight}m
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {getSwimSafetyBadge(location.swimSafety)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
                {filteredAndSortedLocations.length} konum gösteriliyor
            </div>
        </div>
    );
};

export default SeaTempTable;
