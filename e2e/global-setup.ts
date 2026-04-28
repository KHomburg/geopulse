import { execSync } from "child_process";
import path from "path";

/**
 * Runs once before all tests.
 * Seeds the SQLite dev database with predictable test fixtures.
 */
async function globalSetup() {
	console.log("\n[global-setup] Seeding test database…");
	try {
		execSync("npm run seed --workspace=apps/api", {
			cwd: path.resolve(__dirname, ".."),
			stdio: "inherit"
		});
		console.log("[global-setup] Seed complete.\n");
	} catch (err) {
		console.error(
			"[global-setup] Seed failed — tests may lack fixture data."
		);
		console.error(err);
	}
}

export default globalSetup;
