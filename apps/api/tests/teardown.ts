import { sequelize } from "../src/shared/config/sequelize.config";

export default async function globalTeardown() {
	await sequelize.close();
}
