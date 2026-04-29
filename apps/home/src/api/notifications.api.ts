import { apiClient } from "./client";

export interface Notification {
	id: number;
	userId: number;
	type:
		| "friend_request"
		| "friend_accepted"
		| "post_vote"
		| "post_comment"
		| "mention"
		| "system";
	message: string;
	referenceId: number | null;
	referenceType: string | null;
	isRead: boolean;
	actorId: number | null;
	actor?: {
		id: number;
		username: string | null;
		displayName: string | null;
		avatarUrl: string | null;
	};
	createdAt: string;
}

export const notificationsApi = {
	getNotifications: (params?: { limit?: number; offset?: number }) =>
		apiClient.get<{ data: Notification[] }>("/notifications", { params }),

	getUnreadCount: () =>
		apiClient.get<{ count: number }>("/notifications/unread"),

	markRead: (id: number) => apiClient.patch(`/notifications/${id}/read`),

	markAllRead: () => apiClient.patch("/notifications/read-all")
};
