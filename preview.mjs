#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import childProcess from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_NAME = "preview";
const defaultDistDir = path.resolve(__dirname, "./dist");

const NETWORK_DEFAULTS = {
	mainnet: {
		network: "mainnet",
		rpcUrlList: ["https://fullnode.mainnet.sui.io"],
		aggregatorUrl: "https://aggregator.walrus-mainnet.walrus.space",
		sitePackage: "0x26eb7ee8688da02c5f671679524e379f0b837a12f1d1d799f255b7eea260ad27",
	},
	testnet: {
		network: "testnet",
		rpcUrlList: ["https://fullnode.testnet.sui.io"],
		aggregatorUrl: "https://aggregator.walrus-testnet.walrus.space",
		sitePackage: "0xf99aee9f21493e1590e7e5a9aea6f343a1f381031a04a732724871fc294be799",
	},
};

function usage() {
	return [
		"Walrus Sites (standalone preview)",
		"",
		"Usage:",
		`  ${CLI_NAME} [-testnet|-mainnet] -id <0x...> [-port 3000] [--open]`,
		`  ${CLI_NAME} --mode static [--dist ./dist] [-port 3000] [--open]`,
		"",
		"Site mode options:",
		"  --config <path>            Path to config.json (default: ./config.json)",
		"  -testnet / -mainnet        Apply built-in defaults (rpc/aggregator/sitePackage)",
		"  -id, --id <0x...>          Site object ID",
		"  -port, -p, --port <n>      Local port (default: 3000)",
		"  --host <ip>                Bind address (default: localhost)",
		"  --network mainnet|testnet  Optional informational field",
		"  --rpc <csv>                Sui RPC URLs, comma-separated",
		"  --aggregator <url>         Walrus aggregator URL",
		"  --site-package <0x...>     Walrus site Move package address",
		"  --site-object-id <0x...>   Alias for --id",
		"",
		"Static mode options:",
		`  --dist <path>              Directory to serve (default: ${defaultDistDir})`,
		"",
		"Notes:",
		"  - `site` mode fetches resources from Sui + Walrus and serves them locally.",
		"  - `static` mode serves a local folder as a SPA (falls back to index.html).",
	].join("\n");
}

function parsePort(value) {
	const port = Number(value);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		throw new Error(`Invalid port: ${value}`);
	}
	return port;
}

function parseArgs(argv) {
	const options = {
		host: "localhost",
		port: 3000,
		dist: undefined,
		mode: undefined,
		config: path.resolve(process.cwd(), "config.json"),
		network: undefined,
		rpcUrlList: undefined,
		aggregatorUrl: undefined,
		sitePackage: undefined,
		siteObjectId: undefined,
		mainnet: false,
		testnet: false,
		open: false,
		help: false,
	};

	const unknown = [];
	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];

		if (arg === "-h" || arg === "--help") {
			options.help = true;
			continue;
		}
		if (arg === "--open") {
			options.open = true;
			continue;
		}
		if (arg === "-testnet" || arg === "--testnet") {
			options.testnet = true;
			continue;
		}
		if (arg === "-mainnet" || arg === "--mainnet") {
			options.mainnet = true;
			continue;
		}

		const takeValue = () => {
			const next = argv[i + 1];
			if (!next || next.startsWith("-")) throw new Error(`Missing value for ${arg}`);
			i++;
			return next;
		};

		if (arg === "--host") {
			options.host = takeValue();
			continue;
		}
		if (arg === "--mode") {
			options.mode = takeValue();
			continue;
		}
		if (arg === "--config") {
			options.config = path.resolve(process.cwd(), takeValue());
			continue;
		}
		if (arg === "--network") {
			options.network = takeValue();
			continue;
		}
		if (arg === "--rpc") {
			options.rpcUrlList = takeValue();
			continue;
		}
		if (arg === "--aggregator") {
			options.aggregatorUrl = takeValue();
			continue;
		}
		if (arg === "--site-package") {
			options.sitePackage = takeValue();
			continue;
		}
		if (arg === "--site-object-id" || arg === "--id" || arg === "-id") {
			options.siteObjectId = takeValue();
			continue;
		}
		if (arg === "--dist") {
			options.dist = path.resolve(process.cwd(), takeValue());
			continue;
		}
		if (arg === "--port" || arg === "-port" || arg === "-p") {
			options.port = parsePort(takeValue());
			continue;
		}

		unknown.push(arg);
	}

	if (options.testnet && options.mainnet) {
		throw new Error("Choose only one: -testnet or -mainnet");
	}

	return { options, unknown };
}

