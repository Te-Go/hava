
import { WeatherData, MarketTicker, NewsItem, TedderConfig, LifestyleIndex, HourlyForecast, DailyForecast, UserPreferences, LegalContent, HistoricalData, HistoricalDayData, HistoricalAverage } from '../types';

// Export getConfig directly for runtime evaluation
// This allows WordPress to inject TedderConfig after module load
export const getConfig = (): TedderConfig => {
  if (typeof window !== 'undefined' && window.TedderConfig) {
    return window.TedderConfig;
  }
  return {
    isProduction: false,
    ads: { square: '', vertical: '', articleAd: '', adGrid: [] },
    logos: {}
  };
};

// Legacy alias for backwards compatibility - prefer getConfig() for runtime access
export const CONFIG = getConfig();

// SINAN: Decode WordPress HTML entities (e.g., &quot; → ")
const decodeHTMLEntities = (text: string): string => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

// Placeholder for Hub Logos
export const HUB_LOGOS = {
  GOLD: CONFIG.logos?.GOLD || '/logos/logo-altin.png',
  FX: CONFIG.logos?.FX || '/logos/logo-dolar.png',
  BOURSE: CONFIG.logos?.BOURSE || '/logos/logo-borsa.png',
  CRYPTO: CONFIG.logos?.CRYPTO || '/logos/logo-kripto.png',
  WEATHER: CONFIG.logos?.WEATHER || '/logos/hava-durumlari-logo.png'
};

// --- CITY ID MAPPING (SEO Context) ---
// This maps Server Location IDs to City Names
// In a real app, this might fetch from an API or use standard plate codes
export const CITY_ID_MAP: Record<number, string> = {
  1: 'Adana', 2: 'Adıyaman', 3: 'Afyonkarahisar', 4: 'Ağrı', 5: 'Amasya', 6: 'Ankara', 7: 'Antalya', 8: 'Artvin', 9: 'Aydın', 10: 'Balıkesir',
  11: 'Bilecik', 12: 'Bingöl', 13: 'Bitlis', 14: 'Bolu', 15: 'Burdur', 16: 'Bursa', 17: 'Çanakkale', 18: 'Çankırı', 19: 'Çorum', 20: 'Denizli',
  21: 'Diyarbakır', 22: 'Edirne', 23: 'Elazığ', 24: 'Erzincan', 25: 'Erzurum', 26: 'Eskişehir', 27: 'Gaziantep', 28: 'Giresun', 29: 'Gümüşhane', 30: 'Hakkari',
  31: 'Hatay', 32: 'Isparta', 33: 'Mersin', 34: 'İstanbul', 35: 'İzmir', 36: 'Kars', 37: 'Kastamonu', 38: 'Kayseri', 39: 'Kırklareli', 40: 'Kırşehir',
  41: 'Kocaeli', 42: 'Konya', 43: 'Kütahya', 44: 'Malatya', 45: 'Manisa', 46: 'Kahramanmaraş', 47: 'Mardin', 48: 'Muğla', 49: 'Muş', 50: 'Nevşehir',
  51: 'Niğde', 52: 'Ordu', 53: 'Rize', 54: 'Sakarya', 55: 'Samsun', 56: 'Siirt', 57: 'Sinop', 58: 'Sivas', 59: 'Tekirdağ', 60: 'Tokat',
  61: 'Trabzon', 62: 'Tunceli', 63: 'Şanlıurfa', 64: 'Uşak', 65: 'Van', 66: 'Yozgat', 67: 'Zonguldak', 68: 'Aksaray', 69: 'Bayburt', 70: 'Karaman',
  71: 'Kırıkkale', 72: 'Batman', 73: 'Şırnak', 74: 'Bartın', 75: 'Ardahan', 76: 'Iğdır', 77: 'Yalova', 78: 'Karabük', 79: 'Kilis', 80: 'Osmaniye', 81: 'Düzce',
  // Custom/District IDs (Mocking large numbers for districts)
  101: 'Çankaya', 102: 'Bağcılar', 103: 'Üsküdar', 104: 'Bahçelievler', 105: 'Ümraniye', 106: 'Esenler', 107: 'Gebze',
  // Seasonal
  201: 'Erciyes', 202: 'Uludağ', 203: 'Palandöken', 204: 'Saklıkent', 205: 'Davraz'
};

export const getCityById = (id: number): string => {
  return CITY_ID_MAP[id] || 'İstanbul'; // Default fallback
};

// --- USER PREFERENCE ENGINE ---
const PREF_KEY = 'tg_user_prefs';

export const getUserPreferences = (): UserPreferences => {
  if (typeof window === 'undefined') return { theme: 'system', lastCity: 'İstanbul', consentStatus: 'pending' };

  try {
    const saved = localStorage.getItem(PREF_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("LocalStorage access failed", e);
  }

  // Default State
  return { theme: 'system', lastCity: 'İstanbul', consentStatus: 'pending' };
};

export const saveUserPreferences = (updates: Partial<UserPreferences>) => {
  if (typeof window === 'undefined') return;
  const current = getUserPreferences();
  const updated = { ...current, ...updates };
  localStorage.setItem(PREF_KEY, JSON.stringify(updated));
};

// --- ANALYTICS ENGINE ---
export const trackEvent = (action: string, category: string, label: string) => {
  if (typeof window === 'undefined') return;

  // 1. Check Consent
  const prefs = getUserPreferences();
  if (prefs.consentStatus !== 'accepted') {
    if (CONFIG.isProduction) return; // Block tracking in prod if no consent
    // console.debug(`[Analytics Blocked] ${action} - ${category}`);
    return;
  }

  // 2. Fire GA4
  if (window.gtag && CONFIG.analyticsId) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }

  // 3. Dev Logger
  if (!CONFIG.isProduction) {
    console.log(`📊 Track: [${category}] ${action} -> ${label}`);
  }
};

// --- CONSENT GATE: DYNAMIC SCRIPT INJECTION ---
export const initAnalytics = () => {
  if (!CONFIG.analyticsId) return;
  if (document.getElementById('ga4-script')) return;

  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.analyticsId}`;
  document.head.appendChild(script);

  const inlineScript = document.createElement('script');
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${CONFIG.analyticsId}', { 'anonymize_ip': true });
  `;
  document.head.appendChild(inlineScript);
  console.log("Analytics Initialized");
};

export const initAds = () => {
  if (document.getElementById('adsense-script')) return;

  const script = document.createElement('script');
  script.id = 'adsense-script';
  script.async = true;
  // Replace with your actual AdSense Client ID via Config in Production
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
  console.log("Ads Initialized");
};

// --- UTILITIES ---
// SECURITY: Input validation added for URL slug parsing
const MAX_SLUG_LENGTH = 100;

export const toSlug = (text: string): string => {
  // Security: Validate input
  if (!text || typeof text !== 'string') return '';

  // Security: Limit length to prevent buffer/memory issues
  const sanitized = text.slice(0, MAX_SLUG_LENGTH);
  const lower = sanitized.toLowerCase().trim();

  // Turkish character mapping to ASCII
  const map: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o'
  };
  return lower.replace(/[çğşüıöÇĞŞÜİÖ]/g, (char) => map[char] || char).replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
};

