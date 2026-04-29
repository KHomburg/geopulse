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
import { PostRouter } from "../../modules/post/post.routes";
import { VoteRouter } from "../../modules/vote/vote.routes";
import { ContactRouter } from "../../modules/contact/contact.routes";
import { MessageRouter } from "../../modules/message/message.routes";
import { NotificationRouter } from "../../modules/notification/notification.routes";
import { RealtimeRouter } from "../../modules/realtime/realtime.routes";
import { CommentRouter } from "../../modules/comment/comment.routes";
import { ActivityRouter } from "../../modules/activity/activity.routes";
import { AdminRouter } from "../../modules/admin/admin.routes";
import { GhostRouter } from "../../modules/ghost/ghost.routes";
import { RoomRouter } from "../../modules/room/room.routes";
import { MapRouter } from "../../modules/map/map.routes";
import { ReportRouter } from "../../modules/report/report.routes";
import {
	BookmarkRouter,
	MyBookmarksRouter
} from "../../modules/bookmark/bookmark.routes";
import { globalLimiter } from "../middleware/rateLimit.middleware";
import { config } from "./env.config";
import { errorHandler, notFoundHandler } from "../middleware/error.middleware";
import "./models.associations";

//#endregion

//#region Configuration

// Const variable
const App: Express = express();

function isAllowedLocalDevOrigin(origin: string) {
	if (process.env.NODE_ENV === "production") return false;

	try {
		const parsed = new URL(origin);
		return ["localhost", "127.0.0.1"].includes(parsed.hostname);
	} catch {
		return false;
	}
}

// logging middleware
App.use(morgan("dev"));

// Global rate limit
App.use(globalLimiter);

// Compress Bundle
App.use(
	compression({
		filter: (req, res) => {
			if (req.headers.accept?.includes("text/event-stream")) {
				return false;
			}
			return compression.filter(req, res);
		}
	})
);

// Middle for protection in vulnerabilities
App.use(helmet());

// Use CORS with allowlist
const origins = (config.CORS_ALLOWED_ORIGINS || "")
	.split(",")
	.map((o) => o.trim())
	.filter(Boolean);
const allowAnyOrigin = origins.includes("*");
App.use(
	cors({
		origin: (origin, callback) => {
			if (
				!origin ||
				allowAnyOrigin ||
				origins.includes(origin) ||
				isAllowedLocalDevOrigin(origin)
			) {
				callback(null, true);
				return;
			}

			callback(new Error("Not allowed by CORS"));
		},
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

// Health check for readiness probes / E2E test setup
App.get("/api/v1/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// Users
App.use("/api/v1/user", UserRouter);

// Admin
App.use("/api/v1/admin", AdminRouter);

// Auth
App.use("/api/v1/auth", AuthRouter);

// Reports
App.use("/api/v1/reports", ReportRouter);

// Posts
App.use("/api/v1/posts", PostRouter);

// Votes (nested under posts)
App.use("/api/v1/posts/:postId/votes", VoteRouter);

// Comments (nested under posts)
App.use("/api/v1/posts/:postId/comments", CommentRouter);

// Bookmarks (nested under posts, and top-level for user's saved list)
App.use("/api/v1/posts/:postId/bookmark", BookmarkRouter);
App.use("/api/v1/bookmarks", MyBookmarksRouter);

// Contacts
App.use("/api/v1/contacts", ContactRouter);

// Messages / Conversations
App.use("/api/v1/conversations", MessageRouter);

// Notifications
App.use("/api/v1/notifications", NotificationRouter);

// Realtime stream
App.use("/api/v1/realtime", RealtimeRouter);

// Activity, ghost sharing, and rooms
App.use("/api/v1/activity", ActivityRouter);
App.use("/api/v1/ghost", GhostRouter);
App.use("/api/v1/rooms", RoomRouter);
App.use("/api/v1/map", MapRouter);

//#endregion
// 404 and Error handlers
App.use(notFoundHandler);
App.use(errorHandler);
export default App;