function contentType(filePath) {
	switch (path.extname(filePath).toLowerCase()) {
		case ".html":
			return "text/html; charset=utf-8";
		case ".js":
			return "text/javascript; charset=utf-8";
		case ".css":
			return "text/css; charset=utf-8";
		case ".json":
			return "application/json; charset=utf-8";
		case ".ico":
			return "image/x-icon";
		case ".png":
			return "image/png";
		case ".svg":
			return "image/svg+xml";
		case ".woff":
			return "font/woff";
		case ".woff2":
			return "font/woff2";
		case ".ttf":
			return "font/ttf";
		case ".eot":
			return "application/vnd.ms-fontobject";
		case ".map":
			return "application/json; charset=utf-8";
		default:
			return "application/octet-stream";
	}
}

function safeResolve(rootDir, urlPath) {
	const rel = urlPath.replace(/^\/+/, "");
	const resolved = path.resolve(rootDir, rel);
	const normalizedRoot = path.normalize(rootDir + path.sep);
	const normalizedResolved = path.normalize(resolved + path.sep);
	if (!normalizedResolved.startsWith(normalizedRoot)) return null;
	return resolved;
}

function tryOpen(url) {
	try {
		const platform = process.platform;
		if (platform === "darwin") {
			childProcess.spawn("open", [url], { stdio: "ignore", detached: true }).unref();
			return;
		}
		if (platform === "win32") {
			childProcess
				.spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true })
				.unref();
			return;
		}
		childProcess.spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
	} catch {
		// ignore
	}
}

let parsed;
try {
	parsed = parseArgs(process.argv);
} catch (err) {
	console.error(err?.message ?? String(err));
	console.error("");
	console.error(usage());
	process.exit(1);
}

const cli = parsed.options;
if (parsed.unknown.length) {
	console.error(`Unknown arguments: ${parsed.unknown.join(" ")}`);
	console.error("");
	console.error(usage());
	process.exit(1);
}

if (cli.help) {
	console.log(usage());
	process.exit(0);
}

