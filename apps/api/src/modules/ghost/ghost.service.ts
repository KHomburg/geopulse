import { Op } from "sequelize";
import GhostShare from "./ghostShare.model";
import { obfuscateCoordinates } from "../post/post.utils";
import { ContactRepository } from "../contact/contact.repository";
import User from "../user/user.model";

const FRIEND_ATTRS = [
	"id",
	"username",
	"displayName",
	"avatarUrl",
	"pinAvatar",
	"usernameColor"
];

const GhostService = {
	async shareLocation(params: {
		userId: number;
		lat: number;
		lng: number;
		durationMinutes: number;
	}) {
		const { obfuscatedLat, obfuscatedLng } = obfuscateCoordinates(
			params.lat,
			params.lng
		);
		const expiresAt = new Date(
			Date.now() + params.durationMinutes * 60_000
		);
		const existing = await GhostShare.findOne({
			where: { userId: params.userId }
		});
		if (existing) {
			return existing.update({
				lat: obfuscatedLat,
				lng: obfuscatedLng,
				precisionMeters: 120,
				expiresAt
			});
		}
		return GhostShare.create({
			userId: params.userId,
			lat: obfuscatedLat,
			lng: obfuscatedLng,
			precisionMeters: 120,
			expiresAt
		});
	},

	async stopSharing(userId: number) {
		await GhostShare.destroy({ where: { userId } });
	},

	async getFriendGhosts(userId: number) {
		const friendships = await ContactRepository.findFriends(userId);
		const friendIds = friendships.map((friendship) =>
			friendship.requesterId === userId
				? friendship.addresseeId
				: friendship.requesterId
		);
		if (!friendIds.length) return [];

		const shares = await GhostShare.findAll({
			where: {
				userId: { [Op.in]: friendIds },
				expiresAt: { [Op.gt]: new Date() }
			},
			include: [
				{
					model: User,
					as: "user",
					attributes: FRIEND_ATTRS
				}
			]
		});

		return shares.map((share) => {
			const plain =
				typeof share.toJSON === "function" ? share.toJSON() : share;
			return {
				id: plain.id,
				userId: plain.userId,
				lat: plain.lat,
				lng: plain.lng,
				precisionMeters: plain.precisionMeters,
				expiresAt: plain.expiresAt,
				friend: plain.user ?? null
			};
		});
	}
};

export default GhostService;
