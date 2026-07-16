"use client";

import React, { useState, useEffect } from "react";
import { mapOpenMeteoToModel, toSlug } from "@/services/weatherService";
import { computeLifeRecommendations } from "@/lib/lifeRecommendations";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ClientDashboard from "@/components/ClientDashboard";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState("İstanbul");
  const [weather, setWeather] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    async function loadData(lat: number, lon: number, name: string) {
      try {
        const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (!weatherRes.ok) throw new Error("Weather fetch failed");
        const weatherRaw = await weatherRes.json();
        const mappedWeather = await mapOpenMeteoToModel(name, weatherRaw);

        // Fetch Air Quality using coordinates
        const aqRes = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,ozone,european_aqi,grass_pollen,tree_pollen,weed_pollen&forecast_days=5&timezone=Europe/Istanbul`
        );
        let aqData = null;
        if (aqRes.ok) {
          aqData = await aqRes.json();
        }

        const computedRecs = aqData ? computeLifeRecommendations(mappedWeather, aqData) : [];

        if (active) {
          setWeather(mappedWeather);
          setRecommendations(computedRecs);
          setCityName(name);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load home page weather:", err);
        if (active) {
          setLoading(false);
        }
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let detectedName = "Konumunuz";
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              detectedName =
                geoData.locality || geoData.city || geoData.principalSubdivision || "Konumunuz";
            }
          } catch (e) {
            console.warn("Reverse geocode failed, using generic name", e);
          }
          await loadData(latitude, longitude, detectedName);
        },
        async (err) => {
          console.log("Geolocation permission denied or error, defaulting to Istanbul", err);
          await loadData(41.0082, 28.9784, "İstanbul");
        },
        { timeout: 5000 }
      );
    } else {
      loadData(41.0082, 28.9784, "İstanbul");
    }

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <div className="flex-grow flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin"></div>
          <p className="text-sm text-white/50 tracking-wider">Hava durumu yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Fallback to İstanbul if fetching completely fails
  const displayCity = weather ? cityName : "İstanbul";
  const slug = toSlug(displayCity);
  const isMarine = ["istanbul", "izmir", "antalya", "trabzon", "mersin", "mugla"].includes(slug);
  const isSki = ["erciyes", "uludag", "palandoken", "kartalkaya", "sarikamis", "davraz"].includes(
    slug
  );

  const smartPhrase = weather
    ? weather.smartPhrase
    : `Bugün ${displayCity}'da hava durumu normal seyrediyor.`;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navigation currentCity={displayCity} />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        {weather && (
          <>
            {/* Hero Dashboard */}
            <section className="bg-slate-900/45 border border-white/12 backdrop-blur-md rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
                    Bulunduğunuz Yer
                  </span>
                  <h1 className="text-3xl font-extrabold text-white mt-1">
                    {displayCity} Hava Durumu
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
                  <p className="text-white/40">Basınç</p>
                  <p className="text-base font-bold text-white mt-1">{weather.pressure} hPa</p>
                </div>
              </div>
            </section>

            {/* Recommendations Grid */}
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
            <ClientDashboard
              weather={weather}
              cityName={displayCity}
              isMarine={isMarine}
              isSki={isSki}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
