import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import {
	createPost,
	getPost,
	getFeed,
	deletePost,
	getHotspots
} from "./post.controller";

const PostRouter = Router();

// Public routes
PostRouter.get("/", asyncHandler(getFeed));
PostRouter.get("/hotspots", asyncHandler(getHotspots));
PostRouter.get("/:id", asyncHandler(getPost));

// Authenticated routes
PostRouter.post("/", AuthMiddleware, asyncHandler(createPost));
PostRouter.delete("/:id", AuthMiddleware, asyncHandler(deletePost));

export { PostRouter };
