import { MessageRepository } from "./message.repository";
import { RealtimeService } from "../realtime/realtime.service";

const MessageService = {
	async getOrCreateConversation(userA: number, userB: number) {
		if (userA === userB) {
			throw Object.assign(new Error("Cannot message yourself"), {
				status: 400
			});
		}
		return MessageRepository.findOrCreateConversation(userA, userB);
	},

	async sendMessage(
		conversationId: number,
		senderId: number,
		content: string
	) {
		const isParticipant = await MessageRepository.isParticipant(
			conversationId,
			senderId
		);
		if (!isParticipant) {
			throw Object.assign(new Error("Forbidden"), { status: 403 });
		}
		const message = await MessageRepository.createMessage(
			conversationId,
			senderId,
			content.trim()
		);
		// Bump conversation updatedAt so it sorts to top
		const { Conversation } = await import("./conversation.model");
		await Conversation.update(
			{ updatedAt: new Date() },
			{ where: { id: conversationId } }
		);
		const participantIds = await MessageRepository.getParticipantUserIds(
			conversationId
		);
		RealtimeService.sendToUsers(participantIds, "message:new", {
			conversationId,
			message
		});
		await Promise.all(
			participantIds.map(async (participantId) => {
				const count = await MessageRepository.countUnread(
					participantId
				);
				RealtimeService.sendToUser(participantId, "messages:unread", {
					count
				});
			})
		);
		return message;
	},

	async getMessages(
		conversationId: number,
		userId: number,
		limit?: number,
		before?: number
	) {
		const isParticipant = await MessageRepository.isParticipant(
			conversationId,
			userId
		);
		if (!isParticipant) {
			throw Object.assign(new Error("Forbidden"), { status: 403 });
		}
		return MessageRepository.getMessages(conversationId, limit, before);
	},

	async getConversations(userId: number) {
		return MessageRepository.getConversationsForUser(userId);
	},

	async markRead(conversationId: number, userId: number) {
		const isParticipant = await MessageRepository.isParticipant(
			conversationId,
			userId
		);
		if (!isParticipant) {
			throw Object.assign(new Error("Forbidden"), { status: 403 });
		}
		await MessageRepository.markAsRead(conversationId, userId);
		const count = await MessageRepository.countUnread(userId);
		RealtimeService.sendToUser(userId, "messages:unread", { count });
	},

	async sendTypingIndicator(conversationId: number, userId: number) {
		const isParticipant = await MessageRepository.isParticipant(
			conversationId,
			userId
		);
		if (!isParticipant) {
			throw Object.assign(new Error("Forbidden"), { status: 403 });
		}
		const participantIds = await MessageRepository.getParticipantUserIds(
			conversationId
		);
		RealtimeService.sendToUsers(
			participantIds.filter((participantId) => participantId !== userId),
			"message:typing",
			{
				conversationId,
				userId,
				expiresAt: new Date(Date.now() + 3_000).toISOString()
			}
		);
	},

	async getUnreadCount(userId: number) {
		return MessageRepository.countUnread(userId);
	}
};

export default MessageService;
