import React, { useEffect, useState } from 'react';
import { searchLocations, GeoSearchResult, toSlug, trackEvent } from '../services/weatherService';
import { Icon } from './Icons';

/**
 * LocationSearchPage - Handles location disambiguation and validation
 * 
 * Routes:
 * - /konum-ara?q=belek → 1 result → auto-redirect to /hava-durumu/belek
 * - /konum-ara?q=kemer → 2+ results → show disambiguation list
 * - /konum-ara?q=warm+milk → 0 results → show error
 */

type SearchState =
    | { status: 'loading' }
    | { status: 'single'; result: GeoSearchResult }
    | { status: 'multiple'; results: GeoSearchResult[] }
    | { status: 'notfound'; query: string };

const LocationSearchPage: React.FC = () => {
    const [state, setState] = useState<SearchState>({ status: 'loading' });
    const [query, setQuery] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q') || '';
        const viewParam = params.get('gun') || '';
        setQuery(q);

        if (!q || q.length < 2) {
            setState({ status: 'notfound', query: q || '' });
            return;
        }

        const performSearch = async () => {
            try {
                const results = await searchLocations(q);

                if (results.length === 0) {
                    trackEvent('search_notfound', 'location', q);
                    setState({ status: 'notfound', query: q });
                } else if (results.length === 1) {
                    // Single result - store coordinates and auto-redirect
                    trackEvent('search_single', 'location', results[0].name);
                    const slug = toSlug(results[0].name);
                    // Store selected coordinates for weatherService to use
                    localStorage.setItem(`geo_${slug}`, JSON.stringify({
                        lat: results[0].lat,
                        lon: results[0].lon,
                        name: results[0].name,
                        admin1: results[0].admin1,
                        timestamp: Date.now()
                    }));
                    const viewSuffix = viewParam === 'yarin' ? '/yarin' : (viewParam === 'hafta-sonu' ? '/hafta-sonu' : '');
                    window.location.replace(`/hava-durumu/${slug}${viewSuffix}`);
                } else {
                    // Multiple results - show disambiguation
                    trackEvent('search_multiple', 'location', q);
                    setState({ status: 'multiple', results });
                }
            } catch (e) {
                console.error('Location search error:', e);
                setState({ status: 'notfound', query: q });
            }
        };

        performSearch();
    }, []);

    const handleSelect = (result: GeoSearchResult) => {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('gun') || '';
        const viewSuffix = viewParam === 'yarin' ? '/yarin' : (viewParam === 'hafta-sonu' ? '/hafta-sonu' : '');
        const slug = toSlug(result.name);

        // Store selected coordinates for weatherService to use
        localStorage.setItem(`geo_${slug}`, JSON.stringify({
            lat: result.lat,
            lon: result.lon,
            name: result.name,
            admin1: result.admin1,
            timestamp: Date.now()
        }));

        trackEvent('search_select', 'location', `${result.name}, ${result.admin1}`);
        window.location.href = `/hava-durumu/${slug}${viewSuffix}`;
    };

    const handleBack = () => {
        window.history.back();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Loading State */}
                {state.status === 'loading' && (
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-300">Konum aranıyor...</p>
                    </div>
                )}

                {/* Not Found State */}
                {state.status === 'notfound' && (
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 dark:border-slate-700 p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icon.MapPin className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                            Konum Bulunamadı
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            "{state.query}" için Türkiye'de bir konum bulamadık.
                        </p>

                        {/* Suggestions */}
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                Öneriler:
                            </p>
                            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                                <li>• Şehir veya ilçe adını kontrol edin</li>
                                <li>• Türkçe karakterleri kullanmayı deneyin</li>
                                <li>• Daha genel bir konum adı deneyin</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleBack}
                                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                ← Geri
                            </button>
                            <a
                                href="/"
                                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors text-center"
                            >
                                Ana Sayfa
                            </a>
                        </div>
                    </div>
                )}

                {/* Multiple Results - Disambiguation */}
                {state.status === 'multiple' && (
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 dark:border-slate-700 p-8">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon.MapPin className="w-8 h-8 text-blue-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                Konum Seçin
                            </h1>
                            <p className="text-slate-600 dark:text-slate-300">
                                "{query}" için birden fazla sonuç bulundu
                            </p>
                        </div>

                        {/* Results List */}
                        <div className="space-y-2 mb-6">
                            {state.results.map((result, index) => (
                                <button
                                    key={`${result.name}-${result.admin1}-${index}`}
                                    onClick={() => handleSelect(result)}
                                    className="w-full p-4 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                            <Icon.MapPin className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white">
                                                {result.name}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {result.admin1}
                                            </p>
                                        </div>
                                        <Icon.ChevronRight className="w-5 h-5 text-slate-400 ml-auto group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleBack}
                            className="w-full px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            ← Geri Dön
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default LocationSearchPage;
