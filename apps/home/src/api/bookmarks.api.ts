import apiClient from "./client";
import type { Post } from "./posts.api";

export interface BookmarkStatus {
	bookmarked: boolean;
}

export const bookmarksApi = {
	toggleBookmark: async (postId: number): Promise<BookmarkStatus> => {
		const { data } = await apiClient.post(`/posts/${postId}/bookmark`);
		return data;
	},

	isBookmarked: async (postId: number): Promise<boolean> => {
		const { data } = await apiClient.get(`/posts/${postId}/bookmark`);
		return data.bookmarked;
	},

	getMyBookmarks: async (): Promise<Post[]> => {
		const { data } = await apiClient.get("/bookmarks");
		return data.data;
	}
};
