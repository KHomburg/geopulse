import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { castVote, removeVote, getMyVote } from "./vote.controller";

const VoteRouter = Router({ mergeParams: true });

VoteRouter.post("/", AuthMiddleware, asyncHandler(castVote));
VoteRouter.delete("/", AuthMiddleware, asyncHandler(removeVote));
VoteRouter.get("/me", AuthMiddleware, asyncHandler(getMyVote));

export { VoteRouter };