function readJsonIfExists(filePath) {
	try {
		if (!fs.existsSync(filePath)) return null;
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch (err) {
		throw new Error(`Failed to read JSON at ${filePath}: ${err?.message ?? err}`);
	}
}

function base64UrlSafeEncode(bytes) {
	return Buffer.from(bytes)
		.toString("base64")
		.replaceAll("/", "_")
		.replaceAll("+", "-")
		.replaceAll("=", "");
}

function blobAggregatorEndpoint(blobId, aggregatorUrl) {
	const clean = aggregatorUrl.endsWith("/") ? aggregatorUrl.slice(0, -1) : aggregatorUrl;
	return new URL(`${clean}/v1/blobs/${encodeURIComponent(blobId)}`);
}

function quiltAggregatorEndpoint(quiltPatchId, aggregatorUrl) {
	const clean = aggregatorUrl.endsWith("/") ? aggregatorUrl.slice(0, -1) : aggregatorUrl;
	return new URL(`${clean}/v1/blobs/by-quilt-patch-id/${encodeURIComponent(quiltPatchId)}`);
}

async function sha256(messageArrayBuffer) {
	const hash = await globalThis.crypto.subtle.digest("SHA-256", messageArrayBuffer);
	return new Uint8Array(hash);
}

function normalizePath(urlPath) {
	if (urlPath === "/") return "/index.html";
	if (urlPath.endsWith("/")) return `${urlPath}index.html`;
	return urlPath;
}

function validateSiteConfig(config) {
	const missing = [];
	if (!config?.rpcUrlList?.length) missing.push("rpcUrlList");
	if (!config?.aggregatorUrl) missing.push("aggregatorUrl");
	if (!config?.sitePackage) missing.push("sitePackage");
	if (!config?.siteObjectId) missing.push("siteObjectId");
	return missing;
}

function loadConfigFromFileAndCli() {
	const fileConfig = readJsonIfExists(cli.config) ?? {};

	const merged = {
		mode: fileConfig.mode,
		network: fileConfig.network,
		rpcUrlList: fileConfig.rpcUrlList,
		aggregatorUrl: fileConfig.aggregatorUrl,
		sitePackage: fileConfig.sitePackage,
		siteObjectId: fileConfig.siteObjectId,
		dist: fileConfig.dist,
	};

	if (cli.mode) merged.mode = cli.mode;
	if (cli.network) merged.network = cli.network;
	if (cli.rpcUrlList)
		merged.rpcUrlList = cli.rpcUrlList
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	if (cli.aggregatorUrl) merged.aggregatorUrl = cli.aggregatorUrl;
	if (cli.sitePackage) merged.sitePackage = cli.sitePackage;
	if (cli.siteObjectId) merged.siteObjectId = cli.siteObjectId;
	if (cli.dist) merged.dist = cli.dist;

	return merged;
}

function applyNetworkDefaults(config) {
	const which = cli.testnet ? "testnet" : cli.mainnet ? "mainnet" : null;
	if (!which) return config;

	const defaults = NETWORK_DEFAULTS[which];
	if (!config.network) config.network = defaults.network;
	if (!config.rpcUrlList) config.rpcUrlList = defaults.rpcUrlList;
	if (!config.aggregatorUrl) config.aggregatorUrl = defaults.aggregatorUrl;
	if (!config.sitePackage) config.sitePackage = defaults.sitePackage;
	return config;
}

function serveFile(res, filePath, status = 200) {
	const stat = fs.statSync(filePath);
	res.writeHead(status, {
		"content-type": contentType(filePath),
		"content-length": String(stat.size),
		"cache-control": "no-cache",
	});
	fs.createReadStream(filePath).pipe(res);
}

function createStaticHandler(distDir) {
	return (req, res) => {
		try {
			const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
			let decodedPath;
			try {
				decodedPath = decodeURIComponent(url.pathname);
			} catch {
				res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
				res.end("Bad request");
				return;
			}
			const resolved = safeResolve(distDir, decodedPath);
			if (!resolved) {
				res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
				res.end("Bad request");
				return;
			}

			const candidate =
				decodedPath.endsWith("/") || decodedPath === "/"
					? path.join(resolved, "index.html")
					: resolved;

			const accept = req.headers.accept ?? "";
			const wantsHtml = accept.includes("text/html") || accept === "*/*" || accept === "";

			if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
				serveFile(res, candidate);
				return;
			}

			if (wantsHtml) {
				const indexHtml = path.join(distDir, "index.html");
				if (fs.existsSync(indexHtml)) {
					serveFile(res, indexHtml);
					return;
				}
			}

			const notFoundHtml = path.join(distDir, "404.html");
			if (wantsHtml && fs.existsSync(notFoundHtml)) {
				serveFile(res, notFoundHtml, 404);
				return;
			}

			res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
			res.end("Not found");
		} catch {
			res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
			res.end("Internal server error");
		}
	};
}

