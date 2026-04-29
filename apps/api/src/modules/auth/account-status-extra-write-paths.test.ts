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
import User from "../user/user.model";

describe("Account status extra write paths (SQLite)", () => {
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
		`account_paths_${Date.now()}_${Math.floor(
			Math.random() * 1e6
		)}@example.com`;

	async function registerAndLogin() {
		const email = uniqueEmail();
		const password = "secret123";
		const registered = await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password })
			.expect(201);
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password })
			.expect(200);

		return {
			id: registered.body.id as number,
			token: login.body.token as string,
			email
		};
	}

	it("blocks ghost share for read-only accounts", async () => {
		const user = await registerAndLogin();
		await User.update(
			{ accountStatus: "read_only_timeout" },
			{ where: { id: user.id } }
		);

		await request(App)
			.post("/api/v1/ghost/share")
			.set("Authorization", `Bearer ${user.token}`)
			.send({ lat: 48.8566, lng: 2.3522, durationMinutes: 30 })
			.expect(403);
	});

	it("blocks trusted locals message send for read-only accounts before trust checks", async () => {
		const user = await registerAndLogin();
		await User.update(
			{ accountStatus: "read_only_timeout" },
			{ where: { id: user.id } }
		);

		await request(App)
			.post("/api/v1/rooms/trusted-locals/messages")
			.set("Authorization", `Bearer ${user.token}`)
			.send({ content: "This should be blocked" })
			.expect(403);
	});

	it("blocks live lounge message send for read-only accounts before lounge checks", async () => {
		const user = await registerAndLogin();
		await User.update(
			{ accountStatus: "read_only_timeout" },
			{ where: { id: user.id } }
		);

		await request(App)
			.post("/api/v1/rooms/live-lounges/test-lounge/messages")
			.set("Authorization", `Bearer ${user.token}`)
			.send({
				content: "This should be blocked",
				lat: 48.8566,
				lng: 2.3522
			})
			.expect(403);
	});
});
