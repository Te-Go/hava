
import React, { useState, useRef, useEffect } from 'react';
import { WeatherData, HourlyForecast, DailyForecast } from '../types';
import GlassCard from './GlassCard';
import { Icon } from './Icons';
import { CONFIG } from '../services/weatherService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import DailyForecastChart from './DailyForecastChart';
import { sanitizeHtmlLight } from '../shared/sanitizeHtml';

// Type for selected metric in drawer
type MetricType = 'feelsLike' | 'uv' | 'humidity' | null;

// Mini Sparkline Chart Component for drawer metrics
interface MetricSparklineProps {
  metric: MetricType;
  hourlyData: HourlyForecast[];
  dayFeelsLike: number;
}

const MetricSparkline: React.FC<MetricSparklineProps> = ({ metric, hourlyData, dayFeelsLike }) => {
  // SINAN PROTOCOL: REAL DATA MAPPING
  const chartData = hourlyData.slice(0, 24).map((h) => ({
    time: h.time.split(':')[0],
    temp: Math.round(h.temp),
    feelsLike: Math.round(h.feelsLike), // Real API feelsLike
    precipProb: h.precipProb,
    humidity: h.humidity,               // Real API Humidity
    uv: h.uvIndex,                       // Real API UV
    windSpeed: h.windSpeed
  }));

  const metricLabels: Record<string, string> = {
    feelsLike: '24 Saatlik Sıcaklık Karşılaştırması',
    uv: '24 Saatlik UV İndeksi',
    humidity: '24 Saatlik Nem ve Yağış Olasılığı'
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg border border-white/20 dark:border-slate-600 text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}:00</p>
          {metric === 'feelsLike' && (
            <>
              <p className="text-orange-500">Gerçek: {payload[0]?.value}°</p>
              <p className="text-purple-500">Hissedilen: {payload[1]?.value}°</p>
            </>
          )}
          {metric === 'humidity' && (
            <>
              <p className="text-blue-500">Nem: {payload[0]?.value}%</p>
              <p className="text-cyan-500">Yağış: {payload[1]?.value}%</p>
            </>
          )}
          {metric === 'uv' && <p className="text-amber-500">UV: {payload[0]?.value}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-3 pt-3 border-t border-blue-100/50 dark:border-slate-600/50 animate-fadeIn">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
        <Icon.ArrowUp size={14} />
        {metricLabels[metric || 'feelsLike']}
      </p>
      <div className="h-[100px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {metric === 'feelsLike' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="feelsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} fill="url(#tempGradient)" name="Gerçek" />
              <Line type="monotone" dataKey="feelsLike" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Hissedilen" />
            </ComposedChart>
          ) : metric === 'humidity' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} fill="url(#humidityGradient)" name="Nem" />
              <Line type="monotone" dataKey="precipProb" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Yağış" />
            </ComposedChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 10]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="uv" stroke="#f59e0b" strokeWidth={2} fill="url(#uvGradient)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      {/* Legend for dual-line charts */}
      {metric === 'feelsLike' && (
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-500 rounded"></span> Gerçek Sıcaklık</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-500 rounded border-dashed"></span> Hissedilen</span>
        </div>
      )}
      {metric === 'humidity' && (
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 rounded"></span> Nem %</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-500 rounded"></span> Yağış Olasılığı</span>
        </div>
      )}
    </div>
  );
};

interface ForecastSectionProps {
  data: WeatherData;
  focusTomorrow?: boolean;
}

