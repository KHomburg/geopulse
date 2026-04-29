import { Request, Response } from "express";
import NotificationService from "./notification.service";
import { z } from "zod";

const NotifIdParam = z.object({ id: z.coerce.number().int().positive() });
const PaginationQuery = z.object({
	limit: z.coerce.number().int().min(1).max(100).optional(),
	offset: z.coerce.number().int().min(0).optional()
});

export const getNotifications = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { limit, offset } = PaginationQuery.parse(req.query);
	const notifications = await NotificationService.getNotifications(
		userId,
		limit,
		offset
	);
	return res.status(200).json({ data: notifications });
};

export const getUnreadCount = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const count = await NotificationService.getUnreadCount(userId);
	return res.status(200).json({ count });
};

export const markRead = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { id } = NotifIdParam.parse(req.params);
	await NotificationService.markRead(id, userId);
	return res.status(200).json({ message: "Marked as read" });
};

export const markAllRead = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	await NotificationService.markAllRead(userId);
	return res.status(200).json({ message: "All marked as read" });
};
