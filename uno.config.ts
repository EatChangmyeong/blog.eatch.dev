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
	theme: {
		animation: {
			keyframes: {
				blink: '{0% { visibility: visible; } 50% { visibility: hidden; }}',
			},
			durations: {
				blink: '1s',
			},
			timingFns: {
				blink: 'step-end',
			},
			counts: {
				blink: 'infinite',
			},
		},
		fontFamily: {
			'heading': ['나눔스퀘어라운드', 'sans-seif'],
			'sans-seif': ['Pretendard', 'sans-serif'],
			'monospace': ['D2Coding', 'monospace'],
		},
	},
});
