import { sequelize } from "../src/shared/config/sequelize.config";
import User from "../src/modules/user/user.model";
import Post from "../src/modules/post/post.model";
import Vote from "../src/modules/vote/vote.model";

// Ensure all models are initialized and the DB schema is created for tests
beforeAll(async () => {
	// Sync all defined models to the DB
	await sequelize.sync({ force: true });
});

// Clean tables between tests if needed
afterEach(async () => {
	// Truncate all data to keep tests isolated
	await Vote.destroy({ where: {}, force: true });
	await Post.destroy({ where: {}, force: true });
	await User.destroy({ where: {}, force: true });
});
