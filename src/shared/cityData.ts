/**
 * Centralized City Data - Single Source of Truth
 * 
 * This file eliminates duplicate city arrays across components.
 * Used by: Navigation, Footer, CityIndex, SeasonalRail
 */

// All 81 Turkish Provinces (İL) for the City Rail
// Ordered by population within each region for user relevance
export const REGULAR_CITIES = [
    // Top 10 by Population (Priority Display)
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli',
    // Next 10 (High Traffic)
    'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın',
    // Next 10
    'Denizli', 'Sakarya', 'Tekirdağ', 'Muğla', 'Mardin', 'Eskişehir', 'Trabzon', 'Malatya', 'Erzurum', 'Ordu',
    // Next 10
    'Batman', 'Afyonkarahisar', 'Sivas', 'Şırnak', 'Elazığ', 'Tokat', 'Adıyaman', 'Giresun', 'Kütahya', 'Rize',
    // Remaining Provinces (Alphabetical within groups)
    'Ağrı', 'Aksaray', 'Amasya', 'Ardahan', 'Artvin', 'Bartın', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis',
    'Bolu', 'Burdur', 'Çanakkale', 'Çankırı', 'Çorum', 'Düzce', 'Edirne', 'Erzincan', 'Gümüşhane', 'Hakkari',
    'Iğdır', 'Isparta', 'Kars', 'Kastamonu', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kilis', 'Muş', 'Nevşehir',
    'Niğde', 'Osmaniye', 'Siirt', 'Sinop', 'Tunceli', 'Uşak', 'Yalova', 'Yozgat', 'Zonguldak', 'Karaman'
] as const;

// Seasonal spots (Winter/Ski resorts)
export const SEASONAL_SPOTS = [
    { name: 'Erciyes', type: 'Kayak', icon: '🏔️' },
    { name: 'Uludağ', type: 'Kayak', icon: '⛷️' },
    { name: 'Palandöken', type: 'Kayak', icon: '🏂' },
    { name: 'Saklıkent', type: 'Kayak', icon: '❄️' },
    { name: 'Davraz', type: 'Kayak', icon: '🚠' },
] as const;

// Archive/Article categories
export const ARTICLE_CATEGORIES = ['Tümü', 'Şehir', 'Tarım', 'Bilim', 'Yaşam', 'Sağlık', 'Bahçe'] as const;

