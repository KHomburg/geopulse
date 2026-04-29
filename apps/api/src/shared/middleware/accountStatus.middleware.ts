import { NextFunction, Request, Response } from "express";

function blockedMessage(accountStatus: string) {
	if (accountStatus === "read_only_timeout") {
		return "Account is currently in read-only mode";
	}

	if (accountStatus === "banned") {
		return "Account is banned";
	}

	return "Account cannot perform this action";
}

export const requireWriteEnabledAccount = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	if (
		req.auth.accountStatus === "read_only_timeout" ||
		req.auth.accountStatus === "banned"
	) {
		return res.status(403).json({
			message: blockedMessage(req.auth.accountStatus)
		});
	}

	return next();
};
