import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { getHeatmap, reportPresence } from "./activity.controller";

const ActivityRouter = Router();

ActivityRouter.get("/heatmap", asyncHandler(getHeatmap));
ActivityRouter.post("/presence", AuthMiddleware, asyncHandler(reportPresence));

export { ActivityRouter };
