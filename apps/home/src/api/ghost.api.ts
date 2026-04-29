import { apiClient } from "./client";

export interface FriendGhost {
	id: number;
	userId: number;
	lat: number;
	lng: number;
	precisionMeters: number;
	expiresAt: string;
	friend: {
		id: number;
		username: string | null;
		displayName: string | null;
		avatarUrl: string | null;
		pinAvatar: string | null;
		usernameColor: string | null;
	} | null;
}

export const ghostApi = {
	getFriendGhosts: () =>
		apiClient.get<{ data: FriendGhost[]; count: number }>("/ghost/friends"),
	shareLocation: (payload: {
		lat: number;
		lng: number;
		durationMinutes: number;
	}) => apiClient.post("/ghost/share", payload),
	stopSharing: () => apiClient.delete("/ghost/share")
};
