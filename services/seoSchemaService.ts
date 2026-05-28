/**
 * SEO Schema Utilities
 * Generates JSON-LD structured data for weather pages
 */

import { WeatherData, DailyForecast } from '../types';
import { getParentCity } from '../shared/cityData';

// Turkish month names for SEO
const TURKISH_MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const TURKISH_DAYS = [
    'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];


/**
 * Wikidata Entities for Top Cities (E-E-A-T Signal)
 * Links our pages to the Global Knowledge Graph
 */
const WIKIDATA_MAP: Record<string, string> = {
    'İstanbul': 'https://www.wikidata.org/wiki/Q406',
    'Ankara': 'https://www.wikidata.org/wiki/Q3640',
    'İzmir': 'https://www.wikidata.org/wiki/Q35997',
    'Bursa': 'https://www.wikidata.org/wiki/Q40738',
    'Antalya': 'https://www.wikidata.org/wiki/Q35835',
    'Adana': 'https://www.wikidata.org/wiki/Q40776',
    'Konya': 'https://www.wikidata.org/wiki/Q131317',
    'Şanlıurfa': 'https://www.wikidata.org/wiki/Q173336',
    'Gaziantep': 'https://www.wikidata.org/wiki/Q93338',
    'Kocaeli': 'https://www.wikidata.org/wiki/Q170366', // İzmit
    'Mersin': 'https://www.wikidata.org/wiki/Q180026',
    'Diyarbakır': 'https://www.wikidata.org/wiki/Q83387',
    'Hatay': 'https://www.wikidata.org/wiki/Q134262', // Antakya
    'Manisa': 'https://www.wikidata.org/wiki/Q147089',
    'Kayseri': 'https://www.wikidata.org/wiki/Q172239',
    'Samsun': 'https://www.wikidata.org/wiki/Q168926',
    'Balıkesir': 'https://www.wikidata.org/wiki/Q199723',
    'Kahramanmaraş': 'https://www.wikidata.org/wiki/Q173981',
    'Van': 'https://www.wikidata.org/wiki/Q185671',
    'Aydın': 'https://www.wikidata.org/wiki/Q83419'
};

/**
 * Generates WeatherForecast JSON-LD schema
 * Critical for AI Overviews and Rich Results
 */
export function generateWeatherForecastSchema(
    data: WeatherData,
    cityName: string
): object {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);

    return {
        "@context": "https://schema.org",
        "@type": "WeatherForecast",
        "name": `${cityName} 15 Günlük Hava Durumu Tahmini`,
        "datePosted": today.toISOString().split('T')[0],
        "validFrom": today.toISOString().split('T')[0],
        "validThrough": endDate.toISOString().split('T')[0],
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": data.coord?.lat || 39.0,
            "longitude": data.coord?.lon || 35.0
        },
        "about": {
            "@type": "City",
            "name": cityName,
            "containedInPlace": {
                "@type": "Country",
                "name": "Türkiye"
            },
            "sameAs": WIKIDATA_MAP[cityName] || undefined
        },
        "forecast": data.daily.slice(0, 15).map((day, index) => {
            const forecastDate = new Date(today);
            forecastDate.setDate(forecastDate.getDate() + index);

            return {
                "@type": "Observation",
                "observationDate": forecastDate.toISOString().split('T')[0],
                "measuredProperty": "temperature",
                "measuredValue": {
                    "@type": "QuantitativeValue",
                    "minValue": Math.round(day.low),
                    "maxValue": Math.round(day.high),
                    "unitCode": "CEL"
                },
                "description": day.condition
            };
        })
    };
}

/**
 * Generates FAQPage JSON-LD schema
 * High value for "People Also Ask" boxes
 */
