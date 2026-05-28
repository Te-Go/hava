// Self-contained test script

interface IslandHub {
    id: string; // Slug (e.g., 'antalya')
    name: string; // Display Name (e.g., 'Antalya')
    coord: { lat: number; lon: number };
    modules: ('marine' | 'traffic' | 'ski')[];
    radiusKm: number; // Max radius to serve spokes
}

const ISLAND_HUBS: IslandHub[] = [
    // --- MARITIME HUBS ---
    {
        id: 'istanbul',
        name: 'İstanbul',
        coord: { lat: 41.0082, lon: 28.9784 },
        modules: ['marine', 'traffic'],
        radiusKm: 50
    },
    {
        id: 'antalya',
        name: 'Antalya',
        coord: { lat: 36.8969, lon: 30.7133 },
        modules: ['marine', 'traffic'], // Traffic if available
        radiusKm: 80 // Covers Belek, Kemer, Side
    },
    {
        id: 'izmir',
        name: 'İzmir',
        coord: { lat: 38.4237, lon: 27.1428 },
        modules: ['marine', 'traffic'],
        radiusKm: 60 // Covers Çeşme, Urla (maybe)
    },
    // ... others omitted for brevity
];

function haversineDistance(
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

function findNearestHub(
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

const belek = { lat: 36.8625, lon: 31.0556 };
const antalya = { lat: 36.8969, lon: 30.7133 };
const istanbul = { lat: 41.0082, lon: 28.9784 };

console.log("--- DEBUG LOCATION UTILS ---");
console.log(`Belek Coords: ${belek.lat}, ${belek.lon}`);
console.log(`Antalya Hub: ${antalya.lat}, ${antalya.lon}`);
console.log(`Istanbul Hub: ${istanbul.lat}, ${istanbul.lon}`);

const distToAntalya = haversineDistance(belek.lat, belek.lon, antalya.lat, antalya.lon);
console.log(`Distance to Antalya: ${distToAntalya.toFixed(2)} km`);

const distToIstanbul = haversineDistance(belek.lat, belek.lon, istanbul.lat, istanbul.lon);
console.log(`Distance to Istanbul: ${distToIstanbul.toFixed(2)} km`);

const nearestMarine = findNearestHub(belek.lat, belek.lon, 'marine');
console.log("Nearest Marine Hub:", nearestMarine?.hub.name);

const nearestTraffic = findNearestHub(belek.lat, belek.lon, 'traffic');
console.log("Nearest Traffic Hub:", nearestTraffic?.hub.name);

console.log("----------------------------");

// Check (0,0) Case
const nearestZero = findNearestHub(0, 0, 'traffic');
console.log("Nearest to (0,0):", nearestZero?.hub.name);
