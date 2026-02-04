//#region Import
import jwt, { Secret } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Extend the Request interface to include the 'id' property

declare module "express-serve-static-core" {
	interface Request {
		id?: string;
	}
}

import { config } from "../config/env.config";
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
	try {
		const secretKey: Secret = `${config.TOKEN_KEY}`;
		const token = req.header("Authorization")?.replace("Bearer ", "");

		if (!token) throw new Error();

		// Decode token
		// eslint-disable-next-line
		const decoded = jwt.verify(token, secretKey) as any;

		// Make request as CustomRequest
		// Add decoded token to string propery in CustomRequest
		req["id"] = decoded.id;

		// Run next function
		next();
	} catch (err: unknown) {
		res.status(401).json({ message: "Unauthorized" });
	}
};
