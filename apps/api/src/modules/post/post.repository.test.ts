import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	afterEach
} from "@jest/globals";
import { sequelize } from "../../shared/config/sequelize.config";
import PostRepository from "./post.repository";
import User from "../user/user.model";
import "../../shared/config/models.associations";

const SEED_USER = {
	email: "poster@test.com",
	password: "hashedpassword"
};

const SEED_POST = {
	content: "Hello from the test park!",
	anonymityMode: "public" as const,
	obfuscatedLat: 48.857,
	obfuscatedLng: 2.352,
	isStory: false
};

describe("PostRepository (SQLite)", () => {
	let userId: number;

	beforeAll(async () => {
		await sequelize.sync({ force: true });
		const user = await User.create(SEED_USER as Record<string, unknown>);
		userId = user.id;
	});

	afterEach(async () => {
		const PostModel = (await import("./post.model")).default;
		await PostModel.destroy({ where: {}, force: true });
	});

	afterAll(async () => {
		await sequelize.close();
	});

	it("creates a post and retrieves it by id", async () => {
		const post = await PostRepository.create({ ...SEED_POST, userId });
		expect(post.id).toBeDefined();
		expect(post.content).toBe(SEED_POST.content);

		const found = await PostRepository.findById(post.id);
		expect(found).not.toBeNull();
		expect(found!.content).toBe(SEED_POST.content);
	});

	it("returns null for non-existent post", async () => {
		const found = await PostRepository.findById(99999);
		expect(found).toBeNull();
	});

	it("soft-deletes a post by owner", async () => {
		const post = await PostRepository.create({ ...SEED_POST, userId });
		const deleted = await PostRepository.softDeleteByIdAndUser(
			post.id,
			userId
		);
		expect(deleted).toBe(true);

		// After soft-delete isActive posts should be gone
		const found = await PostRepository.findById(post.id);
		expect(found).toBeNull();
	});

	it("returns false when deleting a post owned by another user", async () => {
		const post = await PostRepository.create({ ...SEED_POST, userId });
		const deleted = await PostRepository.softDeleteByIdAndUser(
			post.id,
			userId + 99
		);
		expect(deleted).toBe(false);
	});

	it("increments karma score", async () => {
		const post = await PostRepository.create({ ...SEED_POST, userId });
		expect(post.karmaScore).toBe(0);

		await PostRepository.incrementKarma(post.id, 1);
		const updated = await PostRepository.findById(post.id);
		expect(updated!.karmaScore).toBe(1);

		await PostRepository.incrementKarma(post.id, -1);
		const reset = await PostRepository.findById(post.id);
		expect(reset!.karmaScore).toBe(0);
	});

	it("finds posts within a bounding box", async () => {
		await PostRepository.create({
			...SEED_POST,
			userId,
			obfuscatedLat: 48.857,
			obfuscatedLng: 2.352
		});
		await PostRepository.create({
			...SEED_POST,
			userId,
			obfuscatedLat: 48.9,
			obfuscatedLng: 2.4
		});
		// This one is far away
		await PostRepository.create({
			...SEED_POST,
			userId,
			obfuscatedLat: 52.0,
			obfuscatedLng: 13.0
		});

		const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const results = await PostRepository.findByLocation({
			minLat: 48.8,
			maxLat: 49.0,
			minLng: 2.3,
			maxLng: 2.5,
			since,
			limit: 10,
			offset: 0
		});
		expect(results.length).toBe(2);
	});

	it("hides legacy posts once they are older than 24 hours", async () => {
		const recent = await PostRepository.create({
			...SEED_POST,
			userId,
			obfuscatedLat: 48.857,
			obfuscatedLng: 2.352,
			expiresAt: null
		});
		const old = await PostRepository.create({
			...SEED_POST,
			userId,
			obfuscatedLat: 48.858,
			obfuscatedLng: 2.353,
			expiresAt: null
		});

		const PostModel = (await import("./post.model")).default;
		await PostModel.update(
			{ createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
			{ where: { id: old.id }, silent: true }
		);

		const results = await PostRepository.findByLocation({
			minLat: 48.8,
			maxLat: 49.0,
			minLng: 2.3,
			maxLng: 2.5,
			since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			limit: 10,
			offset: 0
		});

		expect(results.map((post) => post.id)).toEqual([recent.id]);
	});
});
