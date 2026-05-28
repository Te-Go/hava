
import {
    generateWeatherForecastSchema,
    generateLiveBlogPostingSchema,
    generateFAQSchema
} from '../services/seoSchemaService';
import { WeatherData } from '../types';

// Mock Data for Istanbul
const mockData: WeatherData = {
    city: "İstanbul",
    coord: { lat: 41.0082, lon: 28.9784 },
    currentTemp: 18.5,
    feelsLike: 17.0,
    condition: "Parçalı Bulutlu",
    icon: "partly-cloudy-day",
    smartPhrase: "Bugün hava parçalı bulutlu ve ılık.",
    humidity: 60,
    windSpeed: 15,
    windDirection: "NE",
    pressure: 1012,
    uvIndex: 4,
    rainProb: 10,
    rainVolume: 0,
    high: 20,
    low: 15,
    aqi: 45,
    sunrise: "06:30",
    sunset: "19:45",
    cloudCover: 40,
    daily: Array(15).fill({
        day: "Pazartesi",
        date: "2023-10-23",
        icon: "Sun",
        high: 22,
        low: 16,
        condition: "Güneşli",
        rainProb: 0,
        wind: "15 km/s",
        humidity: 55,
        feelsLike: 23,
        uvIndex: 5,
        visibility: 10
    }),
    hourly: []
};

console.log("--- LIVE BLOG SCHEMA ---");
console.log(JSON.stringify(generateLiveBlogPostingSchema("İstanbul", mockData), null, 2));

console.log("\n--- FORECAST SCHEMA (Checking Wikidata) ---");
console.log(JSON.stringify(generateWeatherForecastSchema(mockData, "İstanbul"), null, 2));