// City-Region mapping for SEO entity signals (All 81 Provinces)
// Format: Province -> Geographic Region
export const CITY_REGIONS: Record<string, string> = {
    // =========================================================================
    // MARMARA REGION (11 provinces)
    // =========================================================================
    'İstanbul': 'Marmara',
    'Bursa': 'Marmara',
    'Kocaeli': 'Marmara',
    'Sakarya': 'Marmara',
    'Tekirdağ': 'Marmara',
    'Balıkesir': 'Marmara',
    'Edirne': 'Marmara',
    'Kırklareli': 'Marmara',
    'Çanakkale': 'Marmara',
    'Yalova': 'Marmara',
    'Bilecik': 'Marmara',

    // =========================================================================
    // İÇ ANADOLU REGION (13 provinces)
    // =========================================================================
    'Ankara': 'İç Anadolu',
    'Konya': 'İç Anadolu',
    'Kayseri': 'İç Anadolu',
    'Eskişehir': 'İç Anadolu',
    'Sivas': 'İç Anadolu',
    'Aksaray': 'İç Anadolu',
    'Nevşehir': 'İç Anadolu',
    'Niğde': 'İç Anadolu',
    'Kırşehir': 'İç Anadolu',
    'Kırıkkale': 'İç Anadolu',
    'Yozgat': 'İç Anadolu',
    'Karaman': 'İç Anadolu',
    'Çankırı': 'İç Anadolu',

    // =========================================================================
    // EGE REGION (8 provinces)
    // =========================================================================
    'İzmir': 'Ege',
    'Denizli': 'Ege',
    'Aydın': 'Ege',
    'Muğla': 'Ege',
    'Manisa': 'Ege',
    'Afyonkarahisar': 'Ege',
    'Kütahya': 'Ege',
    'Uşak': 'Ege',

    // =========================================================================
    // AKDENİZ REGION (8 provinces)
    // =========================================================================
    'Antalya': 'Akdeniz',
    'Adana': 'Akdeniz',
    'Mersin': 'Akdeniz',
    'Hatay': 'Akdeniz',
    'Kahramanmaraş': 'Akdeniz',
    'Osmaniye': 'Akdeniz',
    'Isparta': 'Akdeniz',
    'Burdur': 'Akdeniz',

    // =========================================================================
    // KARADENİZ REGION (18 provinces)
    // =========================================================================
    'Samsun': 'Karadeniz',
    'Trabzon': 'Karadeniz',
    'Ordu': 'Karadeniz',
    'Giresun': 'Karadeniz',
    'Rize': 'Karadeniz',
    'Artvin': 'Karadeniz',
    'Zonguldak': 'Karadeniz',
    'Kastamonu': 'Karadeniz',
    'Sinop': 'Karadeniz',
    'Amasya': 'Karadeniz',
    'Tokat': 'Karadeniz',
    'Çorum': 'Karadeniz',
    'Bolu': 'Karadeniz',
    'Düzce': 'Karadeniz',
    'Karabük': 'Karadeniz',
    'Bartın': 'Karadeniz',
    'Bayburt': 'Karadeniz',
    'Gümüşhane': 'Karadeniz',

    // =========================================================================
    // DOĞU ANADOLU REGION (14 provinces)
    // =========================================================================
    'Erzurum': 'Doğu Anadolu',
    'Malatya': 'Doğu Anadolu',
    'Elazığ': 'Doğu Anadolu',
    'Van': 'Doğu Anadolu',
    'Ağrı': 'Doğu Anadolu',
    'Erzincan': 'Doğu Anadolu',
    'Kars': 'Doğu Anadolu',
    'Iğdır': 'Doğu Anadolu',
    'Ardahan': 'Doğu Anadolu',
    'Muş': 'Doğu Anadolu',
    'Bitlis': 'Doğu Anadolu',
    'Hakkari': 'Doğu Anadolu',
    'Bingöl': 'Doğu Anadolu',
    'Tunceli': 'Doğu Anadolu',

    // =========================================================================
    // GÜNEYDOĞU ANADOLU REGION (9 provinces)
    // =========================================================================
    'Gaziantep': 'Güneydoğu Anadolu',
    'Diyarbakır': 'Güneydoğu Anadolu',
    'Şanlıurfa': 'Güneydoğu Anadolu',
    'Mardin': 'Güneydoğu Anadolu',
    'Batman': 'Güneydoğu Anadolu',
    'Siirt': 'Güneydoğu Anadolu',
    'Şırnak': 'Güneydoğu Anadolu',
    'Adıyaman': 'Güneydoğu Anadolu',
    'Kilis': 'Güneydoğu Anadolu',
};

// Helper function to get region for a city
export const getCityRegion = (city: string): string | undefined => {
    return CITY_REGIONS[city];
};

