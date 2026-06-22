import React, { useEffect, useRef, useState } from 'react';

// Enforce Leaflet CSS directly into this bundle slot
import 'leaflet/dist/leaflet.css';
import { fromSlug } from '../services/weatherService';

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
    articles?: any[];
    weatherData?: any;
    compact?: boolean;
}

const InteractiveRadarMap: React.FC<InteractiveRadarMapProps> = ({ articles = [], weatherData, compact = false }) => {
    const mapRef = useRef<any>(null);
    const tileLayerRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const radarOverlayRef = useRef<any>(null);
    const markersGroupRef = useRef<any>(null);

    const [mapReady, setMapReady] = useState(false);
    const [activeLayer, setActiveLayer] = useState<'radar' | 'wind' | 'temp'>('radar');
    const [cityWeatherData, setCityWeatherData] = useState<any[]>([]);
    const [radarConfig, setRadarConfig] = useState<{ host: string; path: string } | null>(null);

    const isDarkMode = document.documentElement.classList.contains('dark');

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

        if (typeof window !== 'undefined' && mapContainerRef.current) {
            import('leaflet').then((L) => {
                if (!isMounted || mapRef.current) return;

                const path = window.location.pathname;
                const segments = path.split('/').filter(Boolean);
                const isCityPage = segments.length >= 2 && 
                                   segments[0] === 'hava-durumu' && 
                                   !['yarin', '15-gunluk', 'hafta-sonu', 'analiz', 'haberler', 'iletisim', 'hakkimizda', 'gizlilik-politikasi', 'kullanim-kosullari', 'wp-admin', 'wp-json', 'sitemap', 'feed', 'rss', 'konum-ara', 'island-demo', 'deniz-suyu-sicakligi', 'sehirler'].includes(segments[1]);

                const payload = (window as any).SinanWeatherPayload;
                const isDistrictPage = isCityPage && segments.length === 3 && !['yarin', '15-gunluk', 'hafta-sonu'].includes(segments[2]);
                const initialLat = isCityPage && payload?.weatherData?.latitude ? payload.weatherData.latitude : 39.0000;
                const initialLon = isCityPage && payload?.weatherData?.longitude ? payload.weatherData.longitude : 35.5000;
                const initialZoom = isDistrictPage ? 11 : isCityPage ? 8 : 6;

                // Initialize Leaflet Map with strict zoom ceiling limits
                const map = L.map(mapContainerRef.current!, {
                    minZoom: 4,
                    maxZoom: 18,
                    zoomControl: false,
                    scrollWheelZoom: false,
                    attributionControl: false
                }).setView([initialLat, initialLon], initialZoom);
                mapRef.current = map;

                // Standard OpenStreetMap track (renders local Turkish labels natively)
                const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 18,
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(map);
                tileLayerRef.current = tileLayer;

                // Restrict bounds to Turkey geometry
                const southWest = L.latLng(34.0, 24.0);
                const northEast = L.latLng(43.0, 46.0);
                const bounds = L.latLngBounds(southWest, northEast);
                map.setMaxBounds(bounds);

                // Add Zoom Control at bottom right
                L.control.zoom({ position: 'bottomright' }).addTo(map);

                markersGroupRef.current = L.layerGroup().addTo(map);

                setMapReady(true);
            });
        }

        return () => {
            isMounted = false;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            setMapReady(false);
        };
    }, []);

    // Handle safe single-page routing re-centering without constructor crashes
    useEffect(() => {
        if (mapRef.current && mapReady) {
            const path = window.location.pathname;
            const segments = path.split('/').filter(Boolean);
            const isCityPage = segments.length >= 2 && 
                               segments[0] === 'hava-durumu' && 
                               !['yarin', '15-gunluk', 'hafta-sonu', 'analiz', 'haberler', 'iletisim', 'hakkimizda', 'gizlilik-politikasi', 'kullanim-kosullari', 'wp-admin', 'wp-json', 'sitemap', 'feed', 'rss', 'konum-ara', 'island-demo', 'deniz-suyu-sicakligi', 'sehirler'].includes(segments[1]);

            const isDistrictPage = isCityPage && segments.length === 3 && !['yarin', '15-gunluk', 'hafta-sonu'].includes(segments[2]);
            if (isCityPage && weatherData?.coord) {
                const { lat, lon } = weatherData.coord;
                if (typeof lat === 'number' && typeof lon === 'number') {
                    mapRef.current.setView([lat, lon], isDistrictPage ? 11 : 8, { animate: true });
                }
            } else {
                // Return to Turkey overview when on homepage
                mapRef.current.setView([39.0000, 35.5000], 6, { animate: true });
            }
        }
    }, [weatherData?.coord, mapReady]);

    // Update overlays (precipitation, temperature badges, wind vectors) on configuration shifts
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
            const path = window.location.pathname;
            const segments = path.split('/').filter(Boolean);
            const isCityPage = segments.length >= 2 && segments[0] === 'hava-durumu';

            // Combine hardcoded cities with active high-accuracy context location
            let activeCitiesList = [...cityWeatherData];
            if (isCityPage && weatherData?.coord) {
                const currentLat = weatherData.coord.lat;
                const currentLon = weatherData.coord.lon;
                const exists = activeCitiesList.some(c => Math.abs(c.lat - currentLat) < 0.01 && Math.abs(c.lon - currentLon) < 0.01);
                if (!exists && currentLat && currentLon) {
                    activeCitiesList.push({
                        name: fromSlug(segments[segments.length - 1]),
                        lat: currentLat,
                        lon: currentLon,
                        temp: weatherData.currentTemp ?? 15,
                        windSpeed: weatherData.windSpeed ?? 10,
                        windDir: weatherData.windDir || weatherData.windDirection || 0,
                        isCurrentContext: true
                    });
                }
            }

            if (safeLayer === 'radar') {
                if (radarConfig) {
                    const radarUrl = `${radarConfig.host}${radarConfig.path}/256/{z}/{x}/{y}/1/1_1.png`;
                    const radarLayer = L.tileLayer(radarUrl, {
                        opacity: 0.75,
                        maxZoom: 18
                    });
                    radarLayer.addTo(map);
                    radarOverlayRef.current = radarLayer;
                }
            } else if (safeLayer === 'temp') {
                // Renders custom glowing circular temperature badges
                activeCitiesList.forEach((city) => {
                    const tempVal = Math.round(city?.temp ?? 15);
                    const color = tempVal >= 30 ? '#ef4444' : tempVal >= 20 ? '#f97316' : tempVal >= 10 ? '#22c55e' : '#3b82f6';
                    const isCurrent = city.isCurrentContext === true;
                    
                    const markerIcon = L.divIcon({
                        className: 'custom-temp-marker',
                        html: `
                            <div class="flex items-center justify-center rounded-full font-bold text-white shadow-lg border"
                                 style="
                                     background-color: ${color};
                                     width: 32px;
                                     height: 32px;
                                     font-size: 11px;
                                     box-shadow: ${isCurrent ? '0 0 15px #eab308' : `0 0 10px ${color}80`};
                                     border-color: ${isCurrent ? '#eab308' : '#ffffff'};
                                     border-width: ${isCurrent ? '2px' : '1px'};
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
                activeCitiesList.forEach((city) => {
                    const speed = Math.round(city?.windSpeed ?? 10);
                    const dir = city?.windDir ?? 0;
                    const isCurrent = city.isCurrentContext === true;
                    
                    const markerIcon = L.divIcon({
                        className: 'custom-wind-marker',
                        html: `
                            <div class="flex items-center gap-1 bg-slate-900/90 text-white rounded-lg px-1.5 py-1 border shadow-md"
                                 style="
                                     font-size: 9px; 
                                     font-weight: 500;
                                     box-shadow: ${isCurrent ? '0 0 15px #eab308' : '0 4px 6px rgba(0,0,0,0.1)'};
                                     border-color: ${isCurrent ? '#eab308' : '#334155'};
                                     border-width: ${isCurrent ? '2px' : '1px'};
                                 ">
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
    }, [activeLayer, cityWeatherData, radarConfig, mapReady, weatherData]);

    return (
        <div className="w-full relative rounded-xl overflow-hidden shadow-lg border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 transition-colors duration-300">
            {/* Map Container - Theme Aware hardware accelerated dark filter style */}
            <div ref={mapContainerRef} className={`w-full h-[350px] md:h-[400px] lg:h-[450px] z-0 ${isDarkMode ? 'dark-map' : ''}`} />
            
            <style>{`
                .dark-map .leaflet-tile-container {
                    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) !important;
                }
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

            {/* Floating Control Menu Layer */}
            <div className="absolute top-4 right-4 z-[1000] flex gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-xl">
                <button 
                    onClick={() => setActiveLayer('radar')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${activeLayer === 'radar' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                >
                    Radar
                </button>
                <button 
                    onClick={() => setActiveLayer('wind')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${activeLayer === 'wind' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                >
                    Rüzgar
                </button>
                <button 
                    onClick={() => setActiveLayer('temp')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${activeLayer === 'temp' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
                >
                    Sıcaklık
                </button>
            </div>
        </div>
    );
};

export default InteractiveRadarMap;
