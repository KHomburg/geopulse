const { execFileSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../../..");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const nodemonCommand = `${repoRoot}/node_modules/.bin/nodemon`;
const tsNodeCommand = `${repoRoot}/node_modules/.bin/ts-node ./src/index.ts`;

const isMatchingApiDevCommand = (command) => {
	return (
		(command.includes(nodemonCommand) &&
			command.includes("./src/index.ts")) ||
		command.includes(tsNodeCommand)
	);
};

const listMatchingProcesses = () => {
	try {
		const output = execFileSync("ps", ["-axo", "pid=,command="], {
			encoding: "utf8"
		});

		return output
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				const firstSpaceIndex = line.indexOf(" ");
				return {
					pid: Number(line.slice(0, firstSpaceIndex)),
					command: line.slice(firstSpaceIndex + 1)
				};
			})
			.filter(({ pid, command }) => {
				return (
					Number.isInteger(pid) &&
					pid !== process.pid &&
					isMatchingApiDevCommand(command)
				);
			});
	} catch {
		return [];
	}
};

const killProcesses = (processes, signal) => {
	for (const { pid } of processes) {
		try {
			process.kill(pid, signal);
		} catch {
			// Ignore processes that already exited between listing and kill.
		}
	}
};

const waitForCleanup = async () => {
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const remainingProcesses = listMatchingProcesses();
		if (remainingProcesses.length === 0) {
			return true;
		}
		if (attempt === 5) {
			killProcesses(remainingProcesses, "SIGKILL");
		}
		await wait(100);
	}

	return listMatchingProcesses().length === 0;
};

const main = async () => {
	const staleProcesses = listMatchingProcesses();
	if (staleProcesses.length === 0) {
		return;
	}

	killProcesses(staleProcesses, "SIGTERM");
	const cleared = await waitForCleanup();

	if (!cleared) {
		console.warn(
			"⚡️[api:dev]: Unable to clear all stale API dev processes before startup."
		);
		return;
	}

	console.log(
		"⚡️[api:dev]: Cleared stale API dev processes before startup."
	);
};

main().catch((error) => {
	console.warn(
		"⚡️[api:dev]: Failed to clean stale API dev processes.",
		error
	);
	process.exitCode = 0;
});
