import { Router } from "express";
import {
	CreateUser,
	GetMe,
	GetPerkCatalog,
	GetUser,
	GetUsers,
	DeleteUser,
	PurchasePerk,
	UpdateUser,
	UpdateUserEmail,
	SearchUsers
} from "./user.controller";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";

const UserRouter = Router();
UserRouter.get("/search", SearchUsers);
UserRouter.get("/me", AuthMiddleware, GetMe);
UserRouter.get("/me/perks", AuthMiddleware, GetPerkCatalog);
UserRouter.post("/me/perks/purchase", AuthMiddleware, PurchasePerk);
UserRouter.get("/", GetUsers);
UserRouter.get("/:id", GetUser);
UserRouter.post("/", CreateUser);
UserRouter.delete("/:id", AuthMiddleware, DeleteUser);
UserRouter.put("/:id", AuthMiddleware, UpdateUser);
UserRouter.patch("/email/:id", AuthMiddleware, UpdateUserEmail);

export { UserRouter };
