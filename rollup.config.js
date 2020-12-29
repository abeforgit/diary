import filesize from 'rollup-plugin-filesize';
import resolve from '@rollup/plugin-node-resolve';
import types from 'rollup-plugin-dts';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const MODULE = () => ({
	external: [
		...require('module').builtinModules,
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.peerDependencies || {}),
	],
	plugins: [
		resolve({
			extensions: ['.mjs', '.js', '.ts'],
			preferBuiltins: true,
		}),
		typescript({}),
		filesize({
			showBrotliSize: true,
			reporter: [
				(options, bundle, { minSize, gzipSize, brotliSize, fileName }) => {
					console.log(`${fileName} ↠ ${minSize} (min) ~ ${gzipSize} (gzip) ~ ${brotliSize} (brotli)`);
				},
			],
		}),
	],
});

const TYPES = () => ({
	plugins: [
		resolve({
			extensions: ['.js', '.ts'],
			preferBuiltins: true,
		}),
		types(),
	],
});


const make = file => ({
	format: /\.(mj|\.d\.t)s$/.test(file) ? 'esm' : 'cjs',
	sourcemap: false,
	esModule: false,
	interop: false,
	strict: false,
	file: file,
});

const apply_terser = () => terser({
	compress: {
		pure_getters: true,
		unsafe: true,
		unsafe_arrows: true,
		unsafe_comps: true,
		hoist_funs: true,
		hoist_vars: true,
		passes: 10,
	},
	mangle: true,
});

export default [
	{
		...MODULE(),
		input: 'src/index.ts',
		output: [
			make(pkg['exports']['.']['import']),
			make(pkg['exports']['.']['require']),
			{
				...make(pkg['exports']['.']['import']),
				file: 'lib/index.min.mjs',
				plugins: [apply_terser()],
			},
			{
				...make(pkg['unpkg']),
				name: pkg.name,
				format: 'umd',
				plugins: [apply_terser()],
			},
		],
	},
	{
		...TYPES(),
		input: 'src/index.ts',
		output: make('types/index.d.ts'),
	},
];
