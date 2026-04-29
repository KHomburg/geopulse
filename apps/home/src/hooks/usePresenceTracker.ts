import { useEffect } from "react";
import { activityApi } from "../api/activity.api";
import { useFeedStore } from "../store/feed.store";
import { useAuthStore } from "../store/auth.store";

export function usePresenceTracker() {
	const location = useFeedStore((state) => state.location);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	useEffect(() => {
		if (!isAuthenticated || location.lat == null || location.lng == null) {
			return;
		}

		const report = () => {
			void activityApi.reportPresence(location.lat!, location.lng!);
		};

		report();
		const interval = window.setInterval(report, 60_000);
		return () => window.clearInterval(interval);
	}, [isAuthenticated, location.lat, location.lng]);
}