export function generateFAQSchema(
    cityName: string,
    data: WeatherData
): object {
    const today = new Date();
    const tomorrow = data.daily[1];
    const weekendDay = data.daily.find((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d.getDay() === 6 || d.getDay() === 0;
    });

    // Calculate average for next 15 days (with fallback)
    const validDays = data.daily.slice(0, 15).filter(d => !isNaN(d.high) && !isNaN(d.low));
    const avgTemp = validDays.length > 0
        ? Math.round(validDays.reduce((sum, d) => sum + (d.high + d.low) / 2, 0) / validDays.length)
        : 15; // Fallback to reasonable default

    // Find trend (with fallback)
    const firstWeekDays = data.daily.slice(0, 7).filter(d => !isNaN(d.high));
    const secondWeekDays = data.daily.slice(7, 14).filter(d => !isNaN(d.high));
    const firstWeekAvg = firstWeekDays.length > 0 ? firstWeekDays.reduce((sum, d) => sum + d.high, 0) / firstWeekDays.length : 15;
    const secondWeekAvg = secondWeekDays.length > 0 ? secondWeekDays.reduce((sum, d) => sum + d.high, 0) / secondWeekDays.length : 15;
    const trendText = secondWeekAvg > firstWeekAvg + 2
        ? 'ısınma trendi'
        : secondWeekAvg < firstWeekAvg - 2
            ? 'soğuma trendi'
            : 'stabil seyir';

    const faqs = [
        {
            question: `${cityName}'da bugün hava nasıl?`,
            answer: `${cityName}'da bugün hava ${data.condition.toLowerCase()}, sıcaklık ${Math.round(data.currentTemp)}°C. Yüksek ${Math.round(data.high)}°C, düşük ${Math.round(data.low)}°C bekleniyor.`
        },
        {
            question: `${cityName}'da yarın hava nasıl olacak?`,
            answer: tomorrow
                ? `Yarın ${cityName}'da ${tomorrow.condition?.toLowerCase() || 'değişken'} bekleniyor. Sıcaklık ${Math.round(tomorrow.low)}°C ile ${Math.round(tomorrow.high)}°C arasında olacak.`
                : `${cityName} yarınki hava durumu tahmini için sayfayı ziyaret edin.`
        },
        {
            question: `${cityName}'da 15 günlük hava durumu nasıl?`,
            answer: `${cityName} için önümüzdeki 15 günde ortalama sıcaklık ${avgTemp}°C civarında. Genel olarak ${trendText} bekleniyor.`
        },
        {
            question: `${cityName}'da hafta sonu hava nasıl olacak?`,
            answer: weekendDay
                ? `Hafta sonu ${cityName}'da ${weekendDay.condition?.toLowerCase() || 'değişken'} bekleniyor. Sıcaklık ${Math.round(weekendDay.low)}°C ile ${Math.round(weekendDay.high)}°C arasında.`
                : `Hafta sonu hava durumu bilgisi için 15 günlük tahmini inceleyin.`
        },
        {
            question: `${cityName}'da yağmur yağacak mı?`,
            answer: data.daily.slice(0, 7).some(d => (d.rainProb || 0) > 30)
                ? `Evet, önümüzdeki hafta ${cityName}'da yağış bekleniyor. Detaylar için günlük tahminleri inceleyin.`
                : `Önümüzdeki hafta ${cityName}'da önemli yağış beklenmiyor.`
        }
    ];

    // SINAN SEO TRAP: Inject "5 Günlük" Keyword
    const fiveDays = data.daily.slice(0, 5);
    const maxTemp5 = Math.round(Math.max(...fiveDays.map(d => d.high)));
    const minTemp5 = Math.round(Math.min(...fiveDays.map(d => d.low)));
    const condition5 = fiveDays[0]?.condition || 'değişken';

    faqs.splice(2, 0, { // Insert at position 3 (High Visibility)
        question: `${cityName} 5 günlük hava durumu nasıl?`,
        answer: `${cityName} için 5 günlük hava durumu tahminine göre en yüksek sıcaklık ${maxTemp5}°C, en düşük ${minTemp5}°C olacak. ${fiveDays[0]?.day} günü ${condition5.toLowerCase()} bekleniyor.`
    });

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

/**
 * Generates dynamic meta description based on view and data
 */
export function generateMetaDescription(
    cityName: string,
    view: 'home' | 'tomorrow' | '15-days',
    data: WeatherData
): string {
    const today = new Date();
    const currentMonth = TURKISH_MONTHS[today.getMonth()];
    const currentYear = today.getFullYear();

    switch (view) {
        case '15-days':
            const validDays15 = data.daily.slice(0, 15).filter(d => !isNaN(d.high) && !isNaN(d.low));
            const avgTemp15 = validDays15.length > 0
                ? Math.round(validDays15.reduce((sum, d) => sum + (d.high + d.low) / 2, 0) / validDays15.length)
                : 15;
            return `${cityName} 15 günlük hava durumu tahmini. ${currentMonth} ${currentYear} sıcaklık trendi, ortalama ${avgTemp15}°C. Günlük detaylı hava raporu ve görsel grafikler.`;

        case 'tomorrow':
            const tomorrow = data.daily[1];
            return `${cityName} yarınki hava durumu: ${tomorrow?.condition || 'Parçalı Bulutlu'}, ${Math.round(tomorrow?.low || 0)}°C - ${Math.round(tomorrow?.high || 0)}°C. Yarın hava nasıl? Saatlik detaylı rapor ve nem oranı.`;

        default: // home
            return `${cityName} hava durumu: Şu an ${Math.round(data.currentTemp)}°C, ${data.condition}. Saatlik ve Günlük tahmin, 15 günlük trend ve meteoroloji uyarıları.`;
    }
}

/**
 * Generates BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbSchema(
    cityName: string,
    view: 'home' | 'tomorrow' | '15-days',
    parentCity?: string
): object {
    // Auto-detect parent city for districts if not provided

    // Auto-detect parent city for districts if not provided
    const effectiveParentCity = parentCity || getParentCity(cityName);

    const toSlugSimple = (name: string) => name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ç/g, 'c');

    const baseItems = [
        { name: "Ana Sayfa", url: "/" },
        { name: "Hava Durumu", url: "/hava-durumu" }
    ];

    if (effectiveParentCity) {
        // District: Add parent city first, then district
        const parentSlug = toSlugSimple(effectiveParentCity);
        const citySlug = toSlugSimple(cityName);
        baseItems.push({ name: effectiveParentCity, url: `/hava-durumu/${parentSlug}` });
        baseItems.push({ name: cityName, url: `/hava-durumu/${parentSlug}/${citySlug}` });
    } else {
        // Province: Direct link
        baseItems.push({ name: cityName, url: `/hava-durumu/${toSlugSimple(cityName)}` });
    }

    if (view === '15-days') {
        const lastUrl = baseItems[baseItems.length - 1].url;
        baseItems.push({ name: "15 Günlük Tahmin", url: `${lastUrl}/15-gunluk` });
    } else if (view === 'tomorrow') {
        const lastUrl = baseItems[baseItems.length - 1].url;
        baseItems.push({ name: "Yarın", url: `${lastUrl}/yarin` });
    }

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": baseItems.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": `https://hava-durumlari.tr${item.url}`
        }))
    };
}

/**
 * Generates WebSite JSON-LD schema (Sitelinks Search Box)
 */
export function generateWebSiteSchema(): object {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Hava Durumları Türkiye",
        "url": "https://hava-durumlari.tr",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://hava-durumlari.tr/konum-ara?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    };
}

/**
 * Generates Organization JSON-LD schema (Brand Identity)
 */
export function generateOrganizationSchema(): object {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Hava Durumları Türkiye",
        "url": "https://hava-durumlari.tr",
        "logo": "https://hava-durumlari.tr/logo.png", // Ensure this exists or use a valid path
        "sameAs": [
            "https://twitter.com/havadurumlari_tr",
            "https://www.facebook.com/havadurumlari.tr"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "iletisim@hava-durumlari.tr"
        }
    };
}

