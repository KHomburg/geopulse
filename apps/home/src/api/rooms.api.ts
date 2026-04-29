import { apiClient } from "./client";

export interface RoomAuthor {
	id: number;
	username: string | null;
	displayName: string | null;
	avatarUrl: string | null;
	pinAvatar: string | null;
	usernameColor: string | null;
	karmaScore: number;
	isTrusted: boolean;
}

export interface RoomMessage {
	id: number;
	roomType: "trusted_locals" | "live_lounge";
	roomKey: string;
	userId: number;
	content: string;
	mediaUrl: string | null;
	createdAt: string;
	author: RoomAuthor | null;
}

export interface LiveLounge {
	roomKey: string;
	title: string;
	centerLat: number;
	centerLng: number;
	activeUsers: number;
	radiusMeters: number;
}

export const roomsApi = {
	getTrustedMessages: () =>
		apiClient.get<{ data: RoomMessage[]; count: number }>(
			"/rooms/trusted-locals/messages"
		),
	sendTrustedMessage: (content: string, mediaUrl?: string | null) =>
		apiClient.post<RoomMessage>("/rooms/trusted-locals/messages", {
			content,
			mediaUrl: mediaUrl ?? null
		}),
	getLiveLounges: (params: { lat: number; lng: number }) =>
		apiClient.get<{ data: LiveLounge[]; count: number }>(
			"/rooms/live-lounges",
			{ params }
		),
	getLiveLoungeMessages: (
		roomKey: string,
		params: { lat: number; lng: number }
	) =>
		apiClient.get<{ data: RoomMessage[]; count: number }>(
			`/rooms/live-lounges/${roomKey}/messages`,
			{ params }
		),
	sendLiveLoungeMessage: (
		roomKey: string,
		payload: {
			content: string;
			mediaUrl?: string | null;
			lat: number;
			lng: number;
		}
	) =>
		apiClient.post<RoomMessage>(`/rooms/live-lounges/${roomKey}/messages`, {
			content: payload.content,
			mediaUrl: payload.mediaUrl ?? null,
			lat: payload.lat,
			lng: payload.lng
		})
};
