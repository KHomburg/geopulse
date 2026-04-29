import { Router } from "express";
import {
	AuthMiddleware,
	OptionalAuthMiddleware
} from "../../shared/middleware/auth.middleware";
import { requireWriteEnabledAccount } from "../../shared/middleware/accountStatus.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import {
	createPost,
	getPost,
	getFeed,
	getTrustedFeed,
	deletePost,
	getHotspots
} from "./post.controller";

const PostRouter = Router();

// Public routes
PostRouter.get("/", OptionalAuthMiddleware, asyncHandler(getFeed));
PostRouter.get("/hotspots", asyncHandler(getHotspots));
PostRouter.get("/trusted-locals", AuthMiddleware, asyncHandler(getTrustedFeed));
PostRouter.get("/:id", OptionalAuthMiddleware, asyncHandler(getPost));

// Authenticated routes
PostRouter.post(
	"/",
	AuthMiddleware,
	requireWriteEnabledAccount,
	asyncHandler(createPost)
);
PostRouter.delete(
	"/:id",
	AuthMiddleware,
	requireWriteEnabledAccount,
	asyncHandler(deletePost)
);

export { PostRouter };
