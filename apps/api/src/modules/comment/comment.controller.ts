import { Request, Response } from "express";
import CommentService from "./comment.service";
import { z } from "zod";

const PostIdParam = z.object({ postId: z.coerce.number().int().positive() });
const CommentIdParam = z.object({
	commentId: z.coerce.number().int().positive()
});
const CreateCommentBody = z.object({
	content: z.string().min(1).max(2000),
	parentId: z.number().int().positive().optional().nullable()
});

export const getComments = async (req: Request, res: Response) => {
	const { postId } = PostIdParam.parse(req.params);
	const comments = await CommentService.getComments(postId, req.auth?.userId);
	return res.status(200).json({ data: comments });
};

export const createComment = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { postId } = PostIdParam.parse(req.params);
	const { content, parentId } = CreateCommentBody.parse(req.body);
	const comment = await CommentService.createComment({
		postId,
		userId,
		content,
		parentId: parentId ?? null,
		accountStatus: req.auth?.accountStatus
	});
	return res.status(201).json(comment);
};

export const deleteComment = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { commentId } = CommentIdParam.parse(req.params);
	await CommentService.deleteComment(commentId, userId);
	return res.status(200).json({ message: "Comment deleted" });
};
