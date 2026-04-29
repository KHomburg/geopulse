import { apiClient } from "./client";

export interface ActivityHeatPoint {
	centerLat: number;
	centerLng: number;
	intensity: number;
	activityCount: number;
	activeUsers: number;
}

export const activityApi = {
	reportPresence: (lat: number, lng: number) =>
		apiClient.post("/activity/presence", { lat, lng }),

	getHeatmap: (params: { lat: number; lng: number; radiusKm?: number }) =>
		apiClient.get<{ data: ActivityHeatPoint[]; count: number }>(
			"/activity/heatmap",
			{ params }
		)
};
