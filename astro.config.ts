// @ts-check
import { defineConfig } from 'astro/config';

import icons from 'unplugin-icons/vite';
import mdx from '@astrojs/mdx';
import rehypeMathJaxSvg from 'rehype-mathjax/svg';
import remarkCustomHeaderId from 'remark-custom-header-id';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkMyFootnote from './remark-my-footnote.js';
import remarkMyReadingTime from './remark-my-reading-time.js';
import solid from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.eatch.dev',

	markdown: {
		shikiConfig: {
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
		},
		smartypants: false,
	},

	integrations: [
		mdx({
			remarkPlugins: [
				[remarkGfm, { singleTilde: false }],
				remarkCustomHeaderId,
				remarkMath,
				remarkMyFootnote,
				remarkMyReadingTime,
			],
			rehypePlugins: [rehypeMathJaxSvg],
		}),
		solid(),
	],

	vite: {
		plugins: [
			icons({
				compiler: 'astro',
				defaultClass: 'inline-block align-middle',
			}),
			tailwindcss(),
		],
	},
});
