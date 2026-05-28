
import React, { useEffect, useState, ErrorInfo, ReactNode, Suspense } from 'react';
import { getWeatherData, getWeatherDataByCoords, getMarketData, toSlug, fromSlug, fetchLiveArticles, trackEvent, getCityFromCoords, getTomorrowDashboardData, getWeekendDashboardData, initAnalytics, initAds, getUserPreferences, saveUserPreferences, getCityById } from './services/weatherService';
import { WeatherData, MarketTicker, NewsItem } from './types';
import TopBar from './components/TopBar';
import Navigation from './components/Navigation';
import HeroDashboard from './components/HeroDashboard';
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

const App: React.FC<AppProps> = ({ locationId = 0 }) => {

  // BULLETPROOF HYDRATION LOGIC
  const getInitialState = (): { city: string; view: ViewState['type']; parentCity?: string } => {

    // ⛔️ PRIORITY 1: Server Injection (The "Truth")
    // If PHP (Asset Loader) injected the data object, use it.
    if (typeof window !== 'undefined' && (window as any).INITIAL_WEATHER_DATA) {
      return {
        city: (window as any).INITIAL_WEATHER_DATA.city || 'İstanbul',
        view: (window as any).INITIAL_WEATHER_DATA.view || 'home'
      };
    }

    // ⚠️ PRIORITY 2: DOM Data Attributes (The "Bridge")
    // If Shortcode rendered the container with data attributes.
    if (typeof document !== 'undefined') {
      const root = document.getElementById('weather-app');
      if (root?.dataset.initialCity) {
        return {
          city: root.dataset.initialCity,
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
        return { city: 'İstanbul', view: 'sea-temp' };
      }

      if (path === '/15-gunluk' || path === '/15-gunluk/') {
        // Retrieve last city or default to Istanbul
        const prefs = getUserPreferences();
        const city = prefs.lastCity || 'İstanbul';
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

            return { city: fromSlug(rawSlug), view, ...parentParams };
          }
        }
      }
    }

    // 🏳️ PRIORITY 4: Server Context (WordPress locationId prop)
    if (locationId > 0) {
      return { city: getCityById(locationId), view: 'home' };
    }

    // 🏳️ PRIORITY 5: Client Side Persistence (localStorage)
    if (typeof window !== 'undefined') {
      const prefs = getUserPreferences();
      if (prefs.lastCity) {
        return { city: prefs.lastCity, view: 'home' };
      }
    }

    // 🏳️ FALLBACK: Default State
    return { city: 'İstanbul', view: 'home' };
  };

  // Initialize state from bulletproof hydration
  const initialState = getInitialState();
  const [currentCity, setCurrentCity] = useState<string>(initialState.city);
  const [parentCity, setParentCity] = useState<string | null>(initialState.parentCity || null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
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

  // DEBUG: Log mount state
  useEffect(() => {
    console.warn('🔴 [DEBUG-MOUNT] currentCity:', currentCity);
    console.warn('🔴 [DEBUG-MOUNT] URL path:', window.location.pathname);
    console.warn('🔴 [DEBUG-MOUNT] Expected city from slug:', fromSlug(window.location.pathname.split('/').pop() || ''));
  }, []);

  useEffect(() => {
    console.log('🔴 [STATE-CHANGE] currentCity is now:', currentCity);
  }, [currentCity]);

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
        const normalizedCity = currentCity.toLowerCase()
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
          setCurrentCity(localityName);
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
      setLoading(true);
      try {
        const wData = await getWeatherData(currentCity);

        // Only update state if this request is still relevant
        if (isMounted && !abortController.signal.aborted) {
          if (wData?.daily && wData?.hourly) {
            setWeatherData(wData);

            // SINAN FETCH ISLANDS
            const citySlug = toSlug(currentCity);

            // 1. Reset islands
            setMarineData(null);
            setTrafficData(null);
            setSkiData(null);
            setAgricultureData(null);
            setAltitudeData(null);
            setFireRiskData(null);
            setTourismData(null);

            // 2. Traffic (Metro or Hub) - Now covers 29 cities
            if (hasTrafficMonitoring(citySlug)) {
              fetchTrafficData(citySlug, TOMTOM_API_KEY).then(data => {
                if (isMounted) {
                  setTrafficData(data);
                  setTrafficCityDisplay(undefined); // Local
                }
              }).catch(err => console.error("Traffic Fetch Error", err));
            } else {
              // Check for Regional Hub Traffic
              const hub = findNearestHub(wData.coord?.lat || 0, wData.coord?.lon || 0, 'traffic');
              if (hub) {
                fetchTrafficData(hub.hub.id, TOMTOM_API_KEY).then(data => {
                  if (isMounted) {
                    setTrafficData(data);
                    setTrafficCityDisplay(`${hub.hub.name} Bölgesi`);
                  }
                }).catch(err => console.error("Regional Traffic Fetch Error", err));
              }
            }

            // 3. Marine (Coastal or Hub)
            if (isCoastalCity(citySlug)) {
              fetchMarineData(citySlug).then(data => {
                if (isMounted) {
                  setMarineData(data);
                  setMarineCityDisplay(undefined);
                }
              }).catch(err => console.error("Marine Fetch Error", err));
            } else {
              // Check for Regional Hub Marine
              const hub = findNearestHub(wData.coord?.lat || 0, wData.coord?.lon || 0, 'marine');
              if (hub) {
                fetchMarineData(hub.hub.id).then(data => {
                  if (isMounted) {
                    setMarineData(data);
                    setMarineCityDisplay(`${hub.hub.name} Bölgesi`);
                  }
                }).catch(err => console.error("Regional Marine Fetch Error", err));
              }
            }

            // 4. Ski (Mountain)
            if (hasSkiResort(citySlug)) {
              const skiCityKey = resolveSkiCityKey(citySlug);
              import('./services/weatherUnlockedSkiService').then(({ fetchWeatherUnlockedSki }) => {
                fetchWeatherUnlockedSki(skiCityKey).then(data => {
                  if (isMounted && data) setSkiData(data);
                }).catch(err => console.error("Ski Fetch Error", err));
              });
            }

            // 5-8. New Island Categories
            // Primary category determines the "main" extended island
            // Secondary categories are ALSO loaded if applicable
            const islandCategory = getIslandCategory(currentCity);
            const primaryCategory = islandCategory.primary;
            const secondaryCategory = islandCategory.secondary;

            // Determine if raining (for agriculture advice)
            const isRaining = (wData.rainVolume > 0) || (wData.hourly[0]?.precipitation || 0) > 0;

            // Load primary extended category
            if (primaryCategory === 'agriculture') {
              fetchAgricultureData(wData.coord?.lat || 39, wData.coord?.lon || 35, isRaining).then(data => {
                if (isMounted && data) setAgricultureData(data);
              }).catch(err => console.error("Agriculture Fetch Error", err));
            } else if (primaryCategory === 'altitude') {
              const elevation = getProvinceElevation(currentCity);
              const altData = calculateAltitudeData(
                elevation,
                wData.currentTemp,
                wData.feelsLike,
                wData.daily.map(d => d.low),
                wData.windSpeed,
                wData.hourly[0]?.precipitation || 0
              );
              if (isMounted) setAltitudeData(altData);
            } else if (primaryCategory === 'fireRisk') {
              if (shouldShowFireRisk()) {
                const precipSum = wData.daily.slice(0, 7).reduce((sum, d) => sum + (d.precipitationSum || 0), 0);
                const fireData = calculateFireRisk(
                  wData.humidity,
                  wData.windSpeed,
                  wData.currentTemp,
                  precipSum
                );
                if (isMounted) setFireRiskData(fireData);
              }
            }

            // ALSO load Agriculture if it's the secondary category (e.g., Konya, Ankara)
            if (secondaryCategory === 'agriculture' && primaryCategory !== 'agriculture') {
              fetchAgricultureData(wData.coord?.lat || 39, wData.coord?.lon || 35, isRaining).then(data => {
                if (isMounted && data) setAgricultureData(data);
              }).catch(err => console.error("Secondary Agriculture Fetch Error", err));
            }

            // ALWAYS load Tourism if city is a tourism hotspot (regardless of primary category)
            // This allows Istanbul, Antalya, Muğla etc. to show BOTH Traffic/Marine AND Tourism
            if (isTourismRegion(currentCity)) {
              const tourData = calculateTourismComfort(
                wData.currentTemp,
                wData.humidity,
                wData.hourly[0]?.uvIndex ?? 5,
                currentCity
              );
              if (isMounted) setTourismData(tourData);
            }
          } else {
            setWeatherData(null);
          }
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (isMounted) {
          console.error("Weather Fetch Failed", e);
          setWeatherData(null);
        }
      }
      if (isMounted) setLoading(false);
    };

    // Only fetch if we are in a main weather view
    if (view.type === 'home' || view.type === 'tomorrow' || view.type === '15-days') {
      fetchData();
    }

    // Cleanup: abort pending request and mark as unmounted
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [currentCity, view.type]);

  useEffect(() => {
    // Auto-Theme Logic (Only if user hasn't manually overridden via settings)
    // Auto-Theme Logic (Only if user hasn't manually overridden via settings)
    // SINAN FIX: Ensure we only switch theme if the data matches the CURRENT city (prevents stale data flash)
    if (weatherData && !isManualTheme && !loading && toSlug(weatherData.city) === toSlug(currentCity)) {
      if (weatherData.icon === 'moon' || weatherData.icon.includes('night') || weatherData.icon.includes('storm')) {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    }

    // SINAN STANDARD TITLE FORMAT - Must match PHP SEO Engine exactly
    if (!weatherData) return;

    const cityDisplay = fromSlug(toSlug(currentCity)); // Ensure Turkish chars (İstanbul not Istanbul)

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
    const prettyName = fromSlug(toSlug(newCity));
    setCurrentCity(prettyName);

    // Save to LocalStorage
    saveUserPreferences({ lastCity: prettyName });

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
      setCurrentCity(city);
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
              currentCity={currentCity}
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
                  ? `${currentCity} Yarınki Hava Durumu`
                  : view.type === '15-days'
                    ? `${currentCity} 15 Günlük Hava Durumu Tahmini`
                    : `${currentCity} Hava Durumu`
                }
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 md:text-right md:max-w-lg leading-snug">
                {view.type === 'tomorrow'
                  ? `${currentCity} için yarınki hava durumu tahmin raporu ve detaylı meteoroloji verileri.`
                  : view.type === '15-days'
                    ? `${currentCity} 15 günlük hava durumu trendi, sıcaklık değişimi ve yağış beklentisi.`
                    : `${currentCity} güncel hava durumu ve detaylı tahminler. Anlık sıcaklık ve rüzgar verileri.`
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
              <div className="flex items-center justify-center min-h-[50vh]"><div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div></div>
            ) : !displayData ? (
              /* SINAN FIX: Show Location Not Found error - matching LocationSearchPage style */
              <div className="flex items-center justify-center min-h-[50vh] px-4">
                <div className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 dark:border-slate-700 p-8 text-center">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon.MapPin className="w-10 h-10 text-red-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Konum Bulunamadı
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Aradığınız konum veritabanımızda bulunamadı.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Öneriler:</p>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      <li>• Şehir veya ilçe adını kontrol edin</li>
                      <li>• Türkçe karakterleri kullanmayı deneyin</li>
                      <li>• Daha genel bir konum adı deneyin</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.history.back()}
                      className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      ← Geri
                    </button>
                    <a
                      href="/"
                      className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors text-center"
                    >
                      Ana Sayfa
                    </a>
                  </div>
                </div>
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
                        traffic={trafficData}
                        marine={marineData}
                        ski={skiData}
                        agriculture={agricultureData}
                        altitude={altitudeData}
                        fireRisk={fireRiskData}
                        tourism={tourismData}
                        cityDisplay={currentCity}
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
      <div className="min-h-screen flex flex-col font-sans text-slate-800 dark:text-slate-200 selection:bg-blue-200 selection:text-blue-900 transition-colors duration-500">
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
