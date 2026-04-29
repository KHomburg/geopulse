import { haversineDistanceMeters } from "../../modules/post/post.utils";

type ActivityKind = "open" | "vote" | "comment" | "post";

interface ActivitySample {
	userId: number;
	lat: number;
	lng: number;
	weight: number;
	kind: ActivityKind;
	createdAt: number;
}

interface PresenceSample {
	userId: number;
	lat: number;
	lng: number;
	updatedAt: number;
}

export interface ActivityHeatPoint {
	centerLat: number;
	centerLng: number;
	intensity: number;
	activityCount: number;
	activeUsers: number;
}

export interface LiveLounge {
	roomKey: string;
	title: string;
	centerLat: number;
	centerLng: number;
	activeUsers: number;
	radiusMeters: number;
}

const ACTIVITY_RETENTION_MS = 4 * 60 * 60 * 1000;
const PRESENCE_RETENTION_MS = 2 * 60 * 1000;
const OPEN_RECORD_INTERVAL_MS = 60 * 1000;
const HEATMAP_GRID_METERS = 220;
const LIVE_LOUNGE_RADIUS_METERS = 500;
const LIVE_LOUNGE_MIN_USERS = 50;

const activitySamples: ActivitySample[] = [];
const presenceByUser = new Map<number, PresenceSample>();
const lastOpenByUser = new Map<number, number>();

function prune() {
	const now = Date.now();
	for (let index = activitySamples.length - 1; index >= 0; index--) {
		if (activitySamples[index].createdAt < now - ACTIVITY_RETENTION_MS) {
			activitySamples.splice(index, 1);
		}
	}

	for (const [userId, presence] of presenceByUser.entries()) {
		if (presence.updatedAt < now - PRESENCE_RETENTION_MS) {
			presenceByUser.delete(userId);
		}
	}

	for (const [userId, lastOpen] of lastOpenByUser.entries()) {
		if (lastOpen < now - PRESENCE_RETENTION_MS) {
			lastOpenByUser.delete(userId);
		}
	}
}

function buildGridKey(lat: number, lng: number, meters: number) {
	const latSize = meters / 111_320;
	const lngSize =
		meters / (111_320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
	const latIndex = Math.round(lat / latSize);
	const lngIndex = Math.round(lng / lngSize);
	return `${meters}:${latIndex}:${lngIndex}`;
}

function loungeTitle(activeUsers: number) {
	return activeUsers >= 120 ? "Packed Live Lounge" : "Live Lounge";
}

export const ActivityService = {
	recordActivity(params: {
		userId: number;
		lat: number;
		lng: number;
		weight: number;
		kind: ActivityKind;
	}) {
		prune();
		activitySamples.push({ ...params, createdAt: Date.now() });
	},

	reportPresence(userId: number, lat: number, lng: number) {
		prune();
		presenceByUser.set(userId, { userId, lat, lng, updatedAt: Date.now() });
		const lastOpen = lastOpenByUser.get(userId) ?? 0;
		if (Date.now() - lastOpen >= OPEN_RECORD_INTERVAL_MS) {
			lastOpenByUser.set(userId, Date.now());
			this.recordActivity({ userId, lat, lng, weight: 1, kind: "open" });
		}
	},

	getHeatmap(lat: number, lng: number, radiusKm: number) {
		prune();
		const clusters = new Map<
			string,
			{
				latSum: number;
				lngSum: number;
				intensity: number;
				activityCount: number;
				activeUsers: Set<number>;
			}
		>();

		for (const sample of activitySamples) {
			const distance = haversineDistanceMeters(
				lat,
				lng,
				sample.lat,
				sample.lng
			);
			if (distance > radiusKm * 1000) continue;

			const key = buildGridKey(
				sample.lat,
				sample.lng,
				HEATMAP_GRID_METERS
			);
			const current = clusters.get(key) ?? {
				latSum: 0,
				lngSum: 0,
				intensity: 0,
				activityCount: 0,
				activeUsers: new Set<number>()
			};
			current.latSum += sample.lat * sample.weight;
			current.lngSum += sample.lng * sample.weight;
			current.intensity += sample.weight;
			current.activityCount += 1;
			current.activeUsers.add(sample.userId);
			clusters.set(key, current);
		}

		return [...clusters.values()]
			.map((cluster) => ({
				centerLat: cluster.latSum / cluster.intensity,
				centerLng: cluster.lngSum / cluster.intensity,
				intensity: cluster.intensity,
				activityCount: cluster.activityCount,
				activeUsers: cluster.activeUsers.size
			}))
			.sort((a, b) => b.intensity - a.intensity);
	},

	getNearbyLiveLounges(lat: number, lng: number) {
		prune();
		const lounges = new Map<
			string,
			{ latSum: number; lngSum: number; users: number[] }
		>();

		for (const presence of presenceByUser.values()) {
			const key = buildGridKey(
				presence.lat,
				presence.lng,
				LIVE_LOUNGE_RADIUS_METERS
			);
			const current = lounges.get(key) ?? {
				latSum: 0,
				lngSum: 0,
				users: []
			};
			current.latSum += presence.lat;
			current.lngSum += presence.lng;
			current.users.push(presence.userId);
			lounges.set(key, current);
		}

		return [...lounges.entries()]
			.map(([roomKey, cluster]) => ({
				roomKey,
				title: loungeTitle(cluster.users.length),
				centerLat: cluster.latSum / cluster.users.length,
				centerLng: cluster.lngSum / cluster.users.length,
				activeUsers: cluster.users.length,
				radiusMeters: LIVE_LOUNGE_RADIUS_METERS
			}))
			.filter((lounge) => lounge.activeUsers >= LIVE_LOUNGE_MIN_USERS)
			.filter(
				(lounge) =>
					haversineDistanceMeters(
						lat,
						lng,
						lounge.centerLat,
						lounge.centerLng
					) <= 3_000
			)
			.sort((a, b) => b.activeUsers - a.activeUsers);
	},

	getUserIdsInLounge(roomKey: string) {
		prune();
		const userIds: number[] = [];
		for (const presence of presenceByUser.values()) {
			if (
				buildGridKey(
					presence.lat,
					presence.lng,
					LIVE_LOUNGE_RADIUS_METERS
				) === roomKey
			) {
				userIds.push(presence.userId);
			}
		}
		return userIds;
	},

	isUserInsideLiveLounge(roomKey: string, lat: number, lng: number) {
		return buildGridKey(lat, lng, LIVE_LOUNGE_RADIUS_METERS) === roomKey;
	}
};
