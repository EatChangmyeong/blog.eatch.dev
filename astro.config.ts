import { defineConfig, fontProviders } from 'astro/config';

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

	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Pretendard',
			cssVariable: '--font-pretendard',
			featureSettings: "'ss05', 'ss06', 'ss08'",
			options: {
				variants: [
					{
						weight: 400,
						style: 'normal',
						src: ['./src/assets/fonts/pretendard_400.woff2'],
					},
					{
						weight: 700,
						style: 'normal',
						src: ['./src/assets/fonts/pretendard_700.woff2'],
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: '나눔스퀘어라운드',
			cssVariable: '--font-nanumsquareround',
			options: {
				variants: [
					{
						weight: 700,
						style: 'normal',
						src: ['./src/assets/fonts/nanumsquareround_700.woff2'],
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: 'D2Coding',
			cssVariable: '--font-d2coding',
			options: {
				variants: [
					{
						weight: 400,
						style: 'normal',
						src: ['./src/assets/fonts/d2coding_400.woff'],
					},
					{
						weight: 700,
						style: 'normal',
						src: ['./src/assets/fonts/d2coding_700.woff'],
					},
				],
			},
		},
	],

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
