import type { APIRoute, GetStaticPaths } from 'astro';
import { glob } from 'tinyglobby';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { getCollection } from 'astro:content';

export const getStaticPaths = (async () => {
	const yearMapping = new Map((await getCollection('blog')).map(post => [post.id, post.data.published.getFullYear()]));
	const files = await glob(
		'*/attach/*',
		{
			cwd: resolve('src/posts'),
			expandDirectories: false,
		}
	);
	return files.map(path => {
		const [slug,, fname] = path.split('/');
		const year = yearMapping.get(slug);
		return year === undefined
			? undefined
			: { params: { year, slug, fname } };
	}).filter(item => item !== undefined);
}) satisfies GetStaticPaths;

export const GET = (async ({ params: { year, slug, fname } }) => {
	const file = await readFile(resolve('src/posts', slug!, 'attach', fname!));
	return file
		? new Response(new Uint8Array(file))
		: new Response(null, { status: 404 });
}) satisfies APIRoute;