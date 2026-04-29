import { Request, Response } from "express";
import MessageService from "./message.service";
import { z } from "zod";

const ConvIdParam = z.object({
	conversationId: z.coerce.number().int().positive()
});
const UserIdParam = z.object({ userId: z.coerce.number().int().positive() });
const SendMessageBody = z.object({
	content: z.string().min(1).max(2000)
});
const GetMessagesQuery = z.object({
	limit: z.coerce.number().int().min(1).max(100).optional(),
	before: z.coerce.number().int().optional()
});

export const getConversations = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const conversations = await MessageService.getConversations(userId);
	return res.status(200).json({ data: conversations });
};

export const openConversation = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { userId: targetId } = UserIdParam.parse(req.params);
	const { conversation, created } =
		await MessageService.getOrCreateConversation(userId, targetId);
	return res.status(created ? 201 : 200).json(conversation);
};

export const getMessages = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { conversationId } = ConvIdParam.parse(req.params);
	const { limit, before } = GetMessagesQuery.parse(req.query);
	const messages = await MessageService.getMessages(
		conversationId,
		userId,
		limit,
		before
	);
	return res.status(200).json({ data: messages });
};

export const sendMessage = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { conversationId } = ConvIdParam.parse(req.params);
	const { content } = SendMessageBody.parse(req.body);
	const message = await MessageService.sendMessage(
		conversationId,
		userId,
		content
	);
	return res.status(201).json(message);
};

export const markRead = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { conversationId } = ConvIdParam.parse(req.params);
	await MessageService.markRead(conversationId, userId);
	return res.status(200).json({ message: "Marked as read" });
};

export const getUnreadCount = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const count = await MessageService.getUnreadCount(userId);
	return res.status(200).json({ count });
};
