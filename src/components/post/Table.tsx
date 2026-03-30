import type { JSXElement } from 'solid-js';
import { createMemo, For, mapArray, Show } from 'solid-js';

type Align = 'left' | 'center' | 'right';
type ClassedElement = [JSXElement] | [JSXElement, string];
type ColObject<T> = {
	th?: boolean,
	sort?: (lhs: T, rhs: T) => number,
	thead?: (xs: T[]) => ClassedElement,
	render: (x: T) => ClassedElement,
	tfoot?: (xs: T[]) => ClassedElement,
	align?: Align,
};
type Col<T> = ((x: T) => ClassedElement) | ColObject<T>;
type Props<T> = {
	caption?: ClassedElement,
	class?: string,
	cols: Col<T>[],
	children: T[],
};

function Cell(props: {
	th?: boolean,
	class?: string,
	align?: Align,
	children: JSXElement,
}) {
	const cls = createMemo(() => {
		switch(props.align) {
			case 'left':
			default:
			return 'text-left';
			case 'center':
			return 'text-center';
			case 'right':
			return 'text-right';
		}
	})
	return <Show
		when={props.th}
		fallback={<td class={cls()}>{props.children}</td>}
	>
		<th class={`${cls()} ${props.class}`}>{props.children}</th>
	</Show>
}

export default function Table<T>(props: Props<T>) {
	const cols = mapArray(
		() => props.cols,
		col => typeof col == 'function'
			? { render: col }
			: col
	);
	// TODO: implement sorting
	const sorted = createMemo(() => props.children);
	const thead = mapArray(
		cols,
		col => (): [JSXElement, string | undefined] | undefined => {
			const [children, cls] = typeof col?.thead == 'function'
				? col.thead(sorted())
				: [];
			return children === undefined && cls === undefined
				? undefined
				: [children, cls];
		}
	);
	const tfoot = mapArray(
		cols,
		col => (): [JSXElement, string | undefined] | undefined => {
			const [children, cls] = typeof col?.tfoot == 'function'
				? col.tfoot(sorted())
				: [];
			return children === undefined && cls === undefined
				? undefined
				: [children, cls];
		}
	);

	return <table class={props.class}>
		<Show when={props.caption}>
			{caption => {
				const [children, cls] = caption();
				return <caption class={cls}>
					{children}
				</caption>;
			}}
		</Show>
		<Show when={thead().some(x => x() !== undefined)}>
			<thead>
				<tr>
					<For each={thead()}>
						{th => {
							const [children, cls] = th() ?? [];
							return <th class={cls}>{children}</th>;
						}}
					</For>
				</tr>
			</thead>
		</Show>
		<tbody>
			<For each={sorted()}>
				{x =>
					<tr>
						<For each={cols()}>
							{col => {
								const [children, cls] = col.render(x);
								return <Cell
									th={col.th}
									class={cls}
									align={col.align}
								>
									{children}
								</Cell>;
							}}
						</For>
					</tr>
				}
			</For>
		</tbody>
		<Show when={tfoot().some(x => x() !== undefined)}>
			<tfoot>
				<tr>
					<For each={tfoot()}>
						{th => {
							const [children, cls] = th() ?? [];
							return <th class={cls}>{children}</th>;
						}}
					</For>
				</tr>
			</tfoot>
		</Show>
	</table>;
}