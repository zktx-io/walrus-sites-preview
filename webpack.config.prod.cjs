const { merge } = require("webpack-merge");
const common = require("./webpack.config.common.cjs");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common, {
	mode: "production",
	performance: {
		hints: false,
	},
	optimization: {
		minimizer: [
			"...",
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: ["log"],
					},
				},
			}),
			new HtmlMinimizerPlugin(),
			new CssMinimizerPlugin(),
		],
	},
});
