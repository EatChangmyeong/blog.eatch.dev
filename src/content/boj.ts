import type { MDXInstance } from 'astro';
import type { AstroComponentFactory } from 'astro/runtime/server/render/astro/factory.js';
import { isAstroComponentFactory } from 'astro/runtime/server/render/astro/factory.js';
import { z } from 'astro/zod';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { glob } from 'tinyglobby';

const MANIFESTS = import.meta.glob(['/src/problems/*/main.ts', '/src/problems/*.ts'], { eager: true }) as Record<string, { default: unknown }>;;
const FRAGMENTS = import.meta.glob('/src/problems/*/*.mdx', { eager: true }) as Record<string, MDXInstance<Record<never, never>> | undefined>;
async function globWithContent(pattern: string): Promise<Record<string, string>> {
	const result: Record<string, string> = {};
	for(const fname of await glob(pattern, {
		cwd: resolve('src/problems'),
		expandDirectories: false,
	}))
		result[`/src/problems/${fname}`] = await readFile(`src/problems/${fname}`, { encoding: 'utf-8' })
	return result;
}
const EG_IN = await globWithContent('*/*.in.txt');
const EG_OUT = await globWithContent('*/*.out.txt');

const Component = z.custom<AstroComponentFactory>(x => isAstroComponentFactory(x));
const Content = z.union([
	z.string(),
	Component,
]);

const SchemaBase = z.object({
	author: z.string().optional(),
	original: z.string(),
	korean: z.string().optional(),
});
const SchemaStatementPlaceholder = z.object({
	title: z.string(),
	language: z.string(),
});
const SchemaStatementBase = z.object({
	translator: z.string().optional(),
	desc: z.string(),
	title: Content,
	language: z.string(),
});
const SchemaStatementFragment = z.object({
	statement: Component,
	input: Component.optional(),
	output: Component.optional(),
	bounds: Component.optional(),
	clarification: z.array(Component.optional()),
	hint: Component.optional(),
	note: Component.optional(),
});
const SchemaStatement = z.intersection(
	SchemaStatementBase,
	SchemaStatementFragment
);
const SchemaManifest = z.object({
	...SchemaBase.shape,
	statement: z.record(
		z.string(),
		z.union([SchemaStatementBase, SchemaStatementPlaceholder])
	),
});
const Schema = z.object({
	...SchemaBase.shape,
	dataset: z.array(z.tuple([z.string(), z.string()])),
	title: z.tuple([Content, Content.optional()]),
	statement: z.record(z.string(), SchemaStatement),
});
export type Manifest = z.infer<typeof SchemaManifest>;
export type Statement = z.infer<typeof SchemaStatement>;
export type Problem = z.infer<typeof Schema>;

export function getProblem(id: number): Problem | undefined {
	const rawManifest =
		MANIFESTS[`/src/problems/${id}/main.ts`]?.default ??
		MANIFESTS[`/src/problems/${id}.ts`]?.default;
	if(rawManifest === undefined)
		return;
	const manifest = SchemaManifest.parse(rawManifest);

	function getTitle(lang: string): string | AstroComponentFactory {
		return FRAGMENTS[`/src/problems/${id}/title.${lang}.mdx`]?.Content ?? manifest.statement[lang].title;
	}

	const dataset: [string, string][] = [];
	for(let i = 1;; i++) {
		const inf = EG_IN[`/src/problems/${id}/${i}.in.txt`];
		const ouf = EG_OUT[`/src/problems/${id}/${i}.out.txt`];
		if(inf === undefined || ouf === undefined)
			break;
		dataset.push([inf, ouf]);
	}

	const statement: Record<string, Statement> = {};
	for(const lang in manifest.statement) {
		const stmt = FRAGMENTS[`/src/problems/${id}/statement.${lang}.mdx`];
		if(!('desc' in manifest.statement[lang]) || !stmt)
			continue;
		statement[lang] = {
			...manifest.statement[lang],
			title: FRAGMENTS[`/src/problems/${id}/title.${lang}.mdx`]?.Content ?? manifest.statement[lang].title,
			statement: stmt.Content,
			input: FRAGMENTS[`/src/problems/${id}/input.${lang}.mdx`]?.Content,
			output: FRAGMENTS[`/src/problems/${id}/output.${lang}.mdx`]?.Content,
			bounds: FRAGMENTS[`/src/problems/${id}/bounds.${lang}.mdx`]?.Content,
			clarification: dataset.map((_, i) => FRAGMENTS[`/src/problems/${id}/${i + 1}.${lang}.mdx`]?.Content),
			hint: FRAGMENTS[`/src/problems/${id}/hint.${lang}.mdx`]?.Content,
			note: FRAGMENTS[`/src/problems/${id}/note.${lang}.mdx`]?.Content,
		};
	}

	return {
		author: manifest.author,
		original: manifest.original,
		korean: manifest.korean,
		title: manifest.korean === undefined || manifest.korean === manifest.original
			? [getTitle(manifest.original), undefined]
			: [getTitle(manifest.korean), getTitle(manifest.original)],
		dataset,
		statement,
	};
}