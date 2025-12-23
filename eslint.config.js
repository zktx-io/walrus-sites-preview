import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
	{
		ignores: ["dist/**", "node_modules/**", "portal-worker/**", "portal-common/**"],
	},

	js.configs.recommended,
	...tseslint.configs.recommended,

	{
		files: ["**/*.{js,mjs}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: globals.node,
		},
		rules: {
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		},
	},
	{
		files: ["**/*.cjs"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "script",
			globals: globals.node,
		},
		rules: {
			"@typescript-eslint/no-require-imports": "off",
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		},
	},
	{
		files: ["**/*.ts"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-require-imports": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-unsafe-function-type": "off",
			"@typescript-eslint/no-wrapper-object-types": "off",
		},
	},
	{
		files: ["portal-worker/src/**/*.ts"],
		languageOptions: {
			globals: globals.serviceworker,
		},
	},
	{
		rules: {
			"no-console": "off",
			"no-empty": "warn",
			"no-var": "warn",
			"no-async-promise-executor": "warn",
			"no-constant-binary-expression": "warn",
			"prefer-const": "warn",
		},
	},
];
