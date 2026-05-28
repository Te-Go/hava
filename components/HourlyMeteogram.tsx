
import React, { useRef } from 'react';
import { HourlyForecast } from '../types';
import GlassCard from './GlassCard';
import { Icon } from './Icons';

interface HourlyMeteogramProps {
    hourlyData: HourlyForecast[];
    sunrise: string;
    sunset: string;
}

// Helper for Icons in meteogram
const getChartIcon = (iconName: string, size: number = 20) => {
    switch (iconName) {
        case 'sunny': return <Icon.Sun size={size} className="text-orange-400 drop-shadow-sm" />;
        case 'moon': return <Icon.Moon size={size} className="text-indigo-300 drop-shadow-sm" />;
        case 'cloudy': return <Icon.Cloud size={size} className="text-slate-400" />;
        case 'cloudy-night': return <Icon.Cloud size={size} className="text-slate-500" />;
        case 'overcast': return <Icon.Cloud size={size} className="text-slate-500" />;
        case 'rain': return <Icon.CloudRain size={size} className="text-blue-400" />;
        case 'drizzle': return <Icon.CloudRain size={size} className="text-blue-300" />;
        case 'snow': return <Icon.CloudSnow size={size} className="text-cyan-300" />;
        case 'storm': return <Icon.CloudLightning size={size} className="text-amber-500" />;
        case 'fog': return <Icon.CloudFog size={size} className="text-slate-400" />;
        default: return <Icon.Cloud size={size} className="text-slate-400" />;
    }
};

const HourlyMeteogram: React.FC<HourlyMeteogramProps> = ({ hourlyData, sunrise, sunset }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Use up to 48 hours of data if available (e.g., Weekend mode), otherwise 24
    const maxHours = Math.min(hourlyData.length, 48);
    const data = hourlyData.slice(0, maxHours);

    // Temperature range for graph positioning (always use actual temp, not feels like)
    const temps = data.map(h => h.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = maxTemp - minTemp || 1;

    // Parse sunrise/sunset hours
    const sunriseHour = parseInt(sunrise.split(':')[0], 10);
    const sunsetHour = parseInt(sunset.split(':')[0], 10);

    // Scroll handlers
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = 200;
            scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
        }
    };

    // Generate SVG path for temperature graph
    const cardWidth = 56;
    const graphHeight = 45;
    const graphTopOffset = 115; // Position graph in the middle section

    // Calculate min/max including feels like for proper scaling
    const allTemps = data.flatMap(h => [h.temp, h.feelsLike]);
    const graphMinTemp = Math.min(...allTemps);
    const graphMaxTemp = Math.max(...allTemps);
    const graphTempRange = graphMaxTemp - graphMinTemp || 1;

    // Actual temperature path points
    const pathPoints = data.map((h, i) => {
        const x = i * cardWidth + cardWidth / 2;
        const y = graphHeight - ((h.temp - graphMinTemp) / graphTempRange) * (graphHeight - 12) - 6;
        return { x, y };
    });

    // Feels like temperature path points
    const feelsLikePoints = data.map((h, i) => {
        const x = i * cardWidth + cardWidth / 2;
        const y = graphHeight - ((h.feelsLike - graphMinTemp) / graphTempRange) * (graphHeight - 12) - 6;
        return { x, y };
    });

    const linePath = pathPoints.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
    const feelsLikePath = feelsLikePoints.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
    const areaPath = linePath + ` L ${pathPoints[pathPoints.length - 1].x},${graphHeight} L ${pathPoints[0].x},${graphHeight} Z`;

    return (
        <GlassCard className="flex flex-col h-[360px]" noPadding>
            {/* Header - Clean without toggle */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100/80 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">Saatlik Tahmin</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500">({maxHours} Saat)</span>
                </div>
                {/* Sunrise/Sunset times in header */}
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                        <Icon.Sun size={12} className="text-orange-400" />
                        <span>{sunrise}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Icon.Moon size={12} className="text-indigo-400" />
                        <span>{sunset}</span>
                    </div>
                </div>
            </div>

            {/* Scroll Container */}
            <div className="relative group flex-1">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-lg border border-white/50 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hidden md:flex"
                >
                    <Icon.ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-lg border border-white/50 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hidden md:flex"
                >
                    <Icon.ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>

                {/* Scrollable Rail */}
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto snap-x snap-mandatory relative h-full"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {/* SVG Graph Background */}
                    <svg
                        className="absolute left-0 pointer-events-none z-0"
                        style={{ top: `${graphTopOffset}px` }}
                        width={data.length * cardWidth}
                        height={graphHeight}
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="tempGradientFinal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        {/* Area fill for actual temperature */}
                        <path d={areaPath} fill="url(#tempGradientFinal)" />
                        {/* Feels Like line - dashed orange */}
                        <path d={feelsLikePath} stroke="#f97316" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
                        {/* Actual Temperature line - solid blue */}
                        <path d={linePath} stroke="#3b82f6" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Data points for actual temperature */}
                        {pathPoints.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r={2} fill="#3b82f6" stroke="white" strokeWidth={1} />
                        ))}
                    </svg>

                    {/* Hour Cards */}
                    {data.map((hour, index) => {
                        const currentHour = parseInt(hour.time.split(':')[0], 10);
                        const isSunrise = currentHour === sunriseHour;
                        const isSunset = currentHour === sunsetHour;

                        return (
                            <div
                                key={index}
                                className={`snap-start flex-shrink-0 flex flex-col items-center pt-4 pb-2 relative z-10 transition-all hover:scale-105 ${hour.isDay
                                    ? 'bg-gradient-to-b from-amber-100/60 via-amber-50/30 to-transparent dark:from-slate-700/20'
                                    : 'bg-gradient-to-b from-indigo-100/50 via-indigo-50/30 to-transparent dark:from-slate-900/40'
                                    }`}
                                style={{ width: `${cardWidth}px` }}
                            >
                                {/* Time */}
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-3">
                                    {hour.time}
                                </span>

                                {/* Weather Icon - More spacing */}
                                <div className="mb-4">
                                    {getChartIcon(hour.icon, 22)}
                                </div>

                                {/* Temperature - Clear spacing from icon */}
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-8">
                                    {Math.round(hour.temp)}°
                                </span>

                                {/* Spacer for graph area */}
                                <div className="h-[45px]" />

                                {/* Precipitation Bar */}
                                <div className="flex flex-col items-center h-8 mt-1">
                                    {hour.precipProb > 0 ? (
                                        <>
                                            <div
                                                className="w-4 bg-gradient-to-t from-blue-500/70 to-blue-400/50 rounded-t-sm"
                                                style={{ height: `${Math.max(hour.precipProb / 4, 2)}px` }}
                                            />
                                            <span className="text-[9px] text-blue-500 dark:text-blue-400 font-semibold mt-0.5">
                                                {hour.precipProb}%
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[9px] text-slate-300 dark:text-slate-600">-</span>
                                    )}
                                </div>

                                {/* Wind */}
                                <div className="flex items-center gap-0.5 text-[9px] text-slate-400 dark:text-slate-500">
                                    <Icon.Wind size={9} />
                                    <span>{hour.windSpeed}</span>
                                </div>

                                {/* Sunrise/Sunset Marker */}
                                {isSunrise && (
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-orange-100/90 dark:bg-orange-900/60 px-1.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                                        <Icon.Sun size={9} className="text-orange-500" />
                                    </div>
                                )}
                                {isSunset && (
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-indigo-100/90 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                        <Icon.Moon size={9} className="text-indigo-500" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend - With Hissedilen explanation */}
            <div className="flex justify-between items-center px-4 py-2 border-t border-slate-100/80 dark:border-slate-700/50 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-0.5 bg-blue-500 rounded-full" />
                        <span>Sıcaklık</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Icon.Thermometer size={10} className="text-orange-400" />
                        <span>Hissedilen</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Icon.Droplets size={10} className="text-blue-400" />
                        <span>Yağış %</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Icon.Wind size={10} className="text-slate-400" />
                        <span>Rüzgar</span>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default HourlyMeteogram;
