const { merge } = require("webpack-merge");
const common = require("./webpack.config.common.cjs");

module.exports = merge(common, {
	mode: "development",
});
