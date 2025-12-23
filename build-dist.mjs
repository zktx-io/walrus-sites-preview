#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import childProcess from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webpackBin = path.resolve(__dirname, "node_modules/webpack/bin/webpack.js");
const configPath = path.resolve(__dirname, "webpack.config.prod.cjs");

if (!fs.existsSync(webpackBin)) {
	console.error("webpack is not installed.");
	console.error("Run `npm install` in this package before building.");
	process.exit(1);
}

if (!fs.existsSync(configPath)) {
	console.error(`Missing webpack config: ${configPath}`);
	process.exit(1);
}

const result = childProcess.spawnSync(process.execPath, [webpackBin, "--config", configPath], {
	stdio: "inherit",
});
process.exit(result.status ?? 1);
