import { execSync } from "child_process";
import path from "path";

/**
 * Kill any process holding a given port (best-effort, non-fatal).
 * Prevents EADDRINUSE when Playwright's webServer tries to start fresh servers.
 */
function freePort(port: number) {
	try {
		const pids = execSync(`lsof -ti :${port} 2>/dev/null || true`)
			.toString()
			.trim();
		if (pids) {
			execSync(`kill ${pids} 2>/dev/null || true`);
			execSync("sleep 1");
		}
	} catch {
		// port was already free — ignore
	}
}

/**
 * Runs once before all tests.
 * 1. Frees ports so Playwright webServers start cleanly.
 * 2. Seeds the SQLite dev database with predictable test fixtures.
 */
async function globalSetup() {
	freePort(8080);
	freePort(5173);

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