async function createSiteHandler(siteConfig) {
	let SuiClient, deriveDynamicFieldID, fromHex, toHex, bcs;
	try {
		({ SuiClient } = await import("@mysten/sui/client"));
		({ deriveDynamicFieldID, fromHex, toHex } = await import("@mysten/sui/utils"));
		({ bcs } = await import("@mysten/sui/bcs"));
	} catch (err) {
		const message = err?.message ?? String(err);
		if (message.includes("ERR_MODULE_NOT_FOUND") || message.includes("Cannot find package")) {
			throw new Error(
				[
					"Failed to load @mysten/sui dependencies for site mode.",
					"If you're running from this repo, run `npm install` here first.",
					"If you're using the published package, reinstall it in your project: `npm i -D @zktx.io/walrus-sites-preview`.",
					"Then run the command again.",
				].join("\n"),
			);
		}
		throw err;
	}

	function fromBase64(base64) {
		return new Uint8Array(Buffer.from(base64, "base64"));
	}

	function toBase64(bytes) {
		return Buffer.from(bytes).toString("base64");
	}

	function base64UrlToBase64(s) {
		return s.replaceAll("-", "+").replaceAll("_", "/");
	}

	function deriveQuiltPatchId(quiltBlobIdBase64Url, internalIdHex) {
		const internal = internalIdHex.startsWith("0x") ? internalIdHex.slice(2) : internalIdHex;
		const littleEndian = true;

		const blobIdBytes = Buffer.from(base64UrlToBase64(quiltBlobIdBase64Url), "base64");
		const buffer = Buffer.alloc(37);
		blobIdBytes.copy(buffer, 0, 0, Math.min(blobIdBytes.length, 32));

		const internalBuf = Buffer.from(internal, "hex");
		const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
		const internalView = new DataView(
			internalBuf.buffer,
			internalBuf.byteOffset,
			internalBuf.byteLength,
		);
		const version = internalView.getInt8(0);
		const startIndex = internalView.getInt16(1, littleEndian);
		const endIndex = internalView.getInt16(3, littleEndian);

		view.setUint8(32, version);
		view.setUint16(33, startIndex, littleEndian);
		view.setUint16(35, endIndex, littleEndian);

		return base64UrlSafeEncode(buffer).slice(0, 50);
	}

	const Address = bcs.bytes(32).transform({
		input: (id) => fromHex(id),
		output: (id) => toHex(id),
	});

	const BLOB_ID = bcs.u256().transform({
		input: (id) => id,
		output: (id) => base64UrlSafeEncode(bcs.u256().serialize(id).toBytes()),
	});

	const DATA_HASH = bcs.u256().transform({
		input: (id) => id,
		output: (id) => toBase64(bcs.u256().serialize(id).toBytes()),
	});

	const ResourcePathStruct = bcs.struct("ResourcePath", { path: bcs.string() });
	const OPTION_U64 = bcs.option(bcs.u64()).transform({
		input: (value) => value,
		output: (value) => (value ? Number(value) : null),
	});
	const RangeStruct = bcs.struct("Range", { start: OPTION_U64, end: OPTION_U64 });
	const OptionalRangeStruct = bcs.option(RangeStruct).transform({
		input: (value) => value,
		output: (value) => (value ? value : null),
	});
	const ResourceStruct = bcs.struct("Resource", {
		path: bcs.string(),
		headers: bcs.map(bcs.string(), bcs.string()),
		blob_id: BLOB_ID,
		blob_hash: DATA_HASH,
		range: OptionalRangeStruct,
	});
	function DynamicFieldStruct(K, V) {
		return bcs.struct(`DynamicFieldStruct<${K.name}, ${V.name}>`, {
			parentId: Address,
			name: K,
			value: V,
		});
	}

	async function fetchSiteResource(
		{ client, aggregatorUrl, sitePackage, siteObjectId },
		resourcePath,
	) {
		const resourcePathMoveType = `${sitePackage}::site::ResourcePath`;
		const seen = new Set();
		let currentObjectId = siteObjectId;
		let depth = 0;

		while (true) {
			if (seen.has(currentObjectId)) throw new Error("Redirect loop detected");
			if (depth >= 3) throw new Error("Too many redirects");
			seen.add(currentObjectId);

			const dynamicFieldId = deriveDynamicFieldID(
				currentObjectId,
				resourcePathMoveType,
				bcs.string().serialize(resourcePath).toBytes(),
			);

			const [primary, dynamicField] = await client.multiGetObjects({
				ids: [currentObjectId, dynamicFieldId],
				options: { showBcs: true, showDisplay: true },
			});

			const redirectTo = primary?.data?.display?.data?.["walrus site address"];
			if (redirectTo) {
				currentObjectId = redirectTo;
				depth++;
				continue;
			}

			if (!dynamicField?.data?.bcs || dynamicField.data.bcs.dataType !== "moveObject")
				return null;

			const df = DynamicFieldStruct(ResourcePathStruct, ResourceStruct).parse(
				fromBase64(dynamicField.data.bcs.bcsBytes),
			);
			const resource = df.value;
			if (!resource?.blob_id) return null;

			const headers = new Map(
				resource.headers?.entries
					? resource.headers.entries()
					: Object.entries(resource.headers ?? {}),
			);
			const quiltInternalId = headers.get("x-wal-quilt-patch-internal-id");

			let endpoint;
			if (quiltInternalId) {
				const quiltPatchId = deriveQuiltPatchId(resource.blob_id, quiltInternalId);
				endpoint = quiltAggregatorEndpoint(quiltPatchId, aggregatorUrl);
			} else {
				endpoint = blobAggregatorEndpoint(resource.blob_id, aggregatorUrl);
			}

			const requestHeaders = {};
			if (resource.range) {
				const start = resource.range.start ?? "";
				const end = resource.range.end ?? "";
				requestHeaders.range = `bytes=${start}-${end}`;
			}

			const response = await fetch(endpoint, { headers: requestHeaders });
			if (!response.ok) {
				if (response.status === 404) return null;
				throw new Error(`Aggregator error: ${response.status}`);
			}

			const body = await response.arrayBuffer();
			const bodyHash = toBase64(await sha256(body));
			if (resource.blob_hash !== bodyHash) {
				throw new Error("Checksum mismatch (aggregator response hash != on-chain hash)");
			}

			return {
				objectId: currentObjectId,
				path: resource.path,
				headers,
				body,
			};
		}
	}

	const rpcUrl = siteConfig.rpcUrlList[0];
	const client = new SuiClient({ url: rpcUrl });

	return async (req, res) => {
		try {
			const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
			if (url.pathname === "/__config") {
				res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
				res.end(JSON.stringify({ ...siteConfig, rpcUrl: rpcUrl }, null, 2));
				return;
			}

			const accept = req.headers.accept ?? "";
			const wantsHtml = accept.includes("text/html") || accept === "*/*" || accept === "";

			const requestedPath = normalizePath(url.pathname);
			const result = await fetchSiteResource(
				{
					client,
					aggregatorUrl: siteConfig.aggregatorUrl,
					sitePackage: siteConfig.sitePackage,
					siteObjectId: siteConfig.siteObjectId,
				},
				requestedPath,
			);

			// Basic SPA-ish fallback for HTML requests.
			let finalResult = result;
			if (!finalResult && wantsHtml && requestedPath !== "/index.html") {
				finalResult = await fetchSiteResource(
					{
						client,
						aggregatorUrl: siteConfig.aggregatorUrl,
						sitePackage: siteConfig.sitePackage,
						siteObjectId: siteConfig.siteObjectId,
					},
					"/index.html",
				);
			}

			if (!finalResult) {
				res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
				res.end("Not found");
				return;
			}

			const responseHeaders = Object.fromEntries(finalResult.headers.entries());
			responseHeaders["cache-control"] = "no-cache";
			responseHeaders["x-walrus-site-object-id"] = siteConfig.siteObjectId;
			if (!responseHeaders["content-type"] && wantsHtml) {
				responseHeaders["content-type"] = "text/html; charset=utf-8";
			}

			res.writeHead(200, responseHeaders);
			res.end(Buffer.from(finalResult.body));
		} catch (err) {
			res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
			res.end(err?.message ?? "Internal server error");
		}
	};
}

