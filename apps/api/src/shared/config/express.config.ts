//#region Import
import express, { Express } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
// import * as morgan from "morgan";

// Router
import { UserRouter } from "./../../modules/user/user.routes";
import { AuthRouter } from "../../modules/auth/auth.routes";
import { globalLimiter } from "../middleware/rateLimit.middleware";
import { config } from "./env.config";
import { errorHandler, notFoundHandler } from "../middleware/error.middleware";
import "./models.associations";

//#endregion

//#region Configuration

// Const variable
const App: Express = express();

// logging middleware
App.use(morgan("dev"));

// Global rate limit
App.use(globalLimiter);

// Compress Bundle
App.use(compression());

// Middle for protection in vulnerabilities
App.use(helmet());

// Use CORS with allowlist
const origins = (config.CORS_ALLOWED_ORIGINS || "")
	.split(",")
	.map((o) => o.trim());
App.use(
	cors({
		origin: origins.includes("*") ? true : origins,
		credentials: true
	})
);

// Parse incoming request with json payload
App.use(express.json({ limit: "1mb" }));

// Get the json payload with Content-Type header
// Preventing to get undefined value in request
App.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));
App.use(bodyParser.json({ limit: "1mb" }));

//#endregion

//#region Routes Config

// For checking if the api is working
App.get("/", (req, res) => {
	res.status(200).send("Hello");
});

// Users
App.use("/api/v1/user", UserRouter);

// Auth
App.use("/api/v1/auth", AuthRouter);

//#endregion
// 404 and Error handlers
App.use(notFoundHandler);
App.use(errorHandler);
export default App;
