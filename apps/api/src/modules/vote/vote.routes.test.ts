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
import User from "../user/user.model";

describe("Vote routes (SQLite)", () => {
	let authToken: string;
	let secondToken: string;
	let postId: number;

	const user1 = { email: "voter1@example.com", password: "secret123" };
	const user2 = { email: "voter2@example.com", password: "secret123" };
	const basePost = {
		content: "Vote on me!",
		anonymityMode: "public",
		lat: 48.8566,
		lng: 2.3522,
		isStory: false
	};

	beforeAll(async () => {
		await sequelize.sync({ force: true });

		await request(App).post("/api/v1/auth/register").send(user1);
		const login1 = await request(App)
			.post("/api/v1/auth/login")
			.send(user1);
		authToken = login1.body.token as string;

		await request(App).post("/api/v1/auth/register").send(user2);
		const login2 = await request(App)
			.post("/api/v1/auth/login")
			.send(user2);
		secondToken = login2.body.token as string;

		const postRes = await request(App)
			.post("/api/v1/posts")
			.set("Authorization", `Bearer ${authToken}`)
			.send(basePost);
		postId = postRes.body.id as number;
	});

	afterEach(async () => {
		const VoteModel = (await import("./vote.model")).default;
		await VoteModel.destroy({ where: {}, force: true });
		// Reset post karma
		const PostModel = (await import("../post/post.model")).default;
		await PostModel.update({ karmaScore: 0 }, { where: { id: postId } });
	});

	afterAll(async () => {
		await sequelize.close();
	});

	it("upvotes a post and returns status created + updated karmaScore", async () => {
		const res = await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: 1 })
			.expect(200);

		expect(res.body.status).toBe("created");
		expect(res.body.karmaScore).toBe(1);
	});

	it("downvotes a post", async () => {
		const res = await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${secondToken}`)
			.send({ value: -1 })
			.expect(200);

		expect(res.body.status).toBe("created");
		expect(res.body.karmaScore).toBe(-1);
	});

	it("switching vote from upvote to downvote updates karma correctly", async () => {
		// First upvote
		await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: 1 });

		// Switch to downvote
		const res = await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: -1 })
			.expect(200);

		expect(res.body.status).toBe("updated");
		expect(res.body.karmaScore).toBe(-1);
	});

	it("same vote twice returns unchanged status", async () => {
		await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: 1 });

		const res = await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: 1 })
			.expect(200);

		expect(res.body.status).toBe("unchanged");
	});

	it("removes a vote", async () => {
		await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: 1 });

		await request(App)
			.delete(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.expect(200);

		// Check my vote is gone
		const res = await request(App)
			.get(`/api/v1/posts/${postId}/votes/me`)
			.set("Authorization", `Bearer ${authToken}`)
			.expect(200);

		expect(res.body.value).toBeNull();
	});

	it("returns 401 for unauthenticated vote attempt", async () => {
		await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.send({ value: 1 })
			.expect(401);
	});

	it("returns 404 when voting on non-existent post", async () => {
		await request(App)
			.post("/api/v1/posts/99999/votes")
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: 1 })
			.expect(404);
	});

	it("rejects invalid vote values", async () => {
		await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: 5 })
			.expect(400);
	});

	it("blocks voting for read-only accounts", async () => {
		await User.update(
			{ accountStatus: "read_only_timeout" },
			{ where: { email: user1.email } }
		);

		await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: 1 })
			.expect(403);

		await User.update(
			{ accountStatus: "active" },
			{ where: { email: user1.email } }
		);
	});

	it("stores shadow-banned votes without changing public karma", async () => {
		await User.update(
			{ accountStatus: "shadow_banned" },
			{ where: { email: user1.email } }
		);

		const vote = await request(App)
			.post(`/api/v1/posts/${postId}/votes`)
			.set("Authorization", `Bearer ${authToken}`)
			.send({ value: 1 })
			.expect(200);

		expect(vote.body.status).toBe("created");
		expect(vote.body.karmaScore).toBe(0);

		const myVote = await request(App)
			.get(`/api/v1/posts/${postId}/votes/me`)
			.set("Authorization", `Bearer ${authToken}`)
			.expect(200);

		expect(myVote.body.value).toBe(1);

		const post = await request(App)
			.get(`/api/v1/posts/${postId}`)
			.expect(200);

		expect(post.body.karmaScore).toBe(0);

		await User.update(
			{ accountStatus: "active" },
			{ where: { email: user1.email } }
		);
	});
});
