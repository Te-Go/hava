import React, { useRef } from 'react';
import { WeatherData } from '../types';
import GlassCard from './GlassCard';
import { Icon } from './Icons';
import { calculateLifestyleIndexes } from '../services/weatherService';

interface LifestyleRailProps {
  data: WeatherData;
}

const LifestyleRail: React.FC<LifestyleRailProps> = ({ data }) => {
  if (!data) return null;

  const indexes = calculateLifestyleIndexes(data);
  const scrollRef = useRef<HTMLDivElement>(null);

  // SINAN PROTOCOL: Premium Color Logic
  const getStatusColor = (status: string) => {
    if (status === 'good') return 'bg-emerald-500 dark:bg-emerald-400';
    if (status === 'moderate') return 'bg-amber-500 dark:bg-amber-400';
    return 'bg-rose-500 dark:bg-rose-500'; // Sharper red for 'Bad'
  };

  // SINAN PROTOCOL: Premium Icon Mapping (No more duplicate Suns)
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Footprints': return <Icon.Activity className="w-5 h-5 text-orange-500 dark:text-orange-400" />; // Running
      case 'Baby': return <Icon.Baby className="w-5 h-5 text-pink-500 dark:text-pink-400" />; // Kids
      case 'Heart': return <Icon.Heart className="w-5 h-5 text-rose-500 dark:text-rose-400" />; // Health/Allergy
      case 'Shield': return <Icon.Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />; // Sensitive
      case 'Flame': return <Icon.Flame className="w-5 h-5 text-red-500 dark:text-red-400" />; // BBQ
      case 'Fish': return <Icon.Fish className="w-5 h-5 text-teal-500 dark:text-teal-400" />; // Fishing
      case 'Car': return <Icon.Car className="w-5 h-5 text-blue-500 dark:text-blue-400" />; // Car Wash
      case 'Sprout': return <Icon.Sprout className="w-5 h-5 text-green-600 dark:text-green-500" />; // Garden
      case 'Bike': return <Icon.Bike className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />; // Cycling
      default: return <Icon.Sun className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <GlassCard className="flex flex-col relative h-full" noPadding>
      <div className="px-4 py-3 border-b border-glass-border dark:border-dark-border flex justify-between items-center">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center text-sm">
          <Icon.Activity size={16} className="mr-2 text-blue-500" />
          Günlük Yaşam İndeksi
        </h3>
        {/* Premium Detail: A hint that these are calculated */}
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
          Yapay Zeka Analizi
        </span>
      </div>

      <div
        ref={scrollRef}
        className="
           w-full p-3
           flex overflow-x-auto gap-3 snap-x snap-mandatory touch-pan-x custom-scrollbar
           md:grid md:grid-cols-3 md:gap-3 md:overflow-visible
         "
      >
        {indexes.map((idx) => (
          <div
            key={idx.id}
            title={`${idx.name}: ${idx.label}`} // Simple tooltip for accessibility
            className="
                 group flex-shrink-0 w-[110px] md:w-auto h-[90px] 
                 bg-white/60 dark:bg-slate-800/40 
                 border border-slate-200/60 dark:border-slate-700 rounded-xl 
                 p-2 flex flex-col items-center justify-between text-center 
                 hover:bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5
                 dark:hover:bg-slate-700/60 dark:hover:border-blue-500/50
                 transition-all duration-300 cursor-default
                 snap-start relative overflow-hidden
               "
          >
            {/* Status Indicator Line (Premium Touch) */}
            <div className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(idx.status)} opacity-80`} />

            <div className="mt-1.5 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-full shadow-sm group-hover:scale-110 transition-transform">
              {getIcon(idx.icon)}
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-none mb-1">
                {idx.name}
              </span>
              <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 rounded-md
                  ${idx.status === 'good' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                  (idx.status === 'moderate' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300')}
               `}>
                {idx.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default LifestyleRail;
