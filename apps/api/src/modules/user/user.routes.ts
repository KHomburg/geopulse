import { Router } from "express";
import {
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
import { requireWriteEnabledAccount } from "../../shared/middleware/accountStatus.middleware";
import { requireSelfOrAdmin } from "../../shared/middleware/authorization.middleware";

const UserRouter = Router();
UserRouter.get("/search", SearchUsers);
UserRouter.get("/me", AuthMiddleware, GetMe);
UserRouter.get("/me/perks", AuthMiddleware, GetPerkCatalog);
UserRouter.post(
	"/me/perks/purchase",
	AuthMiddleware,
	requireWriteEnabledAccount,
	PurchasePerk
);
UserRouter.get("/", GetUsers);
UserRouter.get("/:id", GetUser);
UserRouter.delete(
	"/:id",
	AuthMiddleware,
	requireWriteEnabledAccount,
	requireSelfOrAdmin(),
	DeleteUser
);
UserRouter.put(
	"/:id",
	AuthMiddleware,
	requireWriteEnabledAccount,
	requireSelfOrAdmin(),
	UpdateUser
);
UserRouter.patch(
	"/email/:id",
	AuthMiddleware,
	requireWriteEnabledAccount,
	requireSelfOrAdmin(),
	UpdateUserEmail
);

export { UserRouter };
