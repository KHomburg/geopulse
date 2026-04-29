import { Request, Response } from "express";
import { MapDiscoveryQuerySchema } from "./map.schemas";
import MapService from "./map.service";

export const getMapDiscovery = async (req: Request, res: Response) => {
	try {
		const query = MapDiscoveryQuerySchema.parse(req.query);
		const result = await MapService.getDiscovery(
			query.lat,
			query.lng,
			query.radiusMeters
		);

		return res.status(200).json({ data: result });
	} catch (error: unknown) {
		if (
			typeof error === "object" &&
			error !== null &&
			"name" in error &&
			(error as { name?: string }).name === "ZodError"
		) {
			return res.status(400).json({ message: "Invalid request" });
		}

		const message =
			error instanceof Error ? error.message : "Map discovery failed";
		return res.status(502).json({ message });
	}
};
