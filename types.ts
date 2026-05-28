
export interface WeatherData {
  city: string;
  coord: { lat: number, lon: number }; // Added for Radar
  currentTemp: number;
  condition: string;
  icon: string;
  smartPhrase: string;
  high: number;
  low: number;
  windSpeed: number;
  windDirection: string;
  rainVolume: number; // mm
  rainProb: number; // %
  humidity: number;
  uvIndex: number;
  feelsLike: number;
  pressure: number;
  aqi: number;
  sunrise: string;
  sunset: string;
  cloudCover: number; // Cloud cover percentage (0-100)
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

export interface HourlyForecast {
  time: string;
  temp: number;
  icon: string;
  precipProb: number;
  windSpeed: number; // km/s or km/h
  feelsLike: number; // Apparent temperature
  isDay: boolean;    // true = day, false = night (for shading)
  humidity: number;  // Relative humidity %
  uvIndex: number;   // UV index (0-11+)
  visibility: number; // Visibility in km
  precipitation?: number; // Precipitation amount (mm)
  fullDate?: string; // ISO Date (YYYY-MM-DD) for grouping
}

export interface DailyForecast {
  day: string; // Pzt, Sal, etc.
  date: string;
  icon: string;
  high: number;
  low: number;
  condition: string;
  rainProb: number;
  wind: string;
  humidity: number;
  feelsLike: number; // Apparent Temp Max
  uvIndex: number;   // Max UV Index
  visibility: number; // Visibility in km
  precipitationSum?: number; // Total precipitation (mm)
  fullDate?: string; // ISO Date (YYYY-MM-DD) for matching
}

export interface NewsItem {
  id: number;
  title: string;
  image: string;
  category: string;
  date: string;
  link: string; // URL for SEO navigation
  content?: string; // Content added back as optional
  excerpt?: string; // SINAN: Short preview text from WP
}

export interface LegalContent {
  title: string;
  content: string;
}

export interface MarketTicker {
  symbol: string;
  price: string;
  change: number; // percentage
  icon: string;
  logoUrl?: string; // New field for official logos
  link?: string; // Added field for link
}

export interface LifestyleIndex {
  id: string;
  name: string;
  status: 'good' | 'moderate' | 'bad';
  label: string;
  icon: string; // Icon name for lookup (e.g., 'Brain', 'Car', 'Shirt')
}

// --- USER PREFERENCES ---
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  lastCity: string;
  consentStatus: 'accepted' | 'declined' | 'pending';
}

// --- CONFIGURATION INJECTION ---
export interface TedderConfig {
  apiUrl?: string; // The WordPress Proxy Endpoint
  nonce?: string;  // WP Nonce for security
  isProduction?: boolean;
  weatherApiKey?: string; // Optional Weather API Key
  preloadedGeo?: {
    city: string;
    lat: number;
    lon: number;
  };
  ads?: {
    square?: string;       // 300x250 - Medium Rectangle (sidebar slot 3)
    vertical?: string;     // 300x600 - Half Page (sidebar slot 1)
    vertical2?: string;    // 300x600 - Half Page (sidebar slot 8)
    mediumRect2?: string;  // 300x250 - Medium Rectangle (sidebar slot 5)
    largeRect?: string;    // 336x280 - Large Rectangle (sidebar slot 6)
    largeRect2?: string;   // 336x280 - Large Rectangle (sidebar slot 9)
    articleAd?: string;    // HTML code for In-Article unit (End of Content)
    horizontal?: string;   // HTML code for Middle Horizontal unit (Lifestyle Bottom)
    adGrid?: string[];     // Array of 6 HTML strings for the bottom grid
  };
  logos?: {
    GOLD?: string;
    FX?: string;
    BOURSE?: string;
    CRYPTO?: string;
    [key: string]: string | undefined;
  };
  analyticsId?: string; // GA4 Measurement ID
}

declare global {
  interface Window {
    TedderConfig?: TedderConfig;
    gtag?: (...args: any[]) => void;
  }
}

// Historical Weather Data for comparison charts
export interface HistoricalDayData {
  date: string;        // YYYY-MM-DD
  high: number;        // Daily max temp
  low: number;         // Daily min temp
  precip: number;      // Precipitation sum (mm)
}

export interface HistoricalAverage {
  dayOfYear: number;   // 1-366
  avgHigh: number;
  avgLow: number;
  avgPrecip: number;
}

export interface HistoricalData {
  last12Months: HistoricalDayData[];
  tenYearAvg: HistoricalAverage[];
}