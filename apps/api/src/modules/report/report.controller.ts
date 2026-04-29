import { Request, Response } from "express";
import { CreateReportSchema } from "./report.schemas";
import ReportService from "./report.service";

export const createReport = async (req: Request, res: Response) => {
	try {
		const body = CreateReportSchema.parse(req.body);
		const result = await ReportService.createReport({
			reporterId: req.auth?.userId as number,
			contentType: body.contentType,
			targetId: body.targetId,
			category: body.category,
			reason: body.reason ?? null
		});

		return res.status(201).json(result);
	} catch (error: unknown) {
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
};
