import PostRepository from "./post.repository";
import { obfuscateCoordinates, haversineDistanceMeters } from "./post.utils";
import type { AnonymityMode } from "./post.model";

// Degrees per km (approximate)
const DEG_PER_KM = 1 / 111.32;

function buildBoundingBox(lat: number, lng: number, radiusKm: number) {
	const latDelta = radiusKm * DEG_PER_KM;
	const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
	return {
		minLat: lat - latDelta,
		maxLat: lat + latDelta,
		minLng: lng - lngDelta,
		maxLng: lng + lngDelta
	};
}

function timeFilterToDate(filter: "now" | "today" | "week"): Date {
	const now = new Date();
	if (filter === "now") {
		now.setHours(now.getHours() - 1);
	} else if (filter === "today") {
		now.setHours(0, 0, 0, 0);
	} else {
		now.setDate(now.getDate() - 7);
	}
	return now;
}

export interface CreatePostInput {
	userId: number;
	content: string;
	mediaUrl?: string;
	anonymityMode: AnonymityMode;
	pseudonym?: string;
	lat: number;
	lng: number;
	isStory: boolean;
}

export interface HotspotCluster {
	centerLat: number;
	centerLng: number;
	postCount: number;
	totalKarma: number;
	weight: number;
}

/**
 * Weighted DBSCAN-inspired clustering for hotspot detection.
 * Engagement-weighted: a post's contribution is proportional to max(1, karmaScore).
 * epsilon: radius in meters within which points are considered neighbours.
 * minWeight: minimum total engagement weight for a cluster to qualify as a hotspot.
 */
function computeHotspots(
	posts: Array<{
		obfuscatedLat: number;
		obfuscatedLng: number;
		karmaScore: number;
	}>,
	epsilonMeters = 300,
	minWeight = 2
): HotspotCluster[] {
	const weights = posts.map((p) => Math.max(1, p.karmaScore));
	const visited = new Array(posts.length).fill(false);
	const clusters: HotspotCluster[] = [];

	for (let i = 0; i < posts.length; i++) {
		if (visited[i]) continue;
		visited[i] = true;

		// Find all neighbours within epsilon
		const neighbours: number[] = [];
		for (let j = 0; j < posts.length; j++) {
			if (i === j) continue;
			const dist = haversineDistanceMeters(
				posts[i].obfuscatedLat,
				posts[i].obfuscatedLng,
				posts[j].obfuscatedLat,
				posts[j].obfuscatedLng
			);
			if (dist <= epsilonMeters) {
				neighbours.push(j);
			}
		}

		const clusterIndices = [i, ...neighbours];
		const totalWeight = clusterIndices.reduce(
			(sum, idx) => sum + weights[idx],
			0
		);

		if (totalWeight < minWeight) continue;

		// Mark all as visited
		for (const idx of neighbours) visited[idx] = true;

		// Weighted centroid
		let latSum = 0;
		let lngSum = 0;
		let wSum = 0;
		for (const idx of clusterIndices) {
			latSum += posts[idx].obfuscatedLat * weights[idx];
			lngSum += posts[idx].obfuscatedLng * weights[idx];
			wSum += weights[idx];
		}

		clusters.push({
			centerLat: latSum / wSum,
			centerLng: lngSum / wSum,
			postCount: clusterIndices.length,
			totalKarma: clusterIndices.reduce(
				(sum, idx) => sum + posts[idx].karmaScore,
				0
			),
			weight: totalWeight
		});
	}

	// Sort by weight descending
	return clusters.sort((a, b) => b.weight - a.weight);
}

export const PostService = {
	async createPost(input: CreatePostInput) {
		const { obfuscatedLat, obfuscatedLng } = obfuscateCoordinates(
			input.lat,
			input.lng
		);

		const expiresAt = input.isStory
			? new Date(Date.now() + 24 * 60 * 60 * 1000)
			: null;

		return PostRepository.create({
			userId: input.userId,
			content: input.content,
			mediaUrl: input.mediaUrl ?? null,
			anonymityMode: input.anonymityMode,
			pseudonym:
				input.anonymityMode === "local_legend"
					? input.pseudonym ?? null
					: null,
			obfuscatedLat,
			obfuscatedLng,
			isStory: input.isStory,
			expiresAt
		});
	},

	async getPostById(id: number) {
		return PostRepository.findById(id);
	},

	async getFeed(params: {
		lat: number;
		lng: number;
		radiusKm: number;
		filter: "now" | "today" | "week";
		limit: number;
		offset: number;
	}) {
		const bbox = buildBoundingBox(params.lat, params.lng, params.radiusKm);
		const since = timeFilterToDate(params.filter);
		return PostRepository.findByLocation({
			...bbox,
			since,
			limit: params.limit,
			offset: params.offset
		});
	},

	async deletePost(id: number, userId: number): Promise<boolean> {
		return PostRepository.softDeleteByIdAndUser(id, userId);
	},

	async getHotspots(params: {
		lat: number;
		lng: number;
		radiusKm: number;
		filter: "now" | "today" | "week";
	}): Promise<HotspotCluster[]> {
		const bbox = buildBoundingBox(params.lat, params.lng, params.radiusKm);
		const since = timeFilterToDate(params.filter);
		const posts = await PostRepository.findForHotspots({ ...bbox, since });

		return computeHotspots(
			posts.map((p) => ({
				obfuscatedLat: p.obfuscatedLat,
				obfuscatedLng: p.obfuscatedLng,
				karmaScore: p.karmaScore
			}))
		);
	}
};

export default PostService;
