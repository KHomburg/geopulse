import { apiClient } from "./client";

export type AnonymityMode = "public" | "local_legend" | "anonymous";
export type TimeFilter = "now" | "today" | "week";

export interface Post {
	id: number;
	content: string;
	previewContent: string;
	mediaUrl: string | null;
	mediaUrls: string[];
	anonymityMode: AnonymityMode;
	authorId: number | null;
	authorPseudonym: string | null;
	authorPinAvatar: string | null;
	authorNameColor: string | null;
	authorKarma: number;
	authorTrusted: boolean;
	lat: number;
	lng: number;
	karmaScore: number;
	postType: "standard" | "drop";
	tags: string[];
	dropHint: string | null;
	dropUnlockRadiusMeters: number | null;
	boostedUntil: string | null;
	isSuperLocalLegend: boolean;
	isLocked: boolean;
	isStory: boolean;
	expiresAt: string | null;
	createdAt: string;
	isOwner: boolean;
	commentCount: number;
}

export interface HotspotCluster {
	centerLat: number;
	centerLng: number;
	postCount: number;
	totalKarma: number;
	weight: number;
}

export interface FeedParams {
	lat: number;
	lng: number;
	radiusKm?: number;
	filter?: TimeFilter;
	tags?: string[];
	limit?: number;
	offset?: number;
}

export interface CreatePostPayload {
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
	lat: number;
	lng: number;
	isStory?: boolean;
}

export const postsApi = {
	getFeed(params: FeedParams) {
		const query = {
			...params,
			tags: params.tags?.length ? params.tags.join(",") : undefined
		};
		return apiClient.get<{ data: Post[]; count: number }>("/posts", {
			params: query
		});
	},

	getPost(id: number, params?: { lat?: number; lng?: number }) {
		return apiClient.get<Post>(`/posts/${id}`, { params });
	},

	createPost(payload: CreatePostPayload) {
		return apiClient.post<Post>("/posts", payload);
	},

	getTrustedFeed(params: FeedParams) {
		const query = {
			...params,
			tags: params.tags?.length ? params.tags.join(",") : undefined
		};
		return apiClient.get<{ data: Post[]; count: number }>(
			"/posts/trusted-locals",
			{ params: query }
		);
	},

	deletePost(id: number) {
		return apiClient.delete(`/posts/${id}`);
	},

	getHotspots(params: {
		lat: number;
		lng: number;
		radiusKm?: number;
		filter?: TimeFilter;
	}) {
		return apiClient.get<{ data: HotspotCluster[]; count: number }>(
			"/posts/hotspots",
			{
				params
			}
		);
	},

	vote(postId: number, value: 1 | -1) {
		return apiClient.post<{ status: string; karmaScore: number }>(
			`/posts/${postId}/votes`,
			{ value }
		);
	},

	removeVote(postId: number) {
		return apiClient.delete(`/posts/${postId}/votes`);
	}
};
