import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { fromSlug, toSlug } from '../services/weatherService';

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
    if (typeof window === 'undefined') {
        return <div className="w-full h-[350px] md:h-[400px] lg:h-[450px] bg-slate-950 rounded-xl animate-pulse" />;
    }

    const [activeLayer, setActiveLayer] = useState<LayerType>('radar');
    const [cityWeatherData, setCityWeatherData] = useState<any[]>([]);
    const [radarConfig, setRadarConfig] = useState<{ host: string; path: string } | null>(null);
    const [mapReady, setMapReady] = useState(false);

    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const tileLayerRef = useRef<any>(null);
    const radarOverlayRef = useRef<any>(null);
    const markersGroupRef = useRef<any>(null);
    const contextMarkerRef = useRef<any>(null);

    // Compile compass headings or string directions back to numbers safely
    const parseWindDirectionToDegrees = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const s = String(val).trim().toUpperCase();
        const num = parseFloat(s);
        if (!isNaN(num)) return num;
        
        const mapping: Record<string, number> = {
            'N': 0, 'K': 0, 'KUZEY': 0, 'NNE': 22.5, 'KKD': 22.5, 'NE': 45, 'KD': 45, 'KUZEYDOĞU': 45,
            'ENE': 67.5, 'DKD': 67.5, 'E': 90, 'D': 90, 'DOĞU': 90, 'ESE': 112.5, 'DGD': 112.5,
            'SE': 135, 'GD': 135, 'GÜNEYDOĞU': 135, 'SSE': 157.5, 'GGD': 157.5, 'S': 180, 'G': 180,
            'GÜNEY': 180, 'SSW': 202.5, 'GGB': 202.5, 'SW': 225, 'GB': 225, 'GÜNEYBATI': 225,
            'WSW': 247.5, 'DGB': 247.5, 'W': 270, 'B': 270, 'BATI': 270, 'WNW': 292.5, 'BKB': 292.5,
            'NW': 315, 'KB': 315, 'KUZEYBATI': 315, 'NNW': 337.5, 'KKB': 337.5
        };
        return mapping[s] ?? 0;
    };

    // Translate degrees to reader-friendly Turkish 16-point heading texts
    const getWindDirectionLabel = (deg: number): string => {
        const normalized = ((deg % 360) + 360) % 360;
        if (normalized >= 348.75 || normalized < 11.25) return 'Kuzey';
        if (normalized >= 11.25 && normalized < 33.75) return 'Kuzey-Kuzeydoğu';
        if (normalized >= 33.75 && normalized < 56.25) return 'Kuzeydoğu';
        if (normalized >= 56.25 && normalized < 78.75) return 'Doğu-Kuzeydoğu';
        if (normalized >= 78.75 && normalized < 101.25) return 'Doğu';
        if (normalized >= 101.25 && normalized < 123.75) return 'Doğu-Güneydoğu';
        if (normalized >= 123.75 && normalized < 146.25) return 'Güneydoğu';
        if (normalized >= 146.25 && normalized < 168.75) return 'Güney-Güneydoğu';
        if (normalized >= 168.75 && normalized < 191.25) return 'Güney';
        if (normalized >= 191.25 && normalized < 213.75) return 'Güney-Güneybatı';
        if (normalized >= 213.75 && normalized < 236.25) return 'Güneybatı';
        if (normalized >= 236.25 && normalized < 258.75) return 'Batı-Güneybatı';
        if (normalized >= 258.75 && normalized < 281.25) return 'Batı';
        if (normalized >= 281.25 && normalized < 303.75) return 'Batı-Kuzeybatı';
        if (normalized >= 303.75 && normalized < 326.25) return 'Kuzeybatı';
        return 'Kuzey-Kuzeybatı';
    };

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
                    if (path) setRadarConfig({ host, path });
                }
            } catch (err) {
                setRadarConfig({ host: 'https://tilecache.rainviewer.com', path: '/v2/radar/nowcast' });
            }
        };
        fetchRadarConfig();
    }, []);

    useEffect(() => {
        const fetchCitiesWeather = async () => {
            try {
                const lats = MAJOR_CITIES.map(c => c.lat).join(',');
                const lons = MAJOR_CITIES.map(c => c.lon).join(',');
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=auto`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Open-Meteo multi-city fetch failed');
                const data = await response.json();
                const mapped = MAJOR_CITIES.map((city, index) => {
                    const cityItem = Array.isArray(data) ? data[index] : data;
                    return {
                        ...city,
                        temp: cityItem?.current?.temperature_2m ?? 15,
                        windSpeed: cityItem?.current?.wind_speed_10m ?? 10,
                        windDir: cityItem?.current?.wind_direction_10m ?? 0
                    };
                });
                setCityWeatherData(mapped);
            } catch (err) {
                console.error('[Radar Map] Cities weather fetch failed:', err);
            }
        };
        fetchCitiesWeather();
    }, []);

    useEffect(() => {
        let isMounted = true;
        if (!mapRef.current && mapContainerRef.current) {
            import('leaflet').then((L) => {
                if (!isMounted || mapRef.current) return;

                const path = window.location.pathname;
                const segments = path.split('/').filter(Boolean);
                const isCityPage = segments.length >= 2 && segments[0] === 'hava-durumu';
                const isDistrictPage = isCityPage && segments.length === 3 && !['yarin', '15-gunluk', 'hafta-sonu'].includes(segments[2]);

                const payload = (window as any).SinanWeatherPayload;
                const initialLat = isCityPage && payload?.weatherData?.latitude ? payload.weatherData.latitude : 38.9637;
                const initialLon = isCityPage && payload?.weatherData?.longitude ? payload.weatherData.longitude : 35.2433;
                const initialZoom = isDistrictPage ? 11 : isCityPage ? 8 : 6;

                const map = L.map(mapContainerRef.current!, {
                    minZoom: 4,
                    maxZoom: 18,
                    zoomControl: false,
                    scrollWheelZoom: false,
                    attributionControl: false
                }).setView([initialLat, initialLon], initialZoom);
                mapRef.current = map;

                // CartoDB International Track: Ensures clean romanized/Turkish baseline naming conventions natively
                tileLayerRef.current = L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=tr&x={x}&y={y}&z={z}', {
                    maxZoom: 18,
                    attribution: '&copy; Google Maps'
                }).addTo(map);

                const southWest = L.latLng(34.0, 24.0);
                const northEast = L.latLng(43.0, 46.0);
                map.setMaxBounds(L.latLngBounds(southWest, northEast));

                L.control.zoom({ position: 'bottomright' }).addTo(map);
                markersGroupRef.current = L.layerGroup().addTo(map);
                setMapReady(true);
                setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 200);
            });
        }
        return () => {
            isMounted = false;
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
            setMapReady(false);
        };
    }, []);

    useEffect(() => {
        if (mapRef.current && mapReady) {
            const path = window.location.pathname;
            const segments = path.split('/').filter(Boolean);
            const isCityPage = segments.length >= 2 && segments[0] === 'hava-durumu';
            const isDistrictPage = isCityPage && segments.length === 3 && !['yarin', '15-gunluk', 'hafta-sonu'].includes(segments[2]);

            if (isCityPage && weatherData?.coord) {
                const { lat, lon } = weatherData.coord;
                if (typeof lat === 'number' && typeof lon === 'number') {
                    mapRef.current.setView([lat, lon], isDistrictPage ? 11 : 8, { animate: true });
                }
            } else {
                mapRef.current.setView([38.9637, 35.2433], 6, { animate: true });
            }
        }
    }, [weatherData?.coord, mapReady]);

    useEffect(() => {
        const updateLayers = async () => {
            const map = mapRef.current;
            if (!map || !mapReady) return;
            const L = await import('leaflet');

            if (radarOverlayRef.current) { map.removeLayer(radarOverlayRef.current); radarOverlayRef.current = null; }
            if (markersGroupRef.current) markersGroupRef.current.clearLayers();
            if (contextMarkerRef.current) { map.removeLayer(contextMarkerRef.current); contextMarkerRef.current = null; }

            const path = window.location.pathname;
            const segments = path.split('/').filter(Boolean);
            const isCityPage = segments.length >= 2 && segments[0] === 'hava-durumu';

            let activeCitiesList = [...cityWeatherData];
            let currentContextLocation: any = null;

            if (isCityPage && weatherData?.coord) {
                const currentLat = weatherData.coord.lat;
                const currentLon = weatherData.coord.lon;
                const exists = activeCitiesList.some(c => Math.abs(c.lat - currentLat) < 0.01 && Math.abs(c.lon - currentLon) < 0.01);
                
                const rawLocationSlug = (segments[2] && !['yarin', '15-gunluk', 'hafta-sonu'].includes(segments[2])) ? segments[2] : segments[1];
                const solvedDegrees = parseWindDirectionToDegrees(weatherData.windDirection ?? weatherData.windDir);
                
                currentContextLocation = {
                    name: fromSlug(rawLocationSlug),
                    lat: currentLat,
                    lon: currentLon,
                    temp: weatherData.currentTemp ?? 15,
                    windSpeed: weatherData.windSpeed ?? 10,
                    windDir: solvedDegrees,
                    isCurrentContext: true
                };
                if (!exists && currentLat && currentLon) activeCitiesList.push(currentContextLocation);
            }

            if (isCityPage && weatherData?.coord?.lat && weatherData?.coord?.lon) {
                const beaconIcon = L.divIcon({
                    className: 'context-beacon-marker',
                    html: `
                        <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
                            <div class="absolute rounded-full bg-yellow-500 animate-ping opacity-75" style="width: 20px; height: 20px;"></div>
                            <div class="rounded-full bg-yellow-500" style="width: 10px; height: 10px; border: 2px solid #ffffff; box-shadow: 0 0 15px #eab308;"></div>
                        </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                const labelName = currentContextLocation?.name || fromSlug(segments[1]);
                const beaconMarker = L.marker([weatherData.coord.lat, weatherData.coord.lon], { icon: beaconIcon });
                beaconMarker.bindPopup(`<div class="p-1 text-center font-bold text-slate-800">${labelName}</div>`);
                beaconMarker.addTo(map);
                contextMarkerRef.current = beaconMarker;
            }

            const safeLayer = activeLayer || 'radar';
            if (safeLayer === 'radar') {
                if (radarConfig) {
                    const radarUrl = `${radarConfig.host}${radarConfig.path}/256/{z}/{x}/{y}/1/1_1.png`;
                    const radarLayer = L.tileLayer(radarUrl, { opacity: 0.75, maxZoom: 18, maxNativeZoom: 7 });
                    radarLayer.addTo(map);
                    radarOverlayRef.current = radarLayer;
                }
            } else if (safeLayer === 'temp') {
                activeCitiesList.forEach((city) => {
                    const tempVal = Math.round(city?.temp ?? 15);
                    const isCtx = city.isCurrentContext;
                    const color = tempVal >= 30 ? '#ef4444' : tempVal >= 20 ? '#f97316' : tempVal >= 10 ? '#22c55e' : '#3b82f6';
                    
                    const markerIcon = L.divIcon({
                        className: 'custom-temp-marker',
                        html: `<div class="flex items-center justify-center rounded-full font-bold text-white shadow-lg" style="background-color: ${color}; width: 32px; height: 32px; font-size: 11px; border: ${isCtx ? '2px solid #eab308' : '1px solid #ffffff'}; box-shadow: ${isCtx ? '0 0 15px #eab308' : `0 0 10px ${color}80`};">${tempVal}°</div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });
                    const marker = L.marker([city?.lat ?? 39.0, city?.lon ?? 35.5], { icon: markerIcon });
                    marker.bindPopup(`<div class="p-2 text-center font-sans"><strong class="text-slate-800 font-bold block text-sm mb-1">${city?.name ?? ''} ${isCtx ? '(Seçili)' : ''}</strong><span class="text-lg font-extrabold" style="color: ${color};">${tempVal}°C</span></div>`);
                    markersGroupRef.current.addLayer(marker);
                });
            } else if (safeLayer === 'wind') {
                activeCitiesList.forEach((city) => {
                    const speed = Math.round(city?.windSpeed ?? 10);
                    const rawDir = city.isCurrentContext ? city.windDir : parseWindDirectionToDegrees(city?.windDir ?? city?.windDirection);
                    const isCtx = city.isCurrentContext;
                    const txtLabel = getWindDirectionLabel(rawDir);
                    
                    const markerIcon = L.divIcon({
                        className: 'custom-wind-marker',
                        html: `
                            <div class="flex items-center gap-1 text-white rounded-lg px-1.5 py-1" style="font-size: 9px; font-weight: 500; background-color: rgba(15, 23, 42, 0.95); border: ${isCtx ? '2px solid #eab308' : '1px solid #334155'}; box-shadow: ${isCtx ? '0 0 15px #eab308' : '0 4px 6px rgba(0,0,0,0.1)'};">
                                <div style="transform: rotate(${rawDir}deg); display: inline-block; font-size: 10px;">⬇️</div>
                                <span>${speed} km/s</span>
                            </div>
                        `,
                        iconSize: [60, 24],
                        iconAnchor: [30, 12]
                    });
                    const marker = L.marker([city?.lat ?? 39.0, city?.lon ?? 35.5], { icon: markerIcon });
                    marker.bindPopup(`<div class="p-2 text-center font-sans"><strong class="text-slate-800 font-bold block text-sm mb-1">${city?.name ?? ''} Rüzgar Raporu ${isCtx ? '(Seçili)' : ''}</strong><span class="text-slate-600 text-xs">Hız: <strong>${speed} km/sa</strong></span><br/><span class="text-slate-600 text-xs">Yön: <strong>${txtLabel} (${rawDir}°)</strong></span></div>`);
                    markersGroupRef.current.addLayer(marker);
                });
            }
        };
        updateLayers();
    }, [activeLayer, cityWeatherData, radarConfig, mapReady, weatherData]);

    return (
        <div className="w-full relative rounded-xl overflow-hidden shadow-lg border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
                <div className="flex bg-slate-950/80 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-1.5 border border-white/10 shadow-lg pointer-events-auto gap-1">
                    <button onClick={() => setActiveLayer('radar')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center ${activeLayer === 'radar' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Icon.CloudRain className="w-3.5 h-3.5 mr-1.5" />Yağış Radarı</button>
                    <button onClick={() => setActiveLayer('temp')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center ${activeLayer === 'temp' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Icon.Thermometer className="w-3.5 h-3.5 mr-1.5" />Sıcaklık</button>
                    <button onClick={() => setActiveLayer('wind')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center ${activeLayer === 'wind' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Icon.Wind className="w-3.5 h-3.5 mr-1.5" />Rüzgar</button>
                </div>
                <div className="hidden sm:flex bg-slate-950/80 dark:bg-slate-900/90 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 shadow-lg text-[10px] font-semibold text-slate-300 items-center pointer-events-auto"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-2"></span>Canlı Meteoroloji Radarı</div>
            </div>
            <div className={`relative w-full h-[350px] md:h-[400px] lg:h-[450px] z-0 ${isDarkMode ? 'dark-map' : ''}`}>
                <style>{`
                    .dark-map .leaflet-layer:first-child .leaflet-tile-container { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) !important; }
                    .leaflet-popup-content-wrapper { background: rgba(30, 41, 59, 0.95) !important; color: #f8fafc !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; backdrop-filter: blur(10px) !important; border-radius: 12px !important; overflow: hidden; }
                    .leaflet-popup-tip { background: rgba(30, 41, 59, 0.95) !important; }
                    .leaflet-popup-content strong { color: #ffffff !important; }
                    .leaflet-bar { border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 8px !important; overflow: hidden; }
                    .leaflet-bar a { background-color: rgba(30, 41, 59, 0.9) !important; color: #ffffff !important; border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important; }
                    .leaflet-bar a:hover { background-color: rgba(51, 65, 85, 0.9) !important; }
                `}</style>
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>
        </div>
    );
};

export default InteractiveRadarMap;
