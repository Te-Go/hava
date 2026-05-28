import React from 'react';
import { SeaTempLocation } from '../services/marineService';

interface TurkeySVGMapProps {
    locations: SeaTempLocation[];
    onLocationClick?: (city: string) => void;
}

/**
 * TurkeySVGMap - Lightweight SVG map of Turkey with temperature markers
 * Zero external dependencies, instant load, perfect for mobile
 * 
 * Coordinate system: viewBox maps roughly to Turkey's lat/lon bounds
 * Turkey spans: lat 36-42°N, lon 26-45°E
 * We map lon 26-45 → x 0-760, lat 36-42 → y 0-240 (inverted)
 */
const TurkeySVGMap: React.FC<TurkeySVGMapProps> = ({ locations, onLocationClick }) => {
    // Convert lat/lon to SVG coordinates
    const toSVGCoords = (lat: number, lon: number): { x: number; y: number } => {
        // Turkey bounds
        const minLon = 25, maxLon = 45;
        const minLat = 35.5, maxLat = 42.5;

        const x = ((lon - minLon) / (maxLon - minLon)) * 760;
        const y = ((maxLat - lat) / (maxLat - minLat)) * 240; // Inverted Y
        return { x, y };
    };

    const getTempColor = (temp: number): string => {
        if (temp >= 24) return '#f97316'; // orange-500
        if (temp >= 20) return '#10b981'; // emerald-500
        if (temp >= 16) return '#06b6d4'; // cyan-500
        return '#3b82f6'; // blue-500
    };

    const getTempBgColor = (temp: number): string => {
        if (temp >= 24) return '#fff7ed'; // orange-50
        if (temp >= 20) return '#ecfdf5'; // emerald-50
        if (temp >= 16) return '#ecfeff'; // cyan-50
        return '#eff6ff'; // blue-50
    };

    return (
        <div className="relative w-full bg-gradient-to-b from-blue-100 to-cyan-100 dark:from-slate-800 dark:to-slate-700 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
            {/* Title overlay */}
            <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">🌊 Deniz Suyu Sıcaklıkları</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{locations.length} konum</p>
            </div>

            {/* Legend */}
            <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1.5 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>&lt;16°</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span>16-20°</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>20-24°</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span>&gt;24°</span>
                </div>
            </div>

            <svg
                viewBox="0 0 760 280"
                className="w-full h-auto"
                style={{ minHeight: '200px', maxHeight: '350px' }}
            >
                {/* Sea background */}
                <rect x="0" y="0" width="760" height="280" fill="url(#seaGradient)" />

                {/* Gradient definitions */}
                <defs>
                    <linearGradient id="seaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#bfdbfe" /> {/* blue-200 */}
                        <stop offset="100%" stopColor="#a5f3fc" /> {/* cyan-200 */}
                    </linearGradient>
                    <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
                    </filter>
                </defs>

                {/* Simplified Turkey outline */}
                <path
                    d="M 40 120 
                       C 60 100, 100 90, 150 85
                       C 200 80, 260 75, 320 70
                       C 380 65, 440 60, 500 55
                       C 560 50, 620 55, 680 65
                       C 720 75, 740 90, 750 110
                       L 750 140
                       C 740 160, 720 180, 680 190
                       C 620 200, 560 205, 500 210
                       C 440 215, 380 220, 320 225
                       C 260 230, 200 235, 150 230
                       C 100 225, 60 210, 40 190
                       Z"
                    fill="#f1f5f9"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    className="dark:fill-slate-600 dark:stroke-slate-500"
                />

                {/* Sea labels */}
                <text x="80" y="260" className="text-[11px] fill-blue-600 dark:fill-blue-400 font-medium">Ege</text>
                <text x="320" y="270" className="text-[11px] fill-cyan-600 dark:fill-cyan-400 font-medium">Akdeniz</text>
                <text x="600" y="30" className="text-[11px] fill-slate-600 dark:fill-slate-400 font-medium">Karadeniz</text>
                <text x="180" y="40" className="text-[11px] fill-slate-500 dark:fill-slate-400 font-medium">Marmara</text>

                {/* Temperature markers */}
                {locations.map((location) => {
                    const { x, y } = toSVGCoords(location.lat, location.lon);
                    const color = getTempColor(location.seaTemp);

                    return (
                        <g
                            key={location.city}
                            className="cursor-pointer hover:scale-110 transition-transform origin-center"
                            style={{ transformOrigin: `${x}px ${y}px` }}
                            onClick={() => onLocationClick?.(location.displayName)}
                        >
                            {/* Marker circle */}
                            <circle
                                cx={x}
                                cy={y}
                                r="16"
                                fill={color}
                                filter="url(#markerShadow)"
                                className="stroke-white stroke-2"
                            />
                            {/* Temperature text */}
                            <text
                                x={x}
                                y={y + 4}
                                textAnchor="middle"
                                className="text-[10px] font-bold fill-white pointer-events-none"
                            >
                                {Math.round(location.seaTemp)}°
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Stats bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 px-4 py-2">
                <div className="flex justify-between items-center text-xs">
                    {locations.length > 0 && (() => {
                        const temps = locations.map(l => l.seaTemp);
                        const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
                        const maxLoc = locations.reduce((a, b) => a.seaTemp > b.seaTemp ? a : b);
                        const minLoc = locations.reduce((a, b) => a.seaTemp < b.seaTemp ? a : b);
                        return (
                            <>
                                <span className="text-slate-600 dark:text-slate-300">
                                    Ort: <strong className="text-blue-600 dark:text-blue-400">{avgTemp}°C</strong>
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                    🔥 {maxLoc.displayName}: <strong className="text-orange-600 dark:text-orange-400">{maxLoc.seaTemp}°</strong>
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                    ❄️ {minLoc.displayName}: <strong className="text-cyan-600 dark:text-cyan-400">{minLoc.seaTemp}°</strong>
                                </span>
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default TurkeySVGMap;
