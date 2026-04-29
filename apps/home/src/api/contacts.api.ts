import { apiClient } from "./client";

export interface ContactUser {
	id: number;
	username: string | null;
	displayName: string | null;
	avatarUrl: string | null;
}

export interface Contact {
	id: number;
	requesterId: number;
	addresseeId: number;
	status: "pending" | "accepted" | "blocked";
	requester?: ContactUser;
	addressee?: ContactUser;
	createdAt: string;
	updatedAt: string;
}

export const contactsApi = {
	getFriends: () => apiClient.get<{ data: Contact[] }>("/contacts/friends"),

	getPendingRequests: () =>
		apiClient.get<{ data: Contact[] }>("/contacts/requests/received"),

	getSentRequests: () =>
		apiClient.get<{ data: Contact[] }>("/contacts/requests/sent"),

	getStatus: (userId: number) =>
		apiClient.get<{ contact: Contact | null }>(
			`/contacts/status/${userId}`
		),

	sendRequest: (userId: number) =>
		apiClient.post<Contact>(`/contacts/request/${userId}`),

	acceptRequest: (contactId: number) =>
		apiClient.patch<Contact>(`/contacts/${contactId}/accept`),

	declineOrRemove: (contactId: number) =>
		apiClient.delete(`/contacts/${contactId}`),

	blockUser: (userId: number) => apiClient.post(`/contacts/block/${userId}`)
};
