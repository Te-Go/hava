
import React, { useEffect, useState, ErrorInfo, ReactNode, Suspense } from 'react';
import { getWeatherData, getWeatherDataByCoords, getMarketData, toSlug, fromSlug, fetchLiveArticles, trackEvent, getCityFromCoords, getTomorrowDashboardData, getWeekendDashboardData, initAnalytics, initAds, getUserPreferences, saveUserPreferences, getCityById } from './services/weatherService';
import { WeatherData, MarketTicker, NewsItem } from './types';
import TopBar from './components/TopBar';
import Navigation from './components/Navigation';
import HeroDashboard from './components/HeroDashboard';
import HeroSkeleton from './components/skeletons/HeroSkeleton';
import IslandSkeleton from './components/skeletons/IslandSkeleton';
import HourlySkeleton from './components/skeletons/HourlySkeleton';
import LifestyleSkeleton from './components/skeletons/LifestyleSkeleton';
import RadarSkeleton from './components/skeletons/RadarSkeleton';
import WeatherCommentaryGrid, { AnswerSummaryBar } from './components/WeatherCommentaryGrid';
import { generateWeatherCommentary, Timeframe } from './shared/weatherCommentary';
import ForecastSection from './components/ForecastSection';

// Restore missing imports
import Footer from './components/Footer';
import CityIndex from './components/CityIndex';
import AdGrid from './components/AdGrid';
import LifestyleRail from './components/LifestyleRail';
import CookieBanner from './components/CookieBanner';
import WeatherTriggeredAd from './components/WeatherTriggeredAd';
// DesktopSidebarLeft removed from layout
import DesktopSidebarRight from './components/DesktopSidebarRight';
import LazySection from './components/LazySection';
import MobileNav from './components/MobileNav';
import NetworkRibbon from './components/NetworkRibbon';
import SEOBreadcrumb from './components/SEOBreadcrumb';

// Lazy Load Heavy Components (Route Splitting & Component Splitting)
const RadarNews = React.lazy(() => import('./components/RadarNews'));
const HistoricalChart = React.lazy(() => import('./components/HistoricalChart'));
const NewsSection = React.lazy(() => import('./components/NewsSection'));
const LocationSearchPage = React.lazy(() => import('./components/LocationSearchPage'));
const IslandDemo = React.lazy(() => import('./components/IslandDemo'));
const SeaTempPage = React.lazy(() => import('./components/SeaTempPage'));
import LastUpdated from './components/LastUpdated';
import SEOFAQSection from './components/SEOFAQSection';
import LocalDistrictsGrid from './components/LocalDistrictsGrid';
import { Icon } from './components/Icons';

// Islands & Services
import { IslandPanel } from './islands';
import { fetchMarineData, isCoastalCity, type MarineData } from './services/marineService';
import { fetchTrafficData, hasTrafficMonitoring, type TomTomTrafficData } from './services/tomtomTrafficService';
import { calculateSkiConditions, hasSkiResort, resolveSkiCityKey, type SkiData } from './services/skiService';
import { findNearestHub } from './services/locationUtils'; // Hub & Spoke Logic

// New Island Services
import { fetchAgricultureData, isAgricultureRegion, type AgricultureData } from './services/agricultureService';
import { calculateAltitudeData, isAltitudeRegion, getProvinceElevation, type AltitudeData } from './services/altitudeService';
import { calculateFireRisk, isFireRiskRegion, shouldShowFireRisk, type FireRiskData } from './services/fireRiskService';
import { calculateTourismComfort, isTourismRegion, type TourismData } from './services/tourismService';
import { getIslandCategory } from './shared/provinceIslandMap';
import { injectSEOSchemas } from './services/seoSchemaService';

// TomTom API Key
// TomTom API Key - Secured via Environment Variables
const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY || '';

type ViewState =
  | { type: 'home' }
  | { type: 'tomorrow' }
  | { type: '15-days' }
  | { type: 'cities' }
  | { type: 'location-search' }
  | { type: 'island-demo' }
  | { type: 'sea-temp' };

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
    trackEvent('app_crash', 'error', error.toString());
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-slate-500">
          Hata oluştu. <button className="text-blue-500 underline" onClick={() => window.location.reload()}>Yenile</button>
        </div>
      );
    }
    // Explicitly cast to avoid TS error with props on some setups
    const props = (this as any).props as ErrorBoundaryProps;
    return props.children ?? null;
  }
}

interface AppProps {
  locationId?: number;
  payload?: any;
}

// SINAN FIREWALL: Reserved paths that should NEVER be treated as cities
const RESERVED_PATHS = [
  'analiz', 'haberler', 'iletisim', 'hakkimizda',
  'gizlilik-politikasi', 'kullanim-kosullari',
  'wp-admin', 'wp-json', 'sitemap', 'feed', 'rss',
  'konum-ara', // Location search disambiguation page
  'island-demo', // Island components development demo
  'deniz-suyu-sicakligi', // Sea temperature page
  'sehirler' // Cities index page
];

