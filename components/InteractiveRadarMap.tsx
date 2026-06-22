import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

// Enforce Leaflet CSS directly into this bundle slot
import 'leaflet/dist/leaflet.css';

const MAJOR_CITIES = [
    { name: 'İstanbul', lat: 41.0082, lon: 28.9784, key: 'istanbul' },
    { name: 'Ankara', lat: 39.9334, lon: 32.8597, key: 'ankara' },
    { name: 'İzmir', lat: 38.4237, lon: 27.1428, key: 'izmir' },
    { name: 'Bursa', lat: 40.1885, lon: 29.0610, key: 'bursa' },
    { name: 'Antalya', lat: 36.8969, lon: 30.7133, key: 'antalya' },
    { name: 'Adana', lat: 37.0017, lon: 35.3289, key: 'adana' },
    { name: 'Konya', lat: 37.8714, lon: 32.4847, key: 'konya' },
    { name: 'Gaziantep', lat: 37.0662, lon: 37.3833, key: 'gaziantep' },
    { name: 'Kayseri', lat: 38.7205, lon: 35.4826, key: 'kayseri' },
    { name: 'Samsun', lat: 41.2928, lon: 36.3313, key: 'samsun' },
    { name: 'Diyarbakır', lat: 37.9144, lon: 40.2106, key: 'diyarbakir' },
    { name: 'Erzurum', lat: 39.9056, lon: 41.2658, key: 'erzurum' },
    { name: 'Trabzon', lat: 41.0027, lon: 39.7168, key: 'trabzon' },
    { name: 'Van', lat: 38.5012, lon: 43.3723, key: 'van' }
];

interface InteractiveRadarMapProps {
    weatherData?: any | null;
    isDarkMode?: boolean;
}

type LayerType = 'radar' | 'temp' | 'wind';

