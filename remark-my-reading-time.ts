// https://docs.astro.build/en/recipes/reading-time/

import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import readingTime from 'reading-time';
import { filter } from 'unist-util-filter';
import { toString } from 'mdast-util-to-string';

export default function() {
	return function(tree: Root, { data }: VFile) {
		const { minutes } = readingTime(
			toString(filter(tree, node => node.type != 'mdxJsEsm')),
			{
				// TODO: find a reasonable WPM value
				wordsPerMinute: 500,
			}
		);
		data.astro!.frontmatter!.minutesRead = minutes;
	};
}