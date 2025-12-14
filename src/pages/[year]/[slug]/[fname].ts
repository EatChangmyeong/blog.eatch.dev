import type { APIRoute, GetStaticPaths } from 'astro';
import { glob } from 'tinyglobby';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

export const getStaticPaths = (async () => {
	const files = await glob(
		'*/attach/*',
		{
			cwd: resolve('src/posts'),
			expandDirectories: false,
		}
	);
	return files.map(path => {
		const [yearSlug,, fname] = path.split('/');
		const [year, ...slug] = yearSlug.split('-');
		return {
			params: {
				year,
				slug: slug.join('-'),
				fname,
			},
		};
	});
}) satisfies GetStaticPaths;

export const GET = (async ({ params: { year, slug, fname } }) => {
	const file = await readFile(resolve('src/posts', `${year!}-${slug!}`, 'attach', fname!));
	return file
		? new Response(new Uint8Array(file))
		: new Response(null, { status: 404 });
}) satisfies APIRoute;