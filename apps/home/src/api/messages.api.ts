import { apiClient } from "./client";

export interface MessageUser {
	id: number;
	username: string | null;
	displayName: string | null;
	avatarUrl: string | null;
}

export interface Message {
	id: number;
	conversationId: number;
	senderId: number;
	content: string;
	readAt: string | null;
	createdAt: string;
	sender?: MessageUser;
}

export interface ConversationParticipant {
	id: number;
	conversationId: number;
	userId: number;
	user?: MessageUser;
}

export interface Conversation {
	id: number;
	participants?: ConversationParticipant[];
	allParticipants?: ConversationParticipant[];
	lastMessage?: Message[];
	createdAt: string;
	updatedAt: string;
}

export const messagesApi = {
	getConversations: () =>
		apiClient.get<{ data: Conversation[] }>("/conversations"),

	getUnreadCount: () =>
		apiClient.get<{ count: number }>("/conversations/unread"),

	openConversation: (userId: number) =>
		apiClient.post<Conversation>(`/conversations/with/${userId}`),

	getMessages: (
		conversationId: number,
		params?: { limit?: number; before?: number }
	) =>
		apiClient.get<{ data: Message[] }>(
			`/conversations/${conversationId}/messages`,
			{ params }
		),

	sendMessage: (conversationId: number, content: string) =>
		apiClient.post<Message>(`/conversations/${conversationId}/messages`, {
			content
		}),

	markRead: (conversationId: number) =>
		apiClient.patch(`/conversations/${conversationId}/read`)
};
