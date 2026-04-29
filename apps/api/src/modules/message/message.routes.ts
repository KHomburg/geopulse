import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import {
	getConversations,
	openConversation,
	getMessages,
	sendMessage,
	markRead,
	getUnreadCount
} from "./message.controller";

const MessageRouter = Router();

MessageRouter.use(AuthMiddleware);

MessageRouter.get("/", getConversations);
MessageRouter.get("/unread", getUnreadCount);
MessageRouter.post("/with/:userId", openConversation);
MessageRouter.get("/:conversationId/messages", getMessages);
MessageRouter.post("/:conversationId/messages", sendMessage);
MessageRouter.patch("/:conversationId/read", markRead);

export { MessageRouter };
