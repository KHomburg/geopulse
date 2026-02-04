import { Sequelize } from "sequelize";
import { config } from "./env.config";

const isTest = process.env.NODE_ENV === "test";

export const sequelize = isTest
	? new Sequelize({
			dialect: "sqlite",
			storage: process.env.SQLITE_STORAGE || ":memory:",
			logging: false
	  })
	: new Sequelize({
			dialect: config.DB_DIALECT as any,
			host: config.DB_HOST as string,
			port: Number(config.DB_PORT),
			username: config.DB_USERNAME as string,
			password: config.DB_PASSWORD as string,
			database: config.DB_DATABASE as string,
			logging: console.log
	  });
