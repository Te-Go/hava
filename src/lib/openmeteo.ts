// src/lib/openmeteo.ts - High-performance server-side meteorological data loaders
export const revalidate = 1800; // Tier 1: 30 minutes cache for forecasts

const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";
const AFAD_QUAKE_URL = "https://deprem.afad.gov.tr/apiv2/event/filter";

export async function fetchWeatherForecast(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    timezone: "Europe/Istanbul",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "rain",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "uv_index",
      "is_day",
    ].join(","),
    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "uv_index",
      "visibility",
      "relative_humidity_2m",
      "snow_depth",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
    ].join(","),
    forecast_days: "15",
  });

  const res = await fetch(`${BASE_URL}?${params}`, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error("Failed to fetch weather forecast data");
  return res.json();
}

export async function fetchAirQuality(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: [
      "pm2_5",
      "pm10",
      "ozone",
      "european_aqi",
      "grass_pollen",
      "tree_pollen",
      "weed_pollen",
    ].join(","),
    forecast_days: "5",
    timezone: "Europe/Istanbul",
  });

  const res = await fetch(`${AQ_URL}?${params}`, { next: { revalidate: 3600 } }); // Tier 2: 1 hour cache
  if (!res.ok) throw new Error("Failed to fetch air quality data");
  return res.json();
}

export async function fetchMarineConditions(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: [
      "wave_height",
      "wave_direction",
      "wave_period",
      "sea_surface_temperature",
    ].join(","),
    forecast_days: "7",
    timezone: "Europe/Istanbul",
  });

  const res = await fetch(`${MARINE_URL}?${params}`, { next: { revalidate: 3600 } }); // Tier 3: 1 hour cache
  if (!res.ok) throw new Error("Failed to fetch marine conditions");
  return res.json();
}

export async function fetchRecentEarthquakes() {
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const res = await fetch(
      `${AFAD_QUAKE_URL}?start=${startDate}&end=${endDate}&minmag=2.0&orderby=timedesc&limit=50`,
      {
        next: { revalidate: 120 }, // Tier 4: 2 minutes cache
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      return fetchKandilliEarthquakes();
    }
    return res.json();
  } catch (err) {
    console.warn("AFAD earthquake fetch failed, falling back to Kandilli...", err);
    return fetchKandilliEarthquakes();
  }
}

async function fetchKandilliEarthquakes() {
  // Kandilli KOERI feed fallback url
  const url = "https://api.orhanaydogdu.com.tr/deprem/kandilli/live?limit=50";
  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) throw new Error("Kandilli API error");
    const data = await res.json();
    // Normalize format
    return data.result || [];
  } catch (err) {
    console.error("Kandilli fallback failed too:", err);
    return [];
  }
}
