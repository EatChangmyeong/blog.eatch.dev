import type { Setter } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { Set } from 'immutable';
import type { TuringMachine } from './turing_machine.js';
import machines from './turing_machine.js';

const
	BATCH = 256,
	BATCH_HEIGHT_STYLE = 'h-1024',
	STATE_STYLE_MAP = [
		'border-[hsl(0deg_100%_50%)]',
		'border-[hsl(72deg_100%_50%)]',
		'border-[hsl(144deg_100%_50%)]',
		'border-[hsl(216deg_100%_50%)]',
		'border-[hsl(288deg_100%_50%)]',
	];

function step<State extends number>(
	machine: TuringMachine<0 | 1, State>,
	tape: Set<number>,
	state: State,
	pos: number
): [Set<number>, State | null, number] {
	const
		cell: 0 | 1 = tape.has(pos) ? 1 : 0,
		[new_cell, dir, new_state] = machine[state][cell];
	return [
		cell == new_cell
			? tape
		: new_cell
			? tape.add(pos)
			: tape.delete(pos),
		new_state,
		pos + (dir ? 1 : -1)
	];
}

function advance<State extends number>(
	machine: TuringMachine<0 | 1, State>,
	tape: Set<number>,
	state: State | null,
	pos: number
): [Set<number>, State | null, number, [State | null, number][], [number, number, number][]] {
	const
		colsAll: [number, number, number][] = [...tape].map(x => [x, 0, 0]),
		colsActive: Map<number, [number, number, number]> = new Map(colsAll.map(x => [x[0], x])),
		trace: [State | null, number][] = [];
	for(let i = 0; i < BATCH; i++) {
		trace.push([state, pos]);
		for(const [, col] of colsActive)
			col[2]++;
		if(state === null)
			break;
		const
			oldCell = tape.has(pos),
			oldPos = pos;
		[tape, state, pos] = step(machine, tape, state, pos);
		const newCell = tape.has(oldPos);
		if(oldCell != newCell)
			if(newCell) {
				const col: [number, number, number] = [oldPos, i + 1, 0];
				colsAll.push(col);
				colsActive.set(oldPos, col);
			} else
				colsActive.delete(oldPos);
	}
	return [tape, state, pos, trace, colsAll.filter(col => col[2] != 0)];
}

function Diagram(props: {
	machine: TuringMachine<0 | 1, 0 | 1 | 2 | 3 | 4>,
	tape: Set<number>,
	state: 0 | 1 | 2 | 3 | 4 | null,
	pos: number,
	callback: (set: Setter<boolean> | null) => void,
}) {
	const
		[newTape, newState, newPos, trace, cols] = advance(props.machine, props.tape, props.state, props.pos),
		renderedSpacetime = cols.map(([x, y, height]) => <div
			class="absolute w-4 bg-#ab94fc"
			style={`left: ${x}rem; top: ${y}rem; height: ${height}rem;`}
		/>),
		renderedTrace = trace.map(([q, x], y) => <div
			class={`box-border absolute w-4 h-4 border-solid border-2px ${q === null ? 'border-#808080' : STATE_STYLE_MAP[q]} z-3`}
			style={`left: ${x}rem; top: ${y}rem;`}
		/>),
		rendered = <div class={`relative w-4 ${BATCH_HEIGHT_STYLE} mx-auto`}>
			{renderedSpacetime}
			{renderedTrace}
		</div>;
	if(newState === null) {
		props.callback(null);
		return rendered;
	}
	const [shouldContinue, setShouldContinue] = createSignal(false);
	props.callback(setShouldContinue);
	return <>
		{rendered}
		<Show when={shouldContinue()}>
			<Diagram
				machine={props.machine}
				tape={newTape} state={newState} pos={newPos}
				callback={props.callback}
			/>
		</Show>
	</>;
}

export default function TuringSpacetime() {
	let
		i = 0,
		tryCollapse = () => {
			if(Math.random() < (i/8)**2) {
				const cls = document.getElementById('turing-machine')!.classList;
				cls.remove('mt-100vh');
				cls.add('mt--4');
				for(const x of document.querySelectorAll('body > :is(div:not(#turing-machine), main)'))
					x.remove();
				tryCollapse = () => {};
			} else
				i++;
		};
	const
		[setter, setSetter] = createSignal<null | Setter<boolean>>(null),
		index = Math.floor(machines.length*Math.random()),
		machine = machines[index],
		observer = new IntersectionObserver(
			arr => {
				if(arr.some(x => x.isIntersecting)) {
					setter()?.(true);
					tryCollapse();
				}
			},
			{ threshold: [0, 1] }
		);
	window.scrollTo({
		top: 0,
		left: 0,
		behavior: 'instant',
	});
	return <>
		<Diagram
			machine={machine}
			tape={Set()} state={0} pos={0}
			callback={set => setSetter(() => set ?? null)}
		/>
		<div
			ref={div => observer.observe(div)}
			class="absolute bottom-0 h-100vh"
		/>
	</>;
}