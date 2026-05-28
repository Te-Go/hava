
import React from 'react';
import { NewsItem } from '../types';
import GlassCard from './GlassCard';
import { Icon } from './Icons';
import { CONFIG } from '../services/weatherService';
import { sanitizeHtmlLight } from '../shared/sanitizeHtml';

interface ArticlePageProps {
  article: NewsItem;
  relatedArticles: NewsItem[];
  onArticleClick: (id: number) => void;
  onBack: () => void;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ article, relatedArticles, onArticleClick, onBack }) => {
  return (
    <div className="max-w-3xl mx-auto pt-4 pb-12 animate-fadeIn">
      {/* Navigation */}
      <button
        onClick={onBack}
        className="flex items-center text-blue-600 dark:text-blue-400 font-medium mb-6 hover:underline"
      >
        <Icon.ChevronRight className="w-4 h-4 rotate-180 mr-1" />
        Geri Dön
      </button>

      {/* Main Article Card */}
      <GlassCard className="overflow-hidden mb-8" noPadding>
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 w-full">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="eager" // Hero image should load fast
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white w-full">
            <span className="inline-block px-3 py-1 bg-blue-500 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2 shadow-sm">
              {article.category}
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight drop-shadow-md">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-10">
          <div className="flex items-center text-slate-400 text-xs md:text-sm mb-8 pb-4 border-b border-blue-50 dark:border-slate-700">
            <span className="mr-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 mr-2 flex items-center justify-center text-[10px] font-bold text-slate-500">TG</span>
              <strong>TG Haber</strong>
            </span>
            <span className="flex items-center">
              <Icon.Sun className="w-3 h-3 mr-1" />
              {article.date}
            </span>
          </div>

          <div
            className="prose prose-blue dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-light"
            dangerouslySetInnerHTML={{ __html: sanitizeHtmlLight(article.content || '<p>İçerik yüklenemedi.</p>') }}
          />
        </div>
      </GlassCard>

      {/* 1. In-Article Ad Slot (High Visibility) */}
      <div className="mb-8">
        <div className="bg-glass-white/40 dark:bg-slate-800/40 border border-glass-border dark:border-dark-border rounded-2xl min-h-[280px] flex items-center justify-center shadow-glass relative overflow-hidden group">
          {CONFIG.ads?.articleAd ? (
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: sanitizeHtmlLight(CONFIG.ads.articleAd) }} />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
              <div className="text-center relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">İlginizi Çekebilir</p>
                <p className="text-[10px] text-slate-400/70 font-mono">Reklam Alanı</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. The "Infinite Loop" (Read Next) */}
      <div className="space-y-4">
        <h3 className="text-xl font-light text-slate-800 dark:text-slate-200 flex items-center">
          <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
          Bunu da Okuyun
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relatedArticles.slice(0, 2).map((item) => (
            <a
              key={item.id}
              href={item.link || `/makale/${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onArticleClick(item.id);
              }}
              className="block"
            >
              <GlassCard
                className="flex items-center p-3 gap-4 group cursor-pointer hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors"
                noPadding
              >
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden ml-3 my-3">
                  <img
                    src={item.image}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={item.title}
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col pr-4 py-2">
                  <span className="text-[10px] font-bold text-blue-500 uppercase mb-1">{item.category}</span>
                  <h4 className="font-medium text-slate-700 dark:text-slate-200 leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center">
                    Devamını Oku <Icon.ChevronRight className="w-3 h-3 ml-0.5" />
                  </div>
                </div>
              </GlassCard>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;