import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { AstroVNode } from 'astro/jsx-runtime';
import type { PostBase } from '../content.config';
import { getEntry, render } from 'astro:content';

import type { MDXInstance } from 'astro';
import type { Post as PostFrontmatter } from '~/src/content.config.js';

export type PostEntry = PostBase & {
	Content: AstroComponentFactory,
	minutesRead: number,
	footnotes?: {
		order: [string, number][],
		content: Record<string, (() => AstroVNode) | string>,
	},
	transnotes?: {
		order: [string, number][],
		content: Record<string, (() => AstroVNode) | string>,
	},
	references?: {
		order: [string, number][],
		content: Record<string, (() => AstroVNode) | string>,
	},
};
export async function getPost(query: string): Promise<PostEntry | undefined> {
	const post = await getEntry('blog', query);
	if(!post)
		return post;
	const
		{
			Content,
			remarkPluginFrontmatter: {
				minutesRead,
				footnotes: footnoteOrder,
				transnotes: transnoteOrder,
				references: referenceOrder,
			},
		} = await render(post),
		{ slug, title, published, edited, cover, permalink, tags } = post.data,
		{ footnotes, transnotes, references } = import.meta.glob(
			'~/src/posts/**/*.mdx',
			{ eager: true }
		)[`/${post.filePath}`] as MDXInstance<PostFrontmatter> & {
			footnotes?: Record<string, (() => AstroVNode) | string>,
			transnotes?: Record<string, (() => AstroVNode) | string>,
			references?: Record<string, (() => AstroVNode) | string>,
		};
	return {
		slug,
		Content,
		title,
		published,
		edited,
		cover,
		permalink,
		tags,
		minutesRead,
		footnotes: footnotes && {
			order: footnoteOrder,
			content: footnotes,
		},
		transnotes: transnotes && {
			order: transnoteOrder,
			content: transnotes,
		},
		references: references && {
			order: referenceOrder,
			content: references,
		},
	};
}