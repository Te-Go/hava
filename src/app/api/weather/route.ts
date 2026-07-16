// src/app/api/weather/route.ts - High-performance server route handler
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  // Ensure lat and lon are clean floats
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,is_day,snow_depth&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,apparent_temperature_max,uv_index_max&forecast_days=15&forecast_hours=360&timezone=auto`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 }, // Tier 1: 30 minutes cache revalidation limit
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo API responded with status ${res.status}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("Open-Meteo proxy error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve meteorological forecast data" },
      { status: 502 }
    );
  }
}
