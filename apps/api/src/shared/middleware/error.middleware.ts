import { NextFunction, Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
	return res.status(404).json({ message: "Not found" });
}

export function errorHandler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) {
	const status = err?.status || 500;
	const code = err?.code || (status >= 500 ? "INTERNAL_ERROR" : "ERROR");
	const message = err?.message || "Internal server error";
	const details = err?.details;
	return res.status(status).json({ code, message, details });
}
