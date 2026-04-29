import Comment from "./comment.model";
import User from "../user/user.model";
import { Op } from "sequelize";
import {
	PUBLISHED_MODERATION_STATUS,
	type ModerationStatus
} from "../../shared/moderation/moderation.types";

const USER_ATTRS = ["id", "username", "displayName", "avatarUrl"];

export const CommentRepository = {
	async create(params: {
		postId: number;
		userId: number;
		content: string;
		parentId?: number | null;
		moderationStatus?: ModerationStatus;
	}): Promise<Comment> {
		return Comment.create(params as unknown as Record<string, unknown>);
	},

	async findByPost(postId: number, requesterId?: number): Promise<Comment[]> {
		return Comment.findAll({
			where:
				requesterId == null
					? {
							postId,
							moderationStatus: PUBLISHED_MODERATION_STATUS
					  }
					: {
							postId,
							[Op.or]: [
								{
									moderationStatus:
										PUBLISHED_MODERATION_STATUS
								},
								{
									userId: requesterId,
									moderationStatus: "shadow_hidden"
								}
							]
					  },
			include: [
				{
					model: User,
					as: "author",
					attributes: USER_ATTRS
				}
			],
			order: [["createdAt", "ASC"]]
		});
	},

	async findById(id: number): Promise<Comment | null> {
		return Comment.findByPk(id);
	},

	async findByIdForModeration(id: number): Promise<Comment | null> {
		return Comment.findOne({
			where: { id },
			include: [
				{
					model: User,
					as: "author",
					attributes: USER_ATTRS
				}
			]
		});
	},

	async findByIdsForModeration(ids: number[]): Promise<Comment[]> {
		if (!ids.length) return [];
		return Comment.findAll({
			where: { id: { [Op.in]: ids } },
			include: [
				{
					model: User,
					as: "author",
					attributes: USER_ATTRS
				}
			]
		});
	},

	async countByPost(postId: number): Promise<number> {
		return Comment.count({
			where: { postId, moderationStatus: PUBLISHED_MODERATION_STATUS }
		});
	},

	async softDeleteByIdAndUser(id: number, userId: number): Promise<boolean> {
		const affected = await Comment.destroy({ where: { id, userId } });
		return affected > 0;
	},

	async updateModerationStatus(
		id: number,
		moderationStatus: ModerationStatus
	): Promise<boolean> {
		const [affected] = await Comment.update(
			{ moderationStatus },
			{ where: { id } }
		);
		return affected > 0;
	},

	async incrementKarma(id: number, delta: number): Promise<void> {
		await Comment.increment("karmaScore", { by: delta, where: { id } });
	}
};
