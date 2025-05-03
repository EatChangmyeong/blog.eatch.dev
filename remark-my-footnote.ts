// https://docs.astro.build/en/recipes/reading-time/

import type { Root, PhrasingContent } from 'mdast';
import type { VFile } from 'vfile';
import type { MdxJsxAttribute } from 'mdast-util-mdx-jsx';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';

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
						const id = props.find((x): x is MdxJsxAttribute => x.type == 'mdxJsxAttribute' && x.name == 'id')?.value;
						if(!id)
							throw new Error('remark-my-footnote: missing `id` prop for `Fn`');
						if(typeof id != 'string' || !id)
							throw new Error('remark-my-footnote: `id` for `Fn` is not a string');
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
						const id = props.find((x): x is MdxJsxAttribute => x.type == 'mdxJsxAttribute' && x.name == 'id')?.value;
						if(!id)
							throw new Error('remark-my-footnote: missing `id` prop for `Tn`');
						if(typeof id != 'string' || !id)
							throw new Error('remark-my-footnote: `id` for `Tn` is not a string');
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
						const id = props.find((x): x is MdxJsxAttribute => x.type == 'mdxJsxAttribute' && x.name == 'id')?.value;
						if(!id)
							throw new Error('remark-my-footnote: missing `id` prop for `Ref`');
						if(typeof id != 'string' || !id)
							throw new Error('remark-my-footnote: `id` for `Ref` is not a string');
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
				.map(([id, { refs }]) => [id, refs]);
		if(transnotes.size)
			data.astro!.frontmatter!.transnotes = [...transnotes]
				.map(([id, { refs }]) => [id, refs]);
		if(references.size)
			data.astro!.frontmatter!.references = [...references]
				.map(([id, { refs }]) => [id, refs]);
	};
}