export const fromSlug = (slug: string): string => {
  // Security: Validate input
  if (!slug || typeof slug !== 'string') return 'İstanbul';

  // Security: Limit length and strip dangerous characters
  const sanitized = slug.slice(0, MAX_SLUG_LENGTH).replace(/[^a-z0-9-]/gi, '').toLowerCase();

  // Comprehensive Turkish City Name Mappings (All 81 Provinces + Popular Districts)
  const TURKISH_NAMES: Record<string, string> = {
    // === PROVINCES (81 İL) ===
    // Marmara
    'istanbul': 'İstanbul',
    'bursa': 'Bursa',
    'kocaeli': 'Kocaeli',
    'sakarya': 'Sakarya',
    'tekirdag': 'Tekirdağ',
    'balikesir': 'Balıkesir',
    'edirne': 'Edirne',
    'kirklareli': 'Kırklareli',
    'canakkale': 'Çanakkale',
    'yalova': 'Yalova',
    'bilecik': 'Bilecik',
    // İç Anadolu
    'ankara': 'Ankara',
    'konya': 'Konya',
    'kayseri': 'Kayseri',
    'eskisehir': 'Eskişehir',
    'sivas': 'Sivas',
    'aksaray': 'Aksaray',
    'nevsehir': 'Nevşehir',
    'nigde': 'Niğde',
    'kirsehir': 'Kırşehir',
    'kirikkale': 'Kırıkkale',
    'yozgat': 'Yozgat',
    'karaman': 'Karaman',
    'cankiri': 'Çankırı',
    // Ege
    'izmir': 'İzmir',
    'denizli': 'Denizli',
    'aydin': 'Aydın',
    'mugla': 'Muğla',
    'manisa': 'Manisa',
    'afyonkarahisar': 'Afyonkarahisar',
    'kutahya': 'Kütahya',
    'usak': 'Uşak',
    // Akdeniz
    'antalya': 'Antalya',
    'adana': 'Adana',
    'mersin': 'Mersin',
    'hatay': 'Hatay',
    'kahramanmaras': 'Kahramanmaraş',
    'osmaniye': 'Osmaniye',
    'isparta': 'Isparta',
    'burdur': 'Burdur',
    // Karadeniz
    'samsun': 'Samsun',
    'trabzon': 'Trabzon',
    'ordu': 'Ordu',
    'giresun': 'Giresun',
    'rize': 'Rize',
    'artvin': 'Artvin',
    'zonguldak': 'Zonguldak',
    'kastamonu': 'Kastamonu',
    'sinop': 'Sinop',
    'amasya': 'Amasya',
    'tokat': 'Tokat',
    'corum': 'Çorum',
    'bolu': 'Bolu',
    'duzce': 'Düzce',
    'karabuk': 'Karabük',
    'bartin': 'Bartın',
    'bayburt': 'Bayburt',
    'gumushane': 'Gümüşhane',
    // Doğu Anadolu
    'erzurum': 'Erzurum',
    'malatya': 'Malatya',
    'elazig': 'Elazığ',
    'van': 'Van',
    'agri': 'Ağrı',
    'erzincan': 'Erzincan',
    'kars': 'Kars',
    'igdir': 'Iğdır',
    'ardahan': 'Ardahan',
    'mus': 'Muş',
    'bitlis': 'Bitlis',
    'hakkari': 'Hakkari',
    'bingol': 'Bingöl',
    'tunceli': 'Tunceli',
    // Güneydoğu Anadolu
    'gaziantep': 'Gaziantep',
    'diyarbakir': 'Diyarbakır',
    'sanliurfa': 'Şanlıurfa',
    'mardin': 'Mardin',
    'batman': 'Batman',
    'siirt': 'Siirt',
    'sirnak': 'Şırnak',
    'adiyaman': 'Adıyaman',
    'kilis': 'Kilis',

    // === POPULAR DISTRICTS (İLÇELER) ===
    // İstanbul Districts (39 ilçe)
    'kadikoy': 'Kadıköy',
    'besiktas': 'Beşiktaş',
    'sisli': 'Şişli',
    'uskudar': 'Üsküdar',
    'bakirkoy': 'Bakırköy',
    'fatih': 'Fatih',
    'beyoglu': 'Beyoğlu',
    'sariyer': 'Sarıyer',
    'maltepe': 'Maltepe',
    'kartal': 'Kartal',
    'pendik': 'Pendik',
    'beylikduzu': 'Beylikdüzü',
    'avcilar': 'Avcılar',
    'esenyurt': 'Esenyurt',
    'basaksehir': 'Başakşehir',
    'bagcilar': 'Bağcılar',
    'bahcelievler': 'Bahçelievler',
    'umraniye': 'Ümraniye',
    'esenler': 'Esenler',
    'zeytinburnu': 'Zeytinburnu',
    'gungoren': 'Güngören',
    'buyukcekmece': 'Büyükçekmece',
    'kucukcekmece': 'Küçükçekmece',
    'sultangazi': 'Sultangazi',
    'sancaktepe': 'Sancaktepe',
    'atasehir': 'Ataşehir',
    'tuzla': 'Tuzla',
    'sultanbeyli': 'Sultanbeyli',
    'kagithane': 'Kağıthane',
    'eyupsultan': 'Eyüpsultan',
    'arnavutkoy': 'Arnavutköy',
    'cekmekoy': 'Çekmeköy',
    'beykoz': 'Beykoz',
    'silivri': 'Silivri',
    'catalca': 'Çatalca',
    'adalar': 'Adalar',
    // Ankara Districts
    'cankaya': 'Çankaya',
    'kecioren': 'Keçiören',
    'yenimahalle': 'Yenimahalle',
    'mamak': 'Mamak',
    'etimesgut': 'Etimesgut',
    'sincan': 'Sincan',
    'altindag': 'Altındağ',
    'pursaklar': 'Pursaklar',
    'golbasi': 'Gölbaşı',
    'polatli': 'Polatlı',
    'beypazari': 'Beypazarı',
    'cubuk': 'Çubuk',
    'haymana': 'Haymana',
    // İzmir Districts
    'buca': 'Buca',
    'karsiyaka': 'Karşıyaka',
    'bornova': 'Bornova',
    'konak': 'Konak',
    'karabaglar': 'Karabağlar',
    'bayrakli': 'Bayraklı',
    'cigli': 'Çiğli',
    'menemen': 'Menemen',
    'torbali': 'Torbalı',
    'odemis': 'Ödemiş',
    'bergama': 'Bergama',
    'tire': 'Tire',
    'seferihisar': 'Seferihisar',
    'urla': 'Urla',
    'cesme': 'Çeşme',
    'alacati': 'Alaçatı',
    // Antalya Districts
    'muratpasa': 'Muratpaşa',
    'kepez': 'Kepez',
    'konyaalti': 'Konyaaltı',
    'alanya': 'Alanya',
    'manavgat': 'Manavgat',
    'serik': 'Serik',
    'kemer': 'Kemer',
    'kas': 'Kaş',
    'side': 'Side',
    'belek': 'Belek',
    'akseki': 'Akseki',
    'elmali': 'Elmalı',
    'finike': 'Finike',
    'gazipasa': 'Gazipaşa',
    'kumluca': 'Kumluca',
    // Bursa Districts
    'osmangazi': 'Osmangazi',
    'yildirim': 'Yıldırım',
    'nilufer': 'Nilüfer',
    'inegol': 'İnegöl',
    'gemlik': 'Gemlik',
    'mudanya': 'Mudanya',
    'gursu': 'Gürsu',
    'kestel': 'Kestel',
    'orhangazi': 'Orhangazi',
    'iznik': 'İznik',
    'karacabey': 'Karacabey',
    'mustafakemalpasa': 'Mustafakemalpaşa',
    // Kocaeli Districts  
    'izmit': 'İzmit',
    'gebze': 'Gebze',
    'darica': 'Darıca',
    'korfez': 'Körfez',
    'derince': 'Derince',
    'golcuk': 'Gölcük',
    'kartepe': 'Kartepe',
    'dilovasi': 'Dilovası',
    'cayirova': 'Çayırova',
    'basiskele': 'Başiskele',
    'kandira': 'Kandıra',
    // Adana Districts
    'seyhan': 'Seyhan',
    'yuregir': 'Yüreğir',
    'cukurova': 'Çukurova',
    'saricam': 'Sarıçam',
    'ceyhan': 'Ceyhan',
    'kozan': 'Kozan',
    'imamoglu': 'İmamoğlu',
    'karatas': 'Karataş',
    'pozanti': 'Pozantı',
    'tufanbeyli': 'Tufanbeyli',
    // Mersin Districts
    'akdeniz': 'Akdeniz',
    'mezitli': 'Mezitli',
    'yenisehir': 'Yenişehir',
    'toroslar': 'Toroslar',
    'tarsus': 'Tarsus',
    'erdemli': 'Erdemli',
    'silifke': 'Silifke',
    'anamur': 'Anamur',
    'mut': 'Mut',
    'gulnar': 'Gülnar',
    // Gaziantep Districts
    'sehitkamil': 'Şehitkamil',
    'sahinbey': 'Şahinbey',
    'nizip': 'Nizip',
    'islahiye': 'İslahiye',
    'nurdagi': 'Nurdağı',
    'oguzeli': 'Oğuzeli',
    'araban': 'Araban',
    // Konya Districts
    'selcuklu': 'Selçuklu',
    'meram': 'Meram',
    'karatay': 'Karatay',
    'eregli': 'Ereğli',
    'aksehir': 'Akşehir',
    'beysehir': 'Beyşehir',
    'seydisehir': 'Seydişehir',
    'cihanbeyli': 'Cihanbeyli',
    'kulu': 'Kulu',
    // Şanlıurfa Districts
    'eyyubiye': 'Eyyübiye',
    'haliliye': 'Haliliye',
    'karakopru': 'Karaköprü',
    'siverek': 'Siverek',
    'viransehir': 'Viranşehir',
    'akcakale': 'Akçakale',
    'birecik': 'Birecik',
    'suruc': 'Suruç',
    'harran': 'Harran',
    'hilvan': 'Hilvan',
    // Diyarbakır Districts
    'baglar': 'Bağlar',
    'kayapinar': 'Kayapınar',
    'sur': 'Sur',
    'bismil': 'Bismil',
    'ergani': 'Ergani',
    'silvan': 'Silvan',
    'cermik': 'Çermik',
    'dicle': 'Dicle',
    'lice': 'Lice',
    'hazro': 'Hazro',
    // Hatay Districts
    'antakya': 'Antakya',
    'iskenderun': 'İskenderun',
    'defne': 'Defne',
    'samandag': 'Samandağ',
    'dortyol': 'Dörtyol',
    'kirikhan': 'Kırıkhan',
    'reyhanli': 'Reyhanlı',
    'arsuz': 'Arsuz',
    'belen': 'Belen',
    // Kahramanmaraş Districts
    'dulkadiroglu': 'Dulkadiroğlu',
    'onikisbat': 'Onikişubat',
    'elbistan': 'Elbistan',
    'afsin': 'Afşin',
    'turkoglu': 'Türkoğlu',
    'goksun': 'Göksun',
    'pazarcik': 'Pazarcık',
    // Van Districts
    'ipekyolu': 'İpekyolu',
    'tusba': 'Tuşba',
    'edremit': 'Edremit',
    'ercis': 'Erciş',
    'ozalp': 'Özalp',
    'caldiran': 'Çaldıran',
    'gevas': 'Gevaş',
    'baskale': 'Başkale',
    'muradiye': 'Muradiye',
    // Sakarya Districts
    'adapazari': 'Adapazarı',
    'serdivan': 'Serdivan',
    'erenler': 'Erenler',
    'arifiye': 'Arifiye',
    'hendek': 'Hendek',
    'akyazi': 'Akyazı',
    'karasu': 'Karasu',
    'sapanca': 'Sapanca',
    // Tekirdağ Districts
    'corlu': 'Çorlu',
    'suleymanpasa': 'Süleymanpaşa',
    'cerkezkoy': 'Çerkezköy',
    'ergene': 'Ergene',
    'kapakli': 'Kapaklı',
    'malkara': 'Malkara',
    'hayrabolu': 'Hayrabolu',
    'muratli': 'Muratlı',
    'saray': 'Saray',
    // Balıkesir Districts
    'altieylul': 'Altıeylül',
    'karesi': 'Karesi',
    'bandirma': 'Bandırma',
    'gonen': 'Gönen',
    'ayvalik': 'Ayvalık',
    'burhaniye': 'Burhaniye',
    'susurluk': 'Susurluk',
    // Manisa Districts
    'sehzadeler': 'Şehzadeler',
    'yunusemre': 'Yunusemre',
    'turgutlu': 'Turgutlu',
    'akhisar': 'Akhisar',
    'salihli': 'Salihli',
    'soma': 'Soma',
    'alasehir': 'Alaşehir',
    'saruhanli': 'Saruhanlı',
    // Aydın Districts
    'efeler': 'Efeler',
    'nazilli': 'Nazilli',
    'soke': 'Söke',
    'kusadasi': 'Kuşadası',
    'didim': 'Didim',
    'cine': 'Çine',
    'germencik': 'Germencik',
    'incirliova': 'İncirliova',
    // Muğla Districts
    'mentese': 'Menteşe',
    'bodrum': 'Bodrum',
    'fethiye': 'Fethiye',
    'marmaris': 'Marmaris',
    'milas': 'Milas',
    'dalaman': 'Dalaman',
    'datca': 'Datça',
    'koycegiz': 'Köyceğiz',
    'ortaca': 'Ortaca',
    'yatagan': 'Yatağan',
    // Denizli Districts
    'merkezefendi': 'Merkezefendi',
    'pamukkale': 'Pamukkale',
    'civril': 'Çivril',
    'acipayam': 'Acıpayam',
    'tavas': 'Tavas',
    'honaz': 'Honaz',
    'saraykoy': 'Sarayköy',
    // Samsun Districts
    'ilkadim': 'İlkadım',
    'atakum': 'Atakum',
    'canik': 'Canik',
    'bafra': 'Bafra',
    'carsamba': 'Çarşamba',
    'terme': 'Terme',
    'vezirkopru': 'Vezirköprü',
    'havza': 'Havza',
    // Trabzon Districts
    'ortahisar': 'Ortahisar',
    'akcaabat': 'Akçaabat',
    'yomra': 'Yomra',
    'arsin': 'Arsin',
    'of': 'Of',
    'arakli': 'Araklı',
    'surmene': 'Sürmene',
    'vakfikebir': 'Vakfıkebir',
    'macka': 'Maçka',
    // Kayseri Districts
    'melikgazi': 'Melikgazi',
    'kocasinan': 'Kocasinan',
    'talas': 'Talas',
    'develi': 'Develi',
    'incesu': 'İncesu',
    'yahyali': 'Yahyalı',
    'bunyan': 'Bünyan',
    'yesilhisar': 'Yeşilhisar',
    // Eskişehir Districts
    'odunpazari': 'Odunpazarı',
    'tepebasi': 'Tepebaşı',
    'sivrihisar': 'Sivrihisar',
    'cifteler': 'Çifteler',
    'mahmudiye': 'Mahmudiye',
    'mihaliccik': 'Mihalıççık',
    // Malatya Districts
    'battalgazi': 'Battalgazi',
    'yesilyurt': 'Yeşilyurt',
    'dogansehir': 'Doğanşehir',
    'akcadag': 'Akçadağ',
    'darende': 'Darende',
    'hekimhan': 'Hekimhan',
    'arguvan': 'Arguvan',
    // Erzurum Districts
    'yakutiye': 'Yakutiye',
    'aziziye': 'Aziziye',
    'horasan': 'Horasan',
    'pasinler': 'Pasinler',
    'oltu': 'Oltu',
    'ispir': 'İspir',
    'tortum': 'Tortum',
    'askale': 'Aşkale',
    // Mardin Districts
    'artuklu': 'Artuklu',
    'kiziltepe': 'Kızıltepe',
    'nusaybin': 'Nusaybin',
    'midyat': 'Midyat',
    'derik': 'Derik',
    'mazidagi': 'Mazıdağı',
    'savur': 'Savur',
    'dargecit': 'Dargeçit',
    // Batman Districts
    'kozluk': 'Kozluk',
    'sason': 'Sason',
    'besiri': 'Beşiri',
    'gercus': 'Gercüş',
    'hasankeyf': 'Hasankeyf',
    // Seasonal Spots
    'uludag': 'Uludağ',
    'erciyes': 'Erciyes',
    'palandoken': 'Palandöken',
    'saklikent': 'Saklıkent',
    'davraz': 'Davraz',
    'kartalkaya': 'Kartalkaya',
    'ilgaz': 'Ilgaz',
    // Tourist/Coastal spots
    'urgup': 'Ürgüp',
    'goreme': 'Göreme',
    'cappadocia': 'Kapadokya',
    'avanos': 'Avanos',
    'derinkuyu': 'Derinkuyu',
    // Nevşehir Districts
    'kozakli': 'Kozaklı',
    'gulsehir': 'Gülşehir',
    'hacibektas': 'Hacıbektaş',
  };

  // Check for compound district slugs (e.g., istanbul-kadikoy)
  if (sanitized.includes('-')) {
    const parts = sanitized.split('-');
    // If it's a district URL like "istanbul-kadikoy", return just the district name
    if (parts.length === 2 && TURKISH_NAMES[parts[1]]) {
      return TURKISH_NAMES[parts[1]];
    }
    // Handle parent-child format for breadcrumbs
    if (parts.length === 2 && TURKISH_NAMES[parts[0]] && TURKISH_NAMES[parts[1]]) {
      return TURKISH_NAMES[parts[1]];
    }
  }

  // Direct lookup
  if (TURKISH_NAMES[sanitized]) {
    return TURKISH_NAMES[sanitized];
  }

  // Fallback: Generic unslugify (Title Case) - for unknown locations
  return sanitized.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// --- GEOCODING FALLBACK ---
const fetchGeocoding = async (city: string) => {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=tr&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: data.results[0].name
      };
    }
  } catch (e) { console.error(e); }
  return null;
};