const InteractiveRadarMap: React.FC<InteractiveRadarMapProps> = ({ weatherData, isDarkMode = true }) => {
    // SSR guard
    if (typeof window === 'undefined') {
        return <div className="w-full h-[350px] md:h-[400px] lg:h-[450px] bg-slate-100 rounded-xl animate-pulse" />;
    }

    const [activeLayer, setActiveLayer] = useState<LayerType>('radar');
    const [cityWeatherData, setCityWeatherData] = useState<any[]>([]);
    const [radarConfig, setRadarConfig] = useState<{ host: string; path: string } | null>(null);
    const [mapReady, setMapReady] = useState(false); // Lifecycle safety state

    const mapRef = useRef<any>(null); // Leaflet map instance stored in persistent ref
    const mapContainerRef = useRef<HTMLDivElement>(null); // Map DOM container
    const tileLayerRef = useRef<any>(null);
    const radarOverlayRef = useRef<any>(null);
    const markersGroupRef = useRef<any>(null);

    // 1. Fetch RainViewer configuration via backend rest proxy (avoiding CSP connect block)
    useEffect(() => {
        const fetchRadarConfig = async () => {
            try {
                const response = await fetch('/wp-json/sinan/v1/radar');
                if (!response.ok) throw new Error('Proxy Radar API failed');
                const data = await response.json();
                
                const host = data?.host;
                const pastFrames = data?.radar?.past;
                
                if (host && Array.isArray(pastFrames) && pastFrames.length > 0) {
                    const latestFrame = pastFrames[pastFrames.length - 1];
                    const path = latestFrame?.path;
                    if (path) {
                        setRadarConfig({ host, path });
                    }
                }
            } catch (err) {
                console.error('[Radar Map] Config fetch failed, falling back:', err);
                setRadarConfig({
                    host: 'https://tilecache.rainviewer.com',
                    path: '/v2/radar/nowcast'
                });
            }
        };

        fetchRadarConfig();
    }, []);

    // 2. Fetch major cities weather for vector overlays
    useEffect(() => {
        const fetchCitiesWeather = async () => {
            try {
                const lats = MAJOR_CITIES.map(c => c.lat).join(',');
                const lons = MAJOR_CITIES.map(c => c.lon).join(',');
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=auto`;
                
                const response = await fetch(url);
                if (!response.ok) throw new Error('Open-Meteo multi-city fetch failed');
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    const mapped = data.map((item, index) => ({
                        ...MAJOR_CITIES[index],
                        temp: item?.current?.temperature_2m ?? 15,
                        windSpeed: item?.current?.wind_speed_10m ?? 10,
                        windDir: item?.current?.wind_direction_10m ?? 0
                    }));
                    setCityWeatherData(mapped);
                } else if (data && typeof data === 'object') {
                    const mapped = MAJOR_CITIES.map((city, index) => {
                        const cityItem = Array.isArray(data) ? data[index] : (data[index] || data);
                        return {
                            ...city,
                            temp: cityItem?.current?.temperature_2m ?? 15,
                            windSpeed: cityItem?.current?.wind_speed_10m ?? 10,
                            windDir: cityItem?.current?.wind_direction_10m ?? 0
                        };
                    });
                    setCityWeatherData(mapped);
                }
            } catch (err) {
                console.error('[Radar Map] Cities weather fetch failed:', err);
            }
        };

        fetchCitiesWeather();
    }, []);

    // 3. SAFE SPA LIFE-CYCLE IMPLEMENTATION VIA useRef
    useEffect(() => {
        let isMounted = true;

        if (!mapRef.current && mapContainerRef.current) {
            import('leaflet').then((L) => {
                // Guard against asynchronous resolution if the component unmounted early
                if (!isMounted || mapRef.current) return;

                // Determine active page context
                const path = window.location.pathname;
                const segments = path.split('/').filter(Boolean);
                const isCityPage = segments.length >= 2 && 
                                   segments[0] === 'hava-durumu' && 
                                   !['yarin', '15-gunluk', 'hafta-sonu', 'analiz', 'haberler', 'iletisim', 'hakkimizda', 'gizlilik-politikasi', 'kullanim-kosullari', 'wp-admin', 'wp-json', 'sitemap', 'feed', 'rss', 'konum-ara', 'island-demo', 'deniz-suyu-sicakligi', 'sehirler'].includes(segments[1]);

                // Extract coordinates from injected global payload context
                const payload = (window as any).SinanWeatherPayload;
                const initialLat = isCityPage && payload?.weatherData?.latitude ? payload.weatherData.latitude : 39.0000;
                const initialLon = isCityPage && payload?.weatherData?.longitude ? payload.weatherData.longitude : 35.5000;
                const initialZoom = isCityPage ? 8 : 6;

                // Initialize Leaflet Map instance ONLY ONCE
                mapRef.current = L.map(mapContainerRef.current!, {
                    minZoom: 5,
                    maxZoom: 10,
                    zoomControl: false,
                    scrollWheelZoom: false,
                    attributionControl: false
                }).setView([initialLat, initialLon], initialZoom);

                // Set theme-aware tile layer (CartoDB voyager for light, dark_all for dark mode)
                const tileUrl = isDarkMode 
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

                tileLayerRef.current = L.tileLayer(tileUrl, {
                    maxZoom: 19
                }).addTo(mapRef.current);

                // Restrict bounds to Turkey geometry
                const southWest = L.latLng(34.0, 24.0);
                const northEast = L.latLng(43.0, 46.0);
                const bounds = L.latLngBounds(southWest, northEast);
                mapRef.current.setMaxBounds(bounds);

                // Add Zoom Control at bottom right
                L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

                markersGroupRef.current = L.layerGroup().addTo(mapRef.current);

                setMapReady(true); // Signal that map is ready to receive overlays

                // Force layout recalculation to clear tile display issues
                setTimeout(() => {
                    if (mapRef.current) {
                        mapRef.current.invalidateSize();
                    }
                }, 200);
            });
        }

        // Structural Cleanup: Destroys map instance on unmount to prevent empty dead DOM nodes on remount
        return () => {
            isMounted = false;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            setMapReady(false);
        };
    }, []);

    // 4. Update tile layer styles dynamically on dark mode state changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !tileLayerRef.current || !mapReady) return;

        const newTileUrl = isDarkMode 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        
        tileLayerRef.current.setUrl(newTileUrl);
    }, [isDarkMode, mapReady]);

    // 5. Handle safe single-page routing re-centering without map container crashes
    useEffect(() => {
        if (mapRef.current && mapReady) {
            const path = window.location.pathname;
            const segments = path.split('/').filter(Boolean);
            const isCityPage = segments.length >= 2 && 
                               segments[0] === 'hava-durumu' && 
                               !['yarin', '15-gunluk', 'hafta-sonu', 'analiz', 'haberler', 'iletisim', 'hakkimizda', 'gizlilik-politikasi', 'kullanim-kosullari', 'wp-admin', 'wp-json', 'sitemap', 'feed', 'rss', 'konum-ara', 'island-demo', 'deniz-suyu-sicakligi', 'sehirler'].includes(segments[1]);

            if (isCityPage && weatherData?.coord) {
                const { lat, lon } = weatherData.coord;
                if (typeof lat === 'number' && typeof lon === 'number') {
                    mapRef.current.setView([lat, lon], 8, { animate: true });
                }
            } else {
                // Return to macro Turkey overview when on generic views
                mapRef.current.setView([39.0000, 35.5000], 6, { animate: true });
            }
        }
    }, [weatherData?.coord, mapReady]);

    // 6. Update overlays (precipitation, temperature badges, wind vectors) on configuration shifts
    useEffect(() => {
        const updateLayers = async () => {
            const map = mapRef.current;
            if (!map || !mapReady) return;

            const L = await import('leaflet');

            // Clean up old radar overlays
            if (radarOverlayRef.current) {
                map.removeLayer(radarOverlayRef.current);
                radarOverlayRef.current = null;
            }

            // Clean up old markers
            if (markersGroupRef.current) {
                markersGroupRef.current.clearLayers();
            }

            const safeLayer = activeLayer || 'radar';

            if (safeLayer === 'radar') {
                if (radarConfig) {
                    const radarUrl = `${radarConfig.host}${radarConfig.path}/256/{z}/{x}/{y}/1/1_1.png`;
                    const radarLayer = L.tileLayer(radarUrl, {
                        opacity: 0.75,
                        maxZoom: 12
                    });
                    radarLayer.addTo(map);
                    radarOverlayRef.current = radarLayer;
                }
            } else if (safeLayer === 'temp') {
                // Renders custom glowing circular temperature badges
                cityWeatherData.forEach((city) => {
                    const tempVal = Math.round(city?.temp ?? 15);
                    const color = tempVal >= 30 ? '#ef4444' : tempVal >= 20 ? '#f97316' : tempVal >= 10 ? '#22c55e' : '#3b82f6';
                    
                    const markerIcon = L.divIcon({
                        className: 'custom-temp-marker',
                        html: `
                            <div class="flex items-center justify-center rounded-full font-bold text-white shadow-lg border border-white"
                                 style="
                                     background-color: ${color};
                                     width: 32px;
                                     height: 32px;
                                     font-size: 11px;
                                     box-shadow: 0 0 10px ${color}80;
                                 ">
                                ${tempVal}°
                            </div>
                        `,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });

                    const marker = L.marker([city?.lat ?? 39.0, city?.lon ?? 35.5], { icon: markerIcon });
                    
                    const popupContent = `
                        <div class="p-2 text-center font-sans">
                            <strong class="text-slate-800 font-bold block text-sm mb-1">${city?.name ?? ''}</strong>
                            <span class="text-lg font-extrabold" style="color: ${color};">${tempVal}°C</span>
                        </div>
                    `;
                    marker.bindPopup(popupContent);
                    markersGroupRef.current.addLayer(marker);
                });
            } else if (safeLayer === 'wind') {
                // Renders wind speed with rotating arrows (glowing vector mappers)
                cityWeatherData.forEach((city) => {
                    const speed = Math.round(city?.windSpeed ?? 10);
                    const dir = city?.windDir ?? 0;
                    
                    const markerIcon = L.divIcon({
                        className: 'custom-wind-marker',
                        html: `
                            <div class="flex items-center gap-1 bg-slate-900/90 text-white rounded-lg px-1.5 py-1 border border-slate-700 shadow-md"
                                 style="font-size: 9px; font-weight: 500;">
                                <div style="transform: rotate(${dir}deg); transition: transform 0.3s; display: inline-block;">
                                    ⬆️
                                </div>
                                <span>${speed} km/s</span>
                            </div>
                        `,
                        iconSize: [60, 24],
                        iconAnchor: [30, 12]
                    });

                    const marker = L.marker([city?.lat ?? 39.0, city?.lon ?? 35.5], { icon: markerIcon });
                    const popupContent = `
                        <div class="p-2 text-center font-sans">
                            <strong class="text-slate-800 font-bold block text-sm mb-1">${city?.name ?? ''} Rüzgar Raporu</strong>
                            <span class="text-slate-600 text-xs">Hız: <strong>${speed} km/sa</strong></span><br/>
                            <span class="text-slate-600 text-xs">Yön: <strong>${dir}°</strong></span>
                        </div>
                    `;
                    marker.bindPopup(popupContent);
                    markersGroupRef.current.addLayer(marker);
                });
            }
        };

        updateLayers();
    }, [activeLayer, cityWeatherData, radarConfig, mapReady]);

    return (
        <div className="w-full relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950/40 backdrop-blur-md">
            {/* FUTURISTIC GLASSMORPHISM SELECTOR OVERLAY */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
                <div className="flex bg-slate-950/80 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-1.5 border border-white/10 shadow-lg pointer-events-auto gap-1">
                    <button
                        onClick={() => setActiveLayer('radar')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center ${
                            activeLayer === 'radar' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Icon.CloudRain className="w-3.5 h-3.5 mr-1.5" />
                        Yağış Radarı
                    </button>
                    <button
                        onClick={() => setActiveLayer('temp')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center ${
                            activeLayer === 'temp' 
                            ? 'bg-orange-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Icon.Thermometer className="w-3.5 h-3.5 mr-1.5" />
                        Sıcaklık
                    </button>
                    <button
                        onClick={() => setActiveLayer('wind')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center ${
                            activeLayer === 'wind' 
                            ? 'bg-green-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Icon.Wind className="w-3.5 h-3.5 mr-1.5" />
                        Rüzgar
                    </button>
                </div>

                <div className="hidden sm:flex bg-slate-950/80 dark:bg-slate-900/90 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 shadow-lg text-[10px] font-semibold text-slate-300 items-center pointer-events-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-2"></span>
                    Canlı Meteoroloji Radarı
                </div>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-[350px] md:h-[400px] lg:h-[450px] z-0">
                <style>{`
                    .leaflet-popup-content-wrapper {
                        background: rgba(30, 41, 59, 0.95) !important;
                        color: #f8fafc !important;
                        border: 1px solid rgba(255, 255, 255, 0.1) !important;
                        backdrop-filter: blur(10px) !important;
                        border-radius: 12px !important;
                        overflow: hidden;
                    }
                    .leaflet-popup-tip {
                        background: rgba(30, 41, 59, 0.95) !important;
                    }
                    .leaflet-popup-content strong {
                        color: #ffffff !important;
                    }
                    .leaflet-bar {
                        border: 1px solid rgba(255, 255, 255, 0.1) !important;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
                        border-radius: 8px !important;
                        overflow: hidden;
                    }
                    .leaflet-bar a {
                        background-color: rgba(30, 41, 59, 0.9) !important;
                        color: #ffffff !important;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                    }
                    .leaflet-bar a:hover {
                        background-color: rgba(51, 65, 85, 0.9) !important;
                    }
                `}</style>
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>
        </div>
    );
};

export default InteractiveRadarMap;
