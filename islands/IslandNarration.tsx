import React from 'react';
import { ISLAND_CATEGORY_NAMES, ISLAND_CATEGORY_ICONS, type IslandCategory } from '../shared/provinceIslandMap';

interface IslandNarrationProps {
    cityDisplay: string;
    activeCategories: IslandCategory[];
    narratives: Record<IslandCategory, string>;
    lastUpdated: number;
}

/**
 * IslandNarration - SEO-optimized summary box below island widgets
 * 
 * Generates unique, contextual content for each city based on
 * which island categories are active, providing differentiated
 * content for search engine ranking.
 * 
 * Design: Matches TrafficWidget/MarineWidget pattern with light/dark mode
 */
const IslandNarration: React.FC<IslandNarrationProps> = ({
    cityDisplay,
    activeCategories,
    narratives,
    lastUpdated
}) => {
    // Generate the opening statement
    const getOpeningStatement = () => {
        const categoryNames = activeCategories
            .map(cat => ISLAND_CATEGORY_NAMES[cat].toLowerCase())
            .join(', ');

        return `${cityDisplay} için güncel ${categoryNames} bilgileri aşağıda özetlenmiştir.`;
    };

    // Format timestamp
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get category-specific intro text
    const getCategoryIntro = (category: IslandCategory): string => {
        switch (category) {
            case 'traffic':
                return 'Trafik durumu açısından';
            case 'marine':
                return 'Deniz ve sahil koşulları açısından';
            case 'ski':
                return 'Kayak ve kış sporları açısından';
            case 'agriculture':
                return 'Tarımsal faaliyetler açısından';
            case 'altitude':
                return 'Yüksek irtifa koşulları açısından';
            case 'fireRisk':
                return 'Orman yangını riski açısından';
            case 'tourism':
                return 'Turizm ve gezi konforu açısından';
            default:
                return 'Bölgesel koşullar açısından';
        }
    };

    // Don't render if no categories
    if (activeCategories.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="h-[50px] px-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📋</span>
                </div>
                <h2 className="font-bold text-slate-800 dark:text-white text-sm">
                    {cityDisplay} Bölgesel Hava Durumu Özeti
                </h2>
            </div>

            {/* Opening Statement */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {getOpeningStatement()}
                </p>
            </div>

            {/* Category Summaries */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {activeCategories.map(category => {
                    const narrative = narratives[category];
                    if (!narrative) return null;

                    return (
                        <div
                            key={category}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <span className="text-xl flex-shrink-0 mt-0.5">
                                {ISLAND_CATEGORY_ICONS[category]}
                            </span>
                            <div className="min-w-0">
                                <span className="text-slate-500 dark:text-slate-400 text-sm">
                                    {getCategoryIntro(category)}:
                                </span>{' '}
                                <span className="text-slate-700 dark:text-slate-200 text-sm">
                                    {narrative}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer with timestamp */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-500">
                    Son güncelleme: {formatDate(lastUpdated)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                    hava-durumlari.tr • {cityDisplay}
                </span>
            </div>

            {/* SEO Schema Markup (hidden) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WeatherForecast",
                        "name": `${cityDisplay} Bölgesel Hava Durumu`,
                        "description": getOpeningStatement(),
                        "dateModified": new Date(lastUpdated).toISOString(),
                        "areaServed": {
                            "@type": "City",
                            "name": cityDisplay,
                            "containedInPlace": {
                                "@type": "Country",
                                "name": "Türkiye"
                            }
                        }
                    })
                }}
            />
        </div>
    );
};

export default IslandNarration;

/**
 * Helper function to generate narratives for each category
 */
export function generateIslandNarratives(
    category: IslandCategory,
    data: any,
    cityName: string
): string {
    switch (category) {
        case 'traffic':
            const congestion = data?.congestionLevel || 'normal';
            return congestion === 'high'
                ? `${cityName}'da trafik yoğun. Alternatif güzergahları değerlendirin.`
                : `${cityName}'da trafik akıcı seyrediyor.`;

        case 'marine':
            const seaTemp = data?.seaTemp || 20;
            const wave = data?.waveHeight || 0.5;
            return `Deniz suyu sıcaklığı ${seaTemp}°C, dalga yüksekliği ${wave}m civarında.`;

        case 'ski':
            const snow = data?.snowDepth || 0;
            return snow > 50
                ? `Kayak için uygun koşullar. Kar kalınlığı ${snow}cm.`
                : `Kar kalınlığı ${snow}cm. Koşulları takip edin.`;

        case 'agriculture':
            const soilTemp = data?.soilTemp || 15;
            const moisture = data?.moistureLabel || 'Normal';
            return `Toprak sıcaklığı ${soilTemp}°C, nem durumu ${moisture.toLowerCase()}.`;

        case 'altitude':
            const elevation = data?.elevation || 1500;
            const road = data?.roadCondition || 'Normal';
            return `${elevation}m yükseklikte yol durumu: ${road}.`;

        case 'fireRisk':
            const risk = data?.riskLevel || 'Orta';
            return `Yangın riski ${risk.toLowerCase()} seviyede.`;

        case 'tourism':
            const comfort = data?.comfortLabel || 'Normal';
            const bestTime = data?.bestTimeToVisit || 'Öğleden Sonra';
            return `Gezi konforu ${comfort.toLowerCase()}, en uygun zaman ${bestTime.toLowerCase()}.`;

        default:
            return `${cityName} için güncel bölgesel bilgiler yukarıda sunulmuştur.`;
    }
}
