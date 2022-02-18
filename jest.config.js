/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
	preset: 'ts-jest',
	transform: {
		"^.+\\.ts$": "ts-jest",
	},
	resolver: "jest-node-exports-resolver",

	// By default, Jest ignore node_modules.
	// So keep this key, even with an empty array,
	// in order to include node_modules like node-fetch
	// which is a ESmodule and needs to be tranformed with babel-jest
	transformIgnorePatterns: [],
};