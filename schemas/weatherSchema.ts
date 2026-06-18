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
    relative_humidity_2m: z.number().catch(50),
    apparent_temperature: z.number().catch(0),
    surface_pressure: z.number().catch(1013),
  }).catch({
    time: '', is_day: 1, temperature_2m: 0, weather_code: 0, wind_speed_10m: 0, relative_humidity_2m: 50, apparent_temperature: 0, surface_pressure: 1013
  }),
  hourly: z.object({
    time: z.array(z.string()).catch([]),
    temperature_2m: z.array(z.number()).catch([]),
    precipitation_probability: z.array(z.number()).catch([]),
    precipitation: z.array(z.number()).catch([]),
    weather_code: z.array(z.number()).catch([]),
    is_day: z.array(z.number()).catch([]),
    wind_speed_10m: z.array(z.number()).catch([]),
    wind_direction_10m: z.array(z.number()).catch([]),
    apparent_temperature: z.array(z.number()).catch([]),
    relative_humidity_2m: z.array(z.number()).catch([]),
    uv_index: z.array(z.number()).catch([]),
    visibility: z.array(z.number()).catch([]),
    surface_pressure: z.array(z.number()).catch([]),
  }).catch({
    time: [], temperature_2m: [], precipitation_probability: [], precipitation: [], weather_code: [], is_day: [], wind_speed_10m: [], wind_direction_10m: [], apparent_temperature: [], relative_humidity_2m: [], uv_index: [], visibility: [], surface_pressure: []
  }),
  daily: z.object({
    time: z.array(z.string()).catch([]),
    weather_code: z.array(z.number()).catch([]),
    temperature_2m_max: z.array(z.number()).catch([]),
    temperature_2m_min: z.array(z.number()).catch([]),
    precipitation_sum: z.array(z.number()).catch([]),
    wind_speed_10m_max: z.array(z.number()).catch([]),
    uv_index_max: z.array(z.number()).catch([]),
    precipitation_probability_max: z.array(z.number()).catch([]),
    apparent_temperature_max: z.array(z.number()).catch([]),
    sunrise: z.array(z.string()).catch([]),
    sunset: z.array(z.string()).catch([]),
  }).catch({
    time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [], wind_speed_10m_max: [], uv_index_max: [], precipitation_probability_max: [], apparent_temperature_max: [], sunrise: [], sunset: []
  })
});

export const sanitizeOpenMeteoPayload = (data: unknown) => {
  return openMeteoSchema.parse(data);
};
