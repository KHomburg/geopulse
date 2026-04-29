const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const CACHE_TTL_MS = 10 * 60 * 1000;
const USER_AGENT = "GeoPulse/1.0 (map discovery proxy)";

const PRIMARY_PLACE_TAGS = [
	"amenity",
	"tourism",
	"leisure",
	"historic",
	"shop",
	"railway"
] as const;

const PLACE_ICONS: Record<string, string> = {
	bakery: "🥐",
	bar: "🍸",
	biergarten: "🍻",
	bus_station: "🚌",
	cafe: "☕",
	cinema: "🎬",
	fast_food: "🍔",
	food_court: "🍜",
	gallery: "🖼️",
	hotel: "🏨",
	library: "📚",
	museum: "🏛️",
	nightclub: "🎶",
	park: "🌳",
	pharmacy: "💊",
	playground: "🛝",
	pub: "🍺",
	restaurant: "🍽️",
	station: "🚉",
	supermarket: "🛒",
	theatre: "🎭",
	tram_stop: "🚊",
	viewpoint: "📷"
};

const DEFAULT_ICONS: Record<string, string> = {
	amenity: "📍",
	historic: "🏛️",
	leisure: "🌿",
	railway: "🚉",
	shop: "🛍️",
	tourism: "⭐"
};

const PLACE_PRIORITIES: Record<string, number> = {
	attraction: 92,
	bakery: 88,
	bar: 82,
	biergarten: 83,
	cafe: 90,
	cinema: 77,
	fast_food: 78,
	gallery: 79,
	hotel: 65,
	library: 74,
	memorial: 20,
	museum: 84,
	nightclub: 72,
	park: 85,
	pharmacy: 66,
	plaque: 12,
	playground: 76,
	pub: 81,
	restaurant: 89,
	station: 68,
	statue: 24,
	supermarket: 70,
	theatre: 80,
	tram_stop: 60,
	viewpoint: 86
};

const DEFAULT_PRIORITY_BY_TAG: Record<string, number> = {
	amenity: 64,
	historic: 32,
	leisure: 71,
	railway: 58,
	shop: 69,
	tourism: 73
};

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

export interface MapDiscoveryResult {
	areaLabel: string | null;
	places: NearbyPlace[];
}

interface OverpassElement {
	type: "node" | "way" | "relation";
	id: number;
	lat?: number;
	lon?: number;
	center?: {
		lat: number;
		lon: number;
	};
	tags?: Record<string, string>;
}

interface OverpassResponse {
	elements: OverpassElement[];
}

interface NominatimResponse {
	name?: string;
	display_name?: string;
	address?: Record<string, string>;
}

interface RankedNearbyPlace extends NearbyPlace {
	priority: number;
}

interface CacheEntry {
	expiresAt: number;
	value: MapDiscoveryResult;
}

const discoveryCache = new Map<string, CacheEntry>();
const inFlightDiscoveryRequests = new Map<
	string,
	Promise<MapDiscoveryResult>
>();

const roundForCache = (value: number, precision = 3) =>
	value.toFixed(precision);

const formatCategory = (value: string) =>
	value
		.split(";")[0]
		.replace(/_/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());

const getPrimaryTag = (tags: Record<string, string>) => {
	for (const key of PRIMARY_PLACE_TAGS) {
		if (tags[key]) {
			return { key, value: tags[key] };
		}
	}

	return null;
};

const getIcon = (tagKey: string, tagValue: string) =>
	PLACE_ICONS[tagValue] ?? DEFAULT_ICONS[tagKey] ?? "📍";

const getPriority = (tagKey: string, tagValue: string) =>
	PLACE_PRIORITIES[tagValue] ?? DEFAULT_PRIORITY_BY_TAG[tagKey] ?? 50;

