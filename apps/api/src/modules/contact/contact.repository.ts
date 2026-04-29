import { Op } from "sequelize";
import Contact, { ContactStatus } from "./contact.model";
import User from "../user/user.model";

export const ContactRepository = {
	async create(requesterId: number, addresseeId: number): Promise<Contact> {
		return Contact.create({ requesterId, addresseeId, status: "pending" });
	},

	async findBetween(userA: number, userB: number): Promise<Contact | null> {
		return Contact.findOne({
			where: {
				[Op.or]: [
					{ requesterId: userA, addresseeId: userB },
					{ requesterId: userB, addresseeId: userA }
				]
			}
		});
	},

	async findById(id: number): Promise<Contact | null> {
		return Contact.findByPk(id);
	},

	async updateStatus(id: number, status: ContactStatus): Promise<boolean> {
		const [affected] = await Contact.update({ status }, { where: { id } });
		return affected > 0;
	},

	async delete(id: number): Promise<boolean> {
		const affected = await Contact.destroy({ where: { id } });
		return affected > 0;
	},

	async findFriends(userId: number): Promise<Contact[]> {
		return Contact.findAll({
			where: {
				status: "accepted",
				[Op.or]: [{ requesterId: userId }, { addresseeId: userId }]
			},
			include: [
				{
					model: User,
					as: "requester",
					attributes: ["id", "username", "displayName", "avatarUrl"]
				},
				{
					model: User,
					as: "addressee",
					attributes: ["id", "username", "displayName", "avatarUrl"]
				}
			]
		});
	},

	async findPendingReceived(userId: number): Promise<Contact[]> {
		return Contact.findAll({
			where: { addresseeId: userId, status: "pending" },
			include: [
				{
					model: User,
					as: "requester",
					attributes: ["id", "username", "displayName", "avatarUrl"]
				}
			]
		});
	},

	async findPendingSent(userId: number): Promise<Contact[]> {
		return Contact.findAll({
			where: { requesterId: userId, status: "pending" },
			include: [
				{
					model: User,
					as: "addressee",
					attributes: ["id", "username", "displayName", "avatarUrl"]
				}
			]
		});
	}
};
