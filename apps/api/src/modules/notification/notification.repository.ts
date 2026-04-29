import Notification, { NotificationType } from "./notification.model";
import User from "../user/user.model";

export const NotificationRepository = {
	async create(params: {
		userId: number;
		type: NotificationType;
		message: string;
		referenceId?: number | null;
		referenceType?: string | null;
		actorId?: number | null;
	}): Promise<Notification> {
		return Notification.create(params);
	},

	async findForUser(
		userId: number,
		limit = 30,
		offset = 0
	): Promise<Notification[]> {
		return Notification.findAll({
			where: { userId },
			include: [
				{
					model: User,
					as: "actor",
					attributes: ["id", "username", "displayName", "avatarUrl"],
					required: false
				}
			],
			order: [["createdAt", "DESC"]],
			limit,
			offset
		});
	},

	async markRead(id: number, userId: number): Promise<boolean> {
		const [affected] = await Notification.update(
			{ isRead: true },
			{ where: { id, userId } }
		);
		return affected > 0;
	},

	async markAllRead(userId: number): Promise<void> {
		await Notification.update(
			{ isRead: true },
			{ where: { userId, isRead: false } }
		);
	},

	async countUnread(userId: number): Promise<number> {
		return Notification.count({ where: { userId, isRead: false } });
	}
};
