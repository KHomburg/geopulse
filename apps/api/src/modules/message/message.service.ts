import { MessageRepository } from "./message.repository";

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
		return MessageRepository.markAsRead(conversationId, userId);
	},

	async getUnreadCount(userId: number) {
		return MessageRepository.countUnread(userId);
	}
};

export default MessageService;
