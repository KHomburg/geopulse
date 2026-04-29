import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	afterEach
} from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";
import App from "../../shared/config/express.config";
import { sequelize } from "../../shared/config/sequelize.config";
import { config } from "../../shared/config/env.config";
import User from "../user/user.model";

describe("Auth routes (SQLite)", () => {
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
		`user_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

	it("registers a new user", async () => {
		const email = uniqueEmail();
		const res = await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password: "secret123" })
			.expect(201);

		expect(res.body.id).toBeDefined();
		expect(res.body.email).toBe(email);
	});

	it("rejects duplicate registration with 409", async () => {
		const email = uniqueEmail();
		await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password: "secret123" })
			.expect(201);
		const res2 = await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password: "secret123" });
		expect(res2.status).toBe(409);
	});

	it("logs in and returns access + refresh tokens", async () => {
		const email = uniqueEmail();
		await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password: "secret123" })
			.expect(201);
		const res = await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password: "secret123" })
			.expect(200);
		expect(res.body.token).toBeDefined();
		expect(typeof res.body.token).toBe("string");
		const decoded = jwt.verify(
			res.body.token as string,
			config.TOKEN_KEY
		) as {
			id: number;
			email: string;
			role: string;
			accountStatus: string;
		};
		expect(decoded.email).toBe(email);
		expect(decoded.role).toBe("user");
		expect(decoded.accountStatus).toBe("active");
		expect(res.body.refreshToken).toBeDefined();
		expect(typeof res.body.refreshToken).toBe("string");
	});

	it("fails login with wrong password", async () => {
		const email = uniqueEmail();
		await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password: "secret123" })
			.expect(201);
		await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password: "wrong" })
			.expect(401);
	});

	it("blocks login for banned accounts", async () => {
		const email = uniqueEmail();
		const password = "secret123";
		const registered = await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password })
			.expect(201);
		await User.update(
			{ accountStatus: "banned" },
			{ where: { id: registered.body.id } }
		);

		await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password })
			.expect(403);
	});

	it("logs out successfully with a valid token", async () => {
		const email = uniqueEmail();
		await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password: "secret123" })
			.expect(201);
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password: "secret123" })
			.expect(200);
		const token = login.body.token as string;
		const refreshToken = login.body.refreshToken as string;

		const res = await request(App)
			.post("/api/v1/auth/logout")
			.set("Authorization", `Bearer ${token}`)
			.expect(200);
		expect(res.body.message).toMatch(/Logged out/);

		// After logout, refresh should fail
		await request(App)
			.post("/api/v1/auth/refresh")
			.send({ refreshToken })
			.expect(401);
	});

	it("rotates refresh token and issues new access token", async () => {
		const email = uniqueEmail();
		await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password: "secret123" })
			.expect(201);
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password: "secret123" })
			.expect(200);
		const oldRefresh = login.body.refreshToken as string;

		const refreshed = await request(App)
			.post("/api/v1/auth/refresh")
			.send({ refreshToken: oldRefresh })
			.expect(200);
		expect(refreshed.body.token).toBeDefined();
		expect(refreshed.body.refreshToken).toBeDefined();

		// Old refresh should be revoked; using it again should fail
		await request(App)
			.post("/api/v1/auth/refresh")
			.send({ refreshToken: oldRefresh })
			.expect(401);
	});

	it("blocks refresh for banned accounts", async () => {
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

		await User.update(
			{ accountStatus: "banned" },
			{ where: { id: registered.body.id } }
		);

		await request(App)
			.post("/api/v1/auth/refresh")
			.send({ refreshToken: login.body.refreshToken })
			.expect(403);
	});

	it("rejects authenticated requests after an account is banned", async () => {
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

		await User.update(
			{ accountStatus: "banned" },
			{ where: { id: registered.body.id } }
		);

		await request(App)
			.get("/api/v1/user/me")
			.set("Authorization", `Bearer ${login.body.token as string}`)
			.expect(403);
	});

	it("deletes account for authenticated user", async () => {
		const email = uniqueEmail();
		await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password: "secret123" })
			.expect(201);
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password: "secret123" })
			.expect(200);
		const token = login.body.token as string;

		const del = await request(App)
			.delete("/api/v1/auth/delete")
			.set("Authorization", `Bearer ${token}`)
			.expect(200);
		expect(del.body.message).toMatch(/Account deleted/);

		await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password: "secret123" })
			.expect(401);
	});
});
