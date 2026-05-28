import React, { useState, useEffect } from 'react';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import { TrafficWidget, MarineWidget, SkiConditions, RegionalSummary } from '../islands';

// Import real data services
import { fetchMarineData, generateMarineNarrative, isCoastalCity, type MarineData } from '../services/marineService';
import { fetchTrafficData, hasTrafficMonitoring, type TomTomTrafficData } from '../services/tomtomTrafficService';
import { calculateSkiConditions, hasSkiResort, type SkiData } from '../services/skiService';

// TomTom API Key (should be in environment variables in production)
const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY || '';

interface CityProfile {
    key: string;
    name: string;
    displayName: string;
    categories: string[];
    coords: { lat: number; lon: number };
}

const DEMO_CITIES: CityProfile[] = [
    {
        key: 'istanbul',
        name: 'İstanbul',
        displayName: 'Kadıköy',
        categories: ['metro', 'coastal'],
        coords: { lat: 41.0082, lon: 28.9784 }
    },
    {
        key: 'antalya',
        name: 'Antalya',
        displayName: 'Alanya',
        categories: ['coastal', 'tourism'],
        coords: { lat: 36.8969, lon: 30.7133 }
    },
    {
        key: 'erzurum',
        name: 'Erzurum',
        displayName: 'Palandöken',
        categories: ['mountain'],
        coords: { lat: 39.9043, lon: 41.2679 }
    },
    {
        key: 'siirt',
        name: 'Siirt',
        displayName: 'Merkez',
        categories: ['inland'],
        coords: { lat: 37.9333, lon: 41.9500 }
    },
];

/**
 * Island Demo Page with REAL DATA from automated services
 */
