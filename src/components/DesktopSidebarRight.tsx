
import React from 'react';
import { CONFIG } from '../services/weatherService';
import { NewsItem } from '../types';
import { sanitizeHtmlLight } from '../shared/sanitizeHtml';

// SINAN LAUNCH PHASE: Import new utility components
import NetworkWidget from './NetworkWidget';
import NewsletterWidget from './NewsletterWidget';
import FeaturedAnalysis from './FeaturedAnalysis';

interface DesktopSidebarRightProps {
  articles: NewsItem[];
  city?: string; // For personalized newsletter
}

const DesktopSidebarRight: React.FC<DesktopSidebarRightProps> = ({ articles, city = 'İstanbul' }) => {
  const ads = CONFIG.ads as Record<string, string | string[] | undefined> | undefined;

  // Get the first article for Featured Analysis
  const featuredArticle = articles.length > 0 ? articles[0] : undefined;

  return (
    <div className="flex flex-col gap-5">

      {/* ═══════════════════════════════════════════════════════════════════
          SLOT 1: THE "PRIME" SPOT (Sticky Top) - REAL ADSENSE
          300x600 Half Page - Your highest-paying real estate
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block bg-glass-white/40 dark:bg-slate-800/40 border border-glass-border dark:border-dark-border rounded-3xl min-h-[600px] flex items-center justify-center shadow-glass relative overflow-hidden">
        {ads?.vertical ? (
          <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: sanitizeHtmlLight(ads.vertical as string) }} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/50 w-full h-full rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -ml-6 -mb-6"></div>

              {/* Content */}
              <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl shadow-sm mb-4 mx-auto flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🏠</span>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
                Ev Sigortası
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Fırtına, dolu ve sel riskine karşı evinizi güvenceye alın.
              </p>
              <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                Teklif Al
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SLOT 2: THE "RETENTION" ENGINE - NEWSLETTER/PUSH
          Storm alert newsletter signup with city personalization
          LAUNCH PHASE: Disabled until backend is ready
         ═══════════════════════════════════════════════════════════════════ */}
      {/* <NewsletterWidget city={city} /> */}

      {/* ═══════════════════════════════════════════════════════════════════
          SLOT 3: THE "RECIRCULATION" MODULE - INTERNAL LINK
          Features the latest article to drive internal traffic
         ═══════════════════════════════════════════════════════════════════ */}
      <FeaturedAnalysis article={featuredArticle} />

      {/* ═══════════════════════════════════════════════════════════════════
          SLOT 4: THE "NETWORK" WIDGET - CROSS-LINK HUB
          Piyasa Özeti with hub logos and live-ish data
         ═══════════════════════════════════════════════════════════════════ */}
      <NetworkWidget />

    </div >
  );
};

export default DesktopSidebarRight;
