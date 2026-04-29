//#region Import
import { sequelize } from "./shared/config/sequelize.config";
import App from "./shared/config/express.config";
import { config } from "./shared/config/env.config";
// models must be imported to register them with sequelize before sync
import "./modules/user/user.model";
import "./modules/post/post.model";
import "./modules/vote/vote.model";
import "./modules/contact/contact.model";
import "./modules/message/conversation.model";
import "./modules/message/conversationParticipant.model";
import "./modules/message/message.model";
import "./modules/notification/notification.model";
import "./modules/comment/comment.model";
import "./modules/bookmark/bookmark.model";
import "./modules/ghost/ghostShare.model";
import "./modules/room/roomMessage.model";
import "./shared/config/models.associations";
//#endregion

//#region Config

const port = config.PORT;

// Connect to DB
(async () => {
	try {
		await sequelize.authenticate();
		// On SQLite (dev/test) `alter: true` causes an infinite rebuild loop due to
		// FK constraint diffing. Plain sync() creates missing tables without altering
		// existing ones — the seed script handles full recreation when needed.
		const isSQLite = sequelize.getDialect() === "sqlite";
		await sequelize.sync(isSQLite ? {} : { alter: true });
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
})();

// Start Express App
const server = App.listen(port, () => {
	console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

const gracefulShutdown = async (signal: string) => {
	console.log(
		`\n⚡️[server]: Received ${signal}. Shutting down gracefully...`
	);
	server.close(async (closeError) => {
		if (closeError) {
			console.error("⚡️[server]: Error closing server:", closeError);
			process.exit(1);
		}
		try {
			await sequelize.close();
			console.log("⚡️[server]: Database connection closed.");
		} catch (error) {
			console.warn(
				"⚡️[server]: Error closing database connection:",
				error
			);
		}
		if (signal === "SIGUSR2") {
			process.kill(process.pid, "SIGUSR2");
		} else {
			process.exit(0);
		}
	});
};

process.once("SIGUSR2", () => gracefulShutdown("SIGUSR2"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
	console.error("⚡️[server]: Unhandled rejection:", reason);
});
process.on("uncaughtException", (error) => {
	console.error("⚡️[server]: Uncaught exception:", error);
	process.exit(1);
});
//#endregion
