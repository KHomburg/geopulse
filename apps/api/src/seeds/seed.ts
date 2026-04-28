/**
 * GeoPulse seed script
 * Usage: npx ts-node src/seeds/seed.ts
 * Populates the dev SQLite database with realistic sample data.
 */

import "../shared/config/models.associations"; // register all associations
import { sequelize } from "../shared/config/sequelize.config";
import { User } from "../modules/user/user.model";
import { Post } from "../modules/post/post.model";
import { Vote } from "../modules/vote/vote.model";
import { hashPassword } from "../modules/auth/auth.utils";
import { obfuscateCoordinates } from "../modules/post/post.utils";

// ─── Seed locations (Berlin, central area) ────────────────────────────────────
const LOCATIONS = [
	{ lat: 52.52, lng: 13.405 }, // Alexanderplatz
	{ lat: 52.5069, lng: 13.3919 }, // Checkpoint Charlie
	{ lat: 52.5145, lng: 13.3501 }, // Tiergarten
	{ lat: 52.5321, lng: 13.3847 }, // Mitte - Torstr
	{ lat: 52.499, lng: 13.4072 }, // Kreuzberg
	{ lat: 52.517, lng: 13.4234 }, // Friedrichshain
	{ lat: 52.524, lng: 13.392 }, // Hackescher Markt
	{ lat: 52.528, lng: 13.415 }, // Prenzlauer Berg
	{ lat: 52.51, lng: 13.37 }, // Potsdamer Platz
	{ lat: 52.487, lng: 13.431 } // Neukölln
];

const USERS = [
	{
		email: "alice@geopulse.dev",
		password: "Alice1234!",
		username: "alice_b",
		displayName: "Alice B."
	},
	{
		email: "bob@geopulse.dev",
		password: "Bob12345!",
		username: "bob_nyc",
		displayName: "Bob N."
	},
	{
		email: "demo@geopulse.dev",
		password: "Demo1234!",
		username: "demo_user",
		displayName: "Demo User"
	},
	{
		email: "ghost@geopulse.dev",
		password: "Ghost123!",
		username: null,
		displayName: null
	}
];

const POST_TEMPLATES: Array<{
	content: string;
	anonymityMode: "public" | "local_legend" | "anonymous";
	pseudonym?: string;
	isStory?: boolean;
}> = [
	{
		content:
			"There's a free open-air concert happening right now at the park! 🎸",
		anonymityMode: "public"
	},
	{
		content: "Huge traffic jam on the main road, avoid if you can 🚗",
		anonymityMode: "anonymous"
	},
	{
		content:
			"Best falafel stand in the city is on the corner here. Highly recommend!",
		anonymityMode: "local_legend",
		pseudonym: "StreetFoodie"
	},
	{
		content: "Spotted a family of foxes near the canal at dusk 🦊",
		anonymityMode: "anonymous"
	},
	{
		content:
			"The new coffee place here is 10/10, cozy vibe and fast wifi ☕",
		anonymityMode: "public"
	},
	{
		content: "Someone left a box of free books outside the library 📚",
		anonymityMode: "local_legend",
		pseudonym: "BookDrop"
	},
	{
		content: "Police activity on the bridge, seems like a minor incident",
		anonymityMode: "anonymous"
	},
	{
		content: "Beautiful sunset from the rooftop right now 🌇",
		anonymityMode: "public",
		isStory: true
	},
	{
		content:
			"Lost a black cat with a red collar near here. Please DM if you see him 🐱",
		anonymityMode: "local_legend",
		pseudonym: "CatDad99"
	},
	{
		content:
			"The farmers market starts at 9am this weekend here, worth the early wake-up!",
		anonymityMode: "public"
	},
	{
		content:
			"Street artist doing live graffiti mural — this is incredible to watch 🎨",
		anonymityMode: "anonymous"
	},
	{
		content:
			"Water pipe burst on the corner, workers have closed the street",
		anonymityMode: "anonymous"
	},
	{
		content:
			"Pro tip: the park behind the station has hidden benches with charging ports 🔋",
		anonymityMode: "local_legend",
		pseudonym: "CityHacker"
	},
	{
		content: "Flash mob just started! About 50 people dancing 💃",
		anonymityMode: "public",
		isStory: true
	},
	{
		content:
			"The busker playing violin near the station is absolutely amazing today 🎻",
		anonymityMode: "public"
	}
];

async function seed() {
	console.log("🌱 Starting GeoPulse seed...");

	// Sync all models
	await sequelize.sync({ force: true });
	console.log("✅ Database synced (force: true — all data cleared)");

	// ─── Create users ────────────────────────────────────────────────────────────
	const createdUsers: User[] = [];
	for (const u of USERS) {
		const hashed = await hashPassword(u.password);
		const user = await User.create({
			email: u.email,
			password: hashed,
			username: u.username,
			displayName: u.displayName,
			karmaScore: Math.floor(Math.random() * 200),
			isTrusted: u.email === "demo@geopulse.dev"
		} as any);
		createdUsers.push(user);
		console.log(`  👤 Created user: ${u.email}`);
	}

	// ─── Create posts ─────────────────────────────────────────────────────────
	const createdPosts: Post[] = [];
	for (let i = 0; i < POST_TEMPLATES.length; i++) {
		const template = POST_TEMPLATES[i];
		const location = LOCATIONS[i % LOCATIONS.length];
		const userIndex = i % createdUsers.length;
		const user = createdUsers[userIndex];

		const { obfuscatedLat, obfuscatedLng } = obfuscateCoordinates(
			location.lat,
			location.lng
		);

		const hoursAgo = Math.floor(Math.random() * 48);
		const createdAt = new Date(Date.now() - hoursAgo * 3_600_000);
		const isStory = template.isStory ?? false;
		const expiresAt = isStory
			? new Date(createdAt.getTime() + 24 * 3_600_000)
			: null;

		const post = await Post.create({
			userId: user.id,
			content: template.content,
			anonymityMode: template.anonymityMode,
			pseudonym: template.pseudonym ?? null,
			obfuscatedLat,
			obfuscatedLng,
			karmaScore: Math.floor(Math.random() * 30) - 5,
			isStory,
			isActive: true,
			expiresAt,
			createdAt,
			updatedAt: createdAt
		} as any);

		createdPosts.push(post);
		console.log(
			`  📍 Post #${post.id}: "${template.content.slice(0, 40)}…"`
		);
	}

	// ─── Create votes ─────────────────────────────────────────────────────────
	let voteCount = 0;
	for (const post of createdPosts) {
		// Random subset of users vote on each post
		const voters = createdUsers.filter(
			(u) => u.id !== post.userId && Math.random() > 0.4
		);
		for (const voter of voters) {
			const value = Math.random() > 0.25 ? 1 : -1;
			await Vote.create({
				userId: voter.id,
				postId: post.id,
				value
			} as any);
			voteCount++;
		}
	}
	console.log(`  🗳️  Created ${voteCount} votes`);

	console.log("\n✅ Seed complete!");
	console.log("\n📋 Demo credentials:");
	for (const u of USERS) {
		console.log(`   ${u.email}  /  ${u.password}`);
	}

	await sequelize.close();
}

seed().catch((err) => {
	console.error("❌ Seed failed:", err);
	process.exit(1);
});
