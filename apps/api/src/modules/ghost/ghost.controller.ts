import { Request, Response } from "express";
import { z } from "zod";
import GhostService from "./ghost.service";

const ShareBody = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	durationMinutes: z.number().int().min(15).max(180).default(60)
});

export const shareGhostLocation = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const body = ShareBody.parse(req.body);
	const share = await GhostService.shareLocation({ userId, ...body });
	return res.status(200).json(share);
};

export const stopGhostLocation = async (req: Request, res: Response) => {
	await GhostService.stopSharing(Number(req.id));
	return res.status(200).json({ message: "Ghost mode disabled" });
};

export const getFriendGhosts = async (req: Request, res: Response) => {
	const data = await GhostService.getFriendGhosts(Number(req.id));
	return res.status(200).json({ data, count: data.length });
};
