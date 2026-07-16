/**
 * Island Data Services Index
 * Exports all automated data services for island widgets
 */

// Marine Data (Open-Meteo Marine API)
export {
    fetchMarineData,
    generateMarineNarrative,
    calculateBeachScore,
    isCoastalCity,
    type MarineData
} from './marineService';

// Traffic Data (Algorithmic estimation)
export {
    estimateTraffic,
    isMetroCity,
    type TrafficData
} from './trafficService';

// Ski Conditions (Weather-derived)
export {
    calculateSkiConditions,
    hasSkiResort,
    SKI_RESORTS,
    type SkiData,
    type SkiResortInfo
} from './skiService';