// --- GEOCODING SEARCH (Multiple Results for Disambiguation) ---
export interface GeoSearchResult {
  name: string;
  admin1: string; // Province/region
  lat: number;
  lon: number;
  country: string;
}

export const searchLocations = async (query: string): Promise<GeoSearchResult[]> => {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=tr&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      // Filter to Turkey only for this app
      return data.results
        .filter((r: { country_code: string }) => r.country_code === 'TR')
        .map((r: { name: string; admin1?: string; latitude: number; longitude: number; country: string }) => ({
          name: r.name,
          admin1: r.admin1 || '',
          lat: r.latitude,
          lon: r.longitude,
          country: r.country
        }));
    }
  } catch (e) { console.error('Geocoding search error:', e); }
  return [];
};

// --- REVERSE GEOCODING (Enhanced with fallbacks) ---
// Returns the best available locality name for given coordinates
export const getCityFromCoords = async (lat: number, lon: number): Promise<string> => {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=tr`);
    const data = await res.json();

    // Cascading fallback chain for best locality name
    // Priority: locality (most specific) → city → principalSubdivision (province)
    const localityName = data.locality
      || data.city
      || data.principalSubdivision
      || null;

    if (localityName) {
      return localityName;
    }

    // If BigDataCloud fails, try Open-Meteo geocoding as secondary fallback
    const geoData = await fetchGeocoding(`${lat},${lon}`);
    if (geoData?.name) {
      return geoData.name;
    }
  } catch (e) {
    console.warn("Reverse geocoding failed", e);
  }

  // Last resort: Return coordinate display
  return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
};

// --- COORDINATE-BASED WEATHER FETCHING ---
// Fetches weather directly by coordinates (most accurate)
// displayCity is used for the WeatherData.city field for display purposes
import { fetchWithCache } from './cacheService';

export const getWeatherDataByCoords = async (
  lat: number,
  lon: number,
  displayCity: string
): Promise<WeatherData> => {
  // Security: Validate coordinate bounds
  const isValidLat = typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
  const isValidLon = typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;

  if (!isValidLat || !isValidLon) {
    console.warn(`Invalid coordinates: lat=${lat}, lon=${lon}. Using fallback.`);
    return getMockWeatherData(displayCity || 'İstanbul');
  }

  // Use Cache Wrapper: 60 Minutes TTL (Standard Weather Update Cycle)
  // Round coords to 4 decimals for cache sharing sensitivity (~11m)
  const cacheKey = `weather_v3_${lat.toFixed(4)}_${lon.toFixed(4)}`;

  return fetchWithCache(
    cacheKey,
    async () => {
      try {
        // Use coordinates directly - no geocoding needed
        // UPDATED: forecast_hours=360 to cover full 15 days of hourly data (15 * 24 = 360) for Accordion
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover,visibility&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,is_day,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,apparent_temperature_max,uv_index_max&forecast_days=15&forecast_hours=360&timezone=auto`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Open-Meteo API Failed');
        const data = await response.json();

        return mapOpenMeteoToModel(displayCity, data);
      } catch (e) {
        console.warn("Coordinate weather fetch failed, using mock data", e);
        return getMockWeatherData(displayCity);
      }
    },
    60 // 1 Hour TTL
  );
};


