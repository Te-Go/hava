
import React, { useRef, useEffect, useState } from 'react';
import { Icon } from './Icons';
import { HUB_LOGOS, trackEvent, toSlug } from '../services/weatherService';
import { REGULAR_CITIES, SEASONAL_SPOTS } from '../shared/cityData';

// Seasonal city names as a Set for O(1) lookup
const SEASONAL_CITY_SET: Set<string> = new Set(SEASONAL_SPOTS.map(spot => spot.name));

// RE-ORDERED: Regular Cities (Left) -> Seasonal Cities (Right)
const RAIL_CITIES = [...REGULAR_CITIES, ...SEASONAL_SPOTS.map(s => s.name)];

interface NavigationProps {
  currentCity: string;
  onCityChange: (city: string) => void;
  onLocationClick?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  activeView?: 'home' | 'tomorrow' | 'weekend';
}

const Navigation: React.FC<NavigationProps> = ({ currentCity, onCityChange, onLocationClick, isDarkMode, onToggleTheme, activeView = 'home' }) => {
  const [inputValue, setInputValue] = useState(currentCity);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentCityRef = useRef(currentCity);

  // Keep ref in sync with prop
  useEffect(() => {
    currentCityRef.current = currentCity;
  }, [currentCity]);

  // 1. Sync input value when currentCity changes (Ensures selected city is in search bar)
  useEffect(() => {
    setInputValue(currentCity);
  }, [currentCity]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val.length > 2) {
        trackEvent('search_city', 'navigation', val);
        // Redirect to disambiguation/search page for proper geocoding validation
        const viewParam = activeView === 'tomorrow' ? '&gun=yarin' : (activeView === 'weekend' ? '&gun=hafta-sonu' : '');
        window.location.href = `/konum-ara?q=${encodeURIComponent(val)}${viewParam}`;
      }
    }
  };

  // Sync input value on blur to ensure it reflects the current city (uses ref to avoid stale closure)
  const handleBlur = () => {
    // Wait for the next tick to allow state updates from onCityChange to propagate
    setTimeout(() => {
      setInputValue(currentCityRef.current);
    }, 150);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative z-40 px-4 pt-4 pb-2 space-y-4">
      {/* Top Row: Logo - Search - Toggle */}
      <div className="relative max-w-4xl mx-auto flex items-center gap-3">

        {/* Logo + Title (Left) - Stacked Vertically */}
        <a href="/" className="flex-shrink-0 flex flex-col items-center group">
          <img
            src={HUB_LOGOS.WEATHER}
            alt="Hava Durumları Logo"
            width="54"
            height="54"
            className="h-14 w-auto object-contain drop-shadow-sm filter dark:brightness-110 group-hover:scale-105 transition-transform"
          />
          <span className="hidden sm:block text-xs font-bold text-slate-700 dark:text-white tracking-tight group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors -mt-0.5">
            Hava Durumları
          </span>
        </a>

        {/* Omni-Search (Middle) */}
        <div className="relative flex-grow group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Icon.Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Şehir veya İlçe Ara..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleSearch}
            onBlur={handleBlur}
            onFocus={(e) => e.target.select()}
            className="w-full pl-12 pr-12 py-3.5 bg-glass-white/80 dark:bg-dark-glass backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl shadow-sm text-gray-700 dark:text-gray-200 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-medium"
          />

          {/* Location Button */}
          <button
            onClick={onLocationClick}
            className="absolute inset-y-0 right-3 flex items-center text-blue-500 hover:text-blue-700 transition-colors p-2"
            title="Konumumu Bul"
          >
            <Icon.MapPin className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Toggle (Right) */}
        {onToggleTheme && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleTheme(); }}
            className={`
                flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shadow-glass active:scale-95
                ${isDarkMode
                ? 'bg-slate-800/80 border-slate-600 shadow-blue-500/20'
                : 'bg-white/60 border-white/40 shadow-yellow-500/20'
              }
              `}
            title={isDarkMode ? "Gündüz Modu" : "Gece Modu"}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <Icon.Moon className="w-5 h-5 text-blue-300 fill-blue-300/20" />
            ) : (
              <Icon.Sun className="w-6 h-6 text-orange-400 fill-orange-400" />
            )}
          </button>
        )}
      </div>

      {/* 2. City Rail - Restored & SEO Optimized & Slider Added */}
      <div className="relative max-w-4xl mx-auto w-full group/rail">

        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full shadow-lg text-slate-500 hover:text-blue-500 transition-all opacity-0 group-hover/rail:opacity-100 hidden md:flex hover:scale-110 active:scale-95"
          aria-label="Sola Kaydır"
        >
          <Icon.ChevronRight className="w-4 h-4 rotate-180" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 scroll-smooth px-1"
        >
          {RAIL_CITIES.map((city) => {
            const isSeasonal = SEASONAL_CITY_SET.has(city);
            return (
              <a
                key={city}
                // WordPress Micropage URL with view context preserved
                href={`/hava-durumu/${toSlug(city)}${activeView === 'tomorrow' ? '?gun=yarin' : (activeView === 'weekend' ? '?gun=hafta-sonu' : '')}`}
                onClick={() => {
                  // Track before navigation (no preventDefault - real page load for SEO)
                  trackEvent('click_city_rail', 'navigation', city);
                }}
                className={`
                      flex-shrink-0 px-4 py-2 
                      rounded-xl 
                      text-sm font-medium 
                      transition-all shadow-sm backdrop-blur-md 
                      whitespace-nowrap active:scale-95
                      group border
                      ${isSeasonal
                    ? 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                    : 'bg-white/40 dark:bg-slate-800/40 border-white/40 dark:border-white/10 hover:bg-white hover:border-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }
                    `}
              >
                <span className={`flex items-center gap-1.5 transition-colors ${isSeasonal
                  ? 'text-blue-600 dark:text-blue-300 font-bold'
                  : 'group-hover:text-blue-600 dark:group-hover:text-blue-300'
                  }`}>
                  {isSeasonal && <Icon.Snowflake className="w-3.5 h-3.5" />}
                  {city}
                </span>
              </a>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full shadow-lg text-slate-500 hover:text-blue-500 transition-all opacity-0 group-hover/rail:opacity-100 hidden md:flex hover:scale-110 active:scale-95"
          aria-label="Sağa Kaydır"
        >
          <Icon.ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Navigation;
