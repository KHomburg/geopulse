import { BookmarkRepository } from "./bookmark.repository";

const BookmarkService = {
	async toggle(
		userId: number,
		postId: number
	): Promise<{ bookmarked: boolean }> {
		const already = await BookmarkRepository.exists(userId, postId);
		if (already) {
			await BookmarkRepository.remove(userId, postId);
			return { bookmarked: false };
		}
		await BookmarkRepository.add(userId, postId);
		return { bookmarked: true };
	},

	async getBookmarks(userId: number) {
		return BookmarkRepository.findByUser(userId);
	},

	async isBookmarked(userId: number, postId: number): Promise<boolean> {
		return BookmarkRepository.exists(userId, postId);
	}
};

export default BookmarkService;
