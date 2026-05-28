/**
 * Cache Service
 * Provides a generic wrapper for API calls using localStorage with TTL support.
 */

const CACHE_PREFIX = 'tg_cache_';
const CACHE_VERSION = 'v1';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    version: string;
}

/**
 * Wraps a promise with caching logic.
 * @param key Unique cache key (e.g., 'weather_istanbul')
 * @param fetcher The function that returns a Promise of the data
 * @param ttlMinutes Time to live in minutes
 * @returns The data (from cache or fresh)
 */
export async function fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMinutes: number
): Promise<T> {
    if (typeof window === 'undefined') {
        return fetcher(); // Server-side fallback
    }

    const fullKey = `${CACHE_PREFIX}${key}`;

    // 1. Try to get from cache
    try {
        const cached = localStorage.getItem(fullKey);
        if (cached) {
            const entry: CacheEntry<T> = JSON.parse(cached);

            // Check Version
            if (entry.version !== CACHE_VERSION) {
                localStorage.removeItem(fullKey);
            }
            // Check TTL
            else {
                const ageMinutes = (Date.now() - entry.timestamp) / (1000 * 60);
                if (ageMinutes < ttlMinutes) {
                    // console.debug(`[Cache] Hit: ${key} (Age: ${Math.round(ageMinutes)}m)`);
                    return entry.data;
                } else {
                    // console.debug(`[Cache] Expired: ${key}`);
                    localStorage.removeItem(fullKey);
                }
            }
        }
    } catch (e) {
        console.warn('[Cache] Read Error', e);
    }

    // 2. Fetch Fresh Data
    try {
        const data = await fetcher();

        // 3. Save to Cache
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                version: CACHE_VERSION
            };
            localStorage.setItem(fullKey, JSON.stringify(entry));
        } catch (e) {
            console.warn('[Cache] Write Error (Quota Exceeded?)', e);
            // Optional: Clear old cache if quota exceeded
            clearOldCache();
        }

        return data;
    } catch (error) {
        // 4. Return Stale Cache if Fetch Fails (Offline Strategy)
        // If standard fetch fails, we might want to return expired cache if it exists?
        // For now, simple pass-through error.
        throw error;
    }
}

/**
 * Clears old cache entries to free up space.
 * Simplistic strategy: remove anything older than 24 hours.
 */
function clearOldCache() {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const item = localStorage.getItem(key);
                    if (item) {
                        const entry = JSON.parse(item);
                        const ageHours = (Date.now() - entry.timestamp) / (1000 * 60 * 60);
                        if (ageHours > 24) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch {
                    // invalid item, remove it
                    localStorage.removeItem(key);
                }
            }
        }
    } catch (e) { console.error('Cache cleanup failed', e); }
}

export function flushCache() {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
}
