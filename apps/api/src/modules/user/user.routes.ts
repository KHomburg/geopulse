import { Router } from "express";
import {
	CreateUser,
	GetUser,
	GetUsers,
	DeleteUser,
	UpdateUser,
	UpdateUserEmail
} from "./user.controller";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";

const UserRouter = Router();
UserRouter.get("/", GetUsers);
UserRouter.get("/:id", GetUser);
UserRouter.post("/", CreateUser);
UserRouter.delete("/:id", AuthMiddleware, DeleteUser);
UserRouter.put("/:id", AuthMiddleware, UpdateUser);
UserRouter.patch("/email/:id", AuthMiddleware, UpdateUserEmail);

export { UserRouter };
