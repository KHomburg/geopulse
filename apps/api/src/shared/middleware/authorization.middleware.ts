import { NextFunction, Request, Response } from "express";
import type { UserRole } from "../auth/auth.types";
import { isAdminRole } from "../auth/auth.types";

export const requireRoles =
	(...roles: UserRole[]) =>
	(req: Request, res: Response, next: NextFunction) => {
		if (!req.auth) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		if (!roles.includes(req.auth.role)) {
			return res.status(403).json({ message: "Forbidden" });
		}

		return next();
	};

export const requireAdmin = requireRoles("admin");

export const requireSelfOrAdmin =
	(paramName = "id") =>
	(req: Request, res: Response, next: NextFunction) => {
		if (!req.auth) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const targetId = Number(req.params[paramName]);
		if (!Number.isInteger(targetId)) {
			return next();
		}

		if (req.auth.userId === targetId || isAdminRole(req.auth.role)) {
			return next();
		}

		return res.status(403).json({ message: "Forbidden" });
	};
