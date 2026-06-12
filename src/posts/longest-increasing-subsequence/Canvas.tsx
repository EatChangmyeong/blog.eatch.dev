import type { JSXElement } from 'solid-js';
import { createMemo, For, mapArray } from 'solid-js';
import { nanoid } from 'nanoid';

import type { PositionedNode, Tree } from './tree';
import { layoutDense } from './tree';

export type Coord<T> = {
	x: number,
	y: number,
	value: T,
};

export const STROKE_WIDTH = 1/40;

export default function Canvas<T>(props: {
	nodes: Coord<Tree<T>>[],
	width?: number,
	height?: number,
	padding?: number,
	renderNode: (u: PositionedNode<T>) => JSXElement,
	renderEdge: (u: PositionedNode<T>) => JSXElement,
	children?: JSXElement,
}) {
	const positioned = mapArray(() => props.nodes, u => layoutDense(u.value, u.x, u.y));

	const dimension = createMemo(() => {
		let xmin = Infinity, xmax = -Infinity;
		let ymin = Infinity, ymax = -Infinity;
		const us = positioned();
		if(!us.length)
			xmin = xmax = ymin = ymax = 0;
		else
			for(const u of us) {
				xmin = Math.min(xmin, u.x);
				xmax = Math.max(xmax, u.x + u.width);
				ymin = Math.min(ymin, u.y);
				ymax = Math.max(ymax, u.y + u.height);
			}
		return {
			xmin, xmax, ymin, ymax,
			width: props.width ?? xmax - xmin,
			height: props.height ?? ymax - ymin,
		};
	});

	const patternId = nanoid();

	return <div class="block-element [--suppress-overflow:initial]">
		<svg
			width={`${5*(dimension().width + (props.padding ?? 0))}rem`}
			height={`${5*dimension().height}rem`}
			viewBox={`${dimension().xmin - 0.5} ${dimension().ymin - 0.5} ${dimension().width + (props.padding ?? 0)} ${dimension().height}`}
		>
			<defs>
				<pattern
					id={patternId}
					x="-0.5"
					width="2" height="1"
					patternUnits="userSpaceOnUse"
				>
					<rect
						class="fill-[light-dark(#e6e6e6,#363636)]"
						width="1" height="1"
					/>
				</pattern>
			</defs>
			<rect
				x="-0.5" y={dimension().ymin - 0.5} width={dimension().width} height={dimension().height}
				fill={`url(#${patternId})`}
			/>
			{props.children}
			<For each={positioned()}>
				{us => <For each={us.nodes}>
					{u => props.renderEdge(u)}
				</For>}
			</For>
			<For each={positioned()}>
				{us => <For each={us.nodes}>
					{u => props.renderNode(u)}
				</For>}
			</For>
		</svg>
	</div>;
}