import { apiClient } from "./client";

export type AnonymityMode = "public" | "local_legend" | "anonymous";
export type TimeFilter = "now" | "today" | "week";

export interface Post {
	id: number;
	content: string;
	mediaUrl: string | null;
	anonymityMode: AnonymityMode;
	authorId: number | null;
	authorPseudonym: string | null;
	lat: number;
	lng: number;
	karmaScore: number;
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
	limit?: number;
	offset?: number;
}

export interface CreatePostPayload {
	content: string;
	mediaUrl?: string;
	anonymityMode: AnonymityMode;
	pseudonym?: string;
	lat: number;
	lng: number;
	isStory?: boolean;
}

export const postsApi = {
	getFeed(params: FeedParams) {
		return apiClient.get<{ data: Post[]; count: number }>("/posts", {
			params
		});
	},

	getPost(id: number) {
		return apiClient.get<Post>(`/posts/${id}`);
	},

	createPost(payload: CreatePostPayload) {
		return apiClient.post<Post>("/posts", payload);
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
