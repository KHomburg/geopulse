import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { requireWriteEnabledAccount } from "../../shared/middleware/accountStatus.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import {
	sendRequest,
	acceptRequest,
	declineOrRemove,
	blockUser,
	getFriends,
	getPendingRequests,
	getSentRequests,
	getContactStatus
} from "./contact.controller";

const ContactRouter = Router();

// All contact routes require authentication
ContactRouter.use(AuthMiddleware);

ContactRouter.get("/friends", asyncHandler(getFriends));
ContactRouter.get(
	"/requests/received",
	asyncHandler(getPendingRequests)
);
ContactRouter.get("/requests/sent", asyncHandler(getSentRequests));
ContactRouter.get("/status/:userId", asyncHandler(getContactStatus));
ContactRouter.post(
	"/request/:userId",
	requireWriteEnabledAccount,
	asyncHandler(sendRequest)
);
ContactRouter.patch(
	"/:id/accept",
	requireWriteEnabledAccount,
	asyncHandler(acceptRequest)
);
ContactRouter.delete(
	"/:id",
	requireWriteEnabledAccount,
	asyncHandler(declineOrRemove)
);
ContactRouter.post(
	"/block/:userId",
	requireWriteEnabledAccount,
	asyncHandler(blockUser)
);

export { ContactRouter };
