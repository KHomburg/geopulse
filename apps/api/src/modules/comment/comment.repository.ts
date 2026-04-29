import Comment from "./comment.model";
import User from "../user/user.model";

const USER_ATTRS = ["id", "username", "displayName", "avatarUrl"];

export const CommentRepository = {
	async create(params: {
		postId: number;
		userId: number;
		content: string;
		parentId?: number | null;
	}): Promise<Comment> {
		return Comment.create(params as unknown as Record<string, unknown>);
	},

	async findByPost(postId: number): Promise<Comment[]> {
		return Comment.findAll({
			where: { postId },
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

	async countByPost(postId: number): Promise<number> {
		return Comment.count({ where: { postId } });
	},

	async softDeleteByIdAndUser(id: number, userId: number): Promise<boolean> {
		const affected = await Comment.destroy({ where: { id, userId } });
		return affected > 0;
	},

	async incrementKarma(id: number, delta: number): Promise<void> {
		await Comment.increment("karmaScore", { by: delta, where: { id } });
	}
};
