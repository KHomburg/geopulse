import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRouteHandler = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async route handler so that any thrown error is forwarded
 * to Express's error-handling middleware via next(err).
 */
export function asyncHandler(fn: AsyncRouteHandler): RequestHandler {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}
