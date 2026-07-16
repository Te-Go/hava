// DEPRECATED: WeatherUnlocked Ski Service is retired.
// Use local calculateSkiConditions from services/skiService instead.

export async function fetchWeatherUnlockedSki(city: string): Promise<null> {
    console.warn(`[Deprecated] fetchWeatherUnlockedSki called for '${city}'. Use local calculateSkiConditions from services/skiService instead.`);
    return null;
}
