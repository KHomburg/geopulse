import { Request, Response } from "express";
import { z } from "zod";
import { ActivityService } from "../../shared/activity/activity.service";

const PresenceBody = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180)
});

const HeatmapQuery = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lng: z.coerce.number().min(-180).max(180),
	radiusKm: z.coerce.number().min(0.5).max(25).default(10)
});

export const reportPresence = async (req: Request, res: Response) => {
	const userId = Number(req.id);
	const { lat, lng } = PresenceBody.parse(req.body);
	ActivityService.reportPresence(userId, lat, lng);
	return res.status(202).json({ message: "Presence recorded" });
};

export const getHeatmap = async (req: Request, res: Response) => {
	const { lat, lng, radiusKm } = HeatmapQuery.parse(req.query);
	const data = ActivityService.getHeatmap(lat, lng, radiusKm);
	return res.status(200).json({ data, count: data.length });
};