/**
 * Generates LiveBlogPosting JSON-LD schema
 * Triggers "LIVE" (CANLI) badge in SERPs
 */
export function generateLiveBlogPostingSchema(
    cityName: string,
    data: WeatherData
): object {
    const today = new Date();
    const startTime = new Date(today);
    startTime.setHours(0, 0, 1);

    const endTime = new Date(today);
    endTime.setHours(23, 59, 59);

    // Ensure we have a valid ISO string for dateModified
    const now = new Date().toISOString();

    return {
        "@context": "https://schema.org",
        "@type": "LiveBlogPosting",
        "headline": `${cityName} Anlık Hava Durumu ve Uyarılar - Canlı Takip`,
        "description": `${cityName} için dakikası dakikasına canlı hava durumu, radar görüntüleri ve meteorolojik uyarılar.`,
        "datePublished": startTime.toISOString(),
        "dateModified": now,
        "coverageStartTime": startTime.toISOString(),
        "coverageEndTime": endTime.toISOString(),
        "author": {
            "@type": "Organization",
            "name": "TG Meteoroloji Masası",
            "url": "https://hava-durumlari.tr"
        },
        "publisher": {
            "@type": "Organization",
            "name": "TG Dijital",
            "logo": {
                "@type": "ImageObject",
                "url": "https://hava-durumlari.tr/logo.png"
            }
        },
        "liveBlogUpdate": [
            {
                "@type": "BlogPosting",
                "headline": "Anlık Sıcaklık",
                "datePublished": now,
                "articleBody": `Şu an ${cityName} sıcaklık ${Math.round(data.currentTemp)}°C, hissedilen ${Math.round(data.feelsLike)}°C. ${data.condition}.`
            }
        ]
    };
}

/**
 * Injects all SEO schemas into document head
 */
