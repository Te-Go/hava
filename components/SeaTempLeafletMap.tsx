import React, { useEffect, useRef } from 'react';
import { SeaTempLocation } from '../services/marineService';

// Leaflet CSS - Bundled directly to avoid CDN/CSP issues
import 'leaflet/dist/leaflet.css';

interface SeaTempLeafletMapProps {
    locations: SeaTempLocation[];
    onLocationClick?: (city: string) => void;
    isDarkMode?: boolean;
}

/**
 * SeaTempLeafletMap - Interactive Leaflet map with temperature markers
 * Shows Turkish coastlines with real geography
 */
const SeaTempLeafletMap: React.FC<SeaTempLeafletMapProps> = ({ locations, onLocationClick, isDarkMode = true }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    const getTempColor = (temp: number): string => {
        if (temp >= 24) return '#ef4444'; // red-500 (hot)
        if (temp >= 20) return '#f97316'; // orange-500 (warm)
        if (temp >= 16) return '#22c55e'; // green-500 (moderate)
        return '#3b82f6'; // blue-500 (cold)
    };

    useEffect(() => {
        // Dynamic import to avoid SSR issues
        const initMap = async () => {
            if (!mapRef.current || mapInstanceRef.current) return;

            const L = await import('leaflet');

            // Initialize map centered on Turkey
            const map = L.map(mapRef.current, {
                center: [39.0, 35.0], // Center of Turkey
                zoom: 6,
                minZoom: 5,
                maxZoom: 10,
                zoomControl: true,
                scrollWheelZoom: false, // Disable scroll zoom for better mobile UX
                attributionControl: false
            });

            // Add OpenStreetMap tiles (free, no API key)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            // Restrict panning to Turkey region
            const bounds = L.latLngBounds(
                L.latLng(35.0, 25.0), // Southwest
                L.latLng(43.0, 45.0)  // Northeast
            );
            map.setMaxBounds(bounds);

            mapInstanceRef.current = map;

            // Fix: Force map sizing recalculation after render to prevent "grey tiles" or partial rendering
            setTimeout(() => {
                map.invalidateSize();
            }, 250);

            // Add temperature markers
            locations.forEach((location) => {
                const color = getTempColor(location.seaTemp);

                // Create custom icon with temperature
                const icon = L.divIcon({
                    className: 'sea-temp-marker',
                    html: `
                        <div style="
                            background-color: ${color};
                            color: white;
                            font-weight: bold;
                            font-size: 11px;
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border: 2px solid white;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                            cursor: pointer;
                        ">${Math.round(location.seaTemp)}°</div>
                    `,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                });

                const marker = L.marker([location.lat, location.lon], { icon }).addTo(map);

                // Popup with details
                const popupContent = `
                    <div style="text-align: center; min-width: 100px;">
                        <strong style="font-size: 14px;">${location.displayName}</strong>
                        <div style="font-size: 24px; font-weight: bold; color: ${color}; margin: 4px 0;">
                            ${location.seaTemp}°C
                        </div>
                        <div style="font-size: 11px; color: #666;">
                            🌊 Dalga: ${location.waveHeight}m
                        </div>
                        <div style="font-size: 11px; margin-top: 4px;">
                            ${location.swimSafety === 'safe' ? '✅ Yüzmeye Uygun' :
                        location.swimSafety === 'caution' ? '⚠️ Dikkatli Olun' :
                            '🚫 Tehlikeli'}
                        </div>
                    </div>
                `;
                marker.bindPopup(popupContent);

                // Click handler for navigation
                marker.on('click', () => {
                    if (onLocationClick) {
                        // Delay to allow popup to show first
                        setTimeout(() => {
                            // Optional: navigate on double-click instead
                        }, 100);
                    }
                });
            });

            // Add legend - theme-aware colors
            const legendBg = isDarkMode ? '#1e293b' : 'white';
            const legendText = isDarkMode ? 'white' : '#1e293b';
            const legend = L.control({ position: 'topright' });
            legend.onAdd = function () {
                const div = L.DomUtil.create('div', 'leaflet-legend');
                div.innerHTML = `
                    <div style="
                        background: ${legendBg};
                        color: ${legendText};
                        padding: 8px 12px;
                        border-radius: 8px;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                        font-size: 11px;
                        border: 1px solid ${isDarkMode ? '#334155' : '#e2e8f0'};
                    ">
                        <div style="font-weight: bold; margin-bottom: 4px;">Sıcaklık</div>
                        <div style="display: flex; gap: 8px;">
                            <span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #3b82f6;"></span> &lt;16°</span>
                            <span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #22c55e;"></span> 16-20°</span>
                            <span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #f97316;"></span> 20-24°</span>
                            <span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ef4444;"></span> &gt;24°</span>
                        </div>
                    </div>
                `;
                return div;
            };
            legend.addTo(map);

            // Add stats control
            if (locations.length > 0) {
                const temps = locations.map(l => l.seaTemp);
                const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
                const maxLoc = locations.reduce((a, b) => a.seaTemp > b.seaTemp ? a : b);
                const minLoc = locations.reduce((a, b) => a.seaTemp < b.seaTemp ? a : b);

                const stats = L.control({ position: 'bottomleft' });
                stats.onAdd = function () {
                    const div = L.DomUtil.create('div', 'leaflet-stats');
                    div.innerHTML = `
                        <div style="
                            background: ${legendBg};
                            color: ${legendText};
                            padding: 8px 12px;
                            border-radius: 8px;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                            font-size: 11px;
                            display: flex;
                            gap: 16px;
                            border: 1px solid ${isDarkMode ? '#334155' : '#e2e8f0'};
                        ">
                            <span>Ort: <strong style="color: #3b82f6;">${avgTemp}°C</strong></span>
                            <span>${maxLoc.displayName}: <strong style="color: #f97316;">${maxLoc.seaTemp}°</strong></span>
                            <span>${minLoc.displayName}: <strong style="color: #3b82f6;">${minLoc.seaTemp}°</strong></span>
                        </div>
                    `;
                    return div;
                };
                stats.addTo(map);
            }
        };

        initMap();

        // Cleanup
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [locations, onLocationClick, isDarkMode]); // Re-initialize when theme changes

    return (
        <div className="relative">
            {/* Title overlay - theme-aware */}
            <div className="absolute top-3 left-3 z-[1000] bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold">Deniz Suyu Sıcaklıkları</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{locations.length} konum</div>
            </div>

            {/* Map container */}
            <div
                ref={mapRef}
                className="w-full h-[500px] md:h-[650px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 z-0 shadow-inner"
            />
        </div>
    );
};

export default SeaTempLeafletMap;
