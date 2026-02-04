import { Router } from "express";
import {
	register,
	login,
	logout,
	deleteAccount,
	refresh
} from "./auth.controller";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { authLimiter } from "../../shared/middleware/rateLimit.middleware";

const AuthRouter = Router();

AuthRouter.post("/register", authLimiter, register);
AuthRouter.post("/login", authLimiter, login);
AuthRouter.post("/refresh", authLimiter, refresh);
AuthRouter.post("/logout", AuthMiddleware, logout);
AuthRouter.delete("/delete", AuthMiddleware, deleteAccount);

export { AuthRouter };
