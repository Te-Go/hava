/**
 * Regional Hub Registry
 * 
 * Defines major "Hub" cities that can provide data (Marine, Traffic, Ski)
 * for smaller surrounding towns (Spokes).
 */

export interface IslandHub {
    id: string; // Slug (e.g., 'antalya')
    name: string; // Display Name (e.g., 'Antalya')
    coord: { lat: number; lon: number };
    modules: ('marine' | 'traffic' | 'ski')[];
    radiusKm: number; // Max radius to serve spokes
}

export const ISLAND_HUBS: IslandHub[] = [
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
    {
        id: 'mersin',
        name: 'Mersin',
        coord: { lat: 36.8121, lon: 34.6415 },
        modules: ['marine'],
        radiusKm: 70
    },
    {
        id: 'trabzon',
        name: 'Trabzon',
        coord: { lat: 41.0027, lon: 39.7168 },
        modules: ['marine'],
        radiusKm: 60
    },
    {
        id: 'samsun',
        name: 'Samsun',
        coord: { lat: 41.2867, lon: 36.3300 },
        modules: ['marine'],
        radiusKm: 60
    },

    // --- SKI HUBS ---
    {
        id: 'bursa',
        name: 'Bursa', // Proxy for Uludag
        coord: { lat: 40.1885, lon: 29.0610 },
        modules: ['ski', 'traffic'],
        radiusKm: 40
    },
    {
        id: 'kayseri', // Proxy for Erciyes
        name: 'Kayseri',
        coord: { lat: 38.7312, lon: 35.4787 },
        modules: ['ski'],
        radiusKm: 30
    },
    {
        id: 'erzurum', // Proxy for Palandoken
        name: 'Erzurum',
        coord: { lat: 39.9055, lon: 41.2658 },
        modules: ['ski'],
        radiusKm: 20
    }
];

export const getHubById = (id: string): IslandHub | undefined => {
    return ISLAND_HUBS.find(h => h.id === id);
};