// 1. GLOBAL INTERCEPTOR (Place outside the App component)
const sanitizeOpenMeteoPayload = (payload: any) => {
    if (!payload || !payload.weatherData) return payload;

    // Transpose Daily
    const rawDaily = payload.weatherData.daily || {};
    const transformedDaily = Array.isArray(rawDaily) ? rawDaily : (rawDaily.time || []).map((t: string, i: number) => ({
        day: new Date(t).toLocaleDateString('tr-TR', { weekday: 'short' }),
        high: rawDaily.temperature_2m_max?.[i] || 0,
        low: rawDaily.temperature_2m_min?.[i] || 0,
        rainProb: rawDaily.precipitation_probability_max?.[i] || 0,
        wind: rawDaily.wind_speed_10m_max?.[i] ? `${rawDaily.wind_speed_10m_max[i]} km/s` : '0 km/sa',
        condition: 'Açık',
        icon: rawDaily.weathercode?.[i]?.toString() || '0'
    }));

    // Transpose Hourly
    const wd = payload.weatherData;
    const rawHourly = wd.hourly || {};
    
    // Format timestamp helper
    const formatTime = (t: string) => {
        try {
            return new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return t; // fallback
        }
    };

    const transformedHourly = Array.isArray(rawHourly) ? rawHourly : (rawHourly.time || []).map((t: string, i: number) => ({
        time: formatTime(t),
        temp: rawHourly.temperature_2m?.[i] || 0,
        feelsLike: rawHourly.temperature_2m?.[i] || 0, 
        precipProb: rawHourly.precipitation_probability?.[i] || 0,
        windSpeed: rawHourly.wind_speed_10m?.[i] || 0,
        humidity: rawHourly.relative_humidity_2m?.[i] || 0
    }));

    return {
        ...payload,
        city: payload.city,
        weatherData: {
            ...wd,
            currentTemp: wd.current?.temperature_2m ?? wd.current_weather?.temperature ?? wd.currentTemp ?? wd.current_temp ?? 0,
            high: wd.daily?.temperature_2m_max?.[0] ?? wd.high ?? 0,
            low: wd.daily?.temperature_2m_min?.[0] ?? wd.low ?? 0,
            windSpeed: wd.current?.wind_speed_10m ?? wd.current_weather?.windspeed ?? wd.windSpeed ?? wd.wind_speed ?? 0,
            windDirection: wd.current_weather?.winddirection ?? wd.windDirection ?? wd.wind_direction ?? '',
            rainVolume: wd.rainVolume ?? wd.rain_volume ?? 0,
            rainProb: wd.rainProb ?? wd.rain_prob ?? 0,
            feelsLike: wd.current?.apparent_temperature ?? wd.feelsLike ?? wd.feels_like ?? 0,
            humidity: wd.current?.relative_humidity_2m ?? wd.humidity ?? 0,
            pressure: wd.current?.surface_pressure ?? wd.pressure ?? 0,
            cloudCover: wd.cloudCover ?? wd.cloud_cover ?? 0,
            uvIndex: wd.daily?.uv_index_max?.[0] ?? wd.uvIndex ?? wd.uv_index ?? 0,
            sunrise: wd.daily?.sunrise?.[0] ?? wd.sunrise ?? '',
            sunset: wd.daily?.sunset?.[0] ?? wd.sunset ?? '',
            daily: transformedDaily,
            hourly: transformedHourly,
            city: payload.city,
            icon: wd.current_weather?.weathercode?.toString() || wd.icon || ''
        }
    };
};

// 2. SAFE INITIALIZATION (Place before App component)
const safeInitialPayload = typeof window !== 'undefined' && (window as any).SinanWeatherPayload 
    ? sanitizeOpenMeteoPayload((window as any).SinanWeatherPayload) 
    : null;
const INITIAL_WEATHER_DATA = safeInitialPayload?.weatherData || null;

if (typeof window !== 'undefined') {
    console.log("Current Payload:", (window as any).SinanWeatherPayload);
}


