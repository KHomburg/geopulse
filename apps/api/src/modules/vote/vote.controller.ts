import { Request, Response } from "express";
import VoteService from "./vote.service";
import { CastVoteSchema, VotePostIdParamSchema } from "./vote.schemas";

export const castVote = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { postId } = VotePostIdParamSchema.parse(req.params);
	const { value } = CastVoteSchema.parse(req.body);

	const result = await VoteService.castVote(userId, postId, value);
	if (!result) return res.status(404).json({ message: "Post not found" });

	return res.status(200).json(result);
};

export const removeVote = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { postId } = VotePostIdParamSchema.parse(req.params);

	const removed = await VoteService.removeVote(userId, postId);
	if (!removed) return res.status(404).json({ message: "Vote not found" });

	return res.status(200).json({ message: "Vote removed" });
};

export const getMyVote = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { postId } = VotePostIdParamSchema.parse(req.params);

	const voteValue = await VoteService.getUserVote(userId, postId);
	return res.status(200).json({ value: voteValue });
};