// =========================================================================
// CITY DISTRICTS - Popular districts/ilçeler for each province
// Used by LocalDistrictsGrid/DistrictRail component
// =========================================================================
export const CITY_DISTRICTS: Record<string, string[]> = {
    // MARMARA REGION
    'İstanbul': ['Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Bakırköy', 'Fatih', 'Beyoğlu', 'Sarıyer', 'Maltepe', 'Kartal', 'Pendik', 'Beylikdüzü', 'Avcılar', 'Esenyurt', 'Başakşehir'],
    'Bursa': ['Osmangazi', 'Yıldırım', 'Nilüfer', 'İnegöl', 'Gemlik', 'Mudanya', 'Gürsu', 'Kestel'],
    'Kocaeli': ['İzmit', 'Gebze', 'Darıca', 'Körfez', 'Derince', 'Gölcük', 'Kartepe'],
    'Sakarya': ['Adapazarı', 'Serdivan', 'Erenler', 'Arifiye', 'Hendek', 'Akyazı'],
    'Tekirdağ': ['Çorlu', 'Süleymanpaşa', 'Çerkezköy', 'Ergene', 'Kapaklı', 'Malkara'],
    'Balıkesir': ['Altıeylül', 'Karesi', 'Bandırma', 'Edremit', 'Gönen', 'Ayvalık'],
    'Edirne': ['Merkez', 'Keşan', 'Uzunköprü', 'İpsala', 'Havsa'],
    'Kırklareli': ['Merkez', 'Lüleburgaz', 'Babaeski', 'Vize', 'Pınarhisar'],
    'Çanakkale': ['Merkez', 'Biga', 'Çan', 'Gelibolu', 'Ezine', 'Ayvacık'],
    'Yalova': ['Merkez', 'Çiftlikköy', 'Çınarcık', 'Altınova', 'Armutlu'],
    'Bilecik': ['Merkez', 'Bozüyük', 'Osmaneli', 'Söğüt', 'Pazaryeri'],

    // İÇ ANADOLU REGION
    'Ankara': ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Etimesgut', 'Sincan', 'Altındağ', 'Pursaklar', 'Gölbaşı'],
    'Konya': ['Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Beyşehir', 'Seydişehir'],
    'Kayseri': ['Melikgazi', 'Kocasinan', 'Talas', 'Develi', 'İncesu', 'Yahyalı'],
    'Eskişehir': ['Odunpazarı', 'Tepebaşı', 'Sivrihisar', 'Çifteler', 'Mahmudiye'],
    'Sivas': ['Merkez', 'Şarkışla', 'Gemerek', 'Suşehri', 'Zara', 'Kangal'],
    'Aksaray': ['Merkez', 'Ortaköy', 'Güzelyurt', 'Eskil', 'Ağaçören'],
    'Nevşehir': ['Merkez', 'Ürgüp', 'Avanos', 'Göreme', 'Derinkuyu', 'Kozaklı'],
    'Niğde': ['Merkez', 'Bor', 'Çiftlik', 'Ulukışla', 'Altunhisar'],
    'Kırşehir': ['Merkez', 'Kaman', 'Mucur', 'Çiçekdağı', 'Akpınar'],
    'Kırıkkale': ['Merkez', 'Yahşihan', 'Bahşili', 'Balışeyh', 'Keskin'],
    'Yozgat': ['Merkez', 'Sorgun', 'Yerköy', 'Boğazlıyan', 'Akdağmadeni'],
    'Karaman': ['Merkez', 'Ermenek', 'Sarıveliler', 'Ayrancı', 'Kazımkarabekir'],
    'Çankırı': ['Merkez', 'Çerkeş', 'Kurşunlu', 'Ilgaz', 'Şabanözü'],

    // EGE REGION
    'İzmir': ['Buca', 'Karşıyaka', 'Bornova', 'Konak', 'Karabağlar', 'Bayraklı', 'Çiğli', 'Menemen', 'Torbalı'],
    'Denizli': ['Merkezefendi', 'Pamukkale', 'Çivril', 'Acıpayam', 'Tavas', 'Honaz'],
    'Aydın': ['Efeler', 'Nazilli', 'Söke', 'Kuşadası', 'Didim', 'Çine', 'Germencik'],
    'Muğla': ['Menteşe', 'Bodrum', 'Fethiye', 'Marmaris', 'Milas', 'Dalaman', 'Datça', 'Köyceğiz'],
    'Manisa': ['Şehzadeler', 'Yunusemre', 'Turgutlu', 'Akhisar', 'Salihli', 'Soma', 'Alaşehir'],
    'Afyonkarahisar': ['Merkez', 'Sandıklı', 'Dinar', 'Bolvadin', 'Emirdağ', 'Şuhut'],
    'Kütahya': ['Merkez', 'Tavşanlı', 'Simav', 'Gediz', 'Emet', 'Domaniç'],
    'Uşak': ['Merkez', 'Banaz', 'Sivaslı', 'Eşme', 'Ulubey'],

    // AKDENİZ REGION
    'Antalya': ['Muratpaşa', 'Kepez', 'Konyaaltı', 'Alanya', 'Manavgat', 'Serik', 'Kemer', 'Kaş', 'Side', 'Belek'],
    'Adana': ['Seyhan', 'Yüreğir', 'Çukurova', 'Sarıçam', 'Ceyhan', 'Kozan', 'İmamoğlu'],
    'Mersin': ['Akdeniz', 'Mezitli', 'Yenişehir', 'Toroslar', 'Tarsus', 'Erdemli', 'Silifke', 'Anamur'],
    'Hatay': ['Antakya', 'İskenderun', 'Defne', 'Samandağ', 'Dörtyol', 'Kırıkhan', 'Reyhanlı'],
    'Kahramanmaraş': ['Dulkadiroğlu', 'Onikişubat', 'Elbistan', 'Afşin', 'Türkoğlu', 'Göksun'],
    'Osmaniye': ['Merkez', 'Kadirli', 'Düziçi', 'Bahçe', 'Toprakkale'],
    'Isparta': ['Merkez', 'Yalvaç', 'Eğirdir', 'Şarkikaraağaç', 'Senirkent'],
    'Burdur': ['Merkez', 'Bucak', 'Gölhisar', 'Tefenni', 'Yeşilova'],

    // KARADENİZ REGION
    'Samsun': ['İlkadım', 'Atakum', 'Canik', 'Bafra', 'Çarşamba', 'Terme', 'Vezirköprü'],
    'Trabzon': ['Ortahisar', 'Akçaabat', 'Yomra', 'Arsin', 'Of', 'Araklı', 'Sürmene'],
    'Ordu': ['Altınordu', 'Ünye', 'Fatsa', 'Perşembe', 'Gülyalı', 'Korgan'],
    'Giresun': ['Merkez', 'Bulancak', 'Görele', 'Espiye', 'Tirebolu', 'Keşap'],
    'Rize': ['Merkez', 'Çayeli', 'Ardeşen', 'Pazar', 'Fındıklı', 'İkizdere'],
    'Artvin': ['Merkez', 'Hopa', 'Arhavi', 'Borçka', 'Şavşat', 'Yusufeli'],
    'Zonguldak': ['Merkez', 'Ereğli', 'Çaycuma', 'Devrek', 'Alaplı', 'Gökçebey'],
    'Kastamonu': ['Merkez', 'Tosya', 'Taşköprü', 'İnebolu', 'Cide', 'Araç'],
    'Sinop': ['Merkez', 'Boyabat', 'Gerze', 'Ayancık', 'Durağan'],
    'Amasya': ['Merkez', 'Merzifon', 'Suluova', 'Taşova', 'Gümüşhacıköy'],
    'Tokat': ['Merkez', 'Erbaa', 'Turhal', 'Niksar', 'Zile', 'Reşadiye'],
    'Çorum': ['Merkez', 'Sungurlu', 'Osmancık', 'İskilip', 'Alaca', 'Kargı'],
    'Bolu': ['Merkez', 'Gerede', 'Mudurnu', 'Mengen', 'Göynük'],
    'Düzce': ['Merkez', 'Akçakoca', 'Kaynaşlı', 'Gölyaka', 'Cumayeri'],
    'Karabük': ['Merkez', 'Safranbolu', 'Yenice', 'Eskipazar', 'Ovacık'],
    'Bartın': ['Merkez', 'Ulus', 'Amasra', 'Kurucaşile'],
    'Bayburt': ['Merkez', 'Demirözü', 'Aydıntepe'],
    'Gümüşhane': ['Merkez', 'Kelkit', 'Şiran', 'Kürtün', 'Torul'],

    // DOĞU ANADOLU REGION
    'Erzurum': ['Yakutiye', 'Palandöken', 'Aziziye', 'Horasan', 'Pasinler', 'Oltu', 'İspir'],
    'Malatya': ['Battalgazi', 'Yeşilyurt', 'Doğanşehir', 'Akçadağ', 'Darende', 'Hekimhan'],
    'Elazığ': ['Merkez', 'Kovancılar', 'Karakoçan', 'Palu', 'Sivrice', 'Baskil'],
    'Van': ['İpekyolu', 'Tuşba', 'Edremit', 'Erciş', 'Özalp', 'Çaldıran', 'Gevaş'],
    'Ağrı': ['Merkez', 'Doğubayazıt', 'Patnos', 'Diyadin', 'Eleşkirt', 'Tutak'],
    'Erzincan': ['Merkez', 'Üzümlü', 'Tercan', 'Çayırlı', 'Refahiye'],
    'Kars': ['Merkez', 'Sarıkamış', 'Kağızman', 'Susuz', 'Selim', 'Digor'],
    'Iğdır': ['Merkez', 'Tuzluca', 'Aralık', 'Karakoyunlu'],
    'Ardahan': ['Merkez', 'Göle', 'Çıldır', 'Hanak', 'Posof'],
    'Muş': ['Merkez', 'Bulanık', 'Malazgirt', 'Varto', 'Hasköy'],
    'Bitlis': ['Merkez', 'Tatvan', 'Ahlat', 'Adilcevaz', 'Hizan', 'Güroymak'],
    'Hakkari': ['Merkez', 'Yüksekova', 'Şemdinli', 'Çukurca'],
    'Bingöl': ['Merkez', 'Genç', 'Solhan', 'Karlıova', 'Adaklı'],
    'Tunceli': ['Merkez', 'Pertek', 'Çemişgezek', 'Hozat', 'Ovacık'],

    // GÜNEYDOĞU ANADOLU REGION
    'Gaziantep': ['Şehitkamil', 'Şahinbey', 'Nizip', 'İslahiye', 'Nurdağı', 'Oğuzeli', 'Araban'],
    'Diyarbakır': ['Bağlar', 'Kayapınar', 'Yenişehir', 'Sur', 'Bismil', 'Ergani', 'Silvan', 'Çermik'],
    'Şanlıurfa': ['Eyyübiye', 'Haliliye', 'Karaköprü', 'Siverek', 'Viranşehir', 'Akçakale', 'Birecik', 'Suruç'],
    'Mardin': ['Artuklu', 'Kızıltepe', 'Nusaybin', 'Midyat', 'Derik', 'Mazıdağı', 'Savur'],
    'Batman': ['Merkez', 'Kozluk', 'Sason', 'Beşiri', 'Gercüş', 'Hasankeyf'],
    'Siirt': ['Merkez', 'Kurtalan', 'Baykan', 'Pervari', 'Şirvan', 'Eruh'],
    'Şırnak': ['Merkez', 'Cizre', 'Silopi', 'İdil', 'Uludere', 'Beytüşşebap'],
    'Adıyaman': ['Merkez', 'Kahta', 'Besni', 'Gölbaşı', 'Gerger', 'Samsat'],
    'Kilis': ['Merkez', 'Musabeyli', 'Elbeyli', 'Polateli'],
};

// Helper function to get districts for a city
export const getCityDistricts = (city: string): string[] => {
    return CITY_DISTRICTS[city] || [];
};

// Helper function to find the parent province for a district
// Returns the parent city name, or null if not a recognized district
export const getParentCity = (possibleDistrict: string): string | null => {
    // Check if this location is a province (not a district)
    if (REGULAR_CITIES.includes(possibleDistrict as any)) {
        return null; // It's a province, not a district
    }

    // Search through all city-district mappings
    for (const [city, districts] of Object.entries(CITY_DISTRICTS)) {
        if (districts.includes(possibleDistrict)) {
            return city;
        }
    }

    return null; // District not found in our mappings
};

// Types for type-safe usage
export type CityName = typeof REGULAR_CITIES[number];
export type SeasonalSpot = typeof SEASONAL_SPOTS[number];
export type ArticleCategory = typeof ARTICLE_CATEGORIES[number];

