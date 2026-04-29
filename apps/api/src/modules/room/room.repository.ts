import RoomMessage, { type RoomType } from "./roomMessage.model";
import User from "../user/user.model";

const AUTHOR_ATTRS = [
	"id",
	"username",
	"displayName",
	"avatarUrl",
	"pinAvatar",
	"usernameColor",
	"karmaScore",
	"isTrusted"
];

export const RoomRepository = {
	async create(params: {
		roomType: RoomType;
		roomKey: string;
		userId: number;
		content: string;
		mediaUrl?: string | null;
	}) {
		const message = await RoomMessage.create({
			...params,
			mediaUrl: params.mediaUrl ?? null
		});
		return RoomMessage.findByPk(message.id, {
			include: [
				{
					model: User,
					as: "author",
					attributes: AUTHOR_ATTRS
				}
			]
		});
	},

	async findRecent(roomType: RoomType, roomKey: string, limit = 50) {
		return RoomMessage.findAll({
			where: { roomType, roomKey },
			include: [
				{
					model: User,
					as: "author",
					attributes: AUTHOR_ATTRS
				}
			],
			order: [["createdAt", "ASC"]],
			limit
		});
	}
};
