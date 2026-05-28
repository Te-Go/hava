import React from 'react';
import TrafficWidget from './TrafficWidget';
import MarineWidget from './MarineWidget';
import SkiConditions from './SkiConditions';
import RegionalSummary from './RegionalSummary';
import AgricultureWidget from './AgricultureWidget';
import AltitudeWidget from './AltitudeWidget';
import FireRiskWidget from './FireRiskWidget';
import TourismWidget from './TourismWidget';
import IslandNarration, { generateIslandNarratives } from './IslandNarration';

import type { TomTomTrafficData } from '../services/tomtomTrafficService';
import type { MarineData } from '../services/marineService';
import type { SkiData } from '../services/skiService';
import type { AgricultureData } from '../services/agricultureService';
import type { AltitudeData } from '../services/altitudeService';
import type { FireRiskData } from '../services/fireRiskService';
import type { TourismData } from '../services/tourismService';
import type { IslandCategory } from '../shared/provinceIslandMap';

interface IslandPanelProps {
    // Existing data types
    traffic?: TomTomTrafficData | null;
    marine?: MarineData | null;
    ski?: SkiData | null;

    // New data types
    agriculture?: AgricultureData | null;
    altitude?: AltitudeData | null;
    fireRisk?: FireRiskData | null;
    tourism?: TourismData | null;

    // Display props
    cityDisplay: string;
    trafficCityDisplay?: string;
    marineCityDisplay?: string;
    fallbackNarrative: string;

    // Optional: show narration box
    showNarration?: boolean;
}

/**
 * IslandPanel - Unified container for contextual weather widgets
 * 
 * Layout Logic (Mobile-First):
 * - Mobile: Vertical stack (flex-col)
 * - Desktop: Side-by-side grid for 2+ widgets, centered for 1 widget
 * - Narration box below widgets for SEO
 */
