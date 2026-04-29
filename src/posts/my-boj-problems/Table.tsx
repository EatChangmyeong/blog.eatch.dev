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
				thead: () => <>상태 번호</>,
				th: true,
				render: x => <Number>{x.id}</Number>,
				align: 'right',
			},
			{
				thead: () => <code>0</code>,
				render: x => <>
					{x['0']
						? <>→ <Number>{x['0']}</Number></>
						: '❌'
					}
				</>,
				align: 'center',
			},
			{
				thead: () => <code>1</code>,
				render: x => <>
					{x['1']
						? <>→ <Number>{x['1']}</Number></>
						: '❌'
					}
				</>,
				align: 'center',
			},
			{
				thead: () => <>수용 상태?</>,
				render: x => <>
					{x.accept && '✅'}
				</>,
				align: 'center',
			},
		]}
	>
		{props.data}
	</Table>;
}