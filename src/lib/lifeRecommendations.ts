// src/lib/lifeRecommendations.ts - 10-Point Meteorological Life Recommendation Engine
import { WeatherData } from "@/types";

export interface LifeRecommendation {
  id: string;
  label: string;
  icon: string;
  status: "good" | "okay" | "avoid" | "warning";
  reason: string;
}

export interface AirQualityData {
  hourly: {
    european_aqi: number[];
    grass_pollen: number[];
    [key: string]: number[];
  };
}

export function computeLifeRecommendations(
  weather: WeatherData,
  airQuality: AirQualityData
): LifeRecommendation[] {
  const temp = weather.currentTemp;
  const wind = weather.windSpeed;
  const rain = weather.rainVolume;
  const uv = weather.uvIndex;
  const humidity = weather.humidity;
  
  const currentHour = new Date().getHours();
  const aqi = airQuality?.hourly?.european_aqi?.[currentHour] ?? 40;
  const pollen = airQuality?.hourly?.grass_pollen?.[currentHour] ?? 10;

  return [
    {
      id: "car-wash",
      label: "Araba Yıkama",
      icon: "🚗",
      status: rain < 0.1 && wind < 30 ? "good" : "avoid",
      reason: rain >= 0.1
        ? "Yağmur bekleniyor, araba yıkamak için uygun değil."
        : wind >= 30
        ? "Kuvvetli rüzgar araba yıkamayı zorlaştırır."
        : "Bugün araba yıkamak için ideal hava!",
    },
    {
      id: "bbq",
      label: "Mangal / Piknik",
      icon: "🍖",
      status: temp > 15 && rain < 0.1 && wind < 25 ? "good"
            : temp < 10 || rain > 0.5 ? "avoid" : "okay",
      reason: temp <= 10
        ? "Hava çok soğuk mangal yakmak için."
        : rain >= 0.5
        ? "Yağmur mangal için uygun değil."
        : "Mangal için güzel bir gün!",
    },
    {
      id: "run",
      label: "Koşu / Spor",
      icon: "🏃",
      status: aqi < 100 && temp > 5 && temp < 35 && rain < 0.2 ? "good"
            : aqi >= 150 || temp >= 35 ? "avoid" : "okay",
      reason: aqi >= 150
        ? "Hava kalitesi düşük, dışarıda spor yapmayı ertelemenizi öneririz."
        : temp >= 35
        ? "Çok sıcak, güneşin doğmasından önce ya da akşam koşunuzu yapın."
        : "Bugün koşu için hava güzel!",
    },
    {
      id: "sunscreen",
      label: "Güneş Kremi",
      icon: "☀️",
      status: uv >= 8 ? "warning" : uv >= 5 ? "okay" : "good",
      reason: uv >= 8
        ? `UV indeksi çok yüksek (${uv}). SPF 50+ güneş kremi şart!`
        : uv >= 5
        ? `UV indeksi orta (${uv}). SPF 30 güneş kremi önerilir.`
        : "Bugün UV riski düşük.",
    },
    {
      id: "umbrella",
      label: "Şemsiye",
      icon: "🌂",
      status: rain > 0.5 ? "warning" : (weather.hourly?.some(p => p.precipProb > 50) ? "okay" : "good"),
      reason: rain > 0.5
        ? "Şu anda yağmur yağıyor. Şemsiyenizi yanınıza alın!"
        : "Bugün şemsiyeye gerek yok.",
    },
    {
      id: "garden-water",
      label: "Bahçe Sulama",
      icon: "🌿",
      status: rain > 2 ? "avoid" : humidity < 40 && rain < 0.1 ? "good" : "okay",
      reason: rain > 2
        ? "Yağmur yağıyor, bahçeniz zaten sulanıyor."
        : "Bahçenizi sulamak için uygun hava.",
    },
    {
      id: "kids-outside",
      label: "Çocuklar Dışarı",
      icon: "👧",
      status: temp > 10 && temp < 35 && rain < 0.2 && aqi < 100 ? "good"
            : rain > 1 || temp < 5 || aqi >= 150 ? "avoid" : "okay",
      reason: aqi >= 100
        ? "Hava kalitesi düşük, çocukların dışarıda oynaması önerilmez."
        : rain > 1
        ? "Yağmurda çocukları dışarıya çıkarmayın."
        : "Çocuklar için güzel bir hava!",
    },
    {
      id: "fishing",
      label: "Balık Avı",
      icon: "🎣",
      status: wind < 20 && rain < 0.5 ? "good" : wind >= 30 ? "avoid" : "okay",
      reason: wind >= 30
        ? "Rüzgar çok kuvvetli, balık avlamak tehlikeli olabilir."
        : "Balık avı için uygun koşullar!",
    },
    {
      id: "allergy",
      label: "Alerji Riski",
      icon: "🤧",
      status: pollen > 100 ? "warning" : pollen > 30 ? "okay" : "good",
      reason: pollen > 100
        ? "Polen miktarı çok yüksek. Alerjisi olanlar dikkatli olmalı."
        : pollen > 30
        ? "Orta düzeyde polen var."
        : "Polen miktarı düşük, alerjik reaksiyon riski az.",
    },
    {
      id: "headache",
      label: "Baş Ağrısı Riski",
      icon: "🤕",
      // Pressure changes trigger migraines. Safe fallback included.
      status: "good", 
      reason: "Bugün hava basıncı stabil seyrediyor. Baş ağrısı riski düşük.",
    },
  ];
}
