import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { requireWriteEnabledAccount } from "../../shared/middleware/accountStatus.middleware";
import {
	getConversations,
	openConversation,
	getMessages,
	sendMessage,
	sendTyping,
	markRead,
	getUnreadCount
} from "./message.controller";

const MessageRouter = Router();

MessageRouter.use(AuthMiddleware);

MessageRouter.get("/", getConversations);
MessageRouter.get("/unread", getUnreadCount);
MessageRouter.post(
	"/with/:userId",
	requireWriteEnabledAccount,
	openConversation
);
MessageRouter.get("/:conversationId/messages", getMessages);
MessageRouter.post(
	"/:conversationId/messages",
	requireWriteEnabledAccount,
	sendMessage
);
MessageRouter.post(
	"/:conversationId/typing",
	requireWriteEnabledAccount,
	sendTyping
);
MessageRouter.patch(
	"/:conversationId/read",
	requireWriteEnabledAccount,
	markRead
);

export { MessageRouter };
