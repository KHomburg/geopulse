import { Op, Sequelize } from "sequelize";
import Conversation from "./conversation.model";
import ConversationParticipant from "./conversationParticipant.model";
import Message from "./message.model";
import User from "../user/user.model";

export const MessageRepository = {
	async findOrCreateConversation(
		userA: number,
		userB: number
	): Promise<{ conversation: Conversation; created: boolean }> {
		// Find a conversation that contains both users
		const existing = await Conversation.findOne({
			include: [
				{
					model: ConversationParticipant,
					as: "participants",
					where: { userId: userA },
					required: true
				}
			]
		});

		// Check if there's a shared conversation between both users
		const shared = await Conversation.findOne({
			include: [
				{
					model: ConversationParticipant,
					as: "participants",
					where: {
						userId: { [Op.in]: [userA, userB] }
					},
					required: true
				}
			],
			group: ["Conversation.id"],
			having: Sequelize.literal("COUNT(DISTINCT participants.userId) = 2")
		});

		if (shared) return { conversation: shared, created: false };

		const conversation = await Conversation.create({});
		await ConversationParticipant.bulkCreate([
			{ conversationId: conversation.id, userId: userA },
			{ conversationId: conversation.id, userId: userB }
		]);
		return { conversation, created: true };
	},

	async createMessage(
		conversationId: number,
		senderId: number,
		content: string
	): Promise<Message> {
		const message = await Message.create({
			conversationId,
			senderId,
			content
		});
		return (
			(await Message.findByPk(message.id, {
				include: [
					{
						model: User,
						as: "sender",
						attributes: [
							"id",
							"username",
							"displayName",
							"avatarUrl"
						]
					}
				]
			})) ?? message
		);
	},

	async getMessages(
		conversationId: number,
		limit = 50,
		before?: number
	): Promise<Message[]> {
		const where: Record<string, unknown> = { conversationId };
		if (before) where["id"] = { [Op.lt]: before };
		return Message.findAll({
			where,
			include: [
				{
					model: User,
					as: "sender",
					attributes: ["id", "username", "displayName", "avatarUrl"]
				}
			],
			order: [["createdAt", "DESC"]],
			limit
		});
	},

	async getConversationsForUser(userId: number): Promise<Conversation[]> {
		return Conversation.findAll({
			include: [
				{
					model: ConversationParticipant,
					as: "participants",
					where: { userId },
					required: true,
					attributes: []
				},
				{
					model: ConversationParticipant,
					as: "allParticipants",
					required: false,
					include: [
						{
							model: User,
							as: "user",
							attributes: [
								"id",
								"username",
								"displayName",
								"avatarUrl"
							]
						}
					]
				},
				{
					model: Message,
					as: "lastMessage",
					required: false,
					limit: 1,
					order: [["createdAt", "DESC"]],
					include: [
						{
							model: User,
							as: "sender",
							attributes: ["id", "username", "displayName"]
						}
					]
				}
			],
			order: [["updatedAt", "DESC"]]
		});
	},

	async isParticipant(
		conversationId: number,
		userId: number
	): Promise<boolean> {
		const p = await ConversationParticipant.findOne({
			where: { conversationId, userId }
		});
		return p !== null;
	},

	async getParticipantUserIds(conversationId: number): Promise<number[]> {
		const participants = await ConversationParticipant.findAll({
			where: { conversationId },
			attributes: ["userId"]
		});
		return participants.map((participant) => participant.userId);
	},

	async markAsRead(conversationId: number, userId: number): Promise<void> {
		await Message.update(
			{ readAt: new Date() },
			{
				where: {
					conversationId,
					senderId: { [Op.ne]: userId },
					readAt: null
				}
			}
		);
	},

	async countUnread(userId: number): Promise<number> {
		// Get all conversations the user participates in
		const participations = await ConversationParticipant.findAll({
			where: { userId },
			attributes: ["conversationId"]
		});
		const conversationIds = participations.map((p) => p.conversationId);
		if (!conversationIds.length) return 0;
		return Message.count({
			where: {
				conversationId: { [Op.in]: conversationIds },
				senderId: { [Op.ne]: userId },
				readAt: null
			}
		});
	}
};
