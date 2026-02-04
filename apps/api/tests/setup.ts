import { sequelize } from "../src/shared/config/sequelize.config";
import User from "../src/modules/user/user.model";

// Ensure all models are initialized and the DB schema is created for tests
beforeAll(async () => {
	// Sync all defined models to the DB
	await sequelize.sync({ force: true });
});

// Clean tables between tests if needed
afterEach(async () => {
	// Truncate all data to keep tests isolated
	// Add more models here as they are added
	await User.destroy({ where: {}, force: true });
});
