import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import {
	getNotifications,
	getUnreadCount,
	markRead,
	markAllRead
} from "./notification.controller";

const NotificationRouter = Router();

NotificationRouter.use(AuthMiddleware);

NotificationRouter.get("/", getNotifications);
NotificationRouter.get("/unread", getUnreadCount);
NotificationRouter.patch("/read-all", markAllRead);
NotificationRouter.patch("/:id/read", markRead);

export { NotificationRouter };
