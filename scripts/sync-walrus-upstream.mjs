#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

const DEFAULT_REPO = "MystenLabs/walrus-sites";
const DEFAULT_REF = "main";
const DEFAULT_CACHE_DIR = ".upstream/walrus-sites";

function usage() {
	return [
		"Download upstream Walrus Sites source into a disposable cache directory.",
		"",
		"Usage:",
		"  npm run upstream:download",
		"  node ./scripts/sync-walrus-upstream.mjs [options]",
		"",
		"Options:",
		`  --repo <repo>       GitHub repo, owner/name or URL (default: ${DEFAULT_REPO})`,
		`  --ref <ref>         Upstream branch, tag, or commit (default: ${DEFAULT_REF})`,
		`  --cache-dir <path>  Download directory (default: ${DEFAULT_CACHE_DIR})`,
		"  -h, --help         Show this help",
	].join("\n");
}

function parseArgs(argv) {
	const options = {
		repo: DEFAULT_REPO,
		ref: DEFAULT_REF,
		cacheDir: path.resolve(repoRoot, DEFAULT_CACHE_DIR),
		help: false,
	};

	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];
		const takeValue = () => {
			const value = argv[i + 1];
			if (!value || value.startsWith("-")) throw new Error(`Missing value for ${arg}`);
			i++;
			return value;
		};

		if (arg === "-h" || arg === "--help") {
			options.help = true;
			continue;
		}
		if (arg === "--repo") {
			options.repo = takeValue();
			continue;
		}
		if (arg === "--ref") {
			options.ref = takeValue();
			continue;
		}
		if (arg === "--cache-dir") {
			options.cacheDir = path.resolve(repoRoot, takeValue());
			continue;
		}

		throw new Error(`Unknown argument: ${arg}`);
	}

	return options;
}

function run(command, args, options = {}) {
	const result = childProcess.spawnSync(command, args, {
		cwd: options.cwd ?? repoRoot,
		stdio: options.stdio ?? "inherit",
	});

	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
	}
	return result;
}

function githubRepoSlug(repo) {
	if (/^https?:\/\//.test(repo)) {
		const parsed = new URL(repo);
		const slug = parsed.pathname.replace(/^\/+/, "").replace(/\.git$/, "");
		if (!slug.split("/")[0] || !slug.split("/")[1]) {
			throw new Error(`Invalid GitHub repository URL: ${repo}`);
		}
		return slug;
	}

	const normalized = repo.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
	const parts = normalized.split("/");
	if (parts.length !== 2 || !parts[0] || !parts[1]) {
		throw new Error(`Invalid GitHub repository: ${repo}`);
	}
	return normalized;
}

function githubArchiveUrl(repo, ref) {
	return `https://codeload.github.com/${githubRepoSlug(repo)}/tar.gz/${encodeURIComponent(ref)}`;
}

async function downloadFile(url, destination, redirects = 5) {
	await fs.promises.mkdir(path.dirname(destination), { recursive: true });

	return new Promise((resolve, reject) => {
		const request = https.get(
			url,
			{
				headers: {
					"User-Agent": "walrus-sites-preview-maintenance",
				},
			},
			async (response) => {
				const status = response.statusCode ?? 0;
				const location = response.headers.location;

				if (status >= 300 && status < 400 && location) {
					response.resume();
					if (redirects <= 0) {
						reject(new Error(`Too many redirects while downloading ${url}`));
						return;
					}
					try {
						const nextUrl = new URL(location, url).toString();
						await downloadFile(nextUrl, destination, redirects - 1);
						resolve();
					} catch (err) {
						reject(err);
					}
					return;
				}

				if (status !== 200) {
					response.resume();
					reject(new Error(`Download failed (${status}) for ${url}`));
					return;
				}

				try {
					await pipeline(response, fs.createWriteStream(destination));
					resolve();
				} catch (err) {
					reject(err);
				}
			},
		);

		request.on("error", reject);
	});
}

async function downloadUpstreamArchive(options) {
	const archiveUrl = githubArchiveUrl(options.repo, options.ref);
	const upstreamRoot = path.dirname(options.cacheDir);
	const archivePath = path.join(upstreamRoot, "walrus-sites.tar.gz");

	fs.rmSync(options.cacheDir, { recursive: true, force: true });
	fs.mkdirSync(options.cacheDir, { recursive: true });

	console.log(`Downloading ${archiveUrl}`);
	await downloadFile(archiveUrl, archivePath);

	run("tar", ["-xzf", archivePath, "-C", options.cacheDir, "--strip-components=1"]);

	return archiveUrl;
}

function writeSyncMetadata(options, archiveUrl) {
	const metadataPath = path.join(path.dirname(options.cacheDir), "last-sync.json");
	const metadata = {
		repo: options.repo,
		ref: options.ref,
		archiveUrl,
		syncedAt: new Date().toISOString(),
	};
	fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
	fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
}

async function main() {
	const options = parseArgs(process.argv);
	if (options.help) {
		console.log(usage());
		return;
	}

	const archiveUrl = await downloadUpstreamArchive(options);
	writeSyncMetadata(options, archiveUrl);

	console.log(`Downloaded upstream: ${options.repo} @ ${options.ref}`);
	console.log(`Extracted to: ${options.cacheDir}`);
	console.log("No vendored files were changed.");
}

try {
	await main();
} catch (err) {
	console.error(err?.message ?? String(err));
	process.exit(1);
}
