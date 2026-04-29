import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { streamEvents } from "./realtime.controller";

const RealtimeRouter = Router();

RealtimeRouter.use(AuthMiddleware);
RealtimeRouter.get("/stream", streamEvents);

export { RealtimeRouter };
