import { ContactRepository } from "./contact.repository";
import NotificationService from "../notification/notification.service";

const ContactService = {
	async sendRequest(requesterId: number, addresseeId: number) {
		if (requesterId === addresseeId) {
			throw Object.assign(new Error("Cannot add yourself"), {
				status: 400
			});
		}
		const existing = await ContactRepository.findBetween(
			requesterId,
			addresseeId
		);
		if (existing) {
			throw Object.assign(
				new Error("Contact relationship already exists"),
				{ status: 409 }
			);
		}
		const contact = await ContactRepository.create(
			requesterId,
			addresseeId
		);
		// Notify addressee
		await NotificationService.createNotification({
			userId: addresseeId,
			type: "friend_request",
			message: "You have a new friend request",
			referenceId: contact.id,
			referenceType: "contact",
			actorId: requesterId
		}).catch(() => {});
		return contact;
	},

	async acceptRequest(contactId: number, addresseeId: number) {
		const contact = await ContactRepository.findById(contactId);
		if (!contact || contact.addresseeId !== addresseeId) {
			throw Object.assign(new Error("Request not found"), {
				status: 404
			});
		}
		if (contact.status !== "pending") {
			throw Object.assign(new Error("Request is not pending"), {
				status: 400
			});
		}
		await ContactRepository.updateStatus(contactId, "accepted");
		// Notify requester
		await NotificationService.createNotification({
			userId: contact.requesterId,
			type: "friend_accepted",
			message: "Your friend request was accepted",
			referenceId: contactId,
			referenceType: "contact",
			actorId: addresseeId
		}).catch(() => {});
		return ContactRepository.findById(contactId);
	},

	async declineOrRemove(contactId: number, userId: number) {
		const contact = await ContactRepository.findById(contactId);
		if (
			!contact ||
			(contact.requesterId !== userId && contact.addresseeId !== userId)
		) {
			throw Object.assign(new Error("Contact not found"), {
				status: 404
			});
		}
		return ContactRepository.delete(contactId);
	},

	async blockUser(userId: number, targetId: number) {
		if (userId === targetId) {
			throw Object.assign(new Error("Cannot block yourself"), {
				status: 400
			});
		}

		const existing = await ContactRepository.findBetween(userId, targetId);
		if (existing) {
			await ContactRepository.updateStatus(existing.id, "blocked");
			return ContactRepository.findById(existing.id);
		}
		return ContactRepository.create(userId, targetId, "blocked");
	},

	async getFriends(userId: number) {
		return ContactRepository.findFriends(userId);
	},

	async getPendingRequests(userId: number) {
		return ContactRepository.findPendingReceived(userId);
	},

	async getSentRequests(userId: number) {
		return ContactRepository.findPendingSent(userId);
	},

	async getStatus(userA: number, userB: number) {
		return ContactRepository.findBetween(userA, userB);
	}
};

export default ContactService;
