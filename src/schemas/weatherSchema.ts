import { z } from 'zod';

export const openMeteoSchema = z.object({
  latitude: z.number().catch(0),
  longitude: z.number().catch(0),
  current: z.object({
    time: z.string().catch(''),
    is_day: z.number().catch(1),
    temperature_2m: z.number().catch(0),
    weather_code: z.number().catch(0),
    wind_speed_10m: z.number().catch(0),
    wind_direction_10m: z.number().catch(0),
    relative_humidity_2m: z.number().catch(50),
    apparent_temperature: z.number().catch(0),
    surface_pressure: z.number().catch(1013),
    precipitation: z.number().catch(0),
    cloud_cover: z.number().catch(0),
  }).catch({
    time: '', is_day: 1, temperature_2m: 0, weather_code: 0, wind_speed_10m: 0, wind_direction_10m: 0, relative_humidity_2m: 50, apparent_temperature: 0, surface_pressure: 1013, precipitation: 0, cloud_cover: 0
  }),
  hourly: z.object({
    time: z.array(z.string()).catch(['']),
    temperature_2m: z.array(z.number()).catch([0]),
    precipitation_probability: z.array(z.number()).catch([0]),
    precipitation: z.array(z.number()).catch([0]),
    weather_code: z.array(z.number()).catch([0]),
    is_day: z.array(z.number()).catch([0]),
    wind_speed_10m: z.array(z.number()).catch([0]),
    wind_direction_10m: z.array(z.number()).catch([0]),
    apparent_temperature: z.array(z.number()).catch([0]),
    relative_humidity_2m: z.array(z.number()).catch([0]),
    uv_index: z.array(z.number()).catch([0]),
    visibility: z.array(z.number()).catch([0]),
    surface_pressure: z.array(z.number()).catch([0]),
    snow_depth: z.array(z.number()).optional().default([]),
  }).catch({
    time: [''], temperature_2m: [0], precipitation_probability: [0], precipitation: [0], weather_code: [0], is_day: [0], wind_speed_10m: [0], wind_direction_10m: [0], apparent_temperature: [0], relative_humidity_2m: [0], uv_index: [0], visibility: [0], surface_pressure: [0], snow_depth: []
  }),
  daily: z.object({
    time: z.array(z.string()).catch(['']),
    weather_code: z.array(z.number()).catch([0]),
    temperature_2m_max: z.array(z.number()).catch([0]),
    temperature_2m_min: z.array(z.number()).catch([0]),
    precipitation_sum: z.array(z.number()).catch([0]),
    wind_speed_10m_max: z.array(z.number()).catch([0]),
    uv_index_max: z.array(z.number()).catch([0]),
    precipitation_probability_max: z.array(z.number()).catch([0]),
    apparent_temperature_max: z.array(z.number()).catch([0]),
    sunrise: z.array(z.string()).catch(['']),
    sunset: z.array(z.string()).catch(['']),
  }).catch({
    time: [''], weather_code: [0], temperature_2m_max: [0], temperature_2m_min: [0], precipitation_sum: [0], wind_speed_10m_max: [0], uv_index_max: [0], precipitation_probability_max: [0], apparent_temperature_max: [0], sunrise: [''], sunset: ['']
  })
});

export const sanitizeOpenMeteoPayload = (data: unknown) => {
  try {
    if (!data || typeof data !== 'object') throw new Error("Payload is null or invalid");
    return openMeteoSchema.parse(data);
  } catch (e) {
    console.error("Root Failsafe Activated:", e);
    return {
      latitude: 0, longitude: 0,
      current: { time: '', is_day: 1, temperature_2m: 0, weather_code: 0, wind_speed_10m: 0, wind_direction_10m: 0, relative_humidity_2m: 50, apparent_temperature: 0, surface_pressure: 1013, precipitation: 0, cloud_cover: 0 },
      hourly: { time: [''], temperature_2m: [0], precipitation_probability: [0], precipitation: [0], weather_code: [0], is_day: [0], wind_speed_10m: [0], wind_direction_10m: [0], apparent_temperature: [0], relative_humidity_2m: [0], uv_index: [0], visibility: [0], surface_pressure: [0], snow_depth: [] },
      daily: { time: [''], weather_code: [0], temperature_2m_max: [0], temperature_2m_min: [0], precipitation_sum: [0], wind_speed_10m_max: [0], uv_index_max: [0], precipitation_probability_max: [0], apparent_temperature_max: [0], sunrise: [''], sunset: [''] }
    };
  }
};
