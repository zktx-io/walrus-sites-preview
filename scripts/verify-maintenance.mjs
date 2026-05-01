#!/usr/bin/env node
import childProcess from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const steps = [
	{
		label: "Check formatting",
		command: npmCommand,
		args: ["run", "format:check"],
	},
	{
		label: "Run lint",
		command: npmCommand,
		args: ["run", "lint"],
	},
	{
		label: "Build dist",
		command: npmCommand,
		args: ["run", "build"],
	},
	{
		label: "Check npm package contents",
		command: npmCommand,
		args: ["pack", "--dry-run", "--ignore-scripts"],
		env: {
			...process.env,
			npm_config_cache: path.join(os.tmpdir(), "walrus-sites-preview-npm-cache"),
		},
	},
];

for (const step of steps) {
	console.log(`\n==> ${step.label}`);
	const result = childProcess.spawnSync(step.command, step.args, {
		cwd: repoRoot,
		env: step.env ?? process.env,
		stdio: "inherit",
	});

	if (result.error) {
		console.error(result.error.message);
		process.exit(1);
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

console.log("\nMaintenance verification passed.");
