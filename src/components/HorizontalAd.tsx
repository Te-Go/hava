
import React from 'react';
import { CONFIG } from '../services/weatherService';
import { Icon } from './Icons';
import { sanitizeHtmlLight } from '../shared/sanitizeHtml';

const HorizontalAd: React.FC = () => {
  return (
    <div className="w-full mt-6 mb-8 relative group overflow-hidden rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {CONFIG.ads?.horizontal ? (
        <div
          className="w-full min-h-[100px] flex items-center justify-center bg-slate-50 dark:bg-slate-900"
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlLight(CONFIG.ads.horizontal) }}
        />
      ) : (
        // Mock Content: Car Insurance (Contextual to Car Wash/Travel)
        <div className="relative w-full h-24 md:h-32 cursor-pointer">
          <img
            src="https://picsum.photos/800/200?random=car"
            alt="Kasko Reklamı"
            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/60 to-transparent flex items-center px-6 md:px-10">
            <div className="flex flex-col items-start text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold bg-white text-blue-900 px-1.5 py-0.5 rounded shadow-sm">SPONSORLU</span>
                <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Araç Sigortası</span>
              </div>
              <h4 className="text-lg md:text-xl font-bold leading-tight drop-shadow-md">
                Aracınız Kışa Hazır mı?
              </h4>
              <p className="text-xs md:text-sm text-blue-100 mt-0.5 font-light">
                Kasko teklifi alın, %20 indirim kazanın. <span className="font-bold underline ml-1">Fiyat Gör →</span>
              </p>
            </div>
          </div>

          {/* CTA Button (Fake) */}
          <div className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 bg-white text-blue-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg hidden sm:flex items-center group-hover:bg-blue-50 transition-colors">
            Teklif Al <Icon.ChevronRight className="w-3 h-3 ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalAd;
