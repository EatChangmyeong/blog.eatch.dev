import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const
	base = z.object({
		title: z.string(),
		order: z.number().optional(),
		edited: z.date().optional(),
		cover: z.string().optional(),
		permalink: z.string().url().optional(),
		tags: z.string().array().optional(),
		parent: reference('blog').optional(),
		translation: z.object({
			title: z.string(),
			author: z.string(),
			published: z.date().optional(),
			edited: z.date().optional(),
			link: z.string().url(),
		}).optional(),
		interactive: z.boolean().or(z.literal('desktop')).optional(),
	}),
	additional = z.object({
		slug: z.string(),
		published: z.date(),
	}),
	lenientSchema = base.merge(additional.partial()).passthrough(),
	strictSchema = base.merge(additional).passthrough();

export type PostBase = z.infer<typeof lenientSchema>;
export type Post = z.infer<typeof strictSchema>;

export const collections = {
	blog: defineCollection({
		loader: glob({
			base: 'src/posts',
			pattern: [
				'*/main.mdx',
				'*.mdx',
			],
			generateId({ entry }) {
				const split = entry.slice(0, -4).split('/')[0];
				return split.split('-').slice(1).join('-');
			},
		}),
		schema: strictSchema,
	}),
};