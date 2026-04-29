import { Router } from "express";
import {
	AuthMiddleware,
	OptionalAuthMiddleware
} from "../../shared/middleware/auth.middleware";
import { requireWriteEnabledAccount } from "../../shared/middleware/accountStatus.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import {
	getComments,
	createComment,
	deleteComment
} from "./comment.controller";

const CommentRouter = Router({ mergeParams: true });

CommentRouter.get("/", OptionalAuthMiddleware, asyncHandler(getComments));
CommentRouter.post(
	"/",
	AuthMiddleware,
	requireWriteEnabledAccount,
	asyncHandler(createComment)
);
CommentRouter.delete(
	"/:commentId",
	AuthMiddleware,
	requireWriteEnabledAccount,
	asyncHandler(deleteComment)
);

export { CommentRouter };