export function injectSEOSchemas(
    cityName: string,
    view: 'home' | 'tomorrow' | '15-days',
    data: WeatherData
): void {
    // Remove existing dynamic schemas and canonical
    document.querySelectorAll('script[data-seo-dynamic]').forEach(el => el.remove());
    document.querySelectorAll('meta[data-seo-dynamic]').forEach(el => el.remove()); // Clean up social tags
    document.querySelector('meta[name="description"]')?.remove();
    document.querySelector('link[rel="canonical"]')?.remove();

    // Helper for Slug (Consistent with Breadcrumb)
    const toSlugSimple = (name: string) => name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ç/g, 'c');

    // 0. Inject Canonical URL
    const citySlug = toSlugSimple(cityName);
    let canonicalPath = `/hava-durumu/${citySlug}`;
    if (view === 'tomorrow') canonicalPath += '/yarin';
    else if (view === '15-days') canonicalPath += '/15-gunluk';

    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = `https://hava-durumlari.tr${canonicalPath}`;
    document.head.appendChild(canonicalLink);

    // 1. Inject Meta Description
    const metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content = generateMetaDescription(cityName, view, data);
    document.head.appendChild(metaDesc);

    // 2. Inject WeatherForecast Schema
    const weatherSchema = document.createElement('script');
    weatherSchema.type = 'application/ld+json';
    weatherSchema.setAttribute('data-seo-dynamic', 'weather');
    weatherSchema.textContent = JSON.stringify(generateWeatherForecastSchema(data, cityName));
    document.head.appendChild(weatherSchema);

    // 3. Inject FAQPage Schema
    const faqSchema = document.createElement('script');
    faqSchema.type = 'application/ld+json';
    faqSchema.setAttribute('data-seo-dynamic', 'faq');
    faqSchema.textContent = JSON.stringify(generateFAQSchema(cityName, data));
    document.head.appendChild(faqSchema);

    // 4. Inject Breadcrumb Schema
    const breadcrumbSchema = document.createElement('script');
    breadcrumbSchema.type = 'application/ld+json';
    breadcrumbSchema.setAttribute('data-seo-dynamic', 'breadcrumb');
    breadcrumbSchema.textContent = JSON.stringify(generateBreadcrumbSchema(cityName, view));
    document.head.appendChild(breadcrumbSchema);

    // 5. Inject WebSite Scope Schema (Global)
    const websiteSchema = document.createElement('script');
    websiteSchema.type = 'application/ld+json';
    websiteSchema.setAttribute('data-seo-dynamic', 'website');
    websiteSchema.textContent = JSON.stringify(generateWebSiteSchema());
    document.head.appendChild(websiteSchema);

    // 6. Inject Organization Schema (Global)
    const orgSchema = document.createElement('script');
    orgSchema.type = 'application/ld+json';
    orgSchema.setAttribute('data-seo-dynamic', 'organization');
    orgSchema.textContent = JSON.stringify(generateOrganizationSchema());
    document.head.appendChild(orgSchema);

    // 7. Inject LiveBlogPosting Schema (Only for Home/Dashboard)
    if (view === 'home' && data) {
        const liveSchema = document.createElement('script');
        liveSchema.type = 'application/ld+json';
        liveSchema.setAttribute('data-seo-dynamic', 'live-blog');
        liveSchema.textContent = JSON.stringify(generateLiveBlogPostingSchema(cityName, data));
        document.head.appendChild(liveSchema);
    }

    // 8. Inject Open Graph & Twitter Card Meta Tags (Social)
    const pageTitle = document.title;
    const pageUrl = `https://hava-durumlari.tr${canonicalPath}`;
    const descContent = metaDesc.content;
    const imageUrl = 'https://hava-durumlari.tr/social-share-default.png'; // Placeholder for now

    const metaTags = [
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: descContent },
        { property: 'og:url', content: pageUrl },
        { property: 'og:image', content: imageUrl },
        { property: 'og:site_name', content: 'Hava Durumları Türkiye' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: descContent },
        { name: 'twitter:image', content: imageUrl },
        { name: 'twitter:site', content: '@havadurumlari_tr' }
    ];

    metaTags.forEach(tag => {
        const key = tag.property ? 'property' : 'name';
        const el = document.createElement('meta');
        el.setAttribute(key, tag.property || tag.name || '');
        el.setAttribute('content', tag.content);
        el.setAttribute('data-seo-dynamic', 'social');
        document.head.appendChild(el);
    });

    // 9. Inject Speakable Schema (AEO - Voice Search)
    const speakableSchema = document.createElement('script');
    speakableSchema.type = 'application/ld+json';
    speakableSchema.setAttribute('data-seo-dynamic', 'speakable');
    speakableSchema.textContent = JSON.stringify(generateSpeakableSchema());
    document.head.appendChild(speakableSchema);
}

/**
 * Generates Speakable JSON-LD schema (Voice Search)
 * Targets the main weather summary text
 */
export function generateSpeakableSchema(): object {
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["#weather-summary-text", ".sinan-speakable-summary"]
        }
    };
}
