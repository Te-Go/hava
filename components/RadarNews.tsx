
import React from 'react';
import GlassCard from './GlassCard';
import { NewsItem, WeatherData } from '../types';
import { Icon } from './Icons';

interface RadarNewsProps {
  articles: NewsItem[];
  // onArticleClick removed as links are now external
  weatherData?: WeatherData | null;
  compact?: boolean; // When true, show only radar (for side-by-side layout)
}

const RadarNews: React.FC<RadarNewsProps> = ({ articles, weatherData, compact = false }) => {
  // Show only first 4
  const displayArticles = articles.slice(0, 4);

  // Dynamic Coordinates for Windy
  // Default to Turkey Center (39, 35.5) if no data
  const lat = weatherData?.coord?.lat || 39.000;
  const lon = weatherData?.coord?.lon || 35.500;

  // Windy Embed URL Construction
  // zoom=5 for country view, zoom=8 for city view
  const zoom = weatherData ? 8 : 5;
  // FIXED: overlay=radar for live rain radar, product=ecmwf (standard base model)
  const embedUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=${zoom}&level=surface&overlay=radar&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  // Compact mode: radar only (for side-by-side with LifestyleRail)
  if (compact) {
    return (
      <GlassCard className="flex flex-col h-full" noPadding>
        <div className="px-3 py-2 border-b border-glass-border dark:border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center text-sm">
            <Icon.MapPin className="w-4 h-4 mr-1.5 text-blue-500" />
            Canlı Radar
          </h3>
          <span className="text-[9px] text-slate-400 bg-white/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded-full">Windy.com</span>
        </div>

        <div className="relative flex-grow min-h-[280px] w-full">
          <iframe
            key={`radar-compact-${lat.toFixed(2)}-${lon.toFixed(2)}`}
            width="100%"
            height="100%"
            src={embedUrl}
            frameBorder="0"
            className="w-full h-full absolute inset-0"
            title="Weather Radar"
            loading="lazy"
          ></iframe>
        </div>
      </GlassCard>
    );
  }

  // Full mode: radar + news grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Autoplay Radar Embed (Windy) */}
      <GlassCard className="flex flex-col h-full" noPadding>
        <div className="p-5 pb-0 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
            <Icon.MapPin className="w-4 h-4 mr-2 text-blue-500" />
            Canlı Radar
          </h3>
          <span className="text-[10px] text-slate-400 bg-white/50 dark:bg-slate-700/50 px-2 py-1 rounded-full">Windy.com</span>
        </div>

        <div className="relative flex-grow min-h-[300px] w-full h-full">
          <iframe
            key={`radar-full-${lat.toFixed(2)}-${lon.toFixed(2)}`}
            width="100%"
            height="100%"
            src={embedUrl}
            frameBorder="0"
            className="w-full h-full absolute inset-0"
            title="Weather Radar"
            loading="lazy"
          ></iframe>
        </div>
      </GlassCard>

      {/* Masonry News Grid - NOW LINK BASED */}
      <GlassCard className="flex flex-col">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Hava Durumu Makaleleri</h3>
        <div className="grid grid-cols-2 gap-3">
          {displayArticles.map((item) => (
            <a
              key={item.id}
              href={item.link || '#'}
              className="relative rounded-xl overflow-hidden aspect-square group cursor-pointer block"
              target="_self" // Standard navigation
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                <span className="text-[10px] font-bold text-blue-300 uppercase mb-1">{item.category}</span>
                <p className="text-xs font-medium text-white line-clamp-2 leading-tight">
                  {item.title}
                </p>
              </div>
            </a>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default RadarNews;

