import { useEffect } from "react";
import { useFeedStore } from "../store/feed.store";

/**
 * Acquires the user's geolocation and stores it in the feed store.
 * Falls back to Berlin (52.52, 13.405) if permission is denied or unavailable.
 * Safe to call from multiple components — the store is a singleton.
 */
export function useGeolocation() {
	const setLocation = useFeedStore((s) => s.setLocation);
	const location = useFeedStore((s) => s.location);

	useEffect(() => {
		// Already acquired — don't request again
		if (location.lat !== null) return;

		if (!navigator.geolocation) {
			setLocation(52.52, 13.405);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
			() => setLocation(52.52, 13.405),
			{ enableHighAccuracy: true, timeout: 10_000 }
		);
	}, [setLocation, location.lat]);
}
