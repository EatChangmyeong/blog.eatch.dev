import type { JSXElement } from 'solid-js';
import { children, createEffect, createMemo, For, mapArray } from 'solid-js';

type Align = 'left' | 'center' | 'right';
type ColObject<T> = {
	th?: boolean,
	sort?: (lhs: T, rhs: T) => number,
	thead?: (xs: T[]) => JSXElement,
	render: (x: T) => JSXElement,
	tfoot?: (xs: T[]) => JSXElement,
	align?: Align,
};
type Col<T> = ((x: T) => JSXElement) | ColObject<T>;
type Props<T> = {
	caption?: JSXElement,
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
	return <>
		{props.th
			? <th class={`${cls()} ${props.class}`}>{props.children}</th>
			: <td class={cls()}>{props.children}</td>
		}
	</>;
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
		col => children(() => col.thead?.(sorted()))
	);
	const tfoot = mapArray(
		cols,
		col => children(() => col.tfoot?.(sorted()))
	);
	// 이 두 줄을 인라인으로 돌리면 하이드레이션이 깨짐. 왜?
	const theadVisible = createMemo(() => thead().some(th => th() !== undefined));
	const tfootVisible = createMemo(() => tfoot().some(th => th() !== undefined));

	return <table class={props.class}>
		{props.caption &&
			<caption>
				{props.caption}
			</caption>
		}
		{theadVisible() &&
			<thead>
				<tr>
					<For each={thead()}>
						{th => <th>{th()}</th>}
					</For>
				</tr>
			</thead>
		}
		<tbody>
			<For each={sorted()}>
				{x =>
					<tr>
						<For each={cols()}>
							{col => <Cell
								th={col.th}
								align={col.align}
							>
								{col.render(x)}
							</Cell>}
						</For>
					</tr>
				}
			</For>
		</tbody>
		{tfootVisible() &&
			<tfoot>
				<tr>
					<For each={tfoot()}>
						{th => <th>{th()}</th>}
					</For>
				</tr>
			</tfoot>
		}
	</table>;
}