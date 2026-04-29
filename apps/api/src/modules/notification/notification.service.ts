import { NotificationRepository } from "./notification.repository";
import type { NotificationType } from "./notification.model";

const NotificationService = {
	async getNotifications(userId: number, limit?: number, offset?: number) {
		return NotificationRepository.findForUser(userId, limit, offset);
	},

	async getUnreadCount(userId: number) {
		return NotificationRepository.countUnread(userId);
	},

	async markRead(notificationId: number, userId: number) {
		const updated = await NotificationRepository.markRead(
			notificationId,
			userId
		);
		if (!updated) {
			throw Object.assign(new Error("Notification not found"), {
				status: 404
			});
		}
	},

	async markAllRead(userId: number) {
		await NotificationRepository.markAllRead(userId);
	},

	async createNotification(params: {
		userId: number;
		type: NotificationType;
		message: string;
		referenceId?: number | null;
		referenceType?: string | null;
		actorId?: number | null;
	}) {
		return NotificationRepository.create(params);
	}
};

export default NotificationService;
