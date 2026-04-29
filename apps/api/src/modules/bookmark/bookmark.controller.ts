import { Request, Response } from "express";
import BookmarkService from "./bookmark.service";
import { z } from "zod";

const PostIdParam = z.object({ postId: z.coerce.number().int().positive() });

export const toggleBookmark = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { postId } = PostIdParam.parse(req.params);
	const result = await BookmarkService.toggle(userId, postId);
	return res.status(200).json(result);
};

export const getBookmarks = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const bookmarks = await BookmarkService.getBookmarks(userId);
	return res.status(200).json({ data: bookmarks });
};

export const checkBookmark = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { postId } = PostIdParam.parse(req.params);
	const bookmarked = await BookmarkService.isBookmarked(userId, postId);
	return res.status(200).json({ bookmarked });
};
