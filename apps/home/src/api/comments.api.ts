import apiClient from "./client";

export interface Comment {
	id: number;
	postId: number;
	userId: number;
	content: string;
	parentId: number | null;
	karmaScore: number;
	createdAt: string;
	author?: {
		id: number;
		username: string;
		displayName: string | null;
	};
	replies?: Comment[];
}

export const commentsApi = {
	getComments: async (postId: number): Promise<Comment[]> => {
		const { data } = await apiClient.get(`/posts/${postId}/comments`);
		return data.data;
	},

	createComment: async (
		postId: number,
		content: string,
		parentId?: number
	): Promise<Comment> => {
		const { data } = await apiClient.post(`/posts/${postId}/comments`, {
			content,
			parentId: parentId ?? null
		});
		return data.data;
	},

	deleteComment: async (postId: number, commentId: number): Promise<void> => {
		await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
	}
};
