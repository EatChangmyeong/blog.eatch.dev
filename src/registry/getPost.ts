import type { MDXInstance } from 'astro';
import { getEntry, render } from 'astro:content';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { PostBase } from '../content.config';

import type { FootnoteOrder } from '~/remark-my-footnote';

const FN_MODULES = import.meta.glob('/src/posts/*/*.fn.mdx', { eager: true });
const TN_MODULES = import.meta.glob('/src/posts/*/*.tn.mdx', { eager: true });
const REF_MODULES = import.meta.glob('/src/posts/*/*.ref.mdx', { eager: true });

function importFn(query: string, type: 'fn' | 'tn' | 'ref', order: FootnoteOrder): Record<string, AstroComponentFactory> {
	const files = type === 'fn'
		? FN_MODULES
	: type === 'tn'
		? TN_MODULES
		: REF_MODULES;
	const map: Record<string, AstroComponentFactory> = {};
	for(const [id] of order) {
		const module = files[`/src/posts/${query}/${id}.${type}.mdx`] as MDXInstance<Record<never, never>> | undefined;
		if(!module)
			throw new ReferenceError(`${query}: ${type}:${id} not found`);
		map[id] = module.Content;
	}
	return map;
}

export type PostEntry = PostBase & {
	Content: AstroComponentFactory,
	minutesRead: number,
	footnotes?: {
		order: [string, number][],
		content: Record<string, AstroComponentFactory>,
	},
	transnotes?: {
		order: [string, number][],
		content: Record<string, AstroComponentFactory>,
	},
	references?: {
		order: [string, number][],
		content: Record<string, AstroComponentFactory>,
	},
};
export async function getPost(query: string): Promise<PostEntry | undefined> {
	const post = await getEntry('blog', query);
	if(!post)
		return post;

	const {
		Content,
		remarkPluginFrontmatter,
	} = await render(post)
	const {
		minutesRead,
		footnotes: footnoteOrder,
		transnotes: transnoteOrder,
		references: referenceOrder,
	} = remarkPluginFrontmatter as {
		minutesRead: number,
		footnotes: FootnoteOrder | undefined,
		transnotes: FootnoteOrder | undefined,
		references: FootnoteOrder | undefined,
	};
	const {
		title,
		published, order, edited,
		cover, permalink, tags, interactive,
		parent,
		translation,
	} = post.data;
	const footnotes = footnoteOrder
		? importFn(query, 'fn', footnoteOrder)
		: undefined;
	const transnotes = transnoteOrder
		? importFn(query, 'tn', transnoteOrder)
		: undefined;
	const references = referenceOrder
		? importFn(query, 'ref', referenceOrder)
		: undefined;

	return {
		id: query,
		title, Content,
		published, order, edited,
		cover, permalink, tags, interactive,
		parent,
		translation,
		minutesRead,
		footnotes: footnotes && {
			order: footnoteOrder!,
			content: footnotes,
		},
		transnotes: transnotes && {
			order: transnoteOrder!,
			content: transnotes,
		},
		references: references && {
			order: referenceOrder!,
			content: references,
		},
	};
}