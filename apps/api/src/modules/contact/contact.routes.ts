import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { requireWriteEnabledAccount } from "../../shared/middleware/accountStatus.middleware";
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

ContactRouter.get("/friends", getFriends);
ContactRouter.get("/requests/received", getPendingRequests);
ContactRouter.get("/requests/sent", getSentRequests);
ContactRouter.get("/status/:userId", getContactStatus);
ContactRouter.post("/request/:userId", requireWriteEnabledAccount, sendRequest);
ContactRouter.patch("/:id/accept", requireWriteEnabledAccount, acceptRequest);
ContactRouter.delete("/:id", requireWriteEnabledAccount, declineOrRemove);
ContactRouter.post("/block/:userId", requireWriteEnabledAccount, blockUser);

export { ContactRouter };
