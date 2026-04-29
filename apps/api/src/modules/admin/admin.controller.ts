import { Request, Response } from "express";
import {
	AdminAuditLogQuerySchema,
	AdminReportParamsSchema,
	AdminUserParamsSchema,
	ModerationQueueQuerySchema,
	ReviewModerationReportSchema,
	UpdateAdminUserModerationSchema
} from "./admin.schemas";
import AdminService from "./admin.service";

function handleAdminError(error: unknown, res: Response) {
	if (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		(error as { name?: string }).name === "ZodError"
	) {
		return res.status(400).json({ message: "Invalid request" });
	}

	const status =
		typeof error === "object" && error !== null && "status" in error
			? Number((error as { status?: number }).status ?? 500)
			: 500;
	const message =
		error instanceof Error ? error.message : "Internal server error";
	return res.status(status).json({ message });
}

export const getAdminUser = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const { id } = AdminUserParamsSchema.parse(req.params);
		const user = await AdminService.getUserById(id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json(user);
	} catch (error: unknown) {
		return handleAdminError(error, res);
	}
};

export const updateAdminUserModeration = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const { id } = AdminUserParamsSchema.parse(req.params);
		const updates = UpdateAdminUserModerationSchema.parse(req.body);
		const user = await AdminService.updateUserModeration(
			req.auth?.userId as number,
			id,
			updates
		);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json(user);
	} catch (error: unknown) {
		return handleAdminError(error, res);
	}
};

export const getModerationQueue = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const { limit } = ModerationQueueQuerySchema.parse(req.query);
		const data = await AdminService.getModerationQueue(limit);
		return res.status(200).json({ data, count: data.length });
	} catch (error: unknown) {
		return handleAdminError(error, res);
	}
};

export const getModerationReport = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const { id } = AdminReportParamsSchema.parse(req.params);
		const report = await AdminService.getModerationReport(Number(id));
		if (!report) {
			return res.status(404).json({ message: "Report not found" });
		}
		return res.status(200).json(report);
	} catch (error: unknown) {
		return handleAdminError(error, res);
	}
};

export const reviewModerationReport = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const { id } = AdminReportParamsSchema.parse(req.params);
		const { action, reason } = ReviewModerationReportSchema.parse(req.body);
		const result = await AdminService.reviewModerationReport({
			reportId: Number(id),
			actorId: req.auth?.userId as number,
			action,
			reason: reason ?? null
		});
		if (!result) {
			return res.status(404).json({ message: "Report not found" });
		}
		return res.status(200).json(result);
	} catch (error: unknown) {
		return handleAdminError(error, res);
	}
};

export const getAdminAuditLog = async (
	req: Request,
	res: Response
): Promise<Response> => {
	try {
		const { limit } = AdminAuditLogQuerySchema.parse(req.query);
		const data = await AdminService.getAuditLog(limit);
		return res.status(200).json({ data, count: data.length });
	} catch (error: unknown) {
		return handleAdminError(error, res);
	}
};