const getCoordinates = (element: OverpassElement) => {
	if (typeof element.lat === "number" && typeof element.lon === "number") {
		return { lat: element.lat, lng: element.lon };
	}

	if (element.center) {
		return { lat: element.center.lat, lng: element.center.lon };
	}

	return null;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceMeters = (
	fromLat: number,
	fromLng: number,
	toLat: number,
	toLng: number
) => {
	const earthRadiusMeters = 6_371_000;
	const latDelta = toRadians(toLat - fromLat);
	const lngDelta = toRadians(toLng - fromLng);
	const originLat = toRadians(fromLat);
	const destinationLat = toRadians(toLat);

	const a =
		Math.sin(latDelta / 2) ** 2 +
		Math.cos(originLat) *
			Math.cos(destinationLat) *
			Math.sin(lngDelta / 2) ** 2;

	return Math.round(
		earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	);
};

const buildContextLine = (tags: Record<string, string>) => {
	const parts = [
		tags["addr:street"] ?? tags["addr:place"] ?? null,
		tags["addr:suburb"] ?? tags["addr:neighbourhood"] ?? null
	].filter(Boolean);

	return parts.length > 0 ? parts.join(" · ") : null;
};

const buildNearbyPlacesQuery = (
	lat: number,
	lng: number,
	radiusMeters: number
) => {
	const queryParts = [
		'node["amenity"]["name"]',
		'way["amenity"]["name"]',
		'relation["amenity"]["name"]',
		'node["tourism"]["name"]',
		'way["tourism"]["name"]',
		'relation["tourism"]["name"]',
		'node["leisure"]["name"]',
		'way["leisure"]["name"]',
		'relation["leisure"]["name"]',
		'node["historic"]["name"]',
		'way["historic"]["name"]',
		'relation["historic"]["name"]',
		'node["shop"]["name"]',
		'way["shop"]["name"]',
		'relation["shop"]["name"]',
		'node["railway"~"station|tram_stop"]["name"]',
		'way["railway"~"station|tram_stop"]["name"]',
		'relation["railway"~"station|tram_stop"]["name"]'
	]
		.map((selector) => `${selector}(around:${radiusMeters},${lat},${lng});`)
		.join("\n");

	return `[out:json][timeout:20];\n(\n${queryParts}\n);\nout center;`;
};

const fetchJson = async <T>(url: string, init?: RequestInit) => {
	const response = await fetch(url, init);

	if (!response.ok) {
		throw new Error(
			`Map discovery upstream failed with status ${response.status}`
		);
	}

	return (await response.json()) as T;
};

const fetchNearbyPlaces = async (
	lat: number,
	lng: number,
	radiusMeters: number
) => {
	const data = await fetchJson<OverpassResponse>(OVERPASS_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "text/plain;charset=UTF-8",
			"User-Agent": USER_AGENT
		},
		body: buildNearbyPlacesQuery(lat, lng, radiusMeters)
	});

	const dedupe = new Map<string, RankedNearbyPlace>();

	for (const element of data.elements) {
		const tags = element.tags ?? {};
		const name = tags.name?.trim();
		const primaryTag = getPrimaryTag(tags);
		const coordinates = getCoordinates(element);

		if (!name || !primaryTag || !coordinates) {
			continue;
		}

		const distanceMeters = getDistanceMeters(
			lat,
			lng,
			coordinates.lat,
			coordinates.lng
		);
		const priority = getPriority(primaryTag.key, primaryTag.value);
		const dedupeKey = `${name.toLowerCase()}-${primaryTag.value}`;

		if (!dedupe.has(dedupeKey)) {
			dedupe.set(dedupeKey, {
				id: `${element.type}-${element.id}`,
				name,
				category: formatCategory(primaryTag.value),
				icon: getIcon(primaryTag.key, primaryTag.value),
				lat: coordinates.lat,
				lng: coordinates.lng,
				distanceMeters,
				contextLine: buildContextLine(tags),
				priority
			});
		}
	}

	return [...dedupe.values()]
		.filter((place) => place.priority >= 40)
		.sort((left, right) => {
			if (right.priority !== left.priority) {
				return right.priority - left.priority;
			}

			return left.distanceMeters - right.distanceMeters;
		})
		.slice(0, 10)
		.map(({ priority, ...place }) => place);
};

const fetchAreaLabel = async (lat: number, lng: number) => {
	const params = new URLSearchParams({
		format: "jsonv2",
		lat: String(lat),
		lon: String(lng),
		zoom: "16",
		addressdetails: "1",
		"accept-language": "en"
	});

	const data = await fetchJson<NominatimResponse>(
		`${NOMINATIM_ENDPOINT}?${params.toString()}`,
		{
			headers: {
				"User-Agent": USER_AGENT
			}
		}
	);

	const address = data.address ?? {};

	return (
		address.neighbourhood ??
		address.suburb ??
		address.quarter ??
		data.name ??
		address.road ??
		address.city ??
		data.display_name?.split(",").slice(0, 2).join(", ") ??
		null
	);
};

const pruneExpiredCacheEntries = () => {
	const now = Date.now();
	for (const [key, entry] of discoveryCache.entries()) {
		if (entry.expiresAt <= now) {
			discoveryCache.delete(key);
		}
	}
};

const buildCacheKey = (lat: number, lng: number, radiusMeters: number) =>
	`${roundForCache(lat)}:${roundForCache(lng)}:${radiusMeters}`;

export function clearMapDiscoveryCache() {
	discoveryCache.clear();
	inFlightDiscoveryRequests.clear();
}

const MapService = {
	async getDiscovery(lat: number, lng: number, radiusMeters = 900) {
		pruneExpiredCacheEntries();

		const cacheKey = buildCacheKey(lat, lng, radiusMeters);
		const cached = discoveryCache.get(cacheKey);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.value;
		}

		const inFlight = inFlightDiscoveryRequests.get(cacheKey);
		if (inFlight) {
			return inFlight;
		}

		const discoveryRequest = Promise.all([
			fetchNearbyPlaces(lat, lng, radiusMeters),
			fetchAreaLabel(lat, lng)
		]).then(([places, areaLabel]) => {
			const value: MapDiscoveryResult = { areaLabel, places };
			discoveryCache.set(cacheKey, {
				expiresAt: Date.now() + CACHE_TTL_MS,
				value
			});
			return value;
		});

		inFlightDiscoveryRequests.set(cacheKey, discoveryRequest);

		try {
			return await discoveryRequest;
		} finally {
			inFlightDiscoveryRequests.delete(cacheKey);
		}
	}
};

export default MapService;
