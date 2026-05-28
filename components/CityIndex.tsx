
import React from 'react';
import GlassCard from './GlassCard';
import { Icon } from './Icons';
import { toSlug } from '../services/weatherService';
import { REGULAR_CITIES } from '../shared/cityData';

interface CityIndexProps {
  onCityClick: (city: string) => void;
  onBack: () => void;
}

const CityIndex: React.FC<CityIndexProps> = ({ onCityClick, onBack }) => {

  return (
    <div className="max-w-4xl mx-auto pt-4 pb-12 animate-fadeIn relative">
      {/* SEO Logic */}
      {React.useEffect(() => {
        document.title = "Türkiye Hava Durumu - Tüm Şehirler | TG";

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', 'Türkiye\'nin 81 ili için anlık hava durumu, saatlik ve 15 günlük tahmin raporları. Tüm şehirlerin hava durumu listesi.');

        return () => {
          // Optional: Reset title or leave it for next view to handle
        };
      }, [])}

      {/* Header */}
      <div className="flex justify-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 bg-white/40 hover:bg-white/60 text-slate-700 px-5 py-2 rounded-full backdrop-blur-md transition-all border border-white/40 shadow-sm"
        >
          <Icon.ChevronRight className="w-4 h-4 rotate-180" />
          <span className="font-bold text-sm">Ana Sayfa</span>
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-light text-slate-800 dark:text-slate-200 mb-2">Türkiye Hava Durumu - Tüm Şehirler</h1>
        <p className="text-slate-500 dark:text-slate-400">Aradığınız şehri bulmak için ana sayfadaki arama çubuğunu kullanın veya aşağıdan seçin.</p>
      </div>

      {/* Regular Cities Grid with Sitemap Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {REGULAR_CITIES.map((city) => (
          <a
            key={city}
            href={`/hava-durumu/${toSlug(city)}`}
            onClick={(e) => {
              e.preventDefault();
              onCityClick(city);
            }}
            className="block"
          >
            <GlassCard
              className="group cursor-pointer hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs group-hover:bg-blue-500 group-hover:text-white transition-colors">
                {city.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{city}</span>
                <span className="text-[10px] text-slate-400">Hava Durumu</span>
              </div>
            </GlassCard>
          </a>
        ))}
      </div>
    </div>
  );
};

export default CityIndex;
