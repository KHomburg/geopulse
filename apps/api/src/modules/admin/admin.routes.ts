import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import {
	requireAdmin,
	requireRoles
} from "../../shared/middleware/authorization.middleware";
import {
	getAdminAuditLog,
	getAdminUser,
	getModerationQueue,
	getModerationReport,
	reviewModerationReport,
	updateAdminUserModeration
} from "./admin.controller";

const AdminRouter = Router();

AdminRouter.use(AuthMiddleware);
AdminRouter.get(
	"/reports/queue",
	requireRoles("community_mod", "admin"),
	getModerationQueue
);
AdminRouter.get(
	"/reports/:id",
	requireRoles("community_mod", "admin"),
	getModerationReport
);
AdminRouter.post(
	"/reports/:id/review",
	requireRoles("community_mod", "admin"),
	reviewModerationReport
);
AdminRouter.get("/audit-log", requireAdmin, getAdminAuditLog);
AdminRouter.get("/users/:id", requireAdmin, getAdminUser);
AdminRouter.patch(
	"/users/:id/moderation",
	requireAdmin,
	updateAdminUserModeration
);

export { AdminRouter };