// --- LIFESTYLE LOGIC ---
const generateSmartPhrase = (temp: number, conditionCode: number, wind: number, uv: number): string => {
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(conditionCode)) return 'Şemsiyenizi mutlaka yanınıza alın, yağış bekleniyor.';
  if ([71, 73, 75, 77, 85, 86].includes(conditionCode)) return 'Kar yağışı etkili olabilir, yollarda dikkatli olun.';
  if (wind > 30) return 'Rüzgar sert esiyor, çatı uçmalarına karşı dikkatli olun.';
  if (temp > 30) return 'Sıcaklık yüksek. Bol sıvı tüketin ve güneşten korunun.';
  if (uv > 6) return 'UV indeksi yüksek. Dışarı çıkarken güneş kremi sürün.';
  if (temp < 5) return 'Hava oldukça soğuk. Atkı ve eldiven takmayı unutmayın.';
  if (temp < 15) return 'Hava serin, üzerinize kalın bir şeyler giyin.';
  return 'Hava koşulları gayet güzel, günün tadını çıkarın.';
};

export const calculateLifestyleIndexes = (data: WeatherData): LifestyleIndex[] => {
  if (!data) return [];
  const indexes: LifestyleIndex[] = [];
  const pressure = data.pressure ?? 1013;
  const temp = data.currentTemp ?? 20;
  const wind = data.windSpeed ?? 0;
  const humidity = data.humidity ?? 50;
  const uv = data.uvIndex ?? 0;
  const aqi = data.aqi ?? 40;

  const rainProbCurrent = data.rainProb || 0;
  const rainProbMaxToday = data.daily && data.daily[0] ? data.daily[0].rainProb : rainProbCurrent;
  let rainProbTomorrow = 0;
  if (data.daily && data.daily[1]) { rainProbTomorrow = data.daily[1].rainProb; }

  // --- ROW 1: Health & Activity ---

  // 1. Koşu İndeksi (Running) - NEW
  let runStatus: 'good' | 'moderate' | 'bad' = 'good';
  let runLabel = 'İdeal';
  if (aqi > 100 || temp < 5 || temp > 35 || rainProbCurrent > 50) { runStatus = 'bad'; runLabel = 'Uygun Değil'; }
  else if (aqi > 50 || temp > 30 || wind > 25 || humidity > 80) { runStatus = 'moderate'; runLabel = 'Dikkatli Ol'; }
  indexes.push({ id: 'run', name: 'Koşu', status: runStatus, label: runLabel, icon: 'Footprints' });

  // 2. Çocuk Alanı (Kids Outdoor) - NEW
  let kidsStatus: 'good' | 'moderate' | 'bad' = 'good';
  let kidsLabel = 'Güvenli';
  if (aqi > 100 || uv > 8 || temp < 5 || temp > 35 || rainProbCurrent > 40) { kidsStatus = 'bad'; kidsLabel = 'İçeride Kalın'; }
  else if (aqi > 50 || uv > 6 || temp > 30) { kidsStatus = 'moderate'; kidsLabel = 'Dikkat'; }
  indexes.push({ id: 'kids', name: 'Çocuk Alanı', status: kidsStatus, label: kidsLabel, icon: 'Baby' });

  // 3. Polen/Alerji (Allergy) - NEW
  // Higher humidity + low wind = higher pollen concentration
  let allergyStatus: 'good' | 'moderate' | 'bad' = 'good';
  let allergyLabel = 'Düşük Risk';
  if ((humidity > 70 && wind < 10 && temp > 15 && temp < 30) || aqi > 100) {
    allergyStatus = 'bad'; allergyLabel = 'Yüksek Risk';
  } else if (humidity > 50 && temp > 10 && temp < 28) {
    allergyStatus = 'moderate'; allergyLabel = 'Orta Risk';
  }
  indexes.push({ id: 'allergy', name: 'Alerji', status: allergyStatus, label: allergyLabel, icon: 'Heart' });

  // --- ROW 2: Lifestyle & Niche ---

  // 4. Hassas Gruplar (Sensitive Groups) - NEW
  let sensitiveStatus: 'good' | 'moderate' | 'bad' = 'good';
  let sensitiveLabel = 'Normal';
  if (aqi > 100 || (humidity > 80 && temp > 30)) { sensitiveStatus = 'bad'; sensitiveLabel = 'Dikkat'; }
  else if (aqi > 50 || pressure < 1005 || temp < 5 || temp > 32) { sensitiveStatus = 'moderate'; sensitiveLabel = 'Tedbirli'; }
  indexes.push({ id: 'sensitive', name: 'Hassas Grup', status: sensitiveStatus, label: sensitiveLabel, icon: 'Shield' });

  // 5. Mangal (BBQ) - KEEP (Popular in Turkey)
  let bbqStatus: 'good' | 'moderate' | 'bad' = 'good';
  let bbqLabel = 'Ateşi Yak';
  if (rainProbMaxToday > 30 || wind > 25) { bbqStatus = 'bad'; bbqLabel = 'Uygun Değil'; }
  else if (temp < 15 || wind > 15) { bbqStatus = 'moderate'; bbqLabel = 'Biraz Serin'; }
  indexes.push({ id: 'bbq', name: 'Mangal', status: bbqStatus, label: bbqLabel, icon: 'Flame' });

  // 6. Balıkçılık (Fishing) - KEEP
  let fishStatus: 'good' | 'moderate' | 'bad' = 'good';
  let fishLabel = 'Verimli';
  if (wind > 25 || pressure < 1005) { fishStatus = 'bad'; fishLabel = 'Fırtına Riski'; }
  else if (pressure > 1025 || pressure < 1010) { fishStatus = 'moderate'; fishLabel = 'Durgun'; }
  indexes.push({ id: 'fish', name: 'Balıkçılık', status: fishStatus, label: fishLabel, icon: 'Fish' });

  // --- ROW 3: Practical ---

  // 7. Araç Yıkama (Car Wash) - KEEP
  let carStatus: 'good' | 'moderate' | 'bad' = 'good';
  let carLabel = 'Bu Hafta';
  if (rainProbMaxToday > 40 || rainProbTomorrow > 50) { carStatus = 'bad'; carLabel = 'Bekleyin'; }
  else if (rainProbMaxToday > 20 || rainProbTomorrow > 30) { carStatus = 'moderate'; carLabel = 'Riskli'; }
  indexes.push({ id: 'car', name: 'Araç Yıkama', status: carStatus, label: carLabel, icon: 'Car' });

  // 8. Bahçe (Garden) - KEEP
  let gardenStatus: 'good' | 'moderate' | 'bad' = 'good';
  let gardenLabel = 'Sulayın';
  if (data.rainVolume > 2 || rainProbTomorrow > 60) { gardenStatus = 'bad'; gardenLabel = 'Gerek Yok'; }
  else if (temp > 30 && uv > 7) { gardenStatus = 'moderate'; gardenLabel = 'Akşam Sula'; }
  indexes.push({ id: 'garden', name: 'Bahçe', status: gardenStatus, label: gardenLabel, icon: 'Sprout' });

  // 9. Bisiklet (Cycling) - KEEP
  let bikeStatus: 'good' | 'moderate' | 'bad' = 'good';
  let bikeLabel = 'Pedalla';
  if (rainProbCurrent > 40 || wind > 30 || temp < 5) { bikeStatus = 'bad'; bikeLabel = 'Çıkma'; }
  else if (wind > 20 || temp > 32) { bikeStatus = 'moderate'; bikeLabel = 'Zorlu'; }
  indexes.push({ id: 'bike', name: 'Bisiklet', status: bikeStatus, label: bikeLabel, icon: 'Bike' });

  return indexes;
};

// --- OPENAQ AIR QUALITY API ---
// Free API for real AQI data by coordinates
// Docs: https://docs.openaq.org/

interface OpenAQMeasurement {
  parameter: string;
  value: number;
  unit: string;
}

