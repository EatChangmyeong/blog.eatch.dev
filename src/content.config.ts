import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { Schema as PostSchema } from './content/post';

export const collections = {
	post: defineCollection({
		loader: glob({
			base: 'src/posts',
			pattern: [
				'*/main.mdx',
				'*.mdx',
			],
			generateId({ entry }) {
				return entry.slice(0, -4).split('/')[0];
			},
		}),
		schema: PostSchema,
	}),
};