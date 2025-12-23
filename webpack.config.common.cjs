const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const fs = require("fs");

function readJsonIfExists(filePath) {
	try {
		if (!fs.existsSync(filePath)) return null;
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch {
		return null;
	}
}

const configPath = path.resolve(__dirname, "./config.json");
const runtimeConfig = readJsonIfExists(configPath) ?? {};

const portalDomainNameLength =
	process.env.PORTAL_DOMAIN_NAME_LENGTH ?? runtimeConfig.portalDomainNameLength ?? "21";
const rpcUrlList =
	process.env.RPC_URL_LIST ??
	(Array.isArray(runtimeConfig.rpcUrlList) ? runtimeConfig.rpcUrlList.join(",") : undefined);
const suinsClientNetwork = process.env.SUINS_CLIENT_NETWORK ?? runtimeConfig.network;
const aggregatorUrl = process.env.AGGREGATOR_URL ?? runtimeConfig.aggregatorUrl;
const sitePackage = process.env.SITE_PACKAGE ?? runtimeConfig.sitePackage;

module.exports = {
	context: path.resolve(__dirname, "./portal-worker"),
	watch: false,
	entry: {
		"walrus-sites-sw": "./src/walrus-sites-sw.ts",
		"walrus-sites-portal-register-sw": "./src/walrus-sites-portal-register-sw.ts",
	},
	module: {
		rules: [
			{
				test: /\.html$/,
				type: "asset/source",
			},
			{
				test: /\.ts$/,
				use: {
					loader: "ts-loader",
					options: {
						transpileOnly: true,
						configFile: path.resolve(__dirname, "./tsconfig.worker.json"),
					},
				},
				exclude: /node_modules/,
			},
		],
	},
	output: {
		filename: "[name].js",
		path: process.env.OUTPUT_DIR
			? path.resolve(__dirname, process.env.OUTPUT_DIR)
			: path.resolve(__dirname, "./dist/"),
		clean: true,
	},
	resolve: {
		alias: {
			"@lib": path.resolve(__dirname, "./portal-common/lib/src"),
			"@templates": path.resolve(__dirname, "./portal-common/html_templates"),
		},
		extensions: [".ts", ".js", ".html"],
		fallback: {
			http: require.resolve("stream-http"),
			https: require.resolve("https-browserify"),
			stream: require.resolve("stream-browserify"),
			url: require.resolve("url/"),
			util: require.resolve("util/"),
		},
	},
	plugins: [
		new webpack.DefinePlugin({
			"process.env.PORTAL_DOMAIN_NAME_LENGTH": JSON.stringify(
				portalDomainNameLength || undefined,
			),
			"process.env.RPC_URL_LIST": JSON.stringify(rpcUrlList || undefined),
			"process.env.SUINS_CLIENT_NETWORK": JSON.stringify(suinsClientNetwork || undefined),
			"process.env.AGGREGATOR_URL": JSON.stringify(aggregatorUrl || undefined),
			"process.env.SITE_PACKAGE": JSON.stringify(sitePackage || undefined),
		}),
		new CopyPlugin({
			patterns: [
				{
					from: path.resolve(__dirname, "./portal-worker/static"),
					globOptions: { ignore: ["**/*.template.html"] },
				},
				{
					from: path.resolve(__dirname, "./portal-worker/static/index.html"),
					to: "404.html",
				},
			],
		}),
	],
};
