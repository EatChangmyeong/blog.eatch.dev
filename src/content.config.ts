import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const
	base = z.object({
		title: z.string(),
		order: z.number().optional(),
		edited: z.date().optional(),
		cover: z.string().optional(),
		permalink: z.url().optional(),
		tags: z.string().array().optional(),
		parent: reference('blog').optional(),
		translation: z.object({
			title: z.string(),
			author: z.string(),
			published: z.date().optional(),
			edited: z.date().optional(),
			link: z.url(),
		}).optional(),
		interactive: z.boolean().or(z.literal('desktop')).optional(),
	}),
	additional = z.object({
		published: z.date(),
	}),
	lenientSchema = z.looseObject({
		...base.shape,
		...additional.partial().shape,
	}),
	strictSchema = z.looseObject({
		...base.shape,
		...additional.shape,
	});

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
				return entry.slice(0, -4).split('/')[0];
			},
		}),
		schema: strictSchema,
	}),
};