//#region Import
import jwt, { Secret } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import {
	resolveTrustRole,
	isAccountStatus,
	isUserRole,
	type AccessTokenPayload,
	type AccountStatus,
	type UserRole
} from "../auth/auth.types";
import AuthRepository from "../../modules/auth/auth.repository";

export interface AuthenticatedRequestContext {
	userId: number;
	email: string;
	role: UserRole;
	accountStatus: AccountStatus;
}

// Extend the Request interface to include auth context

declare module "express-serve-static-core" {
	interface Request {
		id?: string;
		auth?: AuthenticatedRequestContext;
	}
}

import { config } from "../config/env.config";

async function resolveAuthContext(token: string) {
	const secretKey: Secret = `${config.TOKEN_KEY}`;
	const decoded = jwt.verify(
		token,
		secretKey
	) as Partial<AccessTokenPayload> & {
		id?: number | string;
		email?: string;
	};
	const userId = Number(decoded.id);
	if (!Number.isInteger(userId) || !decoded.email) {
		throw Object.assign(new Error("Unauthorized"), { status: 401 });
	}

	const currentUser = await AuthRepository.findUserById(userId);
	if (!currentUser) {
		throw Object.assign(new Error("Unauthorized"), { status: 401 });
	}

	const authContext: AuthenticatedRequestContext = {
		userId: currentUser.id,
		email: currentUser.email,
		role: resolveTrustRole(
			isUserRole(currentUser.role) ? currentUser.role : "user",
			currentUser.isTrusted
		),
		accountStatus: isAccountStatus(currentUser.accountStatus)
			? currentUser.accountStatus
			: "active"
	};

	if (authContext.accountStatus === "banned") {
		await AuthRepository.revokeAllRefreshTokensForUser(authContext.userId);
		throw Object.assign(new Error("Account is banned"), { status: 403 });
	}

	return authContext;
}

function sendAuthError(res: Response, err: unknown) {
	const status =
		typeof err === "object" && err !== null && "status" in err
			? Number((err as { status?: number }).status ?? 401)
			: 401;
	const message =
		err instanceof Error && status === 403 ? err.message : "Unauthorized";
	return res.status(status).json({ message });
}
//#endregion

/**
 * @memberof Middeware
 * @description function for validating user token
 * @param req - Object passed by client
 * @param res - Object to be passed by server
 * @param next - next function that will run if token is valid
 * @return Array
 */
export const AuthMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const token = req.header("Authorization")?.replace("Bearer ", "");

	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const authContext = await resolveAuthContext(token);

		req.id = String(authContext.userId);
		req.auth = authContext;

		return next();
	} catch (err: unknown) {
		return sendAuthError(res, err);
	}
};

export const OptionalAuthMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const token = req.header("Authorization")?.replace("Bearer ", "");

	if (!token) {
		return next();
	}

	try {
		const authContext = await resolveAuthContext(token);
		req.id = String(authContext.userId);
		req.auth = authContext;
		return next();
	} catch (err: unknown) {
		return sendAuthError(res, err);
	}
};
