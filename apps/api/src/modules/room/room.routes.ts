import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { requireWriteEnabledAccount } from "../../shared/middleware/accountStatus.middleware";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import {
	getLiveLoungeMessages,
	getTrustedLocalMessages,
	listLiveLounges,
	sendLiveLoungeMessage,
	sendTrustedLocalMessage
} from "./room.controller";

const RoomRouter = Router();

RoomRouter.get("/live-lounges", asyncHandler(listLiveLounges));

RoomRouter.use(AuthMiddleware);
RoomRouter.get(
	"/trusted-locals/messages",
	asyncHandler(getTrustedLocalMessages)
);
RoomRouter.post(
	"/trusted-locals/messages",
	requireWriteEnabledAccount,
	asyncHandler(sendTrustedLocalMessage)
);
RoomRouter.get(
	"/live-lounges/:roomKey/messages",
	asyncHandler(getLiveLoungeMessages)
);
RoomRouter.post(
	"/live-lounges/:roomKey/messages",
	requireWriteEnabledAccount,
	asyncHandler(sendLiveLoungeMessage)
);

export { RoomRouter };
