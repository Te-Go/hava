import React from 'react';
import GlassCard from './GlassCard';
import { CONFIG } from '../services/weatherService';
import { Icon } from './Icons';
import { sanitizeHtmlLight } from '../shared/sanitizeHtml';

const AdGrid: React.FC = () => {
  // Use mock data if no config provided
  const adSlots = CONFIG.ads?.adGrid && CONFIG.ads.adGrid.length > 0
    ? CONFIG.ads.adGrid
    : Array(6).fill(null); // Create 6 slots

  const mockAds = [
    { title: "Güneş Enerjisi ile Tasarruf Edin", img: "https://picsum.photos/300/300?random=10" },
    { title: "Kış Tatili İçin En İyi Rotalar", img: "https://picsum.photos/300/300?random=11" },
    { title: "Yatırım Yapmanın Püf Noktaları", img: "https://picsum.photos/300/300?random=12" },
    { title: "Elektrikli Araç Fiyatları Düşüyor", img: "https://picsum.photos/300/300?random=13" },
    { title: "Tarım Sigortası Neleri Kapsar?", img: "https://picsum.photos/300/300?random=14" },
    { title: "Evde Su Tasarrufu Yöntemleri", img: "https://picsum.photos/300/300?random=15" }
  ];

  return (
    <GlassCard className="flex flex-col mt-6 mb-10" noPadding>
      <div className="p-5 pb-0">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
          <span className="w-1.5 h-4 bg-orange-400 rounded-full mr-2"></span>
          İlginizi Çekebilir
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 pt-0">
        {adSlots.map((adHtml, index) => (
          <div
            key={index}
            className="relative rounded-xl overflow-hidden aspect-square group bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5"
          >
            {adHtml ? (
              // Live Ad Code Injection (sanitized for XSS protection)
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlLight(adHtml) }}
              />
            ) : (
              // Mock Ad (Native Style)
              <div className="w-full h-full cursor-pointer relative">
                <img
                  src={mockAds[index % mockAds.length].img}
                  alt="Sponsorlu"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-3 flex flex-col justify-end">
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 text-[8px] font-bold text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-sm border border-black/5">
                    REKLAM
                  </div>
                  <p className="text-xs font-medium text-white line-clamp-2 leading-tight">
                    {mockAds[index % mockAds.length].title}
                  </p>
                  <span className="text-xs text-gray-300 mt-2 py-1 flex items-center">
                    Sponsorlu <Icon.ChevronRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default AdGrid;