const ForecastSection: React.FC<ForecastSectionProps> = ({ data, focusTomorrow = false }) => {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<{ day: string; metric: MetricType } | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dailySectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusTomorrow) {
      setExpandedDay('Yarın');
    }
  }, [focusTomorrow]);

  const toggleDay = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date);
    // Reset metric selection when closing drawer
    if (expandedDay === date) {
      setSelectedMetric(null);
    }
  };

  const toggleMetric = (day: string, metric: MetricType) => {
    if (selectedMetric?.day === day && selectedMetric?.metric === metric) {
      setSelectedMetric(null);
    } else {
      setSelectedMetric({ day, metric });
    }
  };

  const scrollHourly = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const containerWidth = sliderRef.current.clientWidth;
      const scrollAmount = containerWidth * 0.75;

      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getForecastIcon = (iconName: string, size: number = 24) => {
    switch (iconName) {
      case 'sunny': return <Icon.Sun size={size} className="text-orange-400" />;
      case 'moon': return <Icon.Moon size={size} className="text-slate-400" />;
      case 'cloudy': return <Icon.Cloud size={size} className="text-slate-400" />;
      case 'cloudy-night': return <Icon.Cloud size={size} className="text-slate-500" />;
      case 'overcast': return <Icon.Cloud size={size} className="text-slate-500" />;
      case 'rain': return <Icon.CloudRain size={size} className="text-blue-400" />;
      case 'drizzle': return <Icon.CloudRain size={size} className="text-blue-300" />;
      case 'storm': return <Icon.CloudLightning size={size} className="text-amber-500" />;
      case 'snow': return <Icon.CloudSnow size={size} className="text-cyan-300" />;
      case 'fog': return <Icon.CloudFog size={size} className="text-slate-400" />;
      default: return <Icon.Cloud size={size} className="text-slate-400" />;
    }
  };

  // Map icon names to Turkish weather descriptions
  const getWeatherDescription = (iconName: string): string => {
    switch (iconName) {
      case 'sunny': return 'Güneşli';
      case 'moon': return 'Açık (Gece)';
      case 'cloudy': return 'Parçalı Bulutlu';
      case 'cloudy-night': return 'Bulutlu (Gece)';
      case 'overcast': return 'Kapalı';
      case 'rain': return 'Yağmurlu';
      case 'drizzle': return 'Çisenti';
      case 'storm': return 'Fırtınalı';
      case 'snow': return 'Karlı';
      case 'fog': return 'Sisli';
      default: return 'Parçalı Bulutlu';
    }
  };

  const renderHourlyChart = (data: WeatherData, day: DailyForecast) => {
    // SINAN FIX: Use real date matching (ISO) instead of blind slicing
    let dayHourlyData: HourlyForecast[] = [];

    // 1. Try ISO Date Match (Best)
    if (day.fullDate) {
      dayHourlyData = data.hourly.filter(h => h.fullDate === day.fullDate);
    }

    // 2. Fallback to Unique Index Match (if fullDate missing for some reason)
    if (dayHourlyData.length === 0 && day.date) {
      const uniqueDates = Array.from(new Set(data.hourly.map(h => h.fullDate))).filter(Boolean);
      const targetDate = uniqueDates[data.daily.indexOf(day)];
      if (targetDate) {
        dayHourlyData = data.hourly.filter(h => h.fullDate === targetDate);
      }
    }

    if (!dayHourlyData.length) return <div className="p-4 text-center text-sm text-slate-400">Saatlik veri bulunamadı.</div>;

    return (
      <div className="flex flex-col w-full">
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dayHourlyData.map((h) => ({
                time: h.time.split(':')[0],
                temp: Math.round(h.temp),
                feelsLike: Math.round(h.feelsLike),
                precipProb: h.precipProb,
                humidity: h.humidity,
                windSpeed: h.windSpeed
              }))}
              margin={{ top: 10, right: 5, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tempGradientDrawer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="precipGradientDrawer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={2}
                tickFormatter={(val) => `${val}:00`}
              />
              <YAxis
                yAxisId="temp"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(val) => `${val}°`}
              />
              <YAxis
                yAxisId="precip"
                orientation="right"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                hide
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg border border-white/20 dark:border-slate-600 text-xs">
                        <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}:00</p>
                        <p className="text-orange-500">Sıcaklık: {payload[0]?.value}°</p>
                        <p className="text-purple-500">Hissedilen: {payload[1]?.value}°</p>
                        <p className="text-blue-500">Yağış: {payload[2]?.value}%</p>
                        <p className="text-slate-500">Rüzgar: {payload[3]?.value} km/sa</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                yAxisId="temp"
                type="monotone"
                dataKey="temp"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#tempGradientDrawer)"
                name="Sıcaklık"
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="feelsLike"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name="Hissedilen"
              />
              <Area
                yAxisId="precip"
                type="monotone"
                dataKey="precipProb"
                stroke="#3b82f6"
                strokeWidth={1}
                fill="url(#precipGradientDrawer)"
                name="Yağış"
                opacity={0.6}
              />
              <Line
                yAxisId="precip"
                type="monotone"
                dataKey="windSpeed"
                stroke="#64748b"
                strokeWidth={1.5}
                dot={false}
                name="Rüzgar"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span>Sıcaklık</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 rounded-full bg-purple-500"></span>
            <span>Hissedilen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Yağış</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 rounded-full bg-slate-400"></span>
            <span>Rüzgar</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 15 Day Vertical */}
        <div className="flex-1 min-w-0" ref={dailySectionRef}>
          <GlassCard className="flex flex-col h-full relative" noPadding>
            {/* SEO: "Matryoshka" 5-Day Nesting Protocol */}
            {/* TACTICAL ZONE: Days 1-5 (High Detail Signal) */}
            <div className="p-5 pb-0">
              <h2 id="5-gunluk-detay" className="text-lg font-bold text-slate-800 dark:text-blue-100 flex items-center gap-2">
                <Icon.Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                5 Günlük Detaylı Hava Durumu
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-l-4 border-blue-500 pl-3 py-1 bg-blue-50/50 dark:bg-slate-800/50 rounded-r-lg">
                <strong>5 günlük hava durumu</strong> verilerine göre, önümüzdeki günlerde sıcaklık en yüksek {Math.round(Math.max(...data.daily.slice(0, 5).map(d => d.high)))}°C, en düşük {Math.round(Math.min(...data.daily.slice(0, 5).map(d => d.low)))}°C olacak. Detaylı saatlik rapor için günlerin üzerine tıklayınız.
              </p>
            </div>

            <div className="custom-scrollbar divide-y divide-blue-50 dark:divide-slate-700 relative pb-4">
              {/* Render Days 0-4 (Tactical) */}
              {data.daily.slice(0, 5).map((day) => (
                <div key={`${day.day}-${day.date}`} className={`group transition-colors border-l-4 ${expandedDay === day.date ? 'bg-blue-100/60 dark:bg-slate-700/30 border-l-blue-500' : 'border-l-transparent hover:border-l-blue-300'}`}>
                  <button onClick={() => toggleDay(day.date)} className={`w-full flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors min-h-[72px] ${expandedDay === day.date ? 'bg-slate-100/80 dark:bg-slate-700/30' : (data.daily.indexOf(day) % 2 === 0 ? 'bg-slate-50/60 dark:bg-transparent' : 'bg-white/60 dark:bg-slate-800/20')}`}>
                    {/* Column 1: Day + Date */}
                    <div className="flex flex-col items-start min-w-[100px]">
                      <span className={`font-bold text-base ${day.day === 'Yarın' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>{day.day}</span>
                      <span className="text-xs text-slate-500 font-medium">{day.date}</span>
                    </div>
                    {/* Column 2: Weather Icon */}
                    <div className="flex items-center justify-center min-w-[40px] scale-110 transform transition-transform group-hover:scale-125 duration-300">{getForecastIcon(day.icon, 28)}</div>
                    {/* Column 3: Description (short weather text) */}
                    <div className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-300 min-w-[120px] text-center truncate">
                      {day.description || getWeatherDescription(day.icon)}
                    </div>
                    {/* Column 4: Rain Probability - Highlighted */}
                    <div className="flex items-center bg-blue-100 dark:bg-blue-900/40 px-3 py-1.5 rounded-lg min-w-[60px] justify-center text-xs font-bold text-blue-700 dark:text-blue-300 shadow-sm">
                      <Icon.Droplets size={14} className="mr-1.5" />{day.rainProb !== undefined ? `${day.rainProb}%` : '0%'}
                    </div>
                    {/* Column 5: Wind - Enhanced */}
                    <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-700/60 px-2 py-1.5 rounded-lg min-w-[60px] justify-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <Icon.Wind size={14} className="mr-1.5 text-slate-400" />{day.wind.split(' ')[0]}
                    </div>
                    {/* Column 5b: Visibility (New) */}
                    <div className="hidden lg:flex items-center justify-center min-w-[60px] text-xs text-slate-500 gap-1" title="Görüş Mesafesi">
                      <Icon.Eye size={14} className="text-slate-400" />
                      {day.visibility >= 10 ? '10+ km' : `${day.visibility} km`}
                    </div>
                    {/* Column 6: Temperatures - Large */}
                    <div className="flex items-center space-x-3 min-w-[80px] justify-end">
                      <span className="text-slate-900 dark:text-white font-bold text-lg">{Math.round(day.high)}°</span>
                      <span className="text-slate-400 dark:text-slate-500 font-medium text-base">{Math.round(day.low)}°</span>
                    </div>
                    {/* Column 7: Chevron */}
                    <Icon.ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedDay === day.date ? 'rotate-90 text-blue-500' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-500 ease-out overflow-hidden ${expandedDay === day.date ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="min-h-0">
                      {/* Comprehensive 24-Hour Forecast Chart */}
                      <div className="bg-blue-50/30 dark:bg-slate-800/30 p-4 border-t border-blue-50/50 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon.ArrowUp size={14} className="text-slate-500" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">24 Saatlik Detaylı Tahmin</span>
                        </div>
                        {/* Chart Logic Reuse */}
                        {renderHourlyChart(data, day)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* STRATEGIC ZONE: Days 6-15 (Standard Detail) */}
              <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-y border-slate-200 dark:border-slate-700 py-3 px-5 mt-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Icon.Calendar size={14} />
                  10-15 Günlük Uzun Vadeli Trend
                </h3>
              </div>

              {/* Render Days 5-14 (Strategic) */}
              {data.daily.slice(5).map((day) => (
                <div key={`${day.day}-${day.date}`} className={`group transition-colors ${expandedDay === day.date ? 'bg-blue-100/60 dark:bg-slate-700/30' : ''}`}>
                  <button onClick={() => toggleDay(day.date)} className={`w-full flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors min-h-[50px] border-b border-slate-100 dark:border-transparent opacity-90 hover:opacity-100 ${expandedDay === day.date ? 'bg-slate-100/80 dark:bg-slate-700/30' : 'bg-transparent'}`}>
                    {/* Compact Columns */}
                    <div className="flex items-center min-w-[100px]">
                      <span className="font-medium text-slate-600 dark:text-slate-300 w-24 text-left">{day.day}</span>
                      <span className="text-xs text-slate-400">{day.date}</span>
                    </div>
                    <div className="flex items-center justify-center min-w-[40px]">{getForecastIcon(day.icon, 20)}</div>
                    <div className="hidden md:block text-xs text-slate-400 min-w-[120px] text-center truncate">
                      {day.description || getWeatherDescription(day.icon)}
                    </div>
                    <div className="flex items-center justify-center min-w-[55px] text-xs text-slate-500">
                      {day.rainProb !== undefined ? <><Icon.Droplets size={12} className="mr-1 text-blue-400" />{day.rainProb}%</> : <span className="text-slate-300">-</span>}
                    </div>
                    <div className="hidden sm:flex items-center justify-center min-w-[55px] text-xs text-slate-400">
                      <Icon.Wind size={12} className="mr-1 text-slate-300" />{day.wind.split(' ')[0]}
                    </div>
                    <div className="flex items-center space-x-2 min-w-[70px] justify-end">
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">{Math.round(day.high)}°</span>
                      <span className="text-slate-400 dark:text-slate-600 font-light">{Math.round(day.low)}°</span>
                    </div>
                    <Icon.ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${expandedDay === day.date ? 'rotate-90' : ''}`} />
                  </button>
                  {/* Expandable Chart for Strategic Days too */}
                  <div className={`grid transition-all duration-500 ease-out overflow-hidden ${expandedDay === day.date ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="min-h-0">
                      <div className="bg-slate-50/50 dark:bg-slate-800/30 p-2 border-t border-slate-100 dark:border-slate-700">
                        {renderHourlyChart(data, day)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* Scroll Hint Fade (Visible only on Desktop with overflow) */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/80 dark:from-slate-800/80 to-transparent pointer-events-none hidden md:block rounded-b-3xl"></div>

            {/* FORCE VISIBLE SCROLLBAR */}
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
                display: block; 
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent; 
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #94a3b8; 
                border-radius: 20px;
                border: 2px solid transparent;
                background-clip: content-box;
              }
              .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #475569; 
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: #64748b; 
              }
            `}</style>
          </GlassCard>
        </div>

        {/* Sidebar Ads (Two Static Square 300x250 Units) */}
        {/* UPDATED: Hidden on XL screens because the main App Right Sidebar takes over */}
        <div className="hidden md:flex xl:hidden flex-col gap-6 w-[300px] flex-shrink-0">
          {/* Ad 1: Travel */}
          <div className="bg-glass-white/40 dark:bg-slate-800/40 border border-glass-border dark:border-dark-border rounded-3xl h-[250px] flex items-center justify-center shadow-glass relative overflow-hidden group cursor-pointer">
            {CONFIG.ads?.square ? (
              <div className="w-full h-full overflow-hidden" dangerouslySetInnerHTML={{ __html: sanitizeHtmlLight(CONFIG.ads.square) }} />
            ) : (
              <>
                <img
                  src="https://picsum.photos/300/250?random=88"
                  alt="Reklam"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-blue-600 w-fit px-2 py-0.5 rounded mb-1">Sponsorlu</span>
                  <p className="text-sm font-bold text-white leading-tight">Yaz Tatili Erken Rezervasyon Fırsatları</p>
                </div>
              </>
            )}
          </div>

          {/* Ad 2: Energy (Converted to Square, Removed Sticky) */}
          <div className="bg-glass-white/40 dark:bg-slate-800/40 border border-glass-border dark:border-dark-border rounded-3xl h-[250px] flex items-center justify-center shadow-glass relative overflow-hidden group cursor-pointer">
            {CONFIG.ads?.vertical ? (
              <div className="w-full h-full overflow-hidden" dangerouslySetInnerHTML={{ __html: sanitizeHtmlLight(CONFIG.ads.vertical) }} />
            ) : (
              <>
                <img
                  src="https://picsum.photos/300/250?random=99"
                  alt="Reklam"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-green-600 w-fit px-2 py-0.5 rounded mb-1">Enerji</span>
                  <p className="text-sm font-bold text-white leading-tight">Eviniz İçin Güneş Paneli Çözümleri</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* NOTE: DailyForecastChart removed here - it's already shown in HeroDashboard for 15-days view */}
    </div>
  );
};
export default ForecastSection;
