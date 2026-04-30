import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	afterEach
} from "@jest/globals";
import request from "supertest";
import App from "../../shared/config/express.config";
import { sequelize } from "../../shared/config/sequelize.config";
import User from "./user.model";

describe("User routes (SQLite)", () => {
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

	async function registerUser() {
		const email = uniqueEmail();
		const password = "secret123";
		const register = await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password })
			.expect(201);
		return {
			id: register.body.id as number,
			email,
			password
		};
	}

	async function registerAndLogin() {
		const user = await registerUser();
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: user.email, password: user.password })
			.expect(200);
		return { ...user, token: login.body.token as string };
	}

	it("does not expose a public user creation endpoint", async () => {
		await request(App)
			.post("/api/v1/user")
			.send({ email: uniqueEmail(), password: "secret123" })
			.expect(404);
	});

	it("lists users without exposing email addresses", async () => {
		const first = await registerUser();
		const second = await registerUser();

		const res = await request(App).get("/api/v1/user").expect(200);
		const list = res.body as Array<any>;
		const found = list.filter((user) =>
			[first.id, second.id].includes(user.id)
		);
		expect(found).toHaveLength(2);
		for (const user of found) {
			expect(user).not.toHaveProperty("email");
		}
	});

	it("returns a public user profile without email address", async () => {
		const created = await registerUser();

		const get = await request(App)
			.get(`/api/v1/user/${created.id}`)
			.expect(200);
		expect(get.body.id).toBe(created.id);
		expect(get.body).not.toHaveProperty("email");
	});

	it("updates a user via PUT /api/user/:id (auth required)", async () => {
		const { id, token } = await registerAndLogin();

		const newEmail = uniqueEmail();
		const upd = await request(App)
			.put(`/api/v1/user/${id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ email: newEmail })
			.expect(200);
		expect(upd.body.email).toBe(newEmail);
	});

	it("patches user email via PATCH /api/user/email/:id (auth required)", async () => {
		const { id, token } = await registerAndLogin();

		const newEmail = uniqueEmail();
		const upd = await request(App)
			.patch(`/api/v1/user/email/${id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ email: newEmail })
			.expect(200);
		expect(upd.body.email).toBe(newEmail);
	});

	it("deletes a user via DELETE /api/user/:id (auth required)", async () => {
		const { id, token } = await registerAndLogin();

		const del = await request(App)
			.delete(`/api/v1/user/${id}`)
			.set("Authorization", `Bearer ${token}`)
			.expect(200);
		expect(del.body.message).toMatch(/User deleted/);
		await request(App).get(`/api/v1/user/${id}`).expect(404);
	});

	it("forbids a standard user from updating another user", async () => {
		const target = await registerUser();
		const actor = await registerAndLogin();

		await request(App)
			.put(`/api/v1/user/${target.id}`)
			.set("Authorization", `Bearer ${actor.token}`)
			.send({ email: uniqueEmail() })
			.expect(403);
	});

	it("forbids a standard user from deleting another user", async () => {
		const target = await registerUser();
		const actor = await registerAndLogin();

		await request(App)
			.delete(`/api/v1/user/${target.id}`)
			.set("Authorization", `Bearer ${actor.token}`)
			.expect(403);
	});

	it("allows an admin to update another user", async () => {
		const target = await registerUser();
		const admin = await registerUser();
		await User.update({ role: "admin" }, { where: { id: admin.id } });
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: admin.email, password: admin.password })
			.expect(200);

		const newEmail = uniqueEmail();
		const upd = await request(App)
			.put(`/api/v1/user/${target.id}`)
			.set("Authorization", `Bearer ${login.body.token as string}`)
			.send({ email: newEmail })
			.expect(200);

		expect(upd.body.email).toBe(newEmail);
	});
});
