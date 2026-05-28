
import React, { useEffect, useState } from 'react';
import { WeatherData } from '../types';
import GlassCard from './GlassCard';
import { Icon } from './Icons';

const MetricCard: React.FC<{
  title: string,
  value: string | number,
  unit?: string,
  subtext: string,
  icon?: React.ReactNode,
  customIcon?: React.ReactNode,
  accentColor?: string
}> = ({ title, value, unit, subtext, icon, customIcon, accentColor = "text-slate-700 dark:text-slate-200" }) => (
  <GlassCard className="flex flex-col justify-between h-full min-h-[140px]">
    <div className="flex justify-between items-start">
      <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{title}</span>
      <div className="p-2 rounded-full bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
        {customIcon ? customIcon : icon}
      </div>
    </div>
    <div>
      <div className={`text-2xl font-light ${accentColor} flex items-baseline`}>
        {value}
        {unit && <span className="text-sm font-medium ml-1 text-slate-400">{unit}</span>}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{subtext}</p>
    </div>
  </GlassCard>
);

const WindCompass: React.FC<{ direction: string | number }> = ({ direction }) => {
  const getRotation = (dir: string | number): number => {
    const num = parseFloat(dir as string);
    if (!isNaN(num)) return num;

    const map: { [key: string]: number } = {
      'Kuzey': 0, 'N': 0,
      'Kuzeydoğu': 45, 'NE': 45,
      'Doğu': 90, 'E': 90,
      'Güneydoğu': 135, 'SE': 135,
      'Güney': 180, 'S': 180,
      'Güneybatı': 225, 'SW': 225,
      'Batı': 270, 'W': 270,
      'Kuzeybatı': 315, 'NW': 315
    };
    return map[dir as string] || 0;
  };

  const rotation = getRotation(direction);

  return (
    <div className="relative w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600 shadow-inner">
      <span className="absolute top-0.5 text-[6px] font-bold text-slate-400">K</span>
      <span className="absolute right-0.5 text-[6px] font-bold text-slate-400">D</span>
      <span className="absolute bottom-0.5 text-[6px] font-bold text-slate-400">G</span>
      <span className="absolute left-0.5 text-[6px] font-bold text-slate-400">B</span>
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-1000 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="relative flex flex-col items-center h-full justify-start py-1">
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[8px] border-b-red-500 drop-shadow-sm"></div>
          <div className="w-0.5 h-3 bg-red-400/50"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-700 dark:bg-white rounded-full border border-white z-10"></div>
          <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-500"></div>
        </div>
      </div>
    </div>
  );
};

