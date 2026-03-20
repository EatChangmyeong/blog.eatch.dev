import type { JSXElement } from 'solid-js';
import Table from '~/src/components/post/Table';

function Number(props: {
	children: JSXElement,
}) {
	return <>
		<span class="text-sm opacity-75">#</span>{props.children}
	</>;
}

export function DFA(props: {
	data: {
		id: number,
		'0': number,
		'1': number,
		accept?: boolean,
	}[],
}) {
	return <Table
		cols={[
			{
				thead() {
					return ['상태 번호'];
				},
				th: true,
				render(x) {
					return [<Number>{x.id}</Number>];
				},
				align: 'right',
			},
			{
				thead() {
					return [<code>0</code>];
				},
				render(x) {
					return x['0']
						? [<>→ <Number>{x['0']}</Number></>]
						: ['❌'];
				},
				align: 'center',
			},
			{
				thead() {
					return [<code>1</code>];
				},
				render(x) {
					return x['1']
						? [<>→ <Number>{x['1']}</Number></>]
						: ['❌'];
				},
				align: 'center',
			},
			{
				thead() {
					return ['수용 상태?'];
				},
				render(x) {
					return [x.accept && '✅'];
				},
				align: 'center',
			},
		]}
	>
		{props.data}
	</Table>;
}