const IslandPanel: React.FC<IslandPanelProps> = ({
    traffic,
    marine,
    ski,
    agriculture,
    altitude,
    fireRisk,
    tourism,
    cityDisplay,
    trafficCityDisplay,
    marineCityDisplay,
    fallbackNarrative,
    showNarration = true
}) => {
    // Determine which widgets are active
    const hasTraffic = !!traffic;
    const hasMarine = !!marine;
    const hasSki = !!ski;
    const hasAgriculture = !!agriculture;
    const hasAltitude = !!altitude;
    const hasFireRisk = !!fireRisk && fireRisk.isFireSeason;
    const hasTourism = !!tourism;

    // Build active categories list (for narration)
    const activeCategories: IslandCategory[] = [];
    if (hasTraffic) activeCategories.push('traffic');
    if (hasMarine) activeCategories.push('marine');
    if (hasSki) activeCategories.push('ski');
    if (hasAgriculture) activeCategories.push('agriculture');
    if (hasAltitude) activeCategories.push('altitude');
    if (hasFireRisk) activeCategories.push('fireRisk');
    if (hasTourism) activeCategories.push('tourism');

    const widgetCount = activeCategories.length;
    const lastUpdated = Date.now();

    // Derive narratives for each category
    const trafficNarrative = traffic?.congestionLevel === 'high'
        ? 'Trafik yoğunluğu yüksek.'
        : 'Trafik akıcı.';
    const marineNarrative = marine ? `Deniz suyu ${marine.seaTemp}°C.` : '';
    const skiNarrative = ski ? `Kar kalınlığı ${ski.snowDepth}cm.` : '';

    // Build narratives object for IslandNarration
    const narratives: Record<IslandCategory, string> = {
        traffic: generateIslandNarratives('traffic', traffic, cityDisplay),
        marine: generateIslandNarratives('marine', marine, cityDisplay),
        ski: generateIslandNarratives('ski', ski, cityDisplay),
        agriculture: generateIslandNarratives('agriculture', agriculture, cityDisplay),
        altitude: generateIslandNarratives('altitude', altitude, cityDisplay),
        fireRisk: generateIslandNarratives('fireRisk', fireRisk, cityDisplay),
        tourism: generateIslandNarratives('tourism', tourism, cityDisplay),
    };

    // If no widgets, show fallback
    if (widgetCount === 0) {
        return (
            <div className="mt-6">
                <RegionalSummary
                    narrative={fallbackNarrative}
                    cityDisplay={cityDisplay}
                />
            </div>
        );
    }

    // SPECIAL LAYOUT: Stacked Traffic/Marine + Full Height Tourism
    // Condition: We have Tourism AND at least one of Traffic/Marine
    const isStackedLayout = hasTourism && (hasTraffic || hasMarine);

    return (
        <>
            <div className="mt-6">
                {isStackedLayout ? (
                    // ════════════════════════════════════════════════════════════════
                    // LAYOUT A: STACKED (Traffic+Marine Left, Tourism Right)
                    // Desktop: Flex row (Left 40%, Right 60%)
                    // Mobile: Vertical stack
                    // ════════════════════════════════════════════════════════════════
                    <div className="flex flex-col md:flex-row gap-4 mb-6">

                        {/* LEFT COLUMN (Stack): Traffic & Marine (40%) */}
                        <div className="w-full md:w-[40%] flex flex-col gap-4">
                            {hasTraffic && (
                                <div className="w-full">
                                    <TrafficWidget
                                        city={cityDisplay}
                                        cityDisplay={trafficCityDisplay || cityDisplay}
                                        data={traffic}
                                        narrative={trafficNarrative}
                                        lastUpdated={lastUpdated}
                                    />
                                </div>
                            )}
                            {hasMarine && (
                                <div className="w-full">
                                    <MarineWidget
                                        data={marine}
                                        cityDisplay={marineCityDisplay}
                                        narrative={marineNarrative}
                                        lastUpdated={lastUpdated}
                                    />
                                </div>
                            )}
                            {/* Render other minor widgets in the stack if they exist */}
                            {hasSki && ski && (
                                <SkiConditions data={ski} narrative={skiNarrative} lastUpdated={lastUpdated} />
                            )}
                            {hasAgriculture && agriculture && (
                                <AgricultureWidget data={agriculture} cityDisplay={cityDisplay} lastUpdated={lastUpdated} />
                            )}
                            {hasAltitude && altitude && (
                                <AltitudeWidget data={altitude} cityDisplay={cityDisplay} lastUpdated={lastUpdated} />
                            )}
                            {hasFireRisk && fireRisk && (
                                <FireRiskWidget data={fireRisk} cityDisplay={cityDisplay} lastUpdated={lastUpdated} />
                            )}
                        </div>

                        {/* RIGHT COLUMN: Tourism (60%) */}
                        <div className="w-full md:w-[60%] flex flex-col">
                            <div className="h-full">
                                <TourismWidget
                                    data={tourism}
                                    cityDisplay={cityDisplay}
                                    lastUpdated={lastUpdated}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    // ════════════════════════════════════════════════════════════════
                    // LAYOUT B: STANDARD GRID (Fallback)
                    // Used when Tourism is missing or we only have single widgets
                    // ════════════════════════════════════════════════════════════════
                    <div className={widgetCount === 1 ? 'flex flex-col items-center' : 'grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch'}>
                        {/* Traffic Widget */}
                        {hasTraffic && (
                            <div className={`${widgetCount === 1 ? 'w-full md:max-w-lg' : 'w-full'} h-full`}>
                                <TrafficWidget
                                    city={cityDisplay}
                                    cityDisplay={trafficCityDisplay || cityDisplay}
                                    data={traffic}
                                    narrative={trafficNarrative}
                                    lastUpdated={lastUpdated}
                                />
                            </div>
                        )}

                        {/* Marine Widget */}
                        {hasMarine && (
                            <div className={`${widgetCount === 1 ? 'w-full md:max-w-lg' : 'w-full'} h-full`}>
                                <MarineWidget
                                    data={marine}
                                    cityDisplay={marineCityDisplay}
                                    narrative={marineNarrative}
                                    lastUpdated={lastUpdated}
                                />
                            </div>
                        )}

                        {/* Ski Widget */}
                        {hasSki && ski && (
                            <div className={`${widgetCount === 1 ? 'w-full md:max-w-lg' : 'w-full'} h-full`}>
                                <SkiConditions
                                    data={ski}
                                    narrative={skiNarrative}
                                    lastUpdated={lastUpdated}
                                />
                            </div>
                        )}

                        {/* Agriculture Widget */}
                        {hasAgriculture && agriculture && (
                            <div className={`${widgetCount === 1 ? 'w-full md:max-w-lg' : 'w-full'} h-full`}>
                                <AgricultureWidget
                                    data={agriculture}
                                    cityDisplay={cityDisplay}
                                    lastUpdated={lastUpdated}
                                />
                            </div>
                        )}

                        {/* Altitude Widget */}
                        {hasAltitude && altitude && (
                            <div className={`${widgetCount === 1 ? 'w-full md:max-w-lg' : 'w-full'} h-full`}>
                                <AltitudeWidget
                                    data={altitude}
                                    cityDisplay={cityDisplay}
                                    lastUpdated={lastUpdated}
                                />
                            </div>
                        )}

                        {/* Fire Risk Widget */}
                        {hasFireRisk && fireRisk && (
                            <div className={`${widgetCount === 1 ? 'w-full md:max-w-lg' : 'w-full'} h-full`}>
                                <FireRiskWidget
                                    data={fireRisk}
                                    cityDisplay={cityDisplay}
                                    lastUpdated={lastUpdated}
                                />
                            </div>
                        )}

                        {/* Tourism Widget (Fallback position) */}
                        {hasTourism && tourism && (
                            <div className={`${widgetCount === 1 ? 'w-full md:max-w-lg' : 'w-full'} h-full`}>
                                <TourismWidget
                                    data={tourism}
                                    cityDisplay={cityDisplay}
                                    lastUpdated={lastUpdated}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SEO Narration Box */}
            {showNarration && activeCategories.length > 0 && (
                <IslandNarration
                    cityDisplay={cityDisplay}
                    activeCategories={activeCategories}
                    narratives={narratives}
                    lastUpdated={lastUpdated}
                />
            )}
        </>
    );
};

export default IslandPanel;
