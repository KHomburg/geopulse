import { Router } from "express";
import { AuthMiddleware } from "../../shared/middleware/auth.middleware";
import { createReport } from "./report.controller";

const ReportRouter = Router();

ReportRouter.post("/", AuthMiddleware, createReport);

export { ReportRouter };
