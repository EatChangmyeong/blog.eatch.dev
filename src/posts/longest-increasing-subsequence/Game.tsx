import Canvas, { STROKE_WIDTH } from './Canvas';
import { batch, createMemo, createSignal, Show } from 'solid-js';

import type { Tree } from './tree';
import { newSeed, randomSeq } from './random';

type GameNode = {
	value: number | null,
	push: (value: number) => void,
};

function lisLength(xs: number[]): number {
	const dp = [];
	for(const x of xs) {
		let begin = 0, end = dp.length;
		while(begin < end) {
			const mid = Math.floor((begin + end)/2);
			if(dp[mid] < x)
				begin = mid + 1;
			else
				end = mid;
		}
		dp[begin] = x;
	}
	return dp.length;
}
function treeDepth<T>(u: Tree<T>): number {
	let depth = 0;
	for(const v of u.children)
		depth = Math.max(depth, treeDepth(v));
	return depth + 1;
}

export default function Game() {
	function pushCallback(ix: number[]): (value: number) => void {
		function produce(u: Tree<GameNode>, value: number): Tree<GameNode> {
			const root = { ...u };
			let v = root;
			for(const i of ix) {
				v.children = [...v.children];
				v = v.children[i] = { ...v.children[i] };
			}
			v.children = [
				...v.children,
				{
					value: {
						value,
						push: pushCallback([...ix, v.children.length]),
					},
					children: [],
				},
			];
			return root;
		}
		return value => {
			let hist_ = history().slice(0);
			const tree_ = tree();
			const turn_ = turn();
			if(turn_ + 1 < hist_.length)
				hist_.length = turn_ + 1;
			hist_.push(produce(tree_, value));
			batch(() => {
				setHistory(hist_);
				setTurn(turn_ + 1);
			});
		};
	}
	function startOver() {
		setTurn(0);
		setFinished(false);
	}
	function newGame() {
		setSeed(newSeed());
		setTurn(0);
		setFinished(false);
		setHistory([INITIAL_TREE]);
	}
	function undo() {
		setTurn(t => Math.max(t - 1, 0));
		setFinished(false);
	}
	function redo() {
		setTurn(t => Math.min(t + 1, history().length));
	}
	function finish() {
		if(turn() == seq().length)
			setFinished(true);
	}

	const [seed, setSeed] = createSignal(newSeed());
	let seqLenInput!: HTMLInputElement;
	let maxValueInput!: HTMLInputElement;
	const [seqLen, setSeqLen] = createSignal(20);
	const [maxValue, setMaxValue] = createSignal(999);
	const seq = createMemo(() =>
		randomSeq([{ min: 0, max: maxValue(), count: seqLen() }], seed())
	);
	const lis = createMemo(() => lisLength(seq()));
	const [turn, setTurn] = createSignal(0);
	const nextNode = createMemo<number | undefined>(() => seq()[turn()]);

	const INITIAL_TREE = {
		value: {
			value: null,
			push: pushCallback([]),
		},
		children: [],
	};
	const [history, setHistory] = createSignal<Tree<GameNode>[]>([INITIAL_TREE]);
	const tree = createMemo(() => history()[turn()]);
	const score = createMemo(() => treeDepth(tree()) - 1);
	const [finished, setFinished] = createSignal(false);
	const blueNode = createMemo(() => finished()
		? score() == lis()
		: turn() != seq().length
	);

	return <>
		<Canvas
			nodes={[{ x: 0, y: 0, value: tree() }]}
			renderNode={u =>
				<g transform={`translate(${u.x}, ${u.y})`}>
					<circle
						class="fill-bg"
						r="0.3"
					/>
					<circle
						classList={{
							'fill-transparent': true,
							'hover:not-active:fill-fg/10': (() => {
								const next = nextNode();
								return next !== undefined && (u.value.value ?? -Infinity) < next;
							})(),
							'stroke-fg': true,
							'transition-decoration': true,
						}}
						r="0.3"
						stroke-width={STROKE_WIDTH}
						on:click={() => {
							const next = nextNode();
							if(next !== undefined && (u.value.value ?? -Infinity) < next)
								u.value.push(next);
						}}
					/>
					<text
						class="fill-fg [font:0.2px_var(--font-code)] pointer-events-none"
						y="0.08"
						text-anchor="middle"
					>
						{u.value.value ?? '-∞'}
					</text>
				</g>
			}
			renderEdge={u => <Show when={u.parent}>
				{parent =>
					<line
						class="stroke-fg"
						x1={u.x} y1={u.y}
						x2={parent().x} y2={parent().y}
						stroke-width={STROKE_WIDTH}
					/>
				}
			</Show>}
		/>
		<div class="flex flex-col sm:flex-row justify-center items-center gap-2 text-center">
			<button class="order-1" on:click={startOver}>초기화</button>
			<button
				class="order-1"
				disabled={finished() || turn() == 0} on:click={undo}
			>
				실행 취소
			</button>
			<div class="order-0 sm:order-2">
				<p class="m-0 mb-1 text-sm opacity-75">
					<Show when={finished()}
						fallback={<>
							{Math.min(turn() + 1, seq().length)}/{seq().length}턴
						</>}
					>
						{score()}/{lis()}점
					</Show>
				</p>
				<svg width="3.2rem" height="3.2rem" viewBox="-0.32 -0.32 0.64 0.64">
					<circle
						classList={{
							'fill-[light-dark(#9ff,#266)]': blueNode(),
							'fill-bg': !blueNode(),
							'stroke-fg': true,
						}}
						r="0.3"
						stroke-width={STROKE_WIDTH}
					/>
					<text
						class="fill-fg [font:0.2px_var(--font-code)] pointer-events-none"
						y="0.08"
						text-anchor="middle"
					>
						{finished()
							? score() == lis()
								? '🎉'
								: '😅'
						: turn() != seq().length
							? (nextNode() ?? '-∞')
							: ''
						}
					</text>
				</svg>
			</div>
			<button
				class="order-3"
				disabled={finished() || turn() + 1 == history().length} on:click={redo}
			>
				다시 실행
			</button>
			<button
				classList={{
					'bg-[light-dark(#9ff,#266)]': turn() == seq().length && !finished(),
					'order-3': true,
				}}
				disabled={finished() || turn() != seq().length}
				on:click={finish}
			>
				완료
			</button>
		</div>
		<p>
			<button on:click={() => {
				if(seqLenInput.validity.valid && maxValueInput.validity.valid)
					batch(() => {
						setSeqLen(seqLenInput.valueAsNumber);
						setMaxValue(maxValueInput.valueAsNumber);
						newGame();
					});
			}}>
				새 게임
			</button>{' '}
			(
				<label>
					길이 <input ref={seqLenInput}
						type="number" required value={seqLen()} min="2"
					/>
				</label>,{' '}
				<label>
					0~<input ref={maxValueInput}
						type="number" required value={maxValue()} min="1" max="9999"
					/>
				</label>
			)
			<Show when={finished()}>
				{' '}(🎲 <code class="select-all">
					{seqLen()}*0~{maxValue()}@{seed()}
				</code>)
			</Show>
		</p>
	</>;
}