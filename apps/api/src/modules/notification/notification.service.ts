import { NotificationRepository } from "./notification.repository";
import type { NotificationType } from "./notification.model";
import { RealtimeService } from "../realtime/realtime.service";

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
		const count = await NotificationRepository.countUnread(userId);
		RealtimeService.sendToUser(userId, "notifications:unread", { count });
	},

	async markAllRead(userId: number) {
		await NotificationRepository.markAllRead(userId);
		RealtimeService.sendToUser(userId, "notifications:unread", {
			count: 0
		});
	},

	async createNotification(params: {
		userId: number;
		type: NotificationType;
		message: string;
		referenceId?: number | null;
		referenceType?: string | null;
		actorId?: number | null;
	}) {
		const notification = await NotificationRepository.create(params);
		const count = await NotificationRepository.countUnread(params.userId);
		RealtimeService.sendToUser(params.userId, "notification:new", {
			notification
		});
		RealtimeService.sendToUser(params.userId, "notifications:unread", {
			count
		});
		return notification;
	}
};

export default NotificationService;
