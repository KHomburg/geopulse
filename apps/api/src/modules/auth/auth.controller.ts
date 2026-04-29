import { Request, Response } from "express";
import { RegisterSchema, LoginSchema } from "./auth.schemas";
import AuthService from "./auth.service";
import { validate as validateZod } from "../../shared/middleware/validate.middleware";

export const register = async (req: Request, res: Response) => {
	const dto = RegisterSchema.parse(req.body);
	const result = await AuthService.register({
		email: dto.email,
		password: dto.password
	});
	if ((result as any).conflict) {
		return res.status(409).json({ message: "Email already registered" });
	}
	return res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
	try {
		const dto = LoginSchema.parse(req.body);
		const result = await AuthService.login({
			email: dto.email,
			password: dto.password
		});
		if (!result) {
			return res.status(401).json({ message: "Invalid credentials" });
		}
		return res.status(200).json(result);
	} catch (error: unknown) {
		const status =
			typeof error === "object" && error !== null && "status" in error
				? Number((error as { status?: number }).status ?? 500)
				: 500;
		const message =
			error instanceof Error ? error.message : "Internal server error";
		return res.status(status).json({ message });
	}
};

export const logout = async (req: Request, res: Response) => {
	const userId = req.auth?.userId;
	if (!userId) return res.status(401).json({ message: "Unauthorized" });
	await AuthService.logoutAll(userId);
	return res.status(200).json({ message: "Logged out" });
};

export const deleteAccount = async (req: Request, res: Response) => {
	const userId = req.auth?.userId;
	if (!userId) return res.status(401).json({ message: "Unauthorized" });
	const deleted = await AuthService.deleteAccount(userId);
	if (!deleted) return res.status(404).json({ message: "User not found" });
	return res.status(200).json({ message: "Account deleted" });
};

export const refresh = async (req: Request, res: Response) => {
	try {
		const { refreshToken } = req.body as { refreshToken?: string };
		if (!refreshToken)
			return res.status(400).json({ message: "Missing refreshToken" });
		const result = await AuthService.refresh(refreshToken);
		if (!result)
			return res.status(401).json({ message: "Invalid refresh token" });
		return res.status(200).json(result);
	} catch (error: unknown) {
		const status =
			typeof error === "object" && error !== null && "status" in error
				? Number((error as { status?: number }).status ?? 500)
				: 500;
		const message =
			error instanceof Error ? error.message : "Internal server error";
		return res.status(status).json({ message });
	}
};
