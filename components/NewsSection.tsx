import React, { useEffect, useState } from 'react';
import GlassCard from './GlassCard';
import { Icon } from './Icons';
import { NewsItem } from '../types';
import { fetchLiveArticles } from '../services/weatherService';

// SINAN PROTOCOL: Interface now accepts 'city' for context
interface NewsSectionProps {
    city?: string;
}

const NewsSection: React.FC<NewsSectionProps> = ({ city }) => {
    const [articles, setArticles] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadNews = async () => {
            setLoading(true);
            // Pass the city to the bridge
            const news = await fetchLiveArticles(city);
            if (isMounted) {
                setArticles(news);
                setLoading(false);
            }
        };

        loadNews();

        return () => { isMounted = false; };
    }, [city]); // Re-fetch when city changes

    // Show only first 4
    const displayArticles = articles.slice(0, 4);

    if (!loading && displayArticles.length === 0) return null;

    return (
        <GlassCard className="flex flex-col mt-6 mb-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">
                {/* Dynamic Header: "Ankara Hava Durumu Makaleleri" */}
                {city ? `${city} Hava Durumu Makaleleri` : 'Hava Durumu Makaleleri'}
            </h3>

            {loading ? (
                // Skeleton Loader - Featured Layout
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="aspect-[4/3] md:aspect-square rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                        <div className="aspect-video md:aspect-[16/9] rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="aspect-video md:aspect-[16/9] rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </div>
                </div>
            ) : (
                /* OPTION B: Featured Layout - 1 Large + 2 Small */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* LEFT: Featured Large Article + Button */}
                    <div className="flex flex-col gap-4">
                        {displayArticles[0] && (
                            <a
                                href={displayArticles[0].link || '#'}
                                className="relative rounded-xl overflow-hidden aspect-[4/3] md:aspect-[4/3] group cursor-pointer block flex-grow"
                                target="_self"
                            >
                                <img
                                    src={displayArticles[0].image}
                                    alt={displayArticles[0].title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 md:p-6 flex flex-col justify-end">
                                    <span className="text-[10px] font-bold text-blue-300 uppercase mb-2 tracking-wide">
                                        {displayArticles[0].category}
                                    </span>
                                    <h4 className="text-lg md:text-xl font-bold text-white line-clamp-3 leading-snug">
                                        {displayArticles[0].title}
                                    </h4>
                                    {displayArticles[0].excerpt && (
                                        <p className="text-sm text-white/80 line-clamp-2 mt-2 hidden md:block">
                                            {displayArticles[0].excerpt}
                                        </p>
                                    )}
                                    <span className="text-xs text-white/60 mt-2">{displayArticles[0].date}</span>
                                </div>
                            </a>
                        )}

                        {/* Button under featured article */}
                        {displayArticles.length > 0 && (
                            <a
                                href="https://hava-durumlari.tr/meteorolojik-analiz/"
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm group"
                            >
                                <Icon.Grid size={16} />
                                Tüm Hava Durumu Makalelerini İncele
                                <Icon.ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                        )}
                    </div>

                    {/* RIGHT: 2 Smaller Articles Stacked */}
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                        {displayArticles.slice(1, 3).map((item) => (
                            <a
                                key={item.id}
                                href={item.link || '#'}
                                className="relative rounded-xl overflow-hidden aspect-video md:aspect-[16/9] group cursor-pointer block"
                                target="_self"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 md:p-4 flex flex-col justify-end">
                                    <span className="text-[9px] font-bold text-blue-300 uppercase mb-1">
                                        {item.category}
                                    </span>
                                    <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">
                                        {item.title}
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </GlassCard>
    );
};

export default NewsSection;
