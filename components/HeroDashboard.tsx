import React, { Suspense, lazy } from 'react';
import { WeatherData } from '../types';
import GlassCard from './GlassCard';
import { WeatherIcon3D } from './Icons';
// import HourlyMeteogram from './HourlyMeteogram'; // Lazy loaded below
import AlertBar from './AlertBar';
import { toSlug } from '../services/weatherService';
import MeteogramSkeleton from './MeteogramSkeleton';

// LCP Optimization: Lazy load heavy chart components
const HourlyMeteogram = lazy(() => import('./HourlyMeteogram'));
const DailyForecastChart = lazy(() => import('./DailyForecastChart'));

interface HeroDashboardProps {
  data: WeatherData;
  badgeText?: string;
  activeView: 'home' | 'tomorrow' | '15-days';
  onToggleView: (view: 'home' | 'tomorrow' | '15-days') => void;
}

const HeroDashboard: React.FC<HeroDashboardProps> = ({ data, badgeText = "Şimdi", activeView, onToggleView }) => {
  // SINAN SEO FIX: Use the 'Silo' URL structure
  const citySlug = toSlug(data.city);
  const baseUrl = `/hava-durumu/${citySlug}`;

  // Clean URLs (No query params)
  const homeHref = baseUrl;
  const tomorrowHref = `${baseUrl}/yarin`;
  const fifteenDaysHref = `${baseUrl}/15-gunluk`;

  return (
    <div className="flex flex-col gap-4 mb-6">



      <AlertBar data={data} />

      <div className={`grid gap-4 ${activeView === '15-days' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {/* Current Weather (Left) */}
        <GlassCard className={`relative flex flex-col justify-between h-[360px] ${activeView === '15-days' ? '' : 'md:col-span-1'}`}>

          <div className="flex flex-col gap-3 mb-2">
            {/* Toggle Control - Silo Navigation Links */}
            <div className="flex bg-white/40 dark:bg-slate-700/50 p-1.5 rounded-xl border border-white/20 dark:border-white/5 backdrop-blur-md w-full">
              <a
                href={homeHref}
                onClick={(e) => { e.preventDefault(); onToggleView('home'); }}
                aria-current={activeView === 'home' ? 'page' : undefined}
                className={`flex-1 py-2 rounded-lg text-[11px] font-bold text-center transition-all ${activeView === 'home' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Bugün
              </a>
              <a
                href={tomorrowHref}
                onClick={(e) => { e.preventDefault(); onToggleView('tomorrow'); }}
                aria-current={activeView === 'tomorrow' ? 'page' : undefined}
                className={`flex-1 py-2 rounded-lg text-[11px] font-bold text-center transition-all ${activeView === 'tomorrow' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Yarın
              </a>
              {/* SINAN SEO: 5-Day Internal Link Anchor */}
              <a
                href={`${fifteenDaysHref}#5-gunluk-detay`}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleView('15-days');

                  // SINAN SCROLL CHASER: Handle lazy-load layout shifts
                  const targetId = '5-gunluk-detay';
                  let attempts = 0;
                  const maxAttempts = 12; // Try for 1.2 seconds

                  const chaseParams = () => {
                    const el = document.getElementById(targetId);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  };

                  const chaser = setInterval(() => {
                    attempts++;
                    chaseParams();
                    if (attempts >= maxAttempts) clearInterval(chaser);
                  }, 100);
                }}
                className="flex-1 py-2 rounded-lg text-[11px] font-bold text-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-all border-l border-white/10 dark:border-white/5"
              >
                5 Günlük
              </a>
              <a
                href={fifteenDaysHref}
                onClick={(e) => { e.preventDefault(); onToggleView('15-days'); }}
                aria-current={activeView === '15-days' ? 'page' : undefined}
                className={`flex-1 py-2 rounded-lg text-[11px] font-bold text-center transition-all ${activeView === '15-days' ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                15 Günlük
              </a>
            </div>

            {/* Status Badge */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${badgeText === 'Yarın' ? 'bg-indigo-500' : (badgeText === '15 Günlük' ? 'bg-purple-500' : 'bg-blue-500')}`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${badgeText === 'Yarın' ? 'text-indigo-600 dark:text-indigo-300' : (badgeText === '15 Günlük' ? 'text-purple-600 dark:text-purple-300' : 'text-blue-600 dark:text-blue-300')}`}>
                GÖSTERİLEN: {badgeText.toUpperCase()}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="sinan-speakable-temp text-7xl font-light text-slate-800 dark:text-white tracking-tighter">
                  {Math.round(data.currentTemp)}°
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{data.condition}</p>
              </div>
              <WeatherIcon3D type={data.icon} className="transform scale-150 mr-4" />
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-blue-50/50 dark:bg-slate-800/50 rounded-xl p-3 border border-blue-100/50 dark:border-slate-700 relative overflow-hidden">
              {/* Background Icon */}
              <div className="absolute -right-2 -bottom-4 opacity-10 dark:opacity-5 pointer-events-none">
                <WeatherIcon3D type={data.icon} className="w-24 h-24 transform rotate-12" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase">Öneri</span>
                </div>
                <p className="sinan-speakable-summary text-sm text-slate-700 dark:text-slate-300 leading-snug">
                  {data.smartPhrase}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center justify-between">
              <span>Yüksek: {Math.round(data.high)}°</span>
              <span>Düşük: {Math.round(data.low)}°</span>
            </p>
          </div>
        </GlassCard>

        {/* Right Column: Chart (swaps based on view) - Full width for 15-days */}
        <div className={activeView === '15-days' ? 'w-full' : 'md:col-span-2'}>
          <Suspense fallback={<MeteogramSkeleton />}>
            {activeView === '15-days' ? (
              <DailyForecastChart
                dailyData={data.daily}
                cityName={data.city}
              />
            ) : (
              <HourlyMeteogram
                hourlyData={data.hourly}
                sunrise={data.sunrise}
                sunset={data.sunset}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default HeroDashboard;

