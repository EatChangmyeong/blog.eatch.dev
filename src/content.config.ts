import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const
	base = z.object({
		title: z.string(),
		edited: z.date().optional(),
		cover: z.string().optional(),
		permalink: z.string().url().optional(),
		tags: z.string().array().optional(),
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
			base: './src/posts',
			pattern: './**/*.mdx',
		}),
		schema: strictSchema,
	}),
};