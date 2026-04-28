import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFoundHandler(req: Request, res: Response) {
	return res.status(404).json({ message: "Not found" });
}

export function errorHandler(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
) {
	if (err instanceof ZodError) {
		return res
			.status(400)
			.json({ message: "Validation failed", errors: err.flatten() });
	}
	const e = err as Record<string, unknown>;
	const status = (e?.status as number) || 500;
	const code =
		(e?.code as string) || (status >= 500 ? "INTERNAL_ERROR" : "ERROR");
	const message = (e?.message as string) || "Internal server error";
	const details = e?.details;
	return res.status(status).json({ code, message, details });
}
