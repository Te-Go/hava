
import React, { useRef } from 'react';
import GlassCard from './GlassCard';
import { Icon } from './Icons';
import { SEASONAL_SPOTS } from '../shared/cityData';

interface SeasonalRailProps {
  onCityChange: (city: string) => void;
}

const SeasonalRail: React.FC<SeasonalRailProps> = ({ onCityChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 150;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-6">
      <GlassCard className="flex items-center gap-4 py-3 relative group/rail" noPadding>
        {/* Title Block */}
        <div className="px-5 py-3 border-r border-blue-100 dark:border-slate-700 bg-blue-50/50 dark:bg-slate-800/50 h-full flex items-center min-w-[80px] justify-center">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider whitespace-nowrap">
            Kış
          </span>
        </div>

        {/* Scroll Left Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-[80px] z-10 p-1.5 bg-white/80 dark:bg-slate-700/80 rounded-full shadow-sm text-blue-500 hidden md:flex opacity-0 group-hover/rail:opacity-100 transition-opacity disabled:opacity-0"
        >
          <Icon.ChevronRight className="w-4 h-4 rotate-180" />
        </button>

        {/* Scrollable List */}
        <div
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 pr-4 flex-1 scroll-smooth"
        >
          {SEASONAL_SPOTS.map(spot => (
            <button
              key={spot.name}
              onClick={(e) => {
                e.preventDefault(); // Stop default browser anchor behavior
                e.currentTarget.blur(); // CRITICAL: Release focus to prevent browser from scrolling back down to this button
                onCityChange(spot.name);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-white/40 dark:bg-slate-700/50 border border-white/20 dark:border-white/5 rounded-xl text-sm font-medium hover:bg-white/80 dark:hover:bg-slate-600 transition-all text-slate-700 dark:text-slate-200 whitespace-nowrap group/btn hover:scale-105"
            >
              <span className="text-lg group-hover/btn:animate-bounce">{spot.icon}</span>
              <span>{spot.name}</span>
            </button>
          ))}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 z-10 p-1.5 bg-white/80 dark:bg-slate-700/80 rounded-full shadow-sm text-blue-500 hidden md:flex opacity-0 group-hover/rail:opacity-100 transition-opacity"
        >
          <Icon.ChevronRight className="w-4 h-4" />
        </button>
      </GlassCard>
    </div>
  );
};

export default SeasonalRail;
