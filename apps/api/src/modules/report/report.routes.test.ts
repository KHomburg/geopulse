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

describe("Report routes (SQLite)", () => {
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
		`report_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

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
			email,
			password,
			token: login.body.token as string
		};
	}

	it("auto-hides a post after enough distinct reports and exposes it in the moderation queue", async () => {
		const author = await registerAndLogin();
		const created = await request(App)
			.post("/api/v1/posts")
			.set("Authorization", `Bearer ${author.token}`)
			.send({
				content: "Suspicious repeated spam post",
				anonymityMode: "public",
				lat: 48.8566,
				lng: 2.3522,
				isStory: false,
				postType: "standard"
			})
			.expect(201);

		for (let index = 0; index < 2; index++) {
			const reporter = await registerAndLogin();
			await request(App)
				.post("/api/v1/reports")
				.set("Authorization", `Bearer ${reporter.token}`)
				.send({
					contentType: "post",
					targetId: created.body.id,
					category: "spam"
				})
				.expect(201);
		}

		const thirdReporter = await registerAndLogin();
		const finalReport = await request(App)
			.post("/api/v1/reports")
			.set("Authorization", `Bearer ${thirdReporter.token}`)
			.send({
				contentType: "post",
				targetId: created.body.id,
				category: "spam",
				reason: "Repeated across the local feed"
			})
			.expect(201);

		expect(finalReport.body.autoHidden).toBe(true);
		expect(finalReport.body.moderationStatus).toBe("hidden_pending_review");

		await request(App).get(`/api/v1/posts/${created.body.id}`).expect(404);

		const moderator = await registerAndLogin();
		await User.update(
			{ role: "community_mod" },
			{ where: { id: moderator.id } }
		);
		const moderatorLogin = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: moderator.email, password: moderator.password })
			.expect(200);

		const queue = await request(App)
			.get("/api/v1/admin/reports/queue")
			.set(
				"Authorization",
				`Bearer ${moderatorLogin.body.token as string}`
			)
			.expect(200);

		expect(queue.body.count).toBeGreaterThan(0);
		expect(queue.body.data[0].targetId).toBe(created.body.id);
		expect(queue.body.data[0].autoHidden).toBe(true);
		expect(queue.body.data[0].target.preview.moderationStatus).toBe(
			"hidden_pending_review"
		);
	});

	it("lets a community moderator approve a hidden post and records the action in the audit log", async () => {
		const author = await registerAndLogin();
		const created = await request(App)
			.post("/api/v1/posts")
			.set("Authorization", `Bearer ${author.token}`)
			.send({
				content: "Borderline local rumor",
				anonymityMode: "public",
				lat: 48.8566,
				lng: 2.3522,
				isStory: false,
				postType: "standard"
			})
			.expect(201);

		for (let index = 0; index < 3; index++) {
			const reporter = await registerAndLogin();
			await request(App)
				.post("/api/v1/reports")
				.set("Authorization", `Bearer ${reporter.token}`)
				.send({
					contentType: "post",
					targetId: created.body.id,
					category: "misinformation"
				})
				.expect(201);
		}

		const moderator = await registerAndLogin();
		await User.update(
			{ role: "community_mod" },
			{ where: { id: moderator.id } }
		);
		const moderatorLogin = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: moderator.email, password: moderator.password })
			.expect(200);

		const queue = await request(App)
			.get("/api/v1/admin/reports/queue")
			.set(
				"Authorization",
				`Bearer ${moderatorLogin.body.token as string}`
			)
			.expect(200);
		const reportId = queue.body.data[0].reportId as number;

		await request(App)
			.post(`/api/v1/admin/reports/${reportId}/review`)
			.set(
				"Authorization",
				`Bearer ${moderatorLogin.body.token as string}`
			)
			.send({ action: "approve", reason: "False positive after review" })
			.expect(200);

		await request(App).get(`/api/v1/posts/${created.body.id}`).expect(200);

		const admin = await registerAndLogin();
		await User.update({ role: "admin" }, { where: { id: admin.id } });
		const adminLogin = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: admin.email, password: admin.password })
			.expect(200);

		const audit = await request(App)
			.get("/api/v1/admin/audit-log")
			.set("Authorization", `Bearer ${adminLogin.body.token as string}`)
			.expect(200);

		expect(audit.body.count).toBeGreaterThan(0);
		expect(audit.body.data[0].action).toBe("report.approve");
		expect(audit.body.data[0].targetType).toBe("post");
	});

	it("auto-hides a comment after enough distinct reports", async () => {
		const author = await registerAndLogin();
		const commenter = await registerAndLogin();
		const post = await request(App)
			.post("/api/v1/posts")
			.set("Authorization", `Bearer ${author.token}`)
			.send({
				content: "Post that will receive a bad comment",
				anonymityMode: "public",
				lat: 48.8566,
				lng: 2.3522,
				isStory: false,
				postType: "standard"
			})
			.expect(201);

		const comment = await request(App)
			.post(`/api/v1/posts/${post.body.id}/comments`)
			.set("Authorization", `Bearer ${commenter.token}`)
			.send({ content: "Hate-filled spam comment" })
			.expect(201);

		for (let index = 0; index < 3; index++) {
			const reporter = await registerAndLogin();
			await request(App)
				.post("/api/v1/reports")
				.set("Authorization", `Bearer ${reporter.token}`)
				.send({
					contentType: "comment",
					targetId: comment.body.id,
					category: "harassment"
				})
				.expect(201);
		}

		const comments = await request(App)
			.get(`/api/v1/posts/${post.body.id}/comments`)
			.expect(200);

		expect(
			(comments.body.data as Array<{ id: number }>).some(
				(entry) => entry.id === comment.body.id
			)
		).toBe(false);
	});

	it("queues profile reports without auto-suspending the account", async () => {
		const target = await registerAndLogin();
		const reporter = await registerAndLogin();
		const moderator = await registerAndLogin();
		await User.update(
			{ role: "community_mod" },
			{ where: { id: moderator.id } }
		);
		const moderatorLogin = await request(App)
			.post("/api/v1/auth/login")
			.send({ email: moderator.email, password: moderator.password })
			.expect(200);

		const report = await request(App)
			.post("/api/v1/reports")
			.set("Authorization", `Bearer ${reporter.token}`)
			.send({
				contentType: "profile",
				targetId: target.id,
				category: "impersonation"
			})
			.expect(201);

		expect(report.body.autoHidden).toBe(false);

		const queue = await request(App)
			.get("/api/v1/admin/reports/queue")
			.set(
				"Authorization",
				`Bearer ${moderatorLogin.body.token as string}`
			)
			.expect(200);

		const profileQueueItem = (queue.body.data as Array<any>).find(
			(item) =>
				item.contentType === "profile" && item.targetId === target.id
		);
		expect(profileQueueItem).toBeDefined();
		expect(profileQueueItem.autoHidden).toBe(false);
		expect(profileQueueItem.target.preview.accountStatus).toBe("active");
	});
});
