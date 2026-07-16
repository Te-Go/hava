import React from 'react';
import { NewsItem } from '../types';
import { Icon } from './Icons';

interface FeaturedAnalysisProps {
    article?: NewsItem;
}

const FeaturedAnalysis: React.FC<FeaturedAnalysisProps> = ({ article }) => {
    // Don't render if no article
    if (!article) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm group">
            {/* Header Badge */}
            <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 border-b border-blue-100 dark:border-blue-800/50 flex items-center gap-2">
                <Icon.FileText size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                    Günün Analizi
                </span>
            </div>

            {/* Article Card */}
            <a
                href={article.link}
                className="block"
                target="_self"
            >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden">
                    <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase">
                            {article.category}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {article.title}
                    </h4>

                    {article.excerpt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                            {article.excerpt}
                        </p>
                    )}

                    {/* Read More */}
                    <div className="flex items-center gap-1 mt-3 text-blue-600 dark:text-blue-400">
                        <span className="text-xs font-bold">Raporu Oku</span>
                        <Icon.ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </a>
        </div>
    );
};

export default FeaturedAnalysis;
