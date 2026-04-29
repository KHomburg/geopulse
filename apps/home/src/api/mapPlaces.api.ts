import apiClient from "./client";

const CACHE_TTL_MS = 10 * 60 * 1000;

export interface NearbyPlace {
	id: string;
	name: string;
	category: string;
	icon: string;
	lat: number;
	lng: number;
	distanceMeters: number;
	contextLine: string | null;
}

export interface MapDiscovery {
	areaLabel: string | null;
	places: NearbyPlace[];
}

interface DiscoveryParams {
	lat: number;
	lng: number;
	radiusMeters?: number;
	signal?: AbortSignal;
}

interface CacheEntry<T> {
	expiresAt: number;
	value: T;
}

const roundForCache = (value: number, precision = 3) =>
	value.toFixed(precision);

const buildCacheKey = (lat: number, lng: number, radiusMeters: number) =>
	`geopulse-map-discovery:${roundForCache(lat)}:${roundForCache(
		lng
	)}:${radiusMeters}`;

const readCache = <T>(key: string) => {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const raw = window.sessionStorage.getItem(key);
		if (!raw) {
			return null;
		}

		const parsed = JSON.parse(raw) as CacheEntry<T>;
		if (parsed.expiresAt <= Date.now()) {
			window.sessionStorage.removeItem(key);
			return null;
		}

		return parsed.value;
	} catch {
		return null;
	}
};

const writeCache = <T>(key: string, value: T) => {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.sessionStorage.setItem(
			key,
			JSON.stringify({
				expiresAt: Date.now() + CACHE_TTL_MS,
				value
			})
		);
	} catch {
		// Ignore cache write failures and fall back to live API reads.
	}
};

export const mapPlacesApi = {
	async getDiscovery({
		lat,
		lng,
		radiusMeters = 900,
		signal
	}: DiscoveryParams): Promise<MapDiscovery> {
		const cacheKey = buildCacheKey(lat, lng, radiusMeters);
		const cachedDiscovery = readCache<MapDiscovery>(cacheKey);

		if (cachedDiscovery) {
			return cachedDiscovery;
		}

		const { data } = await apiClient.get<{ data: MapDiscovery }>(
			"/map/discovery",
			{
				params: {
					lat,
					lng,
					radiusMeters
				},
				signal
			}
		);

		writeCache(cacheKey, data.data);
		return data.data;
	}
};
