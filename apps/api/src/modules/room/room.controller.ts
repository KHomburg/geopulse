import { Request, Response } from "express";
import { z } from "zod";
import RoomService from "./room.service";

const LocationQuery = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lng: z.coerce.number().min(-180).max(180)
});

const LiveLoungeParam = z.object({ roomKey: z.string().min(3).max(120) });

const RoomMessageBody = z.object({
	content: z.string().min(1).max(2000),
	mediaUrl: z.string().url().optional().nullable(),
	lat: z.number().min(-90).max(90).optional(),
	lng: z.number().min(-180).max(180).optional()
});

export const listLiveLounges = async (req: Request, res: Response) => {
	const { lat, lng } = LocationQuery.parse(req.query);
	const data = await RoomService.listLiveLounges(lat, lng);
	return res.status(200).json({ data, count: data.length });
};

export const getTrustedLocalMessages = async (req: Request, res: Response) => {
	const data = await RoomService.getTrustedLocalMessages(Number(req.id));
	return res.status(200).json({ data, count: data.length });
};

export const sendTrustedLocalMessage = async (req: Request, res: Response) => {
	const { content, mediaUrl } = RoomMessageBody.parse(req.body);
	const message = await RoomService.sendTrustedLocalMessage({
		userId: Number(req.id),
		content,
		mediaUrl: mediaUrl ?? null
	});
	return res.status(201).json(message);
};

export const getLiveLoungeMessages = async (req: Request, res: Response) => {
	const { roomKey } = LiveLoungeParam.parse(req.params);
	const { lat, lng } = LocationQuery.parse(req.query);
	const data = await RoomService.getLiveLoungeMessages({
		userId: Number(req.id),
		roomKey,
		lat,
		lng
	});
	return res.status(200).json({ data, count: data.length });
};

export const sendLiveLoungeMessage = async (req: Request, res: Response) => {
	const { roomKey } = LiveLoungeParam.parse(req.params);
	const { content, mediaUrl, lat, lng } = RoomMessageBody.parse(req.body);
	if (lat == null || lng == null) {
		return res.status(400).json({ message: "lat and lng are required" });
	}
	const message = await RoomService.sendLiveLoungeMessage({
		userId: Number(req.id),
		roomKey,
		lat,
		lng,
		content,
		mediaUrl: mediaUrl ?? null
	});
	return res.status(201).json(message);
};
