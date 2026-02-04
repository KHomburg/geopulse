import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	afterEach
} from "@jest/globals";
import { sequelize } from "../../shared/config/sequelize.config";
import UserRepository from "./user.repository";

describe("UserRepository with SQLite (test)", () => {
	beforeAll(async () => {
		await sequelize.sync({ force: true });
	});

	afterEach(async () => {
		// Ensure isolation between tests
		await sequelize.truncate({ cascade: true });
	});

	afterAll(async () => {
		await sequelize.close();
	});

	it("creates and fetches a user", async () => {
		const created = await UserRepository.create({
			email: "test@example.com",
			password: "secret"
		});

		expect(created.id).toBeDefined();

		const fetched = await UserRepository.findById(created.id);
		expect(fetched).not.toBeNull();
		expect(fetched?.email).toBe("test@example.com");
	});

	it("updates user email", async () => {
		const created = await UserRepository.create({
			email: "old@example.com",
			password: "secret"
		});

		const updated = await UserRepository.updateEmailById(
			created.id,
			"new@example.com"
		);
		expect(updated).not.toBeNull();
		expect(updated?.email).toBe("new@example.com");
	});

	it("deletes user", async () => {
		const created = await UserRepository.create({
			email: "delete@example.com",
			password: "secret"
		});

		const deleted = await UserRepository.deleteById(created.id);
		expect(deleted).toBe(true);

		const fetched = await UserRepository.findById(created.id);
		expect(fetched).toBeNull();
	});
});
