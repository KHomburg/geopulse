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

describe("Post routes (SQLite)", () => {
	let authToken: string;
	const userEmail = "posttest@example.com";
	const userPassword = "secret123";

	beforeAll(async () => {
		await sequelize.sync({ force: true });
		// Register + login to get a token
		await request(App)
			.post("/api/v1/auth/register")
			.send({ email: userEmail, password: userPassword });
		const login = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: userEmail, password: userPassword });
		authToken = login.body.token as string;
	});

	afterEach(async () => {
		const PostModel = (await import("./post.model")).default;
		const VoteModel = (await import("../vote/vote.model")).default;
		await VoteModel.destroy({ where: {}, force: true });
		await PostModel.destroy({ where: {}, force: true });
	});

	afterAll(async () => {
		await sequelize.close();
	});

	const basePost = {
		content: "Testing from the park!",
		anonymityMode: "public",
		lat: 48.8566,
		lng: 2.3522,
		isStory: false
	};

	describe("POST /api/v1/posts", () => {
		it("creates a post when authenticated", async () => {
			const res = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send(basePost)
				.expect(201);

			expect(res.body.id).toBeDefined();
			expect(res.body.content).toBe(basePost.content);
			expect(res.body.anonymityMode).toBe("public");
			expect(res.body.isStory).toBe(true);
			expect(res.body.expiresAt).toEqual(expect.any(String));
			// Coordinates should be obfuscated (not exact input)
			expect(typeof res.body.lat).toBe("number");
			expect(typeof res.body.lng).toBe("number");
		});

		it("returns 401 without auth token", async () => {
			await request(App).post("/api/v1/posts").send(basePost).expect(401);
		});

		it("returns 400 with missing content", async () => {
			await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ lat: 48.8566, lng: 2.3522 })
				.expect(400);
		});

		it("creates post as local_legend with pseudonym", async () => {
			const res = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					...basePost,
					anonymityMode: "local_legend",
					pseudonym: "TheShadow"
				})
				.expect(201);

			expect(res.body.authorPseudonym).toBe("TheShadow");
			expect(res.body.authorId).toBeNull();
		});

		it("returns 400 for local_legend without pseudonym", async () => {
			await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ ...basePost, anonymityMode: "local_legend" })
				.expect(400);
		});

		it("creates anonymous post without revealing author", async () => {
			const res = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ ...basePost, anonymityMode: "anonymous" })
				.expect(201);

			expect(res.body.authorId).toBeNull();
			expect(res.body.authorPseudonym).toBeNull();
		});

		it("creates a post with an image gallery", async () => {
			const res = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					...basePost,
					content: "Gallery post from the square",
					mediaUrls: [
						"https://images.example.com/post-1.jpg",
						"https://images.example.com/post-2.jpg",
						"https://images.example.com/post-3.jpg"
					]
				})
				.expect(201);

			expect(res.body.mediaUrl).toBe(
				"https://images.example.com/post-1.jpg"
			);
			expect(res.body.mediaUrls).toEqual([
				"https://images.example.com/post-1.jpg",
				"https://images.example.com/post-2.jpg",
				"https://images.example.com/post-3.jpg"
			]);
		});

		it("blocks post creation for read-only accounts", async () => {
			const UserModel = (await import("../user/user.model")).default;
			await UserModel.update(
				{ accountStatus: "read_only_timeout" },
				{ where: { email: userEmail } }
			);

			await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send(basePost)
				.expect(403);

			await UserModel.update(
				{ accountStatus: "active" },
				{ where: { email: userEmail } }
			);
		});

		it("stores shadow-banned posts as hidden from public feeds", async () => {
			const UserModel = (await import("../user/user.model")).default;
			await UserModel.update(
				{ accountStatus: "shadow_banned" },
				{ where: { email: userEmail } }
			);

			const created = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send(basePost)
				.expect(201);

			await request(App)
				.get(`/api/v1/posts/${created.body.id}`)
				.expect(404);

			await request(App)
				.get(`/api/v1/posts/${created.body.id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			await UserModel.update(
				{ accountStatus: "active" },
				{ where: { email: userEmail } }
			);
		});
	});

	describe("GET /api/v1/posts/:id", () => {
		it("retrieves an existing post", async () => {
			const created = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send(basePost)
				.expect(201);

			const res = await request(App)
				.get(`/api/v1/posts/${created.body.id}`)
				.expect(200);

			expect(res.body.id).toBe(created.body.id);
		});

		it("hides expired posts after 24 hours", async () => {
			const created = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send(basePost)
				.expect(201);

			const PostModel = (await import("./post.model")).default;
			await PostModel.update(
				{ expiresAt: new Date(Date.now() - 60_000) },
				{ where: { id: created.body.id } }
			);

			await request(App)
				.get(`/api/v1/posts/${created.body.id}`)
				.expect(404);

			const feed = await request(App)
				.get(
					"/api/v1/posts?lat=48.8566&lng=2.3522&radiusKm=20&filter=week"
				)
				.expect(200);

			expect(
				(feed.body.data as Array<{ id: number }>).some(
					(post) => post.id === created.body.id
				)
			).toBe(false);
		});

		it("returns 404 for non-existent post", async () => {
			await request(App).get("/api/v1/posts/99999").expect(404);
		});

		it("hides posts that are pending moderation", async () => {
			const created = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send(basePost)
				.expect(201);

			const PostModel = (await import("./post.model")).default;
			await PostModel.update(
				{ moderationStatus: "hidden_pending_review" },
				{ where: { id: created.body.id } }
			);

			await request(App)
				.get(`/api/v1/posts/${created.body.id}`)
				.expect(404);

			const feed = await request(App)
				.get(
					"/api/v1/posts?lat=48.8566&lng=2.3522&radiusKm=20&filter=today"
				)
				.expect(200);

			expect(
				(feed.body.data as Array<{ id: number }>).some(
					(post) => post.id === created.body.id
				)
			).toBe(false);
		});
	});

	describe("GET /api/v1/posts (feed)", () => {
		it("returns posts near given coordinates", async () => {
			await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send(basePost)
				.expect(201);

			const res = await request(App)
				.get(
					"/api/v1/posts?lat=48.8566&lng=2.3522&radiusKm=20&filter=today"
				)
				.expect(200);

			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBeGreaterThan(0);
		});

		it("returns 400 when lat/lng are missing", async () => {
			await request(App).get("/api/v1/posts").expect(400);
		});
	});

	describe("DELETE /api/v1/posts/:id", () => {
		it("deletes own post", async () => {
			const created = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send(basePost)
				.expect(201);

			await request(App)
				.delete(`/api/v1/posts/${created.body.id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			await request(App)
				.get(`/api/v1/posts/${created.body.id}`)
				.expect(404);
		});

		it("cannot delete a post that does not belong to the user", async () => {
			// Create a second user
			await request(App)
				.post("/api/v1/auth/register")
				.send({ email: "other@example.com", password: "secret123" });
			const otherLogin = await request(App)
				.post("/api/v1/auth/login")
				.send({ email: "other@example.com", password: "secret123" });
			const otherToken = otherLogin.body.token as string;

			const created = await request(App)
				.post("/api/v1/posts")
				.set("Authorization", `Bearer ${authToken}`)
				.send(basePost)
				.expect(201);

			await request(App)
				.delete(`/api/v1/posts/${created.body.id}`)
				.set("Authorization", `Bearer ${otherToken}`)
				.expect(404);
		});
	});

	describe("GET /api/v1/posts/hotspots", () => {
		it("returns hotspot clusters", async () => {
			// Seed multiple posts near the same location
			for (let i = 0; i < 3; i++) {
				await request(App)
					.post("/api/v1/posts")
					.set("Authorization", `Bearer ${authToken}`)
					.send(basePost);
			}

			const res = await request(App)
				.get(
					"/api/v1/posts/hotspots?lat=48.8566&lng=2.3522&radiusKm=20&filter=today"
				)
				.expect(200);

			expect(Array.isArray(res.body.data)).toBe(true);
		});
	});
});
