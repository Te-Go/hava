import { IslandHub, ISLAND_HUBS } from './islandHubs';

/**
 * Calculates the Great Circle distance between two points in Kilometers
 * using the Haversine formula.
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Finds the nearest supported Island Hub for a given location.
 * @param lat Target latitude
 * @param lon Target longitude
 * @param moduleType Filter by capability (e.g. 'marine' must be supported)
 */
export function findNearestHub(
    lat: number,
    lon: number,
    moduleType: 'marine' | 'traffic' | 'ski'
): { hub: IslandHub; distance: number } | null {
    let bestHub: IslandHub | null = null;
    let minDistance = Infinity;

    for (const hub of ISLAND_HUBS) {
        // 1. Check if hub supports the required module
        if (!hub.modules.includes(moduleType)) continue;

        // 2. Calculate distance
        const dist = haversineDistance(lat, lon, hub.coord.lat, hub.coord.lon);

        // 3. Check radius and optimality
        if (dist <= hub.radiusKm && dist < minDistance) {
            minDistance = dist;
            bestHub = hub;
        }
    }

    if (bestHub) {
        return { hub: bestHub, distance: minDistance };
    }

    return null;
}
