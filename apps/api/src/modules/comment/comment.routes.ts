import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import {
	getComments,
	createComment,
	deleteComment
} from "./comment.controller";

const CommentRouter = Router({ mergeParams: true });

CommentRouter.get("/", asyncHandler(getComments));
CommentRouter.post("/", AuthMiddleware, asyncHandler(createComment));
CommentRouter.delete(
	"/:commentId",
	AuthMiddleware,
	asyncHandler(deleteComment)
);

export { CommentRouter };
