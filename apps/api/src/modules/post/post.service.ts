import PostRepository from "./post.repository";
import { obfuscateCoordinates, haversineDistanceMeters } from "./post.utils";
import type { AnonymityMode } from "./post.model";
import UserRepository from "../user/user.repository";
import { ActivityService } from "../../shared/activity/activity.service";
import { TRUSTED_LOCALS_MIN_KARMA } from "../user/user.perks";
import type { AccountStatus } from "../../shared/auth/auth.types";
import {
	mergeIncomingPostMediaUrls,
	serializePostMediaUrls
} from "./post.media";

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
	mediaUrls?: string[];
	anonymityMode: AnonymityMode;
	pseudonym?: string;
	postType: "standard" | "drop";
	tags?: string[];
	dropHint?: string;
	dropUnlockRadiusMeters?: number;
	isSuperLocalLegend?: boolean;
	accountStatus?: AccountStatus;
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

function normalizeTags(tags: string[] = []) {
	return [
		...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))
	];
}

function splitStoredTags(tags: string | null | undefined) {
	return tags ? tags.split(",").filter(Boolean) : [];
}

function filterPostsByTags<T extends { tags?: string | null }>(
	posts: T[],
	tags?: string[]
) {
	if (!tags?.length) return posts;
	return posts.filter((post) => {
		const stored = splitStoredTags(post.tags);
		return tags.some((tag) => stored.includes(tag));
	});
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
		const mediaUrls = mergeIncomingPostMediaUrls({
			mediaUrl: input.mediaUrl,
			mediaUrls: input.mediaUrls
		});

		if (input.isSuperLocalLegend) {
			const user = await UserRepository.findById(input.userId);
			if (!user || user.superPostCredits < 1) {
				throw Object.assign(
					new Error(
						"Buy a Super Local Legend credit in the Karma Shop first"
					),
					{ status: 400 }
				);
			}
			await UserRepository.updateById(input.userId, {
				superPostCredits: user.superPostCredits - 1
			});
		}

		const { obfuscatedLat, obfuscatedLng } = obfuscateCoordinates(
			input.lat,
			input.lng
		);

		const expiresAt = input.isStory
			? new Date(Date.now() + 24 * 60 * 60 * 1000)
			: null;

		return PostRepository.create({
			userId: input.userId,
			content: input.content.trim(),
			mediaUrl: serializePostMediaUrls(mediaUrls),
			anonymityMode: input.anonymityMode,
			pseudonym:
				input.anonymityMode === "local_legend"
					? input.pseudonym ?? null
					: null,
			obfuscatedLat,
			obfuscatedLng,
			postType: input.postType,
			tags: normalizeTags(input.tags).join(",") || null,
			dropHint: input.postType === "drop" ? input.dropHint ?? null : null,
			dropUnlockRadiusMeters:
				input.postType === "drop"
					? input.dropUnlockRadiusMeters ?? 20
					: null,
			boostedUntil: input.isSuperLocalLegend
				? new Date(Date.now() + 60 * 60 * 1000)
				: null,
			moderationStatus:
				input.accountStatus === "shadow_banned"
					? "shadow_hidden"
					: "published",
			isStory: input.isStory,
			expiresAt
		}).then((post) => {
			ActivityService.recordActivity({
				userId: input.userId,
				lat: obfuscatedLat,
				lng: obfuscatedLng,
				weight: input.isSuperLocalLegend ? 4 : 2,
				kind: "post"
			});
			return post;
		});
	},

	async getPostById(id: number, requesterId?: number) {
		return PostRepository.findByIdForViewer(id, requesterId);
	},

	async getFeed(params: {
		lat: number;
		lng: number;
		radiusKm: number;
		filter: "now" | "today" | "week";
		tags?: string[];
		limit: number;
		offset: number;
		requesterId?: number;
	}) {
		const bbox = buildBoundingBox(params.lat, params.lng, params.radiusKm);
		const since = timeFilterToDate(params.filter);
		const fetchLimit = params.tags?.length
			? Math.max((params.offset + params.limit) * 3, 60)
			: params.limit;
		const posts = await PostRepository.findByLocation({
			...bbox,
			since,
			limit: fetchLimit,
			offset: params.tags?.length ? 0 : params.offset,
			requesterId: params.requesterId
		});
		const filtered = filterPostsByTags(posts, normalizeTags(params.tags));
		return params.tags?.length
			? filtered.slice(params.offset, params.offset + params.limit)
			: filtered;
	},

	async getTrustedFeed(params: {
		userId: number;
		lat: number;
		lng: number;
		radiusKm: number;
		filter: "now" | "today" | "week";
		tags?: string[];
		limit: number;
		offset: number;
	}) {
		const user = await UserRepository.findById(params.userId);
		if (
			!user ||
			(user.karmaScore < TRUSTED_LOCALS_MIN_KARMA && !user.isTrusted)
		) {
			throw Object.assign(
				new Error("Trusted Locals opens at 500 karma"),
				{ status: 403 }
			);
		}

		const bbox = buildBoundingBox(params.lat, params.lng, params.radiusKm);
		const since = timeFilterToDate(params.filter);
		const posts = await PostRepository.findByLocation({
			...bbox,
			since,
			limit: Math.max((params.offset + params.limit) * 3, 60),
			offset: 0,
			trustedOnly: true,
			requesterId: params.userId
		});
		const filtered = filterPostsByTags(posts, normalizeTags(params.tags));
		return filtered.slice(params.offset, params.offset + params.limit);
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
