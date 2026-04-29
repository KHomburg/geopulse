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
import "./shared/config/models.associations";
//#endregion

//#region Config

const port = config.PORT;

// Connect to DB
(async () => {
	try {
		await sequelize.authenticate();
		// Sync all models in a single call; individual syncs are redundant
		await sequelize.sync({ alter: true });
		console.log("All tables synced successfully.");
		console.log("Connection has been established successfully.");
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
})();

// Start Express App
App.listen(port, () => {
	console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
//#endregion