const fetchAirQuality = async (lat: number, lon: number): Promise<number> => {
  // Use Cache Wrapper: 60 Minutes TTL
  const cacheKey = `aqi_v1_${lat.toFixed(4)}_${lon.toFixed(4)}`;

  return fetchWithCache(
    cacheKey,
    async () => {
      try {
        // OpenAQ v2 API - find nearest measurements
        const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=25000&limit=1`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('OpenAQ request failed');

        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const measurements = data.results[0].measurements as OpenAQMeasurement[];

          // Look for PM2.5 or PM10 (common AQI indicators)
          const pm25 = measurements.find(m => m.parameter === 'pm25');
          const pm10 = measurements.find(m => m.parameter === 'pm10');

          // Convert PM2.5 to simplified AQI (0-100+ scale)
          // EPA breakpoints: 0-12 = Good, 12-35 = Moderate, 35-55 = Unhealthy for Sensitive
          if (pm25) {
            const value = pm25.value;
            if (value <= 12) return Math.round(value * 4); // 0-48 (Good)
            if (value <= 35) return Math.round(50 + (value - 12) * 2); // 50-96 (Moderate)
            if (value <= 55) return Math.round(100 + (value - 35)); // 100-120 (Unhealthy for Sensitive)
            return Math.min(Math.round(value * 2), 300); // Scale up for worse conditions
          }

          // Fallback to PM10 if PM2.5 not available
          if (pm10) {
            return Math.min(Math.round(pm10.value / 2), 200);
          }
        }

        return 40; // Default fallback
      } catch (e) {
        console.warn('OpenAQ fetch failed, using default AQI:', e);
        return 40; // Fallback to moderate value
      }
    },
    60 // 1 Hour TTL
  );
};

// --- DATA FETCHING (OPEN-METEO) ---

const WMO_TRANSLATION: Record<number, string> = {
  0: 'Açık', 1: 'Çoğunlukla Açık', 2: 'Parçalı Bulutlu', 3: 'Kapalı',
  45: 'Sisli', 48: 'Kırağı ve Sis',
  51: 'Hafif Çiseleme', 53: 'Çiseleme', 55: 'Yoğun Çiseleme',
  56: 'Hafif Dondurucu Çiseleme', 57: 'Yoğun Dondurucu Çiseleme',
  61: 'Hafif Yağmur', 63: 'Yağmurlu', 65: 'Şiddetli Yağmur',
  66: 'Hafif Dondurucu Yağmur', 67: 'Yoğun Dondurucu Yağmur',
  71: 'Hafif Kar', 73: 'Kar Yağışlı', 75: 'Yoğun Kar',
  77: 'Kar Taneleri', // Sleet/Snow grains
  80: 'Sağanak', 81: 'Şiddetli Sağanak', 82: 'Aşırı Sağanak',
  85: 'Hafif Kar Sağanağı', 86: 'Yoğun Kar Sağanağı',
  95: 'Fırtına', 96: 'Dolu Fırtınası', 99: 'Şiddetli Dolu'
};

// Helper: Reverse-lookup WMO code from condition text (for smartPhrase generation)
const getWMOCodeFromCondition = (condition: string): number => {
  const entry = Object.entries(WMO_TRANSLATION).find(([_, text]) => text === condition);
  return entry ? parseInt(entry[0], 10) : 0;
};

const getWeatherIcon = (code: number, isDay: boolean, precipProb: number = 0): string => {
  // 1. Extreme & Frozen (Keep as is)
  if ([95, 96, 99].includes(code)) return 'storm';
  if ([71, 73, 75, 85, 86, 77].includes(code)) return 'snow';
  if ([56, 57, 66, 67].includes(code)) return 'freezing-rain';
  if (code === 45 || code === 48) return 'fog';

  // 2. SINAN REFINEMENT: Smart Rain Thresholds
  // If code says "Clear" (0) but high rain prob, show 'cloudy' as warning.
  // Only show 'rain' icon if probability is severe (>60%) OR code matches rain.
  if (precipProb >= 60) return 'rain';

  // If prob is moderate (30-59%), do not show sun. Show cloud.
  if (precipProb >= 30 && isDay) return 'cloudy';
  if (precipProb >= 30 && !isDay) return 'cloudy-night';

  // 3. Standard Codes
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';
  if (code === 0 || code === 1) return isDay ? 'sunny' : 'moon';
  if (code === 2) return isDay ? 'cloudy' : 'cloudy-night';
  if (code === 3) return 'overcast';

  return 'cloudy'; // Safe fallback
}

const mapOpenMeteoToModel = async (city: string, data: any): Promise<WeatherData> => {
  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;
  const isDay = current.is_day === 1;

  const nowIndex = hourly.time.findIndex((t: string) => t >= current.time);
  const validIndex = nowIndex === -1 ? 0 : nowIndex;

  // Get Current Probability
  const currentRainProb = hourly.precipitation_probability[validIndex] || 0;

  const hourlyData: HourlyForecast[] = [];
  // Capture up to 360 hours (15 days) for Accordion support
  for (let i = validIndex; i < validIndex + 360 && i < hourly.time.length; i++) {
    const timeStr = hourly.time[i];
    const fullDate = timeStr.split('T')[0]; // YYYY-MM-DD
    const hTime = timeStr.split('T')[1].substring(0, 5);
    const code = hourly.weather_code[i];
    const isHourDay = hourly.is_day ? hourly.is_day[i] === 1 : true;
    const prob = hourly.precipitation_probability[i] || 0;

    hourlyData.push({
      time: hTime,
      fullDate: fullDate, // Store full date for grouping
      temp: hourly.temperature_2m[i],
      icon: getWeatherIcon(code, isHourDay, prob),
      precipProb: prob,
      windSpeed: Math.round(hourly.wind_speed_10m[i]),
      feelsLike: Math.round(hourly.apparent_temperature[i]),
      isDay: isHourDay,
      humidity: hourly.relative_humidity_2m[i] || 50, // Real humidity data
      uvIndex: hourly.uv_index[i] || 0,                // Real UV index data
      visibility: (hourly.visibility && hourly.visibility[i]) ? Math.round(hourly.visibility[i] / 1000) : 10, // Convert m to km
      precipitation: hourly.precipitation ? (hourly.precipitation[i] || 0) : 0 // New Mapping
    });
  }

  const dailyData: DailyForecast[] = [];
  for (let i = 0; i < daily.time.length; i++) {
    const dDate = new Date(daily.time[i]);
    const dayName = dDate.toLocaleDateString('tr-TR', { weekday: 'short' });
    const dateStr = dDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const fullDate = daily.time[i].split('T')[0]; // ISO Date for matching
    const code = daily.weather_code[i];
    const prob = daily.precipitation_probability_max[i] || 0;

    let displayDay = dayName;
    if (i === 0) displayDay = 'Bugün';
    if (i === 1) displayDay = 'Yarın';

    dailyData.push({
      day: displayDay,
      date: dateStr,
      fullDate: fullDate, // Store ISO date
      icon: getWeatherIcon(code, true, prob), // Passed prob
      high: Math.round(daily.temperature_2m_max[i]),
      low: Math.round(daily.temperature_2m_min[i]),
      condition: WMO_TRANSLATION[code] || "Hava Durumu",
      rainProb: prob,
      wind: Math.round(daily.wind_speed_10m_max[i]) + ' km/sa',
      humidity: 50,
      feelsLike: Math.round(daily.apparent_temperature_max[i] || daily.temperature_2m_max[i]), // New Mapping
      uvIndex: daily.uv_index_max ? Math.round(daily.uv_index_max[i]) : 0, // New Mapping
      // Estimate daily visibility from hourly at noon (approx index i*24 + 12)
      visibility: (hourly.visibility && hourly.visibility[i * 24 + 12]) ? Math.round(hourly.visibility[i * 24 + 12] / 1000) : 10,
      precipitationSum: daily.precipitation_sum ? (daily.precipitation_sum[i] || 0) : 0 // New Mapping
    });
  }

  return {
    city: city,
    // API response contains accurate coordinates from geocoding
    coord: { lat: data.latitude, lon: data.longitude },
    currentTemp: current.temperature_2m,
    condition: WMO_TRANSLATION[current.weather_code] || "Hava Durumu",
    icon: getWeatherIcon(current.weather_code, isDay, currentRainProb), // Passed prob
    smartPhrase: generateSmartPhrase(current.temperature_2m, current.weather_code, current.wind_speed_10m, hourly.uv_index[validIndex]),
    high: daily.temperature_2m_max[0],
    low: daily.temperature_2m_min[0],
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m?.toString() || "0", // 0 degrees = North
    rainVolume: current.precipitation || 0,
    rainProb: currentRainProb,
    humidity: current.relative_humidity_2m,
    uvIndex: hourly.uv_index[validIndex] || 0,
    feelsLike: current.apparent_temperature,
    pressure: current.surface_pressure,
    aqi: await fetchAirQuality(data.latitude, data.longitude),
    sunrise: daily.sunrise[0].split('T')[1],
    sunset: daily.sunset[0].split('T')[1],
    cloudCover: current.cloud_cover ?? 0,
    hourly: hourlyData,
    daily: dailyData
  };
};

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

// SINAN PROTOCOL: Turkish City Coordinates Lookup
// Used for mock data and radar positioning
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  // Top 10 Major Cities
  'istanbul': { lat: 41.0082, lon: 28.9784 },
  'İstanbul': { lat: 41.0082, lon: 28.9784 },
  'ankara': { lat: 39.9334, lon: 32.8597 },
  'Ankara': { lat: 39.9334, lon: 32.8597 },
  'izmir': { lat: 38.4192, lon: 27.1287 },
  'İzmir': { lat: 38.4192, lon: 27.1287 },
  'bursa': { lat: 40.1885, lon: 29.0610 },
  'Bursa': { lat: 40.1885, lon: 29.0610 },
  'antalya': { lat: 36.8969, lon: 30.7133 },
  'Antalya': { lat: 36.8969, lon: 30.7133 },
  'adana': { lat: 37.0000, lon: 35.3213 },
  'Adana': { lat: 37.0000, lon: 35.3213 },
  'konya': { lat: 37.8746, lon: 32.4932 },
  'Konya': { lat: 37.8746, lon: 32.4932 },
  'gaziantep': { lat: 37.0662, lon: 37.3833 },
  'Gaziantep': { lat: 37.0662, lon: 37.3833 },
  'mersin': { lat: 36.8121, lon: 34.6415 },
  'Mersin': { lat: 36.8121, lon: 34.6415 },
  'diyarbakır': { lat: 37.9144, lon: 40.2306 },
  'Diyarbakır': { lat: 37.9144, lon: 40.2306 },
  // Additional Popular Cities
  'kayseri': { lat: 38.7312, lon: 35.4787 },
  'Kayseri': { lat: 38.7312, lon: 35.4787 },
  'eskişehir': { lat: 39.7767, lon: 30.5206 },
  'Eskişehir': { lat: 39.7767, lon: 30.5206 },
  'samsun': { lat: 41.2928, lon: 36.3313 },
  'Samsun': { lat: 41.2928, lon: 36.3313 },
  'trabzon': { lat: 41.0027, lon: 39.7168 },
  'Trabzon': { lat: 41.0027, lon: 39.7168 },
  'denizli': { lat: 37.7765, lon: 29.0864 },
  'Denizli': { lat: 37.7765, lon: 29.0864 },
  'malatya': { lat: 38.3552, lon: 38.3095 },
  'Malatya': { lat: 38.3552, lon: 38.3095 },
  'erzurum': { lat: 39.9055, lon: 41.2658 },
  'Erzurum': { lat: 39.9055, lon: 41.2658 },
  'van': { lat: 38.5012, lon: 43.4089 },
  'Van': { lat: 38.5012, lon: 43.4089 },
  'muğla': { lat: 37.2153, lon: 28.3636 },
  'Muğla': { lat: 37.2153, lon: 28.3636 },
  'bodrum': { lat: 37.0344, lon: 27.4305 },
  'Bodrum': { lat: 37.0344, lon: 27.4305 },
  'fethiye': { lat: 36.6538, lon: 29.1236 },
  'Fethiye': { lat: 36.6538, lon: 29.1236 },
  'kuşadası': { lat: 37.8579, lon: 27.2610 },
  'Kuşadası': { lat: 37.8579, lon: 27.2610 },
  'marmaris': { lat: 36.8550, lon: 28.2742 },
  'Marmaris': { lat: 36.8550, lon: 28.2742 },
  'alanya': { lat: 36.5437, lon: 31.9994 },
  'Alanya': { lat: 36.5437, lon: 31.9994 },
  // Black Sea
  'rize': { lat: 41.0208, lon: 40.5178 },
  'Rize': { lat: 41.0208, lon: 40.5178 },
  'ordu': { lat: 40.9862, lon: 37.8797 },
  'Ordu': { lat: 40.9862, lon: 37.8797 },
  'giresun': { lat: 40.9128, lon: 38.3895 },
  'Giresun': { lat: 40.9128, lon: 38.3895 },
  // Marmara
  'edirne': { lat: 41.6818, lon: 26.5623 },
  'Edirne': { lat: 41.6818, lon: 26.5623 },
  'çanakkale': { lat: 40.1553, lon: 26.4142 },
  'Çanakkale': { lat: 40.1553, lon: 26.4142 },
  'kocaeli': { lat: 40.8533, lon: 29.8815 },
  'Kocaeli': { lat: 40.8533, lon: 29.8815 },
  'sakarya': { lat: 40.7569, lon: 30.3781 },
  'Sakarya': { lat: 40.7569, lon: 30.3781 },
  // Aegean
  'aydın': { lat: 37.8560, lon: 27.8416 },
  'Aydın': { lat: 37.8560, lon: 27.8416 },
  'manisa': { lat: 38.6191, lon: 27.4289 },
  'Manisa': { lat: 38.6191, lon: 27.4289 },
  // Central Anatolia
  'afyon': { lat: 38.7507, lon: 30.5567 },
  'Afyon': { lat: 38.7507, lon: 30.5567 },
  'nevşehir': { lat: 38.6250, lon: 34.7239 },
  'Nevşehir': { lat: 38.6250, lon: 34.7239 },
  'kapadokya': { lat: 38.6431, lon: 34.8289 },
  'Kapadokya': { lat: 38.6431, lon: 34.8289 },
  // Resort Towns (Hub Support)
  'belek': { lat: 36.8625, lon: 31.0556 },
  'Belek': { lat: 36.8625, lon: 31.0556 },
  'çeşme': { lat: 38.3233, lon: 26.3042 },
  'Çeşme': { lat: 38.3233, lon: 26.3042 },
  'kemer': { lat: 36.5962, lon: 30.5602 },
  'Kemer': { lat: 36.5962, lon: 30.5602 },
  'kaş': { lat: 36.2018, lon: 29.6377 },
  'Kaş': { lat: 36.2018, lon: 29.6377 },
};

// Helper to get coordinates for a city (with fallback to Turkey center)
const getCityCoords = (city: string): { lat: number; lon: number } => {
  // Try exact match first
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  // Try lowercase
  const lower = city.toLowerCase();
  if (CITY_COORDS[lower]) return CITY_COORDS[lower];
  // Try slug-based lookup
  const slug = toSlug(city);
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (toSlug(key) === slug) return coords;
  }
  // Fallback to Turkey center
  return { lat: 39.0, lon: 35.5 };
};

const getMockWeatherData = (city: string): WeatherData => {
  const baseTemp = 18;
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const windSpeed = 15;
  const uvIndex = 5;
  // Use a fixed recent date or just new Date()
  const simulationStartDate = new Date(2025, 11, 5, 8, 0, 0);

  // Get city-specific coordinates for radar positioning
  const coords = getCityCoords(city);

  return {
    city,
    coord: coords, // Use city-specific coordinates for radar positioning
    currentTemp: baseTemp,
    condition: 'Güneşli (Mock)',
    icon: 'sunny',
    smartPhrase: generateSmartPhrase(baseTemp, 0, windSpeed, uvIndex),
    high: baseTemp + 4,
    low: baseTemp - 5,
    windSpeed: windSpeed,
    windDirection: '45', // 45° = Kuzeydoğu (Northeast)
    rainVolume: 0,
    rainProb: 10,
    humidity: 50,
    uvIndex: uvIndex,
    feelsLike: baseTemp + 1,
    pressure: 1012,
    aqi: 40,
    sunrise: '06:00',
    sunset: '20:00',
    cloudCover: 25,
    hourly: Array.from({ length: 48 }).map((_, i) => ({
      time: `${i % 24}:00`,
      temp: baseTemp + Math.sin(i / 3) * 5,
      icon: 'sunny',
      precipProb: 10,
      windSpeed: 10,
      feelsLike: baseTemp + Math.sin(i / 3) * 4,
      isDay: i % 24 >= 6 && i % 24 < 20,
      humidity: 50 + Math.round(Math.sin(i / 6) * 15), // Mock: 35-65% range
      uvIndex: i % 24 >= 6 && i % 24 < 20 ? Math.max(0, 5 - Math.abs(12 - (i % 24)) * 0.5) : 0, // Mock: peaks midday
      visibility: 10 // Mock Value in km
    })),
    // Align with API: Provide exactly 15 days
    daily: Array.from({ length: 15 }).map((_, i) => {
      const d = new Date(simulationStartDate);
      d.setDate(d.getDate() + i);
      const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
      return {
        day: i === 0 ? 'Bugün' : (i === 1 ? 'Yarın' : dayName),
        date: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        icon: 'sunny',
        high: baseTemp + 3,
        low: baseTemp - 3,
        condition: 'Güneşli',
        rainProb: 10,
        wind: '10 km/sa',
        humidity: 50,
        feelsLike: baseTemp + 2, // Mock Value
        uvIndex: 5, // Mock Value
        visibility: 10 // Mock Value in km
      };
    })
  };
};

export const getWeatherData = async (city: string): Promise<WeatherData> => {
  let finalCityName = city;

  // 1. Check Preloaded Config for display name
  if (CONFIG.preloadedGeo && toSlug(CONFIG.preloadedGeo.city) === toSlug(city)) {
    finalCityName = CONFIG.preloadedGeo.city;
  }

  // 2. Resolve coordinates EARLY (before any API calls)
  // Priority: localStorage (from disambiguation) > static lookup > null (use API coords)
  const slug = toSlug(finalCityName);
  let resolvedCoords: { lat: number; lon: number } | null = null;

  // Priority 1: Check localStorage for user-selected coordinates (from disambiguation page)
  const storedGeo = localStorage.getItem(`geo_${slug}`);
  if (storedGeo) {
    try {
      const geoData = JSON.parse(storedGeo);
      // Only use if stored within last 24 hours
      if (geoData.lat && geoData.lon && Date.now() - geoData.timestamp < 86400000) {
        resolvedCoords = { lat: geoData.lat, lon: geoData.lon };
        console.log(`📍 Using stored geo for "${finalCityName}": (${resolvedCoords.lat}, ${resolvedCoords.lon}) from ${geoData.admin1 || 'disambiguation'}`);
      }
    } catch { /* ignore parse errors */ }
  }

  // Priority 2: Static lookup for known cities
  if (!resolvedCoords) {
    const lookupCoords = getCityCoords(finalCityName);
    // Only use if not Turkey center default
    if (lookupCoords.lat !== 39.0 || lookupCoords.lon !== 35.5) {
      resolvedCoords = lookupCoords;
      console.log(`📍 Static lookup for "${finalCityName}": (${resolvedCoords.lat}, ${resolvedCoords.lon})`);
    }
  }

  // SINAN PROTOCOL: Cascading Fallback Chain
  // 1. Try WordPress Proxy (production with caching)
  // 2. Try Direct Open-Meteo API (dev/fallback)
  // 3. Use Mock Data (offline/error)

  // FALLBACK 1: WordPress Proxy (PRODUCTION ONLY)
  // In dev mode, skip the proxy to ensure real API data is used
  if (getConfig().isProduction) {
    try {
      const proxyUrl = `/wp-json/sinan/v1/weather?city=${toSlug(finalCityName)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('WP Proxy Failed');

      const data = await response.json();

      // Override API coordinates with resolved coords if available
      if (resolvedCoords) {
        data.latitude = resolvedCoords.lat;
        data.longitude = resolvedCoords.lon;
        console.log(`📍 Overriding proxy coords with resolved: (${resolvedCoords.lat}, ${resolvedCoords.lon})`);
      }

      return mapOpenMeteoToModel(finalCityName, data);

    } catch (e) {
      console.warn("WP Proxy Failed, trying direct Open-Meteo API...");
    }
  } else {
    console.log("🔧 [DEV MODE] Skipping WP Proxy, going direct to Open-Meteo API...");
  }

  // FALLBACK 2: Direct Open-Meteo API with city coordinates
  try {
    // Use already-resolved coords, or fall back to dynamic geocoding
    let coords = resolvedCoords || { lat: 0, lon: 0 };

    // If no coords resolved yet, try dynamic geocoding API
    if (coords.lat === 0 && coords.lon === 0) {
      const geoResult = await fetchGeocoding(finalCityName);
      if (geoResult) {
        coords = { lat: geoResult.lat, lon: geoResult.lon };
        console.log(`📍 Geocoded "${finalCityName}" to (${coords.lat}, ${coords.lon})`);
      } else {
        // SINAN FIX: Return null for unknown cities instead of fallback
        // This allows the UI to show "Konum Bulunamadı" error
        console.warn(`⚠️ City not found: "${finalCityName}" - no static lookup or geocoding match`);
        return null as any; // Signal city not found
      }
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,apparent_temperature_max,uv_index_max&forecast_days=15&forecast_hours=360&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Open-Meteo API Failed');

    const data = await response.json();
    console.log(`✓ Open-Meteo direct fetch success for ${finalCityName} (${coords.lat}, ${coords.lon})`);
    return mapOpenMeteoToModel(finalCityName, data);

  } catch (e) {
    console.warn("Direct Open-Meteo failed, using Mock Data", e);
  }

  // FALLBACK 3: Mock Data (only for known cities that failed API)
  // If we reach here, it means the city WAS found but API failed - use mock
  return getMockWeatherData(finalCityName);
};

export const transformToTomorrow = (data: WeatherData): WeatherData => {
  const tomorrowDaily = data.daily[1];
  if (!tomorrowDaily) return data;

  // Find tomorrow's midnight (00:00) in the hourly data
  // Hourly data starts from current hour, so we need to find the next 00:00
  let midnightIndex = -1;
  let foundFirstMidnight = false;

  for (let i = 0; i < data.hourly.length; i++) {
    const hour = parseInt(data.hourly[i].time.split(':')[0], 10);
    if (hour === 0) {
      if (!foundFirstMidnight) {
        // This is today's midnight (if current time is before midnight) or tomorrow's
        // We need the NEXT midnight after current time
        foundFirstMidnight = true;
        midnightIndex = i;
      } else {
        // This is tomorrow's midnight
        midnightIndex = i;
        break;
      }
    }
  }

  // If we're already past midnight today, the first 00:00 we find is tomorrow's
  // If midnightIndex is 0, we're at midnight now, so tomorrow is at index 24
  if (midnightIndex <= 0) {
    midnightIndex = 24; // Fallback: assume tomorrow starts 24 hours from now
  }

  // Get 24 hours starting from tomorrow's midnight
  const tomorrowHourly = data.hourly.slice(midnightIndex, midnightIndex + 24);

  return {
    ...data,
    currentTemp: tomorrowDaily.high,
    condition: tomorrowDaily.condition || "Yarın",
    icon: tomorrowDaily.icon,
    smartPhrase: generateSmartPhrase(
      tomorrowDaily.high,
      getWMOCodeFromCondition(tomorrowDaily.condition),
      parseInt(tomorrowDaily.wind.replace(/[^0-9]/g, ''), 10) || 0,
      tomorrowDaily.uvIndex || 0
    ),
    high: tomorrowDaily.high,
    low: tomorrowDaily.low,
    windSpeed: parseInt(tomorrowDaily.wind.replace(/[^0-9]/g, ''), 10) || 0,
    rainProb: tomorrowDaily.rainProb,
    humidity: tomorrowDaily.humidity,
    uvIndex: tomorrowDaily.uvIndex || data.uvIndex,
    feelsLike: tomorrowDaily.feelsLike || data.feelsLike,
    hourly: tomorrowHourly,
  };
};

export const getTomorrowDashboardData = (data: WeatherData): WeatherData => {
  return transformToTomorrow(data);
}

export const getWeekendDashboardData = (data: WeatherData): WeatherData => {
  // Find Saturday and Sunday in the daily forecast
  const weekendDays = data.daily.filter((day) => {
    const dayName = day.day.toLowerCase();
    return dayName === 'cmt' || dayName === 'paz' ||
      dayName === 'cumartesi' || dayName === 'pazar';
  });

  // Calculate days until Saturday
  const today = new Date();
  const currentDay = today.getDay(); // 0=Sunday, 6=Saturday
  let daysUntilSaturday = (6 - currentDay + 7) % 7;
  if (daysUntilSaturday === 0) daysUntilSaturday = 0; // Today is Saturday

  // If no weekend days found by name, use index calculation
  if (weekendDays.length === 0) {
    const saturdayIndex = daysUntilSaturday;
    const sundayIndex = daysUntilSaturday + 1;

    if (data.daily[saturdayIndex]) weekendDays.push(data.daily[saturdayIndex]);
    if (data.daily[sundayIndex]) weekendDays.push(data.daily[sundayIndex]);
  }

  if (weekendDays.length === 0) return data;

  // Find Saturday's midnight (00:00) by counting midnights in the hourly data
  // Each 00:00 marks the start of a new day
  let midnightCount = 0;
  let saturdayMidnightIndex = -1;

  for (let i = 0; i < data.hourly.length; i++) {
    const hour = parseInt(data.hourly[i].time.split(':')[0], 10);
    if (hour === 0) {
      midnightCount++;
      // We need to find the (daysUntilSaturday + 1)th midnight
      // +1 because the first midnight is tomorrow (day 1), not today
      if (midnightCount === daysUntilSaturday + 1) {
        saturdayMidnightIndex = i;
        break;
      }
    }
  }

  // Fallback: if we couldn't find Saturday's midnight
  if (saturdayMidnightIndex === -1) {
    // Use index-based calculation: each day is 24 hours from current hour
    const hoursUntilSaturdayMidnight = (daysUntilSaturday * 24) - today.getHours();
    saturdayMidnightIndex = Math.max(0, hoursUntilSaturdayMidnight);
  }

  // Get 48 hours: Saturday 00:00 to Sunday 23:00
  const weekendHourly = data.hourly.slice(saturdayMidnightIndex, saturdayMidnightIndex + 48);

  // Calculate average conditions for weekend
  const avgHigh = Math.round(weekendDays.reduce((sum, d) => sum + d.high, 0) / weekendDays.length);
  const avgLow = Math.round(weekendDays.reduce((sum, d) => sum + d.low, 0) / weekendDays.length);
  const maxRainProb = Math.max(...weekendDays.map(d => d.rainProb));
  const avgWindSpeed = Math.round(weekendDays.reduce((sum, d) => sum + parseInt(d.wind.replace(/[^0-9]/g, ''), 10), 0) / weekendDays.length);
  const avgHumidity = Math.round(weekendDays.reduce((sum, d) => sum + d.humidity, 0) / weekendDays.length);
  const maxUvIndex = Math.max(...weekendDays.map(d => d.uvIndex || 0));
  const avgFeelsLike = Math.round(weekendDays.reduce((sum, d) => sum + (d.feelsLike || d.high), 0) / weekendDays.length);

  const mainIcon = weekendDays[0].icon;
  const mainCondition = weekendDays[0].condition;

  return {
    ...data,
    currentTemp: avgHigh,
    condition: mainCondition,
    icon: mainIcon,
    smartPhrase: generateSmartPhrase(
      avgHigh,
      getWMOCodeFromCondition(weekendDays[0].condition),
      parseInt(weekendDays[0].wind.replace(/[^0-9]/g, ''), 10) || 0,
      weekendDays[0].uvIndex || 0
    ),
    high: avgHigh,
    low: avgLow,
    windSpeed: avgWindSpeed,
    rainProb: maxRainProb,
    humidity: avgHumidity,
    uvIndex: maxUvIndex,
    feelsLike: avgFeelsLike,
    hourly: weekendHourly.length > 0 ? weekendHourly : data.hourly.slice(0, 48),
    daily: weekendDays.length >= 2 ? weekendDays : data.daily.slice(0, 7),
  };
};

// --- MARKET DATA (MOCK BRIDGE) ---
export const getMarketData = async (): Promise<MarketTicker[]> => {
  if (CONFIG.apiUrl && CONFIG.nonce) {
    try {
      const res = await fetch(`${CONFIG.apiUrl}/finance`, { headers: { 'X-WP-Nonce': CONFIG.nonce } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => ({
            symbol: item.symbol,
            price: item.price,
            change: item.change,
            icon: item.icon || '📈',
            logoUrl: HUB_LOGOS[item.code as keyof typeof HUB_LOGOS] || HUB_LOGOS.GOLD,
            link: item.link || ''
          }));
        }
      }
    } catch (e) {
      console.warn("API Fetch failed, falling back to mock data.");
    }
  }

  // 2. FALLBACK: Premium Mock Data (For Dev & Testing)
  return [
    { symbol: 'GRAM ALTIN', price: '2.450,50 ₺', change: 0.45, icon: '🟡', logoUrl: HUB_LOGOS.GOLD, link: 'https://altın-fiyatları.tr' },
    { symbol: 'DOLAR/TL', price: '32,45 ₺', change: 0.12, icon: '💵', logoUrl: HUB_LOGOS.FX, link: 'https://dolar-tl.com' },
    { symbol: 'BIST 100', price: '9.850,25', change: 1.20, icon: '📊', logoUrl: HUB_LOGOS.BOURSE, link: 'https://bist-100.tr' },
    { symbol: 'BITCOIN', price: '2.150.000 ₺', change: -2.50, icon: '₿', logoUrl: HUB_LOGOS.CRYPTO, link: 'https://kripto-paralar.com' }
  ];
};

// MOCK NEWS DATA (Updated to use Link structure instead of Content)
const NEWS_DATA: NewsItem[] = [
  { id: 1, title: 'İstanbul için Fırtına Uyarısı: Çatı Uçmalarına Dikkat', image: 'https://picsum.photos/400/300?random=1', category: 'Şehir', date: '12 Mayıs 2025', link: '/haber/istanbul-firtina-uyarisi' },
  { id: 2, title: 'Tarımda Kuraklık Tehlikesi', image: 'https://picsum.photos/400/400?random=2', category: 'Tarım', date: '10 Mayıs 2025', link: '/haber/tarimda-kuraklik' },
  { id: 3, title: 'Yaz Sıcaklıkları', image: 'https://picsum.photos/400/250?random=3', category: 'Bilim', date: '08 Mayıs 2025', link: '/haber/yaz-sicakliklari-el-nino' },
  { id: 4, title: 'Hafta Sonu Planları', image: 'https://picsum.photos/400/350?random=4', category: 'Yaşam', date: '14 Mayıs 2025', link: '/haber/hafta-sonu-planlari' }
];

// SINAN PROTOCOL V3: Smart Backfill Bridge
// Always ensures 6 articles by mixing city-specific + general news
export const fetchLiveArticles = async (cityName?: string): Promise<NewsItem[]> => {
  // Use Cache Wrapper: 30 Minutes TTL (News updates less frequently)
  const cacheKey = `news_v2_${toSlug(cityName || 'general')}`;

  return fetchWithCache(
    cacheKey,
    async () => {
      const ANALYSIS_CATEGORY_ID = 21; // Your ID
      const baseEndpoint = `/wp-json/wp/v2/posts?_embed&per_page=6&categories=${ANALYSIS_CATEGORY_ID}`;

      try {
        let specificPosts: any[] = [];
        let generalPosts: any[] = [];

        // 1. FETCH SPECIFIC (If city provided)
        if (cityName) {
          try {
            const tagSlug = toSlug(cityName);
            const tagRes = await fetch(`/wp-json/wp/v2/tags?slug=${tagSlug}`);
            const tags = await tagRes.json();

            if (Array.isArray(tags) && tags.length > 0) {
              const tagId = tags[0].id;
              // Fetch up to 3 specific posts
              const specificRes = await fetch(`${baseEndpoint}&tags=${tagId}&per_page=3`);
              if (specificRes.ok) {
                specificPosts = await specificRes.json();
              }
            }
          } catch (err) { /* Ignore tag errors */ }
        }

        // 2. FETCH GENERAL (Always fetch to fill gaps)
        // We exclude the specific posts IDs to avoid duplicates
        let excludeParams = "";
        if (specificPosts.length > 0) {
          const excludeIds = specificPosts.map((p: any) => p.id).join(',');
          excludeParams = `&exclude=${excludeIds}`;
        }

        // Fetch enough to fill the remaining slots (Target: 6 total)
        const needed = 6 - specificPosts.length;
        if (needed > 0) {
          const generalRes = await fetch(`${baseEndpoint}${excludeParams}&per_page=${needed}`);
          if (generalRes.ok) {
            generalPosts = await generalRes.json();
          }
        }

        // 3. MERGE
        const allPosts = [...specificPosts, ...generalPosts];

        // 4. MAP
        const newsItems = allPosts.map((post: any) => ({
          id: post.id,
          title: decodeHTMLEntities(post.title.rendered),
          link: post.link,
          image: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || `https://picsum.photos/400/300?random=${post.id}`,
          category: 'Hava Durumu Makalesi',
          date: new Date(post.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          excerpt: post.excerpt?.rendered
            ? decodeHTMLEntities(post.excerpt.rendered.replace(/(<([^>]+)>)/gi, "")).substring(0, 100) + "..."
            : ""
        }));

        console.log(`[News] Fresh fetch for ${cityName || 'General'} (${newsItems.length} items)`);
        return newsItems;

      } catch (e) {
        console.warn("[Sinan Bridge] Failed:", e);
        return NEWS_DATA;
      }
    },
    30 // 30 Min TTL
  );
};

export const fetchLegalPage = async (slug: string): Promise<LegalContent | null> => {
  // If fallback mapping in component is preferred, we return null here unless production logic is active.
  // Assuming production logic for WordPress pages:
  if (CONFIG.isProduction) {
    try {
      const response = await fetch(`/wp-json/wp/v2/pages?slug=${slug}`);
      if (!response.ok) throw new Error('WP API Failed');
      const pages = await response.json();
      if (pages && pages.length > 0) {
        return {
          title: pages[0].title.rendered,
          content: pages[0].content.rendered
        };
      }
    } catch (e) {
      console.error("Legal Page Fetch Failed", e);
    }
  }
  // Allow component fallback to take over
  return null;
};

// --- HISTORICAL WEATHER DATA ---
// Fetches last 12 months + 10-year averages for comparison charts
const HISTORICAL_CACHE_KEY = 'tg_historical_data';
const HISTORICAL_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface HistoricalCache {
  city: string;
  timestamp: number;
  data: HistoricalData;
}

// Helper: Get day of year (1-366)
const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

// Helper: Format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getHistoricalData = async (lat: number, lon: number, city: string): Promise<HistoricalData> => {
  // 1. Check cache first
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(HISTORICAL_CACHE_KEY);
      if (cached) {
        const cacheData: HistoricalCache = JSON.parse(cached);
        if (cacheData.city === city && Date.now() - cacheData.timestamp < HISTORICAL_CACHE_DURATION) {
          console.log('📊 Historical data loaded from cache');
          return cacheData.data;
        }
      }
    } catch (e) { console.warn('Cache read failed', e); }
  }

  const today = new Date();
  const todayStr = formatDate(today);

  // Calculate date ranges
  // Last 12 months: from 1 year ago to today (but API has 5-day delay, so up to 5 days ago)
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  // 10-year history: 2014-01-01 to 5 days ago
  const tenYearsAgo = new Date(today);
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  try {
    // 2. Fetch last 12 months data
    const last12MonthsUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${formatDate(oneYearAgo)}&end_date=${formatDate(fiveDaysAgo)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    const response12m = await fetch(last12MonthsUrl);
    if (!response12m.ok) throw new Error('Historical API failed');
    const data12m = await response12m.json();

    // Process last 12 months
    const last12Months: HistoricalDayData[] = [];
    if (data12m.daily) {
      for (let i = 0; i < data12m.daily.time.length; i++) {
        last12Months.push({
          date: data12m.daily.time[i],
          high: Math.round(data12m.daily.temperature_2m_max[i] ?? 0),
          low: Math.round(data12m.daily.temperature_2m_min[i] ?? 0),
          precip: Math.round((data12m.daily.precipitation_sum[i] ?? 0) * 10) / 10
        });
      }
    }

    // 3. Calculate 10-year averages
    // For performance, we'll compute a simpler average: sample 3 years (every 3rd year)
    const sampleYears = [3, 6, 9]; // Years ago to sample
    const dailyAccumulators: { [dayOfYear: number]: { highs: number[]; lows: number[]; precips: number[] } } = {};

    for (const yearsAgo of sampleYears) {
      const sampleStart = new Date(today);
      sampleStart.setFullYear(sampleStart.getFullYear() - yearsAgo);
      sampleStart.setMonth(0, 1); // Jan 1

      const sampleEnd = new Date(sampleStart);
      sampleEnd.setFullYear(sampleStart.getFullYear());
      sampleEnd.setMonth(11, 31); // Dec 31

      try {
        const sampleUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${formatDate(sampleStart)}&end_date=${formatDate(sampleEnd)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

        const sampleResponse = await fetch(sampleUrl);
        if (sampleResponse.ok) {
          const sampleData = await sampleResponse.json();
          if (sampleData.daily) {
            for (let i = 0; i < sampleData.daily.time.length; i++) {
              const d = new Date(sampleData.daily.time[i]);
              const doy = getDayOfYear(d);

              if (!dailyAccumulators[doy]) {
                dailyAccumulators[doy] = { highs: [], lows: [], precips: [] };
              }

              if (sampleData.daily.temperature_2m_max[i] != null) {
                dailyAccumulators[doy].highs.push(sampleData.daily.temperature_2m_max[i]);
              }
              if (sampleData.daily.temperature_2m_min[i] != null) {
                dailyAccumulators[doy].lows.push(sampleData.daily.temperature_2m_min[i]);
              }
              if (sampleData.daily.precipitation_sum[i] != null) {
                dailyAccumulators[doy].precips.push(sampleData.daily.precipitation_sum[i]);
              }
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch sample year ${yearsAgo}`, e);
      }
    }

    // Compute averages
    const tenYearAvg: HistoricalAverage[] = [];
    for (let doy = 1; doy <= 366; doy++) {
      const acc = dailyAccumulators[doy];
      if (acc && acc.highs.length > 0) {
        tenYearAvg.push({
          dayOfYear: doy,
          avgHigh: Math.round(acc.highs.reduce((a, b) => a + b, 0) / acc.highs.length),
          avgLow: Math.round(acc.lows.reduce((a, b) => a + b, 0) / acc.lows.length),
          avgPrecip: Math.round((acc.precips.reduce((a, b) => a + b, 0) / acc.precips.length) * 10) / 10
        });
      } else {
        // Fill gaps with interpolated values (simple linear fill)
        const prev = tenYearAvg[tenYearAvg.length - 1];
        tenYearAvg.push({
          dayOfYear: doy,
          avgHigh: prev ? prev.avgHigh : 15,
          avgLow: prev ? prev.avgLow : 5,
          avgPrecip: prev ? prev.avgPrecip : 1
        });
      }
    }

    const result: HistoricalData = { last12Months, tenYearAvg };

    // 4. Cache result
    if (typeof window !== 'undefined') {
      try {
        const cacheEntry: HistoricalCache = {
          city,
          timestamp: Date.now(),
          data: result
        };
        localStorage.setItem(HISTORICAL_CACHE_KEY, JSON.stringify(cacheEntry));
        console.log('📊 Historical data cached');
      } catch (e) { console.warn('Cache write failed', e); }
    }

    return result;
  } catch (e) {
    console.error('Historical data fetch failed:', e);
    // Return empty data on failure
    return { last12Months: [], tenYearAvg: [] };
  }
};