const App: React.FC<AppProps> = ({ locationId = 0, payload }) => {

  // BULLETPROOF HYDRATION LOGIC
  const getInitialState = (): { city: string; view: ViewState['type']; parentCity?: string } => {

    // ⛔️ PRIORITY 1: Server Injection (The "Truth")
    // If PHP (Asset Loader) injected the data object, use it.
    if (typeof window !== 'undefined' && (window as any).SinanWeatherPayload) {
      return {
        city: toSlug((window as any).SinanWeatherPayload.city || 'istanbul'),
        view: 'home'
      };
    }

    // ⚠️ PRIORITY 2: DOM Data Attributes (The "Bridge")
    // If Shortcode rendered the container with data attributes.
    if (typeof document !== 'undefined') {
      const root = document.getElementById('weather-app');
      if (root?.dataset.initialCity) {
        return {
          city: toSlug(root.dataset.initialCity),
          view: (root.dataset.initialView as 'home' | 'tomorrow' | '15-days') || 'home'
        };
      }
    }

    // 🤠 PRIORITY 3: Client-Side URL Parsing (The "Wild West")
    // Only runs if Server Injection failed or we are in pure SPA navigation.
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;

      // TOP LEVEL ROUTE EXCEPTIONS (Before /hava-durumu/ checks)
      if (path === '/deniz-suyu-sicakligi' || path === '/deniz-suyu-sicakligi/') {
        return { city: 'istanbul', view: 'sea-temp' };
      }

      if (path === '/15-gunluk' || path === '/15-gunluk/') {
        // Retrieve last city or default to Istanbul
        const prefs = getUserPreferences();
        const city = prefs.lastCity ? toSlug(prefs.lastCity) : 'istanbul';
        return { city, view: '15-days' };
      }

      // A. Strict Prefix Check (The Silo Protocol)
      if (path.startsWith('/hava-durumu/')) {
        const segments = path.split('/');
        // ["", "hava-durumu", "istanbul", "yarin"]
        //  0        1            2          3

        // B. Index Correction (Sinan's Fix) - City is at [2]
        // CHECK FOR DISTRICT: /hava-durumu/city/district
        const rawCitySlug = segments[2];
        const rawNextSlug = segments[3];

        console.log('[DEBUG] getInitialState segments:', segments);
        console.log('[DEBUG] rawCitySlug:', rawCitySlug, 'rawNextSlug:', rawNextSlug);

        let targetCity = rawCitySlug;
        let parentParams = {};

        if (rawNextSlug && !RESERVED_PATHS.includes(rawNextSlug) && rawNextSlug !== 'yarin' && rawNextSlug !== '15-gunluk' && rawNextSlug !== 'hafta-sonu') {
          console.log('[DEBUG] District detected in getInitialState:', rawNextSlug);
          targetCity = rawNextSlug;
          parentParams = { parentCity: fromSlug(rawCitySlug) };
        }

        const rawSlug = targetCity;

        // C. Validation Gate
        if (rawSlug && !RESERVED_PATHS.includes(rawSlug)) {
          // Regex check for strict slug format (a-z, 0-9, -) - XSS protection
          if (/^[a-z0-9-]+$/.test(rawSlug)) {

            // D. View Detection
            let view: 'home' | 'tomorrow' | '15-days' = 'home';
            if (path.includes('/yarin')) view = 'tomorrow';
            else if (path.includes('/15-gunluk')) view = '15-days';
            // Legacy fallback: redirect old weekend URLs to home
            else if (path.includes('/hafta-sonu')) view = 'home';

            return { city: toSlug(rawSlug), view, ...parentParams };
          }
        }
      }
    }

    // 🏳️ PRIORITY 4: Server Context (WordPress locationId prop)
    if (locationId > 0) {
      return { city: toSlug(getCityById(locationId)), view: 'home' };
    }

    // 🏳️ FALLBACK: Default State (SEO Baseline)
    return { city: 'istanbul', view: 'home' };
  };

  // Initialize state from bulletproof hydration
  const initialState = getInitialState();
  const [currentCity, setCurrentCity] = useState<string>(initialState.city);
  const [parentCity, setParentCity] = useState<string | null>(initialState.parentCity || null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(INITIAL_WEATHER_DATA);
  const [marketData, setMarketData] = useState<MarketTicker[]>([]);
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ type: initialState.view });

  // Island Data State
  const [marineData, setMarineData] = useState<MarineData | null>(null);
  const [marineCityDisplay, setMarineCityDisplay] = useState<string | undefined>(undefined);
  const [trafficData, setTrafficData] = useState<TomTomTrafficData | null>(null);
  const [trafficCityDisplay, setTrafficCityDisplay] = useState<string | undefined>(undefined);
  const [skiData, setSkiData] = useState<SkiData | null>(null);

  // New Island Data State
  const [agricultureData, setAgricultureData] = useState<AgricultureData | null>(null);
  const [altitudeData, setAltitudeData] = useState<AltitudeData | null>(null);
  const [fireRiskData, setFireRiskData] = useState<FireRiskData | null>(null);
  const [tourismData, setTourismData] = useState<TourismData | null>(null);

  // Doorway Modules State
  const [modules, setModules] = useState<any>(payload?.modules || { showTraffic: true, showMarine: true, showSki: true, showAgri: true });

  // DEBUG: Log mount state
  useEffect(() => {
    console.warn('🔴 [DEBUG-MOUNT] currentCity:', currentCity);
    console.warn('🔴 [DEBUG-MOUNT] URL path:', window.location.pathname);
    console.warn('🔴 [DEBUG-MOUNT] Expected city from slug:', fromSlug(window.location.pathname.split('/').pop() || ''));
  }, []);

  useEffect(() => {
    console.log('🔴 [STATE-CHANGE] currentCity is now:', currentCity);
  }, [currentCity]);

  // SMART HYDRATION STATE (KVKK COMPLIANT) & STRICT ROOT ROUTING
  useEffect(() => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    if (segments[0] === 'hava-durumu' && segments[1] && segments[1] !== 'yarin' && segments[1] !== '15-gunluk' && segments[1] !== 'hafta-sonu') {
      const slugCity = segments[1];
      setCurrentCity(toSlug(slugCity));
    } else if (path === '/' || path === '/hava-durumu' || path === '/hava-durumu/') {
      const prefs = getUserPreferences();
      const lastCity = localStorage.getItem('last_visited_city') || prefs.lastCity;
      if (prefs.consentStatus === 'accepted' && lastCity && toSlug(lastCity) !== 'istanbul') {
        setCurrentCity(toSlug(lastCity));
        window.history.replaceState({ city: lastCity }, '', `/hava-durumu/${toSlug(lastCity)}`);
      } else {
        setCurrentCity('istanbul');
        window.history.replaceState({ city: 'istanbul' }, '', '/hava-durumu/istanbul');
      }
    }
  }, []);

  // THEME STATE INITIALIZATION (Lazy Initializer)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const prefs = getUserPreferences();
      if (prefs.theme === 'dark') return true;
      if (prefs.theme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isManualTheme, setIsManualTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const prefs = getUserPreferences();
      return prefs.theme !== 'system';
    }
    return false;
  });

  // ============================================================================
  // TEST MODE: Inject Mock Forecast Data for Accuracy Banner
  // ============================================================================
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('test_accuracy') === 'true') {
        const today = new Date().toISOString().split('T')[0];
        const normalizedCity = (currentCity || '').toLowerCase()
          .replace(/İ/gi, 'i').replace(/ı/g, 'i').replace(/ğ/g, 'g')
          .replace(/ş/g, 's').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
        const fakeForecast = {
            city: currentCity,
            date: today,
            forecastHigh: 5,
            forecastLow: 0,
            forecastRainProb: 0,
            forecastCondition: "Sunny",
            storedAt: new Date().toISOString()
        };
        localStorage.setItem(`weather_forecast_${normalizedCity}_${today}`, JSON.stringify(fakeForecast));
        console.log('[TEST] Injected mock accuracy data for', currentCity);
      }
    }
  }, [currentCity]);

  // CONSENT & PREFERENCE LISTENER
  useEffect(() => {
    // 1. Load Consent & Analytics
    const checkConsent = () => {
      const prefs = getUserPreferences();
      if (prefs.consentStatus === 'accepted') {
        initAnalytics();
        initAds();
      }
    };
    checkConsent();
    window.addEventListener('storage', checkConsent);
    window.addEventListener('cookie_consent_updated', checkConsent);

    return () => {
      window.removeEventListener('storage', checkConsent);
      window.removeEventListener('cookie_consent_updated', checkConsent);
    };
  }, []);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Tarayıcı konum özelliğini desteklemiyor.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          // 1. Get locality name from coordinates (for display & URL)
          const localityName = await getCityFromCoords(latitude, longitude);

          // 2. Fetch weather directly by coordinates (most accurate)
          const weatherData = await getWeatherDataByCoords(latitude, longitude, localityName);

          // 3. Update state
          setCurrentCity(toSlug(localityName));
          setWeatherData(weatherData);

          // 4. Update URL (SEO-friendly)
          const slug = toSlug(localityName);
          window.history.pushState({ city: localityName }, '', `/hava-durumu/${slug}`);

          // 5. Save preference & track
          saveUserPreferences({ lastCity: localityName });
          trackEvent('use_location', 'gps', localityName);

        } catch (e) {
          console.error('GPS location error:', e);
          alert("Konum belirlenemedi. Lütfen tekrar deneyin.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini açın.");
        } else {
          alert("Konum alınamadı. Lütfen tekrar deneyin.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // GLOBAL DATA (Market Data - Run ONCE)
  useEffect(() => {
    const initMarketData = async () => {
      try {
        const tickers = await getMarketData();
        setMarketData(Array.isArray(tickers) ? tickers : []);
      } catch (e) { console.error("Market Data Init Failed", e); }
    };
    initMarketData();
  }, []);

  // NEWS API (Context Aware - Run on City Change)
  useEffect(() => {
    const initArticles = async () => {
      try {
        // SINAN TAG BRIDGE: Pass city for context-aware articles
        const liveArticles = await fetchLiveArticles(currentCity);
        setArticles(liveArticles);
      } catch (e) { console.error("News Fetch Failed", e); }
    };
    initArticles();
  }, [currentCity]);

  // VIEW RESOLUTION & URL ROUTING (Runs once on mount)
  // VIEW RESOLUTION & URL ROUTING (Runs once on mount)
  useEffect(() => {
    // View Resolution based on URL (Server routing support)
    // SINAN SILO PROTOCOL: /hava-durumu/city/view
    const urlParams = new URLSearchParams(window.location.search);
    const gunParam = urlParams.get('gun');
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    // Silo structure: [0]=hava-durumu, [1]=city, [2]=view

    // Route: /konum-ara - Location Search Page
    if (path.startsWith('/konum-ara')) {
      setView({ type: 'location-search' });
      return; // Early exit - don't process further
    }

    // Route: /island-demo - Island Components Demo
    if (path.startsWith('/island-demo')) {
      setView({ type: 'island-demo' });
      return; // Early exit - don't process further
    }

    // Route: /deniz-suyu-sicakligi - Sea Temperature Page
    if (path.startsWith('/deniz-suyu-sicakligi')) {
      setView({ type: 'sea-temp' });
      return; // Early exit - don't process further
    }

    // Route: /sehirler - Cities Index Page
    if (path.startsWith('/sehirler')) {
      setView({ type: 'cities' });
      return; // Early exit
    }

    // Check for view in segment[2] or legacy paths
    const viewSegment = segments[2] || '';
    if (gunParam === 'yarin' || viewSegment === 'yarin' || path.includes('/yarin')) setView({ type: 'tomorrow' });
    else if (gunParam === '15-gunluk' || viewSegment === '15-gunluk' || path.includes('/15-gunluk')) setView({ type: '15-days' });
    // Legacy: hafta-sonu redirects to home
    else if (path.includes('/hafta-sonu')) setView({ type: 'home' });

    // SINAN SILO: Extract city from segment[1] (after /hava-durumu/)
    console.log('[DEBUG] Silo URL Parsing:', { path, segments });
    // SINAN SILO: Extract city and district
    if (segments[0] === 'hava-durumu' && segments[1]) {
      const citySlug = segments[1];
      const nextSlug = segments[2];
      console.log('[DEBUG] useEffect Parsing - City:', citySlug, 'Next:', nextSlug);

      if (nextSlug && nextSlug !== 'yarin' && nextSlug !== '15-gunluk' && nextSlug !== 'hafta-sonu') {
        // District detected
        console.log('[DEBUG] District detected in useEffect:', nextSlug);
        setCurrentCity(fromSlug(nextSlug));
        setParentCity(fromSlug(citySlug));
      } else if (citySlug !== 'yarin' && citySlug !== 'hafta-sonu') {
        console.log('[DEBUG] City detected in useEffect:', citySlug);
        setCurrentCity(fromSlug(citySlug));
        setParentCity(null);
      }
    } else {
      // Legacy fallback: last segment is city
      const citySlug = segments[segments.length - 1];
      if (citySlug && citySlug !== 'yarin' && citySlug !== 'hafta-sonu' && citySlug !== 'hava-durumu') {
        const city = fromSlug(citySlug);
        if (city) {
          setCurrentCity(city);
          setParentCity(null);
        }
      }
    }

    // SPA Routing: Handle browser back/forward without full reload
    const handlePopState = () => {
      const pPath = window.location.pathname;
      const pUrlParams = new URLSearchParams(window.location.search);
      const pGunParam = pUrlParams.get('gun');
      const pSegments = pPath.split('/').filter(Boolean);

      // SINAN SILO: Determine view from segment[2] or legacy path
      const pViewSegment = pSegments[2] || '';
      if (pGunParam === 'yarin' || pViewSegment === 'yarin' || pPath.includes('/yarin')) {
        setView({ type: 'tomorrow' });
      } else if (pGunParam === '15-gunluk' || pViewSegment === '15-gunluk' || pPath.includes('/15-gunluk')) {
        setView({ type: '15-days' });
      } else {
        setView({ type: 'home' });
      }

      // SINAN SILO: Extract city and district
      if (pSegments[0] === 'hava-durumu' && pSegments[1]) {
        const pCitySlug = pSegments[1];
        const pNextSlug = pSegments[2];

        if (pNextSlug && pNextSlug !== 'yarin' && pNextSlug !== '15-gunluk' && pNextSlug !== 'hafta-sonu') {
          setCurrentCity(fromSlug(pNextSlug));
          setParentCity(fromSlug(pCitySlug));
        } else if (pCitySlug !== 'yarin' && pCitySlug !== 'hafta-sonu') {
          setCurrentCity(fromSlug(pCitySlug));
          setParentCity(null);
        }
      } else {
        // Legacy fallback
        const pCitySlug = pSegments[pSegments.length - 1];
        if (pCitySlug && pCitySlug !== 'yarin' && pCitySlug !== 'hafta-sonu' && pCitySlug !== 'hava-durumu') {
          const city = fromSlug(pCitySlug);
          if (city) {
            setCurrentCity(city);
            setParentCity(null);
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  console.log('🔴 [RENDER] App Component Rendered. currentCity:', currentCity, 'parentCity:', parentCity); // Run once on mount

  // Watch for locationId prop changes specifically (Dynamic Updates / Single Page Transitions if parent updates)
  // Watch for locationId prop changes (Dynamic Updates from WordPress parent)
  // IMPORTANT: Only override city if the URL doesn't already specify one
  // This prevents the hardcoded data-location-id from overwriting URL-based navigation
  useEffect(() => {
    if (locationId > 0) {
      // Check if URL already specifies a city
      const path = window.location.pathname;
      const segments = path.split('/').filter(Boolean);

      // SINAN FIX: Better URL validation to prevent overwrite
      let urlHasCity = false;

      if (segments.length >= 2 && segments[0] === 'hava-durumu') {
        // Check segment[1] (City)
        const citySlug = segments[1];
        // Check segment[2] (District or View)
        const nextSlug = segments[2];

        if (citySlug && citySlug !== 'yarin' && citySlug !== 'hafta-sonu') {
          urlHasCity = true;
        }
        if (nextSlug && nextSlug !== 'yarin' && nextSlug !== '15-gunluk' && nextSlug !== 'hafta-sonu') {
          urlHasCity = true;
        }
      }

      // Only use locationId if URL doesn't have a valid city
      if (!urlHasCity) {
        const city = getCityById(locationId);
        setCurrentCity(city);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setIsManualTheme(true);
    // Save Preference
    saveUserPreferences({ theme: newMode ? 'dark' : 'light' });
    trackEvent('toggle_theme', 'ui', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    // AbortController to cancel pending requests when city/view changes
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        if (payload && payload.weatherData && toSlug(payload.city) === toSlug(currentCity)) {
          const sanitized = sanitizeOpenMeteoPayload(payload);
          const safeWeatherData = sanitized.weatherData;
          setWeatherData(safeWeatherData);
          
          if (isMetroCity(currentCity)) {
             fetchTrafficData(currentCity).then(setTrafficData).catch(() => setTrafficData(null));
          } else setTrafficData(null);

          if (isCoastalCity(currentCity)) {
             fetchMarineData(currentCity).then(setMarineData).catch(() => setMarineData(null));
          } else setMarineData(null);

          if (hasSkiResort(currentCity)) {
             setSkiData(calculateSkiConditions(currentCity, safeWeatherData.currentTemp, safeWeatherData.rainVolume || 0, safeWeatherData.windSpeed, safeWeatherData.cloudCover || 0));
          } else setSkiData(null);

          if (isAgricultureRegion(currentCity)) {
             fetchAgricultureData(currentCity).then(setAgricultureData).catch(() => setAgricultureData(null));
          } else setAgricultureData(null);

          if (isAltitudeRegion(currentCity)) {
             const minTemp = safeWeatherData.daily?.[0]?.low || 0;
             setAltitudeData(calculateAltitudeData(getProvinceElevation(currentCity), safeWeatherData.currentTemp, safeWeatherData.feelsLike, [minTemp], safeWeatherData.windSpeed, safeWeatherData.rainVolume || 0));
          } else setAltitudeData(null);

          if (isFireRiskRegion(currentCity)) {
             setFireRiskData(calculateFireRisk(safeWeatherData.humidity, safeWeatherData.windSpeed, safeWeatherData.currentTemp, safeWeatherData.rainVolume || 0));
          } else setFireRiskData(null);

          if (isTourismRegion(currentCity)) {
             setTourismData(calculateTourismComfort(safeWeatherData.currentTemp, safeWeatherData.humidity, safeWeatherData.uvIndex, currentCity));
          } else setTourismData(null);

          // Auto-Theme Logic (Only if user hasn't manually overridden via settings)
          if (safeWeatherData && !isManualTheme && !loading && toSlug(safeWeatherData.city) === toSlug(currentCity)) {
            const iconStatus = safeWeatherData.icon || '';
            if (iconStatus === 'moon' || iconStatus.includes('night') || iconStatus.includes('storm')) {
              setIsDarkMode(true);
            } else {
              setIsDarkMode(false);
            }
          }
        } else {
          const newWeatherData = await getWeatherData(currentCity);
          if (!isMounted) return;
            if (newWeatherData) {
            setWeatherData(newWeatherData);
            setModules(payload?.modules || { showTraffic: true, showMarine: true, showSki: true, showAgri: true });
            
            if (isMetroCity(currentCity)) {
               fetchTrafficData(currentCity).then(setTrafficData).catch(() => setTrafficData(null));
            } else setTrafficData(null);

            if (isCoastalCity(currentCity)) {
               fetchMarineData(currentCity).then(setMarineData).catch(() => setMarineData(null));
            } else setMarineData(null);

            if (hasSkiResort(currentCity)) {
               setSkiData(calculateSkiConditions(currentCity, newWeatherData.currentTemp, newWeatherData.rainVolume || 0, newWeatherData.windSpeed, newWeatherData.cloudCover || 0));
            } else setSkiData(null);

            if (isAgricultureRegion(currentCity)) {
               fetchAgricultureData(currentCity).then(setAgricultureData).catch(() => setAgricultureData(null));
            } else setAgricultureData(null);

            if (isAltitudeRegion(currentCity)) {
               const minTemp = newWeatherData.daily?.[0]?.low || 0;
               setAltitudeData(calculateAltitudeData(getProvinceElevation(currentCity), newWeatherData.currentTemp, newWeatherData.feelsLike, [minTemp], newWeatherData.windSpeed, newWeatherData.rainVolume || 0));
            } else setAltitudeData(null);

            if (isFireRiskRegion(currentCity)) {
               setFireRiskData(calculateFireRisk(newWeatherData.humidity, newWeatherData.windSpeed, newWeatherData.currentTemp, newWeatherData.rainVolume || 0));
            } else setFireRiskData(null);

            if (isTourismRegion(currentCity)) {
               setTourismData(calculateTourismComfort(newWeatherData.currentTemp, newWeatherData.humidity, newWeatherData.uvIndex, currentCity));
            } else setTourismData(null);

            // Auto-Theme Logic (Only if user hasn't manually overridden via settings)
            if (newWeatherData && !isManualTheme && !loading && toSlug(newWeatherData.city) === toSlug(currentCity)) {
              const iconStatus = newWeatherData.icon || '';
              if (iconStatus === 'moon' || iconStatus.includes('night') || iconStatus.includes('storm')) {
                setIsDarkMode(true);
              } else {
                setIsDarkMode(false);
              }
            }
          }
        }
      } catch (error) {
        if (isMounted) console.error("Fetch failed:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (view.type === 'home' || view.type === 'tomorrow' || view.type === '15-days') {
      fetchData();
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [currentCity, view.type, payload]);

  useEffect(() => {
    // SINAN CITY MEMORY REDIRECT STORAGE
    const prefs = getUserPreferences();
    if (prefs.consentStatus === 'accepted') {
      localStorage.setItem('sinan_last_city', toSlug(currentCity));
    }


    // SINAN STANDARD TITLE FORMAT - Must match PHP SEO Engine exactly
    if (!weatherData) return;

    const cityDisplay = fromSlug(currentCity); // Ensure Turkish chars (İstanbul not Istanbul)

    // Dynamic month name for SEO freshness
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const currentMonth = monthNames[new Date().getMonth()];
    const currentYear = new Date().getFullYear();

    let pageTitle = '';
    if (view.type === 'tomorrow') {
      pageTitle = `${cityDisplay} Yarınki Hava Durumu - Saatlik Detaylı Rapor | TG`;
    } else if (view.type === '15-days') {
      pageTitle = `${cityDisplay} 15 Günlük Hava Durumu - ${currentMonth} ${currentYear} Trendi | TG`;
    } else {
      pageTitle = `${cityDisplay} Hava Durumu - Saatlik ve Günlük Tahmin | TG`;
    }

    document.title = pageTitle;

    // SINAN SEO: Inject dynamic JSON-LD schemas and meta description
    if (view.type === 'home' || view.type === 'tomorrow' || view.type === '15-days') {
      injectSEOSchemas(cityDisplay, view.type, weatherData);
    }

    trackEvent('view_weather', 'city', currentCity);
  }, [weatherData, view.type, currentCity, isManualTheme, loading]);

  const handleCityChange = (newCity: string) => {
    const prettyName = fromSlug(newCity);
    setCurrentCity(toSlug(newCity));

    // Save to LocalStorage ONLY if consent is granted (KVKK Compliance)
    const prefs = getUserPreferences();
    if (prefs.consentStatus === 'accepted') {
      saveUserPreferences({ lastCity: prettyName });
      localStorage.setItem('last_visited_city', prettyName);
    }

    const slug = toSlug(prettyName);
    // SINAN SILO PROTOCOL: /hava-durumu/city/view
    let path = `/hava-durumu/${slug}`;
    if (view.type === 'tomorrow') path += '/yarin';
    else if (view.type === '15-days') path += '/15-gunluk';

    window.history.pushState({ city: prettyName }, '', path);
    trackEvent('change_city', 'navigation', prettyName);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 200);
  };

  const handleViewToggle = (newView: 'home' | 'tomorrow' | '15-days') => {
    setView({ type: newView });
    const slug = toSlug(currentCity);

    // SINAN SILO PROTOCOL: /hava-durumu/city/view
    let path = `/hava-durumu/${slug}`;
    if (newView === 'tomorrow') path += '/yarin';
    else if (newView === '15-days') path += '/15-gunluk';

    window.history.pushState({ city: currentCity }, '', path);
    trackEvent('toggle_view', 'hero', newView);
  };

  const handleFooterNavigate = (dest: string) => {
    // Navigate to React-controlled views or update state for cities
    window.scrollTo(0, 0);
    const slug = toSlug(currentCity);

    // SINAN SILO PROTOCOL: /hava-durumu/city/view
    if (dest === 'home') {
      setView({ type: 'home' });
      window.history.pushState({ city: currentCity }, '', `/hava-durumu/${slug}`);
    }
    else if (dest === 'tomorrow') {
      setView({ type: 'tomorrow' });
      window.history.pushState({ city: currentCity }, '', `/hava-durumu/${slug}/yarin`);
    }
    else if (dest === '15-days') {
      setView({ type: '15-days' });
      window.history.pushState({ city: currentCity }, '', `/hava-durumu/${slug}/15-gunluk`);
    }
    else if (dest === 'cities') {
      setView({ type: 'cities' });
    }
    else if (dest.startsWith('city:')) {
      const city = dest.split(':')[1];
      setCurrentCity(toSlug(city));
      setView({ type: 'home' });
      window.history.pushState({ city }, '', `/hava-durumu/${toSlug(city)}`);
    }
  };

  const renderView = () => {
    switch (view.type) {
      case 'home':
      case 'tomorrow':
      case '15-days':
        let displayData = weatherData;
        if (weatherData) {
          if (view.type === 'tomorrow') displayData = getTomorrowDashboardData(weatherData);
          // 15-days uses full weatherData (no transformation needed)
        }

        return (
          <>
            <Navigation
              currentCity={fromSlug(currentCity)}
              onCityChange={handleCityChange}
              onLocationClick={handleUseLocation}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              activeView={view.type}
            />
            {/* SINAN UX: District Rail - Positioned directly under City Rail for city→district flow */}
            <LocalDistrictsGrid city={currentCity} view={view.type} />
            {/* SEO Breadcrumb Navigation - Always Visible */}
            <SEOBreadcrumb cityName={currentCity} view={view.type} parentCity={parentCity || undefined} />

            {/* SEO: Visible H1 & Intro (Responsive Layout) */}
            <div className="max-w-4xl mx-auto px-4 mt-2 mb-3 flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-6">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white leading-tight flex-shrink-0">
                {view.type === 'tomorrow'
                  ? `${fromSlug(currentCity)} Yarınki Hava Durumu`
                  : view.type === '15-days'
                    ? `${fromSlug(currentCity)} 15 Günlük Hava Durumu Tahmini`
                    : `${fromSlug(currentCity)} Hava Durumu`
                }
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 md:text-right md:max-w-lg leading-snug">
                {view.type === 'tomorrow'
                  ? `${fromSlug(currentCity)} için yarınki hava durumu tahmin raporu ve detaylı meteoroloji verileri.`
                  : view.type === '15-days'
                    ? `${fromSlug(currentCity)} 15 günlük hava durumu trendi, sıcaklık değişimi ve yağış beklentisi.`
                    : `${fromSlug(currentCity)} güncel hava durumu ve detaylı tahminler. Anlık sıcaklık ve rüzgar verileri.`
                }
              </p>
            </div>
            {/* Answer Summary Bar - Between City Rail and Hero - HIDDEN in 15-days view */}
            {view.type !== '15-days' && displayData && (() => {
              const timeframe: Timeframe = view.type === 'tomorrow' ? 'tomorrow' : 'today';
              const commentary = generateWeatherCommentary(displayData, timeframe);
              return (
                <AnswerSummaryBar
                  city={commentary.city}
                  summary={commentary.answerBlock}
                  comparison={commentary.timeframeBlock.comparison}
                />
              );
            })()}
            {loading ? (
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="animate-fadeIn w-full">
                   <HeroSkeleton />
                   {view.type !== '15-days' && <IslandSkeleton />}
                   {view.type !== '15-days' && (
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6">
                         <div className="w-full md:w-1/2">
                            <LifestyleSkeleton />
                         </div>
                         <div className="w-full md:w-1/2">
                            <RadarSkeleton />
                         </div>
                      </div>
                   )}
                   {view.type !== '15-days' && <HourlySkeleton />}
                </div>
              </div>
            ) : !displayData ? (
              <div className="p-4 text-left text-red-700 bg-red-50 border border-red-500 rounded-lg font-mono text-xs overflow-auto max-w-4xl mx-auto my-8">
                <h3 className="font-bold text-base mb-2">DEBUG MODE: App Terminated Early (No valid displayData)</h3>
                <p className="mb-4">The React Router evaluated to false and failed to render the dashboard. Displaying raw window.SinanWeatherPayload below:</p>
                <pre>{JSON.stringify(window.SinanWeatherPayload, null, 2)}</pre>
              </div>
            ) : (
              <div className="animate-fadeIn mt-4">
                <HeroDashboard
                  data={displayData}
                  badgeText={view.type === 'tomorrow' ? 'Yarın' : (view.type === '15-days' ? '15 Günlük' : 'Şimdi')}
                  activeView={view.type}
                  onToggleView={handleViewToggle}
                />
                {/* Last Updated Timestamp - SEO Freshness Signal */}
                <LastUpdated className="mb-4" />

                {/* 15 Günlük Tahmin - Moved up for 15-days view, positioned right after Hero */}
                {view.type === '15-days' && (
                  <ForecastSection data={displayData} focusTomorrow={false} />
                )}

                {/* Weather Commentary Grid - HIDDEN in 15-days view to avoid duplication */}
                {view.type !== '15-days' && (
                  <WeatherCommentaryGrid
                    weatherData={displayData}
                    initialTimeframe={view.type === 'tomorrow' ? 'tomorrow' : 'today'}
                    showTimeframeSelector={false}
                    showFAQ={false}
                    showDailySummary={true}
                    className="mb-8"
                  />
                )}

                {/* SINAN ISLANDS: Unified Contextual Widget Panel - HIDDEN in 15-days view */}
                {/* SINAN ISLANDS: Unified Contextual Widget Panel - HIDDEN in 15-days view */}
                {view.type !== '15-days' && (
                  <div className="mb-8 animate-fadeIn delay-100">
                    <LazySection>
                      <IslandPanel
                        traffic={modules?.showTraffic ? trafficData : null}
                        marine={modules?.showMarine ? marineData : null}
                        ski={modules?.showSki ? skiData : null}
                        agriculture={modules?.showAgri ? agricultureData : null}
                        altitude={altitudeData}
                        fireRisk={fireRiskData}
                        tourism={tourismData}
                        cityDisplay={fromSlug(currentCity)}
                        trafficCityDisplay={trafficCityDisplay}
                        marineCityDisplay={marineCityDisplay}
                        fallbackNarrative={generateWeatherCommentary(displayData, view.type === 'tomorrow' ? 'tomorrow' : 'today').answerBlock}
                        showNarration={true}
                      />
                    </LazySection>
                  </div>
                )}
                {/* Side-by-side: Lifestyle (left 50%) + Radar (right 50%) on desktop - HIDDEN in 15-days view */}
                {view.type !== '15-days' && (
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6">
                    <div className="w-full md:w-1/2">
                      <LifestyleRail data={displayData} />
                    </div>
                    <div className="w-full md:w-1/2">
                      <Suspense fallback={<div className="h-[300px] bg-white/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />}>
                        <RadarNews
                          articles={articles}
                          weatherData={displayData}
                          compact={true}
                        />
                      </Suspense>
                    </div>
                  </div>
                )}

                {/* Weather-Triggered Contextual Ad Unit */}
                <WeatherTriggeredAd weatherData={displayData} />

                {/* ForecastSection - Only show here for non-15-days views (already shown above for 15-days) */}
                {view.type !== '15-days' && (
                  <ForecastSection data={weatherData || displayData} focusTomorrow={view.type === 'tomorrow'} />
                )}

                {/* SEO FAQ Section - Shows for all views (with different focus) */}
                <SEOFAQSection cityName={currentCity} data={displayData} className="mb-8" />

                {/* Historical Chart (Hava Durumu Eğilimleri) - HIDDEN in 15-days view */}
                {view.type !== '15-days' && (
                  <Suspense fallback={<div className="h-[300px] bg-white/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />}>
                    <HistoricalChart weatherData={displayData} />
                  </Suspense>
                )}
                <LazySection
                  placeholder={<div className="min-h-[300px] animate-pulse bg-slate-100/50 dark:bg-slate-800/50 rounded-xl mt-6 mb-6" />}
                >
                  <Suspense fallback={<div className="min-h-[300px] animate-pulse bg-slate-100/50 dark:bg-slate-800/50 rounded-xl mt-6 mb-6" />}>
                    <NewsSection city={currentCity} />
                  </Suspense>
                </LazySection>
                {/* LAUNCH PHASE: AdGrid (İlginizi Çekebilir) disabled for first 12 weeks. Reactivate after mid-March 2025
                <LazySection>
                  <AdGrid />
                </LazySection>
                */}
              </div>
            )}

          </>
        );
      case 'location-search':
        return <LocationSearchPage />;
      case 'island-demo':
        return <IslandDemo />;
      case 'sea-temp':
        return <SeaTempPage onCityChange={handleCityChange} />;
      case 'cities': return <CityIndex onCityClick={(city) => { setCurrentCity(city); setView({ type: 'home' }); window.history.pushState({ city }, '', `/${toSlug(city)}`); window.scrollTo(0, 0); }} onBack={() => setView({ type: 'home' })} />;
      default: return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className={`w-full min-h-screen flex flex-col font-sans text-slate-800 dark:text-slate-200 dark:bg-slate-900 selection:bg-blue-200 selection:text-blue-900 transition-colors duration-500 ${isDarkMode ? 'dark' : ''}`}>
        {/* LAUNCH PHASE: TopBar disabled for first 6 weeks. Reactivate after mid-February 2025
        <TopBar tickers={marketData} currentTemp={weatherData?.currentTemp} onHomeClick={() => setView({ type: 'home' })} position="top" />
        */}
        <NetworkRibbon />

        {/* Main Grid Layout - Mobile First with max-w-7xl (1280px) */}
        <div className="flex-grow w-full max-w-7xl mx-auto px-4 py-4 md:py-8 flex flex-col lg:flex-row gap-6 md:gap-8">

          {/* Main Content Column - Full width on mobile, flex-1 on desktop */}
          <main className="flex-1 min-w-0 order-1">
            <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div></div>}>
              {renderView()}
            </Suspense>
          </main>

          {/* Right Sidebar (Desktop Only) - Non-sticky, scrolls with content */}
          <aside className="hidden lg:block w-72 flex-shrink-0 order-2">
            <DesktopSidebarRight
              articles={articles}
              city={currentCity}
            />
          </aside>

        </div>

        <Footer onNavigate={handleFooterNavigate} />
        <TopBar tickers={marketData} currentTemp={weatherData?.currentTemp} onHomeClick={() => setView({ type: 'home' })} position="bottom" />

        {/* SINAN UPGRADE: Mobile App Navigation Bar */}
        <MobileNav
          activeView={view.type === 'cities' ? 'home' : view.type}
          onToggleView={handleViewToggle}
          onSearchClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        {/* Bottom padding spacer for mobile nav bar */}
        <div className="h-20 md:hidden"></div>

        {/* Consent Banner Layer */}
        <CookieBanner />
      </div>
    </ErrorBoundary>
  );
};

export default App;
