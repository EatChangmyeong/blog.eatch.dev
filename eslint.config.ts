import { defineConfig } from 'eslint/config';
import globals from 'globals';
import solid from 'eslint-plugin-solid/configs/recommended';
import * as tsParser from '@typescript-eslint/parser';

export default defineConfig([
	{
		files: ['**/*.{ts,tsx}'],
		...solid,
		rules: {
			'solid/prefer-show': 'warn',
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parser: tsParser,
			parserOptions: {
				project: 'tsconfig.json',
			},
		},
	},
]);
