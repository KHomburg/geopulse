import { RoomRepository } from "./room.repository";
import { TRUSTED_LOCALS_MIN_KARMA } from "../user/user.perks";
import UserRepository from "../user/user.repository";
import { ActivityService } from "../../shared/activity/activity.service";
import { RealtimeService } from "../realtime/realtime.service";

const TRUSTED_LOCALS_ROOM_KEY = "trusted-locals";

function sanitizeRoomMessage(message: unknown) {
	const plain =
		typeof (message as { toJSON?: () => unknown }).toJSON === "function"
			? (message as { toJSON: () => unknown }).toJSON()
			: message;
	const record = plain as {
		id: number;
		roomType: "trusted_locals" | "live_lounge";
		roomKey: string;
		userId: number;
		content: string;
		mediaUrl: string | null;
		createdAt: Date;
		author?: {
			id: number;
			username: string | null;
			displayName: string | null;
			avatarUrl: string | null;
			pinAvatar: string | null;
			usernameColor: string | null;
			karmaScore: number;
			isTrusted: boolean;
		};
	};

	return {
		id: record.id,
		roomType: record.roomType,
		roomKey: record.roomKey,
		userId: record.userId,
		content: record.content,
		mediaUrl: record.mediaUrl,
		createdAt: record.createdAt,
		author: record.author ?? null
	};
}

async function ensureTrusted(userId: number) {
	const user = await UserRepository.findById(userId);
	if (
		!user ||
		(user.karmaScore < TRUSTED_LOCALS_MIN_KARMA && !user.isTrusted)
	) {
		throw Object.assign(new Error("Trusted Locals opens at 500 karma"), {
			status: 403
		});
	}
	return user;
}

const RoomService = {
	async getTrustedLocalMessages(userId: number) {
		await ensureTrusted(userId);
		const messages = await RoomRepository.findRecent(
			"trusted_locals",
			TRUSTED_LOCALS_ROOM_KEY
		);
		return messages.map(sanitizeRoomMessage);
	},

	async sendTrustedLocalMessage(params: {
		userId: number;
		content: string;
		mediaUrl?: string | null;
	}) {
		await ensureTrusted(params.userId);
		const created = await RoomRepository.create({
			roomType: "trusted_locals",
			roomKey: TRUSTED_LOCALS_ROOM_KEY,
			userId: params.userId,
			content: params.content,
			mediaUrl: params.mediaUrl
		});
		const message = sanitizeRoomMessage(created);
		const recipients = await UserRepository.findTrustedUserIds();
		RealtimeService.sendToUsers(recipients, "room:message:new", {
			roomType: "trusted_locals",
			roomKey: TRUSTED_LOCALS_ROOM_KEY,
			message
		});
		return message;
	},

	async listLiveLounges(lat: number, lng: number) {
		return ActivityService.getNearbyLiveLounges(lat, lng);
	},

	async getLiveLoungeMessages(params: {
		userId: number;
		roomKey: string;
		lat: number;
		lng: number;
	}) {
		if (
			!ActivityService.isUserInsideLiveLounge(
				params.roomKey,
				params.lat,
				params.lng
			)
		) {
			throw Object.assign(
				new Error("You need to be inside this lounge to join"),
				{
					status: 403
				}
			);
		}
		const messages = await RoomRepository.findRecent(
			"live_lounge",
			params.roomKey
		);
		return messages.map(sanitizeRoomMessage);
	},

	async sendLiveLoungeMessage(params: {
		userId: number;
		roomKey: string;
		lat: number;
		lng: number;
		content: string;
		mediaUrl?: string | null;
	}) {
		if (
			!ActivityService.isUserInsideLiveLounge(
				params.roomKey,
				params.lat,
				params.lng
			)
		) {
			throw Object.assign(
				new Error("You need to be inside this lounge to post"),
				{
					status: 403
				}
			);
		}
		const created = await RoomRepository.create({
			roomType: "live_lounge",
			roomKey: params.roomKey,
			userId: params.userId,
			content: params.content,
			mediaUrl: params.mediaUrl
		});
		const message = sanitizeRoomMessage(created);
		RealtimeService.sendToUsers(
			ActivityService.getUserIdsInLounge(params.roomKey),
			"room:message:new",
			{
				roomType: "live_lounge",
				roomKey: params.roomKey,
				message
			}
		);
		return message;
	}
};

export default RoomService;
