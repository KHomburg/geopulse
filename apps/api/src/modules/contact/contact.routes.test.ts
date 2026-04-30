import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it
} from "@jest/globals";
import request from "supertest";
import App from "../../shared/config/express.config";
import { sequelize } from "../../shared/config/sequelize.config";
import Contact from "./contact.model";

describe("Contact routes (SQLite)", () => {
	beforeAll(async () => {
		await sequelize.sync({ force: true });
	});

	afterEach(async () => {
		await sequelize.truncate({ cascade: true });
	});

	afterAll(async () => {
		await sequelize.close();
	});

	const uniqueEmail = () =>
		`contact_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

	async function registerAndLogin() {
		const email = uniqueEmail();
		const password = "secret123";
		const register = await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password })
			.expect(201);
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password })
			.expect(200);

		return {
			id: register.body.id as number,
			token: login.body.token as string
		};
	}

	it("rejects reversed duplicate contact requests", async () => {
		const firstUser = await registerAndLogin();
		const secondUser = await registerAndLogin();

		await request(App)
			.post(`/api/v1/contacts/request/${secondUser.id}`)
			.set("Authorization", `Bearer ${firstUser.token}`)
			.expect(201);

		const duplicate = await request(App)
			.post(`/api/v1/contacts/request/${firstUser.id}`)
			.set("Authorization", `Bearer ${secondUser.token}`)
			.expect(409);

		expect(duplicate.body.message).toMatch(/already exists/i);
	});

	it("rejects attempts to block yourself", async () => {
		const user = await registerAndLogin();

		const response = await request(App)
			.post(`/api/v1/contacts/block/${user.id}`)
			.set("Authorization", `Bearer ${user.token}`)
			.expect(400);

		expect(response.body.message).toMatch(/cannot block yourself/i);
	});

	it("enforces unordered uniqueness at the database level", async () => {
		const firstUser = await registerAndLogin();
		const secondUser = await registerAndLogin();

		await Contact.create({
			requesterId: firstUser.id,
			addresseeId: secondUser.id,
			status: "pending"
		});

		await expect(
			Contact.create({
				requesterId: secondUser.id,
				addresseeId: firstUser.id,
				status: "accepted"
			})
		).rejects.toThrow();
	});
});