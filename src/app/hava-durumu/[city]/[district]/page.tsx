import React from "react";
import { getWeatherData, toSlug } from "@/services/weatherService";
import { fetchAirQuality } from "@/lib/openmeteo";
import { computeLifeRecommendations } from "@/lib/lifeRecommendations";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ClientDashboard from "@/components/ClientDashboard";

// Force 1-hour time-based cache revalidation for districts
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ city: string; district: string }>;
}

export async function generateStaticParams() {
  return [
    { city: "istanbul", district: "kadikoy" },
    { city: "istanbul", district: "besiktas" },
    { city: "istanbul", district: "sisli" },
    { city: "ankara", district: "cankaya" },
    { city: "izmir", district: "karsiyaka" },
  ];
}

export async function generateMetadata({ params }: PageProps) {
  const { city, district } = await params;
  const cityLower = city.toLowerCase();
  const districtLower = district.toLowerCase();
  const cityName = cityLower.charAt(0).toUpperCase() + cityLower.slice(1);
  const districtName = districtLower.charAt(0).toUpperCase() + districtLower.slice(1);

  return {
    title: `${cityName} ${districtName} Hava Durumu Bugün - 15 Günlük Canlı Meteoroloji Raporu`,
    description: `${cityName} ili ${districtName} ilçesi için anlık hava durumu tahmini. Saatlik meteoroloji grafikleri, kar kalınlıkları, orman yangın riski, polen alerji verileri ve KVKK uyumlu canlı sismik takip haritası.`,
    alternates: {
      canonical: `https://hava-durumlari.tr/hava-durumu/${cityLower}/${districtLower}`,
    },
  };
}

export default async function DistrictWeatherPage({ params }: PageProps) {
  const { city, district } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  const districtName = district.charAt(0).toUpperCase() + district.slice(1);

  // Fetch Core Meteorological Data for District
  const weather = await getWeatherData(district, 3600);

  if (!weather) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <Navigation currentCity={districtName} />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-slate-900/50 border border-white/10 backdrop-blur-md p-8 rounded-2xl max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">İlçe Bulunamadı</h1>
            <p className="text-white/60 text-sm">
              Sorguladığınız ilçe birimi sistemlerimizde tanımlı değildir. Lütfen Türkçe karakter
              normlarına uygun bir ilçe ismi girin.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Fetch Air Quality & Pollen Matrix
  const airQuality = await fetchAirQuality(weather.coord.lat, weather.coord.lon).catch(() => null);

  // Compute Life Recommendations
  const recommendations = airQuality ? computeLifeRecommendations(weather, airQuality) : [];

  // Determine Dynamic Background Gradients
  let bgGradientClass = "from-slate-950 via-slate-900 to-slate-950"; // default overcast
  const code = weather.weatherCode ?? 0;
  if (code === 0) {
    bgGradientClass = "from-amber-950/40 via-slate-950 to-slate-950"; // warm amber/clear sky
  } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95].some((c) => c === code)) {
    bgGradientClass = "from-indigo-950/50 via-slate-950 to-slate-950"; // deep stormy violet/rain
  } else if ([71, 73, 75, 77, 85, 86].some((c) => c === code)) {
    bgGradientClass = "from-cyan-950/40 via-slate-950 to-slate-950"; // cool blue-grey/snow
  }

  // AEO Natural Language Commentary Block
  const smartPhrase =
    weather.smartPhrase ||
    `Bugün ${cityName} ${districtName}'da hava ${weather.condition.toLowerCase()} seyrediyor. Sıcaklık ${
      weather.currentTemp
    }°C seviyesinde olup, rüzgar saatte ${
      weather.windSpeed
    } km hızla esmektedir. Günlük aktivitelerinizi planlamak için aşağıda listelenen detaylı yaşam önerilerini inceleyebilirsiniz.`;

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b ${bgGradientClass} text-white transition-colors duration-500`}>
      <Navigation currentCity={districtName} />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Hero Dashboard */}
        <section className="bg-slate-900/45 border border-white/12 backdrop-blur-md rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
                {cityName} İli
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-1">
                {districtName} Hava Durumu
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-5xl font-black text-white">{weather.currentTemp}°C</span>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-400">{weather.condition}</p>
                <p className="text-xs text-white/50">Hissedilen: {weather.feelsLike}°C</p>
              </div>
            </div>
          </div>

          {/* Conversational AEO Block */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm leading-relaxed text-white/90">
            💬 <span className="font-semibold text-blue-300">Uzman Yorumu:</span> {smartPhrase}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <p className="text-white/40">Nem Oranı</p>
              <p className="text-base font-bold text-white mt-1">%{weather.humidity}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <p className="text-white/40">Rüzgar Hızı</p>
              <p className="text-base font-bold text-white mt-1">{weather.windSpeed} km/s</p>
            </div>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <p className="text-white/40">UV İndeksi</p>
              <p className="text-base font-bold text-white mt-1">{weather.uvIndex} / 10</p>
            </div>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <p className="text-white/40">Göz Akışı / Basınç</p>
              <p className="text-base font-bold text-white mt-1">{weather.pressure} hPa</p>
            </div>
          </div>
        </section>

        {/* 10-Point Glassmorphic Recommendations Grid */}
        {recommendations.length > 0 && (
          <section className="bg-slate-900/45 border border-white/12 backdrop-blur-md rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-extrabold text-white">Yaşam ve Aktivite Önerileri</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{rec.icon}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        rec.status === "good"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : rec.status === "warning"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : rec.status === "avoid"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                      }`}
                    >
                      {rec.status === "good"
                        ? "İdeal"
                        : rec.status === "warning"
                        ? "Uyarı"
                        : rec.status === "avoid"
                        ? "Kaçın"
                        : "Orta"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{rec.label}</h4>
                    <p className="text-white/60 leading-normal">{rec.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Client Interactive Dashboard */}
        <ClientDashboard weather={weather} cityName={districtName} isMarine={false} isSki={false} />
      </main>

      <Footer />
    </div>
  );
}
