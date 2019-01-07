import replace from 'rollup-plugin-re';
import multiEntry from "rollup-plugin-multi-entry";
import resolve from 'rollup-plugin-node-resolve';

export default {
	input: "./auto_tests/tests/*.js",
	output: {
		file: 'dist/tests.js',
		name: 'Dygraph',
		format: 'iife'
	},
	plugins: [
		resolve(),
		replace({
			patterns: [
				{
					test: /typeof\(process\)/gm,
					replace: 'true',
				},
				{
					test: /process\.env\.NODE_ENV/gm,
					replace: "'development'",
				}
			]
		}),
		multiEntry(),
	]
};