import { Request, Response } from "express";
import ContactService from "./contact.service";
import { z } from "zod";

const ContactIdParam = z.object({ id: z.coerce.number().int().positive() });
const UserIdParam = z.object({ userId: z.coerce.number().int().positive() });

export const sendRequest = async (req: Request, res: Response) => {
	const requesterId = Number(req.id);
	const { userId: addresseeId } = UserIdParam.parse(req.params);
	const contact = await ContactService.sendRequest(requesterId, addresseeId);
	return res.status(201).json(contact);
};

export const acceptRequest = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { id } = ContactIdParam.parse(req.params);
	const contact = await ContactService.acceptRequest(id, userId);
	return res.status(200).json(contact);
};

export const declineOrRemove = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { id } = ContactIdParam.parse(req.params);
	await ContactService.declineOrRemove(id, userId);
	return res.status(200).json({ message: "Removed" });
};

export const blockUser = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { userId: targetId } = UserIdParam.parse(req.params);
	const contact = await ContactService.blockUser(userId, targetId);
	return res.status(200).json(contact);
};

export const getFriends = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const friends = await ContactService.getFriends(userId);
	return res.status(200).json({ data: friends });
};

export const getPendingRequests = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const requests = await ContactService.getPendingRequests(userId);
	return res.status(200).json({ data: requests });
};

export const getSentRequests = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const requests = await ContactService.getSentRequests(userId);
	return res.status(200).json({ data: requests });
};

export const getContactStatus = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { userId: targetId } = UserIdParam.parse(req.params);
	const contact = await ContactService.getStatus(userId, targetId);
	return res.status(200).json({ contact: contact ?? null });
};
