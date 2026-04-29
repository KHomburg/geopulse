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

describe("Comment routes (SQLite)", () => {
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
		`comment_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

	async function registerAndLogin() {
		const email = uniqueEmail();
		const password = "secret123";
		await request(App)
			.post("/api/v1/auth/register")
			.send({ email, password })
			.expect(201);
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email, password })
			.expect(200);

		return {
			email,
			token: login.body.token as string
		};
	}

	async function createPost(token: string) {
		const response = await request(App)
			.post("/api/v1/posts")
			.set("Authorization", `Bearer ${token}`)
			.send({
				content: "Post for comment enforcement",
				anonymityMode: "public",
				lat: 48.8566,
				lng: 2.3522,
				isStory: false
			})
			.expect(201);

		return response.body.id as number;
	}

	it("blocks read-only users from commenting", async () => {
		const author = await registerAndLogin();
		const commenter = await registerAndLogin();
		const postId = await createPost(author.token);

		await User.update(
			{ accountStatus: "read_only_timeout" },
			{ where: { email: commenter.email } }
		);

		await request(App)
			.post(`/api/v1/posts/${postId}/comments`)
			.set("Authorization", `Bearer ${commenter.token}`)
			.send({ content: "This should be blocked" })
			.expect(403);
	});

	it("shows shadow-hidden comments only to the shadow-banned author", async () => {
		const author = await registerAndLogin();
		const commenter = await registerAndLogin();
		const postId = await createPost(author.token);

		await User.update(
			{ accountStatus: "shadow_banned" },
			{ where: { email: commenter.email } }
		);

		const created = await request(App)
			.post(`/api/v1/posts/${postId}/comments`)
			.set("Authorization", `Bearer ${commenter.token}`)
			.send({ content: "Only I should see this comment" })
			.expect(201);

		const publicComments = await request(App)
			.get(`/api/v1/posts/${postId}/comments`)
			.expect(200);

		expect(publicComments.body.data).toHaveLength(0);

		const ownComments = await request(App)
			.get(`/api/v1/posts/${postId}/comments`)
			.set("Authorization", `Bearer ${commenter.token}`)
			.expect(200);

		expect(ownComments.body.data).toHaveLength(1);
		expect(ownComments.body.data[0].id).toBe(created.body.id);
	});
});
