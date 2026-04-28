/**
 * Privacy utilities for GeoPulse post location obfuscation.
 *
 * Core rules (from spec):
 *  1. Never store or display the user's exact GPS coordinates.
 *  2. Grid-based snapping: snap to nearest 100 m × 100 m cell.
 *  3. Add a random 10–50 m offset on top of the snapped position.
 */

// Approximate meters per degree at equator
const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Snap a coordinate pair to the nearest 100 m × 100 m grid cell.
 */
export function snapToGrid(
	lat: number,
	lng: number
): { lat: number; lng: number } {
	const gridSizeLat = 100 / METERS_PER_DEGREE_LAT; // ~0.000898°
	const gridSizeLng =
		100 / (METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));

	const snappedLat = Math.round(lat / gridSizeLat) * gridSizeLat;
	const snappedLng = Math.round(lng / gridSizeLng) * gridSizeLng;

	return { lat: snappedLat, lng: snappedLng };
}

/**
 * Add a random offset of 10–50 m in a random direction.
 */
export function addRandomOffset(
	lat: number,
	lng: number
): { lat: number; lng: number } {
	const minMeters = 10;
	const maxMeters = 50;
	const distance = minMeters + Math.random() * (maxMeters - minMeters);
	const angle = Math.random() * 2 * Math.PI;

	const deltaLat = (distance * Math.cos(angle)) / METERS_PER_DEGREE_LAT;
	const deltaLng =
		(distance * Math.sin(angle)) /
		(METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));

	return { lat: lat + deltaLat, lng: lng + deltaLng };
}

/**
 * Full privacy wrapper: snap to grid then add random offset.
 * This is the ONLY function that should be called before persisting coordinates.
 */
export function obfuscateCoordinates(
	rawLat: number,
	rawLng: number
): { obfuscatedLat: number; obfuscatedLng: number } {
	const snapped = snapToGrid(rawLat, rawLng);
	const offset = addRandomOffset(snapped.lat, snapped.lng);
	return { obfuscatedLat: offset.lat, obfuscatedLng: offset.lng };
}

/**
 * Calculate the approximate distance in meters between two coordinate pairs
 * using the Haversine formula.
 */
export function haversineDistanceMeters(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number
): number {
	const R = 6_371_000; // Earth radius in meters
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns the display author info for a post based on anonymity mode.
 * "anonymous" → null (no author shown)
 * "local_legend" → pseudonym string
 * "public" → userId
 */
export function resolveAuthorDisplay(
	anonymityMode: "public" | "local_legend" | "anonymous",
	userId: number,
	pseudonym: string | null
): { authorId: number | null; authorPseudonym: string | null } {
	if (anonymityMode === "anonymous") {
		return { authorId: null, authorPseudonym: null };
	}
	if (anonymityMode === "local_legend") {
		return { authorId: null, authorPseudonym: pseudonym };
	}
	return { authorId: userId, authorPseudonym: null };
}
