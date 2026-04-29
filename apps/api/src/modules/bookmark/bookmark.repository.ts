import Bookmark from "./bookmark.model";
import Post from "../post/post.model";
import User from "../user/user.model";

export const BookmarkRepository = {
	async add(userId: number, postId: number): Promise<Bookmark> {
		return Bookmark.create({ userId, postId });
	},

	async remove(userId: number, postId: number): Promise<boolean> {
		const affected = await Bookmark.destroy({ where: { userId, postId } });
		return affected > 0;
	},

	async findByUser(userId: number): Promise<Bookmark[]> {
		return Bookmark.findAll({
			where: { userId },
			include: [
				{
					model: Post,
					as: "post",
					include: [
						{
							model: User,
							as: "author",
							attributes: [
								"id",
								"username",
								"displayName",
								"avatarUrl"
							]
						}
					]
				}
			],
			order: [["createdAt", "DESC"]]
		});
	},

	async exists(userId: number, postId: number): Promise<boolean> {
		const bm = await Bookmark.findOne({ where: { userId, postId } });
		return bm !== null;
	},

	async countByPost(postId: number): Promise<number> {
		return Bookmark.count({ where: { postId } });
	}
};
