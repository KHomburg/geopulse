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

describe("Admin routes (SQLite)", () => {
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
		`admin_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

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

	it("blocks non-admin access to admin routes", async () => {
		const target = await registerUser();
		const actor = await registerUser();
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: actor.email, password: actor.password })
			.expect(200);

		await request(App)
			.get(`/api/v1/admin/users/${target.id}`)
			.set("Authorization", `Bearer ${login.body.token as string}`)
			.expect(403);
	});

	it("allows admins to inspect user details across accounts", async () => {
		const target = await registerUser();
		const admin = await registerUser();
		await User.update({ role: "admin" }, { where: { id: admin.id } });
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: admin.email, password: admin.password })
			.expect(200);

		const res = await request(App)
			.get(`/api/v1/admin/users/${target.id}`)
			.set("Authorization", `Bearer ${login.body.token as string}`)
			.expect(200);

		expect(res.body.id).toBe(target.id);
		expect(res.body.email).toBe(target.email);
		expect(res.body.role).toBe("user");
		expect(res.body.accountStatus).toBe("active");
	});

	it("allows admins to update moderation fields", async () => {
		const target = await registerUser();
		const admin = await registerUser();
		await User.update({ role: "admin" }, { where: { id: admin.id } });
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: admin.email, password: admin.password })
			.expect(200);

		const res = await request(App)
			.patch(`/api/v1/admin/users/${target.id}/moderation`)
			.set("Authorization", `Bearer ${login.body.token as string}`)
			.send({
				role: "community_mod",
				accountStatus: "read_only_timeout"
			})
			.expect(200);

		expect(res.body.role).toBe("community_mod");
		expect(res.body.accountStatus).toBe("read_only_timeout");
	});

	it("allows a community moderator to access the moderation queue", async () => {
		const moderator = await registerUser();
		await User.update(
			{ role: "community_mod" },
			{ where: { id: moderator.id } }
		);
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: moderator.email, password: moderator.password })
			.expect(200);

		await request(App)
			.get("/api/v1/admin/reports/queue")
			.set("Authorization", `Bearer ${login.body.token as string}`)
			.expect(200);
	});

	it("blocks a community moderator from user-wide admin endpoints", async () => {
		const target = await registerUser();
		const moderator = await registerUser();
		await User.update(
			{ role: "community_mod" },
			{ where: { id: moderator.id } }
		);
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: moderator.email, password: moderator.password })
			.expect(200);

		await request(App)
			.get(`/api/v1/admin/users/${target.id}`)
			.set("Authorization", `Bearer ${login.body.token as string}`)
			.expect(403);
	});
});
