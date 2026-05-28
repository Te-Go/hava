import React, { useEffect, useState } from 'react';
import { Icon } from './Icons';
import SeaRegionCard from './SeaRegionCard';
import SeaTempTable from './SeaTempTable';
import SeaTempLeafletMap from './SeaTempLeafletMap';
import VitalityPulse from './VitalityPulse';
import { fetchAllSeaTemperatures, SeaTempLocation, SEA_REGIONS, SeaRegion } from '../services/marineService';
import { toSlug } from '../services/weatherService';

interface SeaTempPageProps {
    onCityChange: (city: string) => void;
}

/**
 * SeaTempPage - Full page for /deniz-suyu-sicakligi
 * Displays sea water temperatures across Turkey
 */
const SeaTempPage: React.FC<SeaTempPageProps> = ({ onCityChange }) => {
    const [locations, setLocations] = useState<SeaTempLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(Date.now());
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check if dark mode is already set on document
        return document.documentElement.classList.contains('dark');
    });

    // Toggle theme
    const toggleTheme = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await fetchAllSeaTemperatures();
                setLocations(data);
                setLastUpdated(Date.now());
            } catch (error) {
                console.error('Failed to load sea temperatures:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // SEO: Title, Meta, Schema
    useEffect(() => {
        document.title = "Türkiye Deniz Suyu Sıcaklığı - Güncel Veriler | TG";

        // Update Meta Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', 'Marmara, Ege, Akdeniz ve Karadeniz deniz suyu sıcaklıkları. İl il yüzme ve deniz durumu, dalga yüksekliği ve güncel deniz raporları.');

        // Inject Breadcrumb Schema
        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Hava Durumu",
                    "item": "https://hava-durumlari.tr/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Deniz Suyu Sıcaklığı",
                    "item": "https://hava-durumlari.tr/deniz-suyu-sicakligi"
                }
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);

        return () => {
            // Cleanup schema on unmount
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    const handleLocationClick = (city: string) => {
        window.history.pushState({}, '', `/hava-durumu/${toSlug(city)}`);
        onCityChange(city);
    };

    const regionOrder: SeaRegion[] = ['akdeniz', 'ege', 'marmara', 'karadeniz'];

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
            {/* Header with Title and Theme Toggle */}
            <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                            Türkiye Deniz Suyu Sıcaklığı
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Anlık deniz suyu sıcaklıkları ve yüzme koşulları
                        </p>
                    </div>

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title={isDarkMode ? 'Açık Mod' : 'Koyu Mod'}
                    >
                        {isDarkMode ? (
                            <Icon.Sun size={20} className="text-amber-500" />
                        ) : (
                            <Icon.Moon size={20} className="text-slate-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Leaflet Map Section */}
            <div className="max-w-4xl mx-auto px-4 py-4">
                {isLoading ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-slate-500 dark:text-slate-400">Harita yükleniyor...</p>
                    </div>
                ) : (
                    <SeaTempLeafletMap
                        locations={locations}
                        onLocationClick={handleLocationClick}
                        isDarkMode={isDarkMode}
                    />
                )}

                {/* Last Updated */}
                <div className="flex items-center justify-end mt-2">
                    <VitalityPulse lastUpdated={lastUpdated} />
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                {/* Loading State */}
                {isLoading && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-slate-500 dark:text-slate-400">Deniz sıcaklıkları yükleniyor...</p>
                    </div>
                )}

                {/* Sea Region Cards */}
                {!isLoading && regionOrder.map((region) => (
                    <SeaRegionCard
                        key={region}
                        region={region}
                        locations={locations}
                        onLocationClick={handleLocationClick}
                    />
                ))}

                {/* Full Table */}
                {!isLoading && locations.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3 px-1">
                            📋 Tüm Konumlar
                        </h2>
                        <SeaTempTable
                            locations={locations}
                            onLocationClick={handleLocationClick}
                        />
                    </div>
                )}

                {/* SEO Content */}
                <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                        Türkiye'de Deniz Suyu Sıcaklığı
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                        Türkiye'nin dört denizi (Akdeniz, Ege Denizi, Marmara Denizi ve Karadeniz) boyunca
                        anlık deniz suyu sıcaklıklarını takip edin. Sayfamız, yüzme koşulları, dalga yüksekliği
                        ve plaj güvenliği hakkında güncel bilgiler sunar.
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong>En popüler tatil bölgeleri:</strong> Antalya, Alanya, Bodrum, Çeşme, Marmaris,
                        Fethiye ve Kuşadası'nda deniz suyu kaç derece? Güncel sıcaklıkları yukarıdan kontrol edebilirsiniz.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SeaTempPage;