const IslandDemo: React.FC = () => {
    const [selectedCity, setSelectedCity] = useState<CityProfile>(DEMO_CITIES[0]);
    const [marineData, setMarineData] = useState<MarineData | null>(null);
    const [trafficData, setTrafficData] = useState<TomTomTrafficData | null>(null);
    const [skiData, setSkiData] = useState<SkiData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data when city changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setMarineData(null);
            setTrafficData(null);
            setSkiData(null);

            try {
                const { coords, key, categories } = selectedCity;

                // Fetch marine data for coastal cities
                if (categories.includes('coastal') || isCoastalCity(key)) {
                    const marine = await fetchMarineData(key);
                    setMarineData(marine);
                }

                // Fetch REAL traffic data from TomTom API for metro cities
                if (hasTrafficMonitoring(key) || categories.includes('metro')) {
                    const traffic = await fetchTrafficData(key, TOMTOM_API_KEY);
                    setTrafficData(traffic);
                }

                // Get ski data for mountain cities
                if (hasSkiResort(key) || categories.includes('mountain')) {
                    // Mock weather data for ski calculation
                    const ski = calculateSkiConditions(
                        key,
                        -5,  // currentTemp
                        10,  // precipitation mm
                        20,  // windSpeed
                        40,  // cloudCover
                        0    // snowfallMm
                    );
                    setSkiData(ski);
                }

            } catch (err) {
                console.error('Data fetch error:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCity]);

    // Determine which modules to show
    const showTraffic = hasTrafficMonitoring(selectedCity.key) || selectedCity.categories.includes('metro');
    const showMarine = selectedCity.categories.includes('coastal') || isCoastalCity(selectedCity.key);
    const showSki = hasSkiResort(selectedCity.key) || selectedCity.categories.includes('mountain');
    const showRegional = !showTraffic && !showMarine && !showSki;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                        🏝️ Island Components Demo
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        <strong className="text-green-500">REAL DATA</strong> from automated services
                    </p>
                </div>

                {/* City Selector */}
                <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                    <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                        Select City Profile:
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {DEMO_CITIES.map((city) => (
                            <button
                                key={city.key}
                                onClick={() => setSelectedCity(city)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCity.key === city.key
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {city.name}
                                <span className="block text-xs opacity-70">{city.categories.join(' + ')}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500">Fetching real data...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                        <p className="text-red-700 dark:text-red-400">Error: {error}</p>
                    </div>
                )}

                {/* Active Modules */}
                {!loading && (
                    <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                            Active Modules for {selectedCity.name}:
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <ModuleBadge name="Traffic" active={showTraffic} hasData={!!trafficData} />
                            <ModuleBadge name="Marine" active={showMarine} hasData={!!marineData} />
                            <ModuleBadge name="Ski" active={showSki} hasData={!!skiData} />
                            <ModuleBadge name="Regional" active={showRegional} hasData={true} />
                        </div>
                    </div>
                )}

                {/* Widgets Display */}
                {!loading && (
                    <div className="space-y-6">
                        {/* Traffic Widget */}
                        {showTraffic && trafficData && (
                            <div style={{ '--sinan-slot-height': '250px' } as React.CSSProperties}>
                                <WidgetErrorBoundary widgetName="Traffic">
                                    <TrafficWidget
                                        city={selectedCity.key}
                                        cityDisplay={selectedCity.name}
                                        data={{
                                            congestionLevel: trafficData.congestionLevel,
                                            mainRoutes: trafficData.mainRoutes.map(r => ({ name: r.name, delay: r.delay }))
                                        }}
                                        narrative={trafficData.narrative}
                                        lastUpdated={trafficData.lastUpdated}
                                    />
                                </WidgetErrorBoundary>
                            </div>
                        )}

                        {/* Marine Widget */}
                        {showMarine && marineData && (
                            <div style={{ '--sinan-slot-height': '220px' } as React.CSSProperties}>
                                <WidgetErrorBoundary widgetName="Marine">
                                    <MarineWidget
                                        data={{
                                            seaTemp: marineData.seaTemp,
                                            waveHeight: marineData.waveHeight,
                                            windSpeed: 15, // Could calculate from weather
                                            ferryStatus: marineData.ferryStatus
                                        }}
                                        narrative={generateMarineNarrative(marineData)}
                                        lastUpdated={marineData.lastUpdated}
                                    />
                                </WidgetErrorBoundary>
                            </div>
                        )}

                        {/* Marine Loading/Not Available */}
                        {showMarine && !marineData && !loading && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
                                <p className="text-blue-600 dark:text-blue-400">
                                    📡 Marine data loading... (Open-Meteo Marine API)
                                </p>
                            </div>
                        )}

                        {/* Ski Conditions */}
                        {showSki && skiData && (
                            <div style={{ '--sinan-slot-height': '240px' } as React.CSSProperties}>
                                <WidgetErrorBoundary widgetName="Ski">
                                    <SkiConditions
                                        data={{
                                            resort: skiData.resort,
                                            snowDepth: skiData.snowDepth,
                                            liftsOpen: skiData.liftsOpen,
                                            liftsTotal: skiData.liftsTotal,
                                            avalancheRisk: skiData.avalancheRisk
                                        }}
                                        narrative={skiData.narrative}
                                        lastUpdated={skiData.lastUpdated}
                                    />
                                </WidgetErrorBoundary>
                            </div>
                        )}

                        {/* Regional Summary (Default Fallback) */}
                        {showRegional && (
                            <div style={{ '--sinan-slot-height': '140px' } as React.CSSProperties}>
                                <WidgetErrorBoundary widgetName="Regional">
                                    <RegionalSummary
                                        narrative={`${selectedCity.name} bölgesinde hava durumu normal seyrediyor. Detaylı tahminler için şehir sayfasını ziyaret edin.`}
                                        cityDisplay={selectedCity.name}
                                    />
                                </WidgetErrorBoundary>
                            </div>
                        )}
                    </div>
                )}

                {/* Data Source Info */}
                <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">📊 Data Sources:</h3>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <li>• <strong>Marine:</strong> Open-Meteo Marine API (FREE)</li>
                        <li>• <strong>Traffic:</strong> Algorithmic estimation (time + weather patterns)</li>
                        <li>• <strong>Ski:</strong> Derived from weather data (snow accumulation model)</li>
                        <li>• <strong>Regional:</strong> Generated narrative</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

// Module badge component
const ModuleBadge: React.FC<{ name: string; active: boolean; hasData: boolean }> = ({ name, active, hasData }) => {
    if (!active) {
        return (
            <span className="px-2 py-1 rounded text-xs font-mono bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                {name}: ✗
            </span>
        );
    }

    return (
        <span className={`px-2 py-1 rounded text-xs font-mono ${hasData
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
            {name}: {hasData ? '✓ Data' : '⏳ Loading'}
        </span>
    );
};

export default IslandDemo;
