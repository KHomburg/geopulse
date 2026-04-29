import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { getMapDiscovery } from "./map.controller";

const MapRouter = Router();

MapRouter.get("/discovery", asyncHandler(getMapDiscovery));

export { MapRouter };
