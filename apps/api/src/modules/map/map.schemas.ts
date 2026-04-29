import { z } from "zod";

export const MapDiscoveryQuerySchema = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lng: z.coerce.number().min(-180).max(180),
	radiusMeters: z.coerce.number().int().min(250).max(1_800).optional()
});

export type MapDiscoveryQuery = z.infer<typeof MapDiscoveryQuerySchema>;
