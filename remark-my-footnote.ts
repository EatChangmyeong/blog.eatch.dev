import { z } from 'zod';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import type {} from 'mdast-util-mdx-jsx';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';

export type FootnoteOrder = [string, number][];

const attributeSchema = z.looseObject({
	type: z.literal('mdxJsxAttribute'),
	name: z.literal('id'),
});
const schema = z.array(attributeSchema.optional().catch(undefined))
	.transform(xs => xs.filter(x => x !== undefined))
	.pipe(z.tuple([attributeSchema.extend({ value: z.string() })]))
	.transform(([{ value }]) => value);

export default function() {
	return function(tree: Root, { data }: VFile) {
		const
			footnotes = new Map<string, { index: number, refs: number }>(),
			transnotes = new Map<string, { index: number, refs: number }>(),
			references = new Map<string, { index: number, refs: number }>();
		visit(
			tree,
			'mdxJsxTextElement',
			node => {
				const { name, attributes: props } = node;
				switch(name) {
					case 'Fn': {
						const id = schema.parse(props);
						if(!footnotes.has(id))
							footnotes.set(id, {
								index: footnotes.size + 1,
								refs: 0,
							});
						const fn = footnotes.get(id)!;
						props.push(
							u(
								'mdxJsxAttribute',
								{ name: '__index__' },
								`${fn.index}`
							),
							u(
								'mdxJsxAttribute',
								{ name: '__xref__' },
								`${++fn.refs}`
							)
						);
					} break;
					case 'Tn': {
						const id = schema.parse(props);
						if(!transnotes.has(id))
							transnotes.set(id, {
								index: transnotes.size + 1,
								refs: 0,
							});
						const fn = transnotes.get(id)!;
						props.push(
							u(
								'mdxJsxAttribute',
								{ name: '__index__' },
								`${fn.index}`
							),
							u(
								'mdxJsxAttribute',
								{ name: '__xref__' },
								`${++fn.refs}`
							)
						);
					} break;
					case 'Ref': {
						const id = schema.parse(props);
						if(!references.has(id))
							references.set(id, {
								index: references.size + 1,
								refs: 0,
							});
						const ref = references.get(id)!;
						props.push(u(
							'mdxJsxAttribute',
							{ name: '__xref__' },
							`${++ref.refs}`
						));
					} break;
				}
			}
		);
		if(footnotes.size)
			data.astro!.frontmatter!.footnotes = [...footnotes]
				.map(([id, { refs }]) => [id, refs]) satisfies FootnoteOrder;
		if(transnotes.size)
			data.astro!.frontmatter!.transnotes = [...transnotes]
				.map(([id, { refs }]) => [id, refs]) satisfies FootnoteOrder;
		if(references.size)
			data.astro!.frontmatter!.references = [...references]
				.map(([id, { refs }]) => [id, refs]) satisfies FootnoteOrder;
	};
}