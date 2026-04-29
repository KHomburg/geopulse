import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import {
	toggleBookmark,
	getBookmarks,
	checkBookmark
} from "./bookmark.controller";

const BookmarkRouter = Router({ mergeParams: true });

// Nested under /posts/:postId/bookmark
BookmarkRouter.post("/", AuthMiddleware, asyncHandler(toggleBookmark));
BookmarkRouter.get("/", AuthMiddleware, asyncHandler(checkBookmark));

export { BookmarkRouter };

// Separate router for user's bookmark list
const MyBookmarksRouter = Router();
MyBookmarksRouter.get("/", AuthMiddleware, asyncHandler(getBookmarks));

export { MyBookmarksRouter };
