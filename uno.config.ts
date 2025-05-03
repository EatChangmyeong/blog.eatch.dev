import { defineConfig, presetWind3 as wind3, presetIcons as icons } from 'unocss';

export default defineConfig({
	presets: [
		wind3({
			preflight: 'on-demand',
		}),
		icons({
			warn: true,
			extraProperties: {
				display: 'inline-block',
				'font-size': '1.1em',
				'vertical-align': 'middle',
			},
		}),
	],
	rules: [
		['font-heading', { 'font-family': '\'나눔스퀘어라운드\', sans-serif' }],
		['font-sans-serif', { 'font-family': 'Pretendard, sans-serif' }],
		['font-monospace', { 'font-family': 'D2Coding, monospace' }],
	],
});