const config = applyNetworkDefaults(loadConfigFromFileAndCli());

if (cli.mode && !["site", "static"].includes(cli.mode)) {
	console.error(`Invalid --mode: ${cli.mode} (expected "site" or "static")`);
	console.error("");
	console.error(usage());
	process.exit(1);
}

const implicitSiteMode = Boolean(
	config.siteObjectId || cli.siteObjectId || cli.testnet || cli.mainnet,
);

let mode = config.mode;
if (!mode) {
	if (implicitSiteMode) {
		mode = "site";
	} else {
		if (config.dist) {
			console.error("`--dist` requires `--mode static`.");
		} else {
			console.error("Missing required site options.");
		}
		console.error("");
		console.error(usage());
		process.exit(1);
	}
}

let requestHandler;
if (mode === "static") {
	const distDir = path.resolve(config.dist ?? defaultDistDir);
	if (!fs.existsSync(distDir)) {
		console.error(`Missing dist directory: ${distDir}`);
		process.exit(1);
	}
	requestHandler = createStaticHandler(distDir);
} else if (mode === "site") {
	const missing = validateSiteConfig(config);
	if (missing.length) {
		console.error(`Missing config fields for site mode: ${missing.join(", ")}`);
		console.error(
			`Pass CLI flags (e.g. \`${CLI_NAME} -testnet -id 0x...\`) or create ./config.json.`,
		);
		process.exit(1);
	}
	requestHandler = await createSiteHandler(config);
} else {
	console.error(`Unknown mode: ${mode} (expected "site" or "static")`);
	process.exit(1);
}

const server = http.createServer((req, res) => requestHandler(req, res));

server.on("error", (err) => {
	console.error("Failed to start preview server:", err?.message ?? err);
	process.exit(1);
});

server.listen(cli.port, cli.host, () => {
	const url = `http://${cli.host}:${cli.port}`;
	console.log(`Mode: ${mode}`);
	if (mode === "static") console.log(`Serving: ${path.resolve(config.dist ?? defaultDistDir)}`);
	if (mode === "site") console.log(`Site object: ${config.siteObjectId}`);
	console.log(url);
	if (cli.open) tryOpen(url);
});
