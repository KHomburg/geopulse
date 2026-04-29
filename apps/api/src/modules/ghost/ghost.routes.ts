import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import {
	getFriendGhosts,
	shareGhostLocation,
	stopGhostLocation
} from "./ghost.controller";

const GhostRouter = Router();

GhostRouter.use(AuthMiddleware);
GhostRouter.get("/friends", asyncHandler(getFriendGhosts));
GhostRouter.post("/share", asyncHandler(shareGhostLocation));
GhostRouter.delete("/share", asyncHandler(stopGhostLocation));

export { GhostRouter };