const SunCycleCard: React.FC<{ sunrise: string, sunset: string }> = ({ sunrise, sunset }) => {
  const [cycleData, setCycleData] = useState({ progress: 0, isNight: false });

  useEffect(() => {
    const calculateCycle = () => {
      const now = new Date();
      if (!sunrise || !sunset) return { progress: 0, isNight: false };

      const [srH, srM] = sunrise.split(':').map(Number);
      const [ssH, ssM] = sunset.split(':').map(Number);

      const srMins = srH * 60 + srM;
      const ssMins = ssH * 60 + ssM;
      const curMins = now.getHours() * 60 + now.getMinutes();

      let isNight = false;
      let progress = 0;

      // Determine phase
      if (curMins >= srMins && curMins < ssMins) {
        // Day Phase (Sunrise to Sunset)
        isNight = false;
        const totalDayMins = ssMins - srMins;
        progress = ((curMins - srMins) / totalDayMins) * 100;
      } else {
        // Night Phase (Sunset to Sunrise)
        isNight = true;
        const totalNightMins = (1440 - ssMins) + srMins; // Mins from sunset to midnight + midnight to sunrise
        let elapsed = 0;
        if (curMins >= ssMins) {
          // Before midnight
          elapsed = curMins - ssMins;
        } else {
          // After midnight
          elapsed = (1440 - ssMins) + curMins;
        }
        progress = (elapsed / totalNightMins) * 100;
      }
      // Clamp progress to 0-100
      progress = Math.min(Math.max(progress, 0), 100);
      return { progress, isNight };
    };

    setCycleData(calculateCycle());
    const interval = setInterval(() => setCycleData(calculateCycle()), 1000 * 60); // Update every minute
    return () => clearInterval(interval);
  }, [sunrise, sunset]);

  const { progress, isNight } = cycleData;

  // Math for arc position (Sine Wave)
  // PI to 0 -> Left to Right
  const angleRad = Math.PI * (1 - progress / 100);
  const xPct = 50 + 50 * Math.cos(angleRad); // 0 to 100
  const yPct = 100 * Math.sin(angleRad); // 0 to 100 (height)

  return (
    <GlassCard className="flex flex-col justify-between h-full min-h-[140px]">
      {/* Header - matches MetricCard layout */}
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Gün Döngüsü</span>
        <div className="p-2 rounded-full bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
          {isNight
            ? <Icon.Moon size={18} className="text-indigo-500" />
            : <Icon.Sun size={18} className="text-orange-500" />
          }
        </div>
      </div>

      {/* Content - Times on left, Arc on right */}
      <div className="flex items-end justify-between">
        {/* Stacked Times - Left */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Icon.ArrowUp className="w-3 h-3 text-orange-500" />
            <span className={`text-lg font-light ${!isNight ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>
              {sunrise}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon.ArrowDown className="w-3 h-3 text-blue-500" />
            <span className={`text-lg font-light ${isNight ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
              {sunset}
            </span>
          </div>
        </div>

        {/* Arc - Right side */}
        <div className="relative w-16 h-10">
          {/* Dashed Arc Track */}
          <div className="absolute inset-0 border-t-2 border-l-2 border-r-2 border-dashed border-slate-300 dark:border-slate-600 rounded-t-full"></div>
          {/* Horizon Line */}
          <div className="absolute bottom-0 w-full h-0.5 bg-slate-300 dark:bg-slate-600"></div>
          {/* Celestial Body */}
          <div
            className={`absolute w-4 h-4 -ml-2 rounded-full transition-all duration-1000 shadow-lg ${isNight
                ? 'bg-gradient-to-br from-slate-200 to-indigo-300'
                : 'bg-gradient-to-br from-yellow-300 to-orange-500'
              }`}
            style={{ left: `${xPct}%`, bottom: `${yPct * 0.8}%` }}
          ></div>
        </div>
      </div>
    </GlassCard>
  );
};

const BentoGrid: React.FC<{ data: WeatherData }> = ({ data }) => {
  // Helper to convert Degrees to Text (e.g., 345 -> 'Kuzeybatı')
  const getWindLabel = (dir: string | number): string => {
    const num = parseFloat(dir as string);
    if (isNaN(num)) return dir as string;
    if (num >= 337.5 || num < 22.5) return "Kuzey";
    if (num >= 22.5 && num < 67.5) return "Kuzeydoğu";
    if (num >= 67.5 && num < 112.5) return "Doğu";
    if (num >= 112.5 && num < 157.5) return "Güneydoğu";
    if (num >= 157.5 && num < 202.5) return "Güney";
    if (num >= 202.5 && num < 247.5) return "Güneybatı";
    if (num >= 247.5 && num < 292.5) return "Batı";
    if (num >= 292.5 && num < 337.5) return "Kuzeybatı";
    return "";
  };

  const windLabel = getWindLabel(data.windDirection);

  // Dynamic Logic
  const getFeelsLikeText = () => {
    const diff = data.feelsLike - data.currentTemp;
    if (diff > 2) return "Nemden dolayı daha sıcak";
    if (diff < -2) return "Rüzgar nedeniyle soğuk";
    return "Sıcaklık ile benzer";
  };
  const getAqiText = () => {
    if (data.aqi <= 50) return `AQI: ${data.aqi} (İyi)`;
    if (data.aqi <= 100) return `AQI: ${data.aqi} (Orta)`;
    return `AQI: ${data.aqi} (Hassas)`;
  };

  // Cloud cover helper
  const getCloudCoverText = () => {
    if (data.cloudCover <= 10) return 'Açık';
    if (data.cloudCover <= 30) return 'Az Bulutlu';
    if (data.cloudCover <= 60) return 'Parçalı Bulutlu';
    if (data.cloudCover <= 80) return 'Bulutlu';
    return 'Kapalı';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Rüzgar"
        value={data.windSpeed}
        unit="km/sa"
        subtext={windLabel ? `${windLabel} (${data.windDirection}°)` : `${data.windDirection}°`}
        customIcon={<WindCompass direction={data.windDirection} />}
      />
      <MetricCard
        title="Yağış"
        value={data.rainVolume}
        unit="mm"
        subtext={`${data.rainProb}% İhtimalle`}
        icon={<Icon.CloudRain size={18} />}
        accentColor="text-blue-600 dark:text-blue-400"
      />
      <MetricCard
        title="Nem"
        value={data.humidity}
        unit="%"
        subtext="Çiy Noktası 25°"
        icon={<Icon.Droplets size={18} />}
      />
      <MetricCard
        title="UV İndeksi"
        value={data.uvIndex}
        subtext={data.uvIndex > 6 ? "Yanma Süresi: ~15dk" : "Düşük Risk"}
        icon={<Icon.Sun size={18} />}
        accentColor={data.uvIndex > 6 ? "text-orange-500 dark:text-orange-400" : "text-green-600 dark:text-green-400"}
      />
      <MetricCard
        title="Hissedilen"
        value={Math.round(data.feelsLike)}
        unit="°C"
        subtext={getFeelsLikeText()}
        icon={<Icon.Thermometer size={18} />}
      />
      <MetricCard
        title="Atmosfer"
        value={`${data.pressure}`}
        unit="hPa"
        subtext={getAqiText()}
        icon={<Icon.Umbrella size={18} />}
      />
      <MetricCard
        title="Bulut Örtüsü"
        value={data.cloudCover}
        unit="%"
        subtext={getCloudCoverText()}
        icon={<Icon.Cloud size={18} />}
        accentColor={data.cloudCover > 60 ? "text-slate-500 dark:text-slate-400" : "text-blue-500 dark:text-blue-400"}
      />
      <SunCycleCard sunrise={data.sunrise} sunset={data.sunset} />
    </div>
  );
};
export default BentoGrid;
