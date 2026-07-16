"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { WeatherData } from "@/types";
import { calculateSkiConditions } from "@/services/skiService";
import { fetchMarineData, generateMarineNarrative } from "@/services/marineService";

// Dynamic import with SSR deactivated for interactive map and charts to protect CLS
const DailyForecastChart = dynamic(() => import("./DailyForecastChart"), {
  ssr: false,
});
const HourlyMeteogram = dynamic(() => import("./HourlyMeteogram"), {
  ssr: false,
});
const SkiConditions = dynamic(() => import("./widgets/SkiConditions"), {
  ssr: false,
});
const MarineWidget = dynamic(() => import("./widgets/MarineWidget"), {
  ssr: false,
});

interface ClientDashboardProps {
  weather: WeatherData;
  cityName: string;
  isMarine: boolean;
  isSki: boolean;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  weather,
  cityName,
  isMarine,
  isSki,
}) => {
  const [skiData, setSkiData] = useState<any>(null);
  const [marineData, setMarineData] = useState<any>(null);
  const [marineNarrative, setMarineNarrative] = useState<string>("");

  useEffect(() => {
    if (isSki) {
      const data = calculateSkiConditions(
        cityName,
        weather.currentTemp,
        weather.rainVolume,
        weather.windSpeed,
        weather.cloudCover,
        0,
        weather.snowDepth
      );
      setSkiData(data);
    }
  }, [isSki, cityName, weather]);

  useEffect(() => {
    if (isMarine) {
      fetchMarineData(cityName).then((data) => {
        if (data) {
          setMarineData(data);
          setMarineNarrative(generateMarineNarrative(data));
        }
      });
    }
  }, [isMarine, cityName]);

  return (
    <div className="space-y-8">
      {/* Forecast Visualization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/45 border border-white/12 backdrop-blur-md rounded-2xl p-6 aspect-video">
          <h3 className="text-base font-bold text-white mb-4">15 Günlük Sıcaklık Eğrisi</h3>
          <div className="w-full h-full min-h-[250px]">
            <DailyForecastChart dailyData={weather.daily} cityName={cityName} />
          </div>
        </div>

        <div className="bg-slate-900/45 border border-white/12 backdrop-blur-md rounded-2xl p-6 aspect-video">
          <h3 className="text-base font-bold text-white mb-4">24 Saatlik Meteorogram</h3>
          <div className="w-full h-full min-h-[250px]">
            <HourlyMeteogram
              hourlyData={weather.hourly}
              sunrise={weather.sunrise}
              sunset={weather.sunset}
            />
          </div>
        </div>
      </div>

      {/* Specialist/Tourism Dynamic Spoke Mounting */}
      {(isSki || isMarine) && (
        <section className="grid grid-cols-1 gap-8">
          {isSki && (
            <div className="bg-slate-900/45 border border-white/12 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">
                Kayak Koşulları & Kar Kalınlığı
              </h3>
              <SkiConditions
                data={skiData}
                narrative={skiData?.narrative}
                lastUpdated={Date.now()}
              />
            </div>
          )}
          {isMarine && (
            <div className="bg-slate-900/45 border border-white/12 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">
                Deniz & Dalga Yüksekliği Tahminleri
              </h3>
              <MarineWidget
                data={marineData}
                narrative={marineNarrative}
                lastUpdated={Date.now()}
                cityDisplay={cityName}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ClientDashboard;
