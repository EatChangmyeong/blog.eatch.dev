// @ts-check
import { defineConfig } from 'astro/config';

import solid from '@astrojs/solid-js';
import mdx from '@astrojs/mdx';
import unocss from 'unocss/astro';
import remarkCustomHeaderId from 'remark-custom-header-id';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkMyFootnote from './remark-my-footnote.js';
import remarkMyReadingTime from './remark-my-reading-time.js';
import rehypeMathJaxSvg from 'rehype-mathjax/svg';


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
            rehypePlugins: [
                rehypeMathJaxSvg,
            ],
		}),
        unocss(),
        solid(),
    ],
});