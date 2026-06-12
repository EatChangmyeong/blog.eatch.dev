import Canvas, { STROKE_WIDTH } from './Canvas';
import type { Accessor, JSX } from 'solid-js';
import {
	batch,
	createContext, createEffect, createMemo, createSignal,
	Show, Switch, Match,
	onCleanup, onMount,
	useContext
} from 'solid-js';
import { nanoid } from 'nanoid';

import type { Tree } from './tree';
import { layoutDense } from './tree';
import type { SeqPattern } from './random';
import { newSeed, parsePattern, randomSeq } from './random';

const ANIMATION_DURATION = '0.2s';

enum Step {
	Step,
	Loop,
	Finish,
}

type VisNode = {
	value: number | null,
	highlight: boolean,
	animation?: {
		visible?: false,
		edgeVisible?: false,
		highlight?: boolean,
		coord?: {
			x: number,
			y: number,
		},
	},
};

type Snapshot = {
	tree: Tree<VisNode>,
	step: Step,
	next?: number,
	bisect?: {
		from: number,
		to: number,
		at?: number,
	},
};

function lisRun(xs: number[]): Snapshot[] {
	function produce(u: Tree<VisNode>, path: number[], f: (u: Tree<VisNode>) => Tree<VisNode>): Tree<VisNode> {
		if(!path.length)
			return f(u);
		const v = { ...u };
		let t = v.children = [...v.children];
		t[path[0]] = { ...t[path[0]] };
		for(let i = 1; i < path.length; i++) {
			t = t[path[i - 1]].children = [...t[path[i - 1]].children];
			t[path[i]] = { ...t[path[i]] };
		}
		t[path[path.length - 1]] = f(t[path[path.length - 1]]);
		return v;
	}
	function stopAnimation(u: Tree<VisNode>): Tree<VisNode> {
		const { animation: _, ...value } = u.value;
		return { ...u, value };
	}

	let tree: Tree<VisNode> = {
		value: {
			value: null,
			highlight: false,
		},
		children: [],
	};
	const memo: {
		value: number,
		path: number[],
	}[] = [];
	const frames: Snapshot[] = [{ tree, step: Step.Loop }];
	for(const next of xs) {
		let bisect: { from: number, to: number, at?: number } = {
			from: 0,
			to: memo.length,
		};
		frames.push({ tree, next, bisect, step: Step.Step });
		while(bisect.from < bisect.to) {
			bisect = {
				...bisect,
				at: Math.floor((bisect.from + bisect.to)/2),
			};
			frames.push({ tree, next, bisect, step: Step.Step });
			bisect = memo[bisect.at!].value < next
				? {
					from: bisect.at! + 1,
					to: bisect.to,
				}
				: {
					from: bisect.from,
					to: bisect.at!,
				}
			frames.push({ tree, next, bisect, step: Step.Step });
		}
		const index = bisect.from;
		const path = index
			? memo[index - 1].path
			: [];
		const oldHighlight = index < memo.length
			? memo[index].path
			: undefined;
		if(oldHighlight)
			tree = produce(tree, oldHighlight, u => ({
				...u,
				value: {
					...u.value,
					highlight: false,
					animation: {
						highlight: true,
					},
				},
			}));
		tree = produce(tree, path, u => {
			memo[index] = {
				value: next,
				path: [...path, u.children.length],
			};
			return {
				...u,
				children: [
					...u.children,
					{
						value: {
							value: next,
							highlight: true,
							animation: {
								edgeVisible: false,
								highlight: false,
								coord: { x: 0, y: 1 },
							},
						},
						children: [],
					},
				],
			};
		});
		frames.push({ tree, step: Step.Loop });
		if(oldHighlight)
			tree = produce(tree, oldHighlight, stopAnimation);
		tree = produce(tree, memo[index].path, stopAnimation);
	}
	return frames;
}

const AnimateContext = createContext<Accessor<boolean>>(() => false);

function Animate(props: Omit<JSX.AnimateSVGAttributes<SVGAnimateElement>, 'begin'>) {
	const enabled = useContext(AnimateContext);
	const key = createMemo(() => {
		JSON.stringify(props); // track every prop... but does it really work
		return enabled() ? {} : null;
	})
	return <Show when={key()} keyed>
		{_ => {
			let el!: SVGAnimateElement;
			onMount(() => el.beginElement());
			return <animate ref={el} {...props} begin="indefinite" />;
		}}
	</Show>;
}
function AnimateTransform(props: Omit<JSX.AnimateTransformSVGAttributes<SVGAnimateTransformElement>, 'begin'>) {
	const enabled = useContext(AnimateContext);
	const key = createMemo(() => {
		JSON.stringify(props); // track every prop... but does it really work
		return enabled() ? {} : null;
	})
	return <Show when={key()} keyed>
		{_ => {
			let el!: SVGAnimateTransformElement;
			onMount(() => el.beginElement());
			return <animateTransform ref={el} {...props} begin="indefinite" />;
		}}
	</Show>;
}

function RectArea(props: {
	curr: { from: number, to: number } | undefined,
	prev: { from: number, to: number } | undefined,
	height: number,
	padding: number,
	fill: string,
}) {
	const enabled = useContext(AnimateContext);

	return <Switch>
		<Match when={props.curr}>
			{curr =>
				<rect
					x={curr().from + 0.5 - props.padding} y="-0.5"
					width={curr().to - curr().from + 2*props.padding}
					height={props.height}
					rx="0.1"
					fill={props.fill}
				>
					<Show when={props.prev}
						fallback={
							<Animate
								attributeName="opacity"
								dur={ANIMATION_DURATION}
								from="0" to="1"
								fill="freeze"
								repeatCount={1}
							/>
						}
					>
						{prev => <>
							<Animate
								attributeName="x"
								dur={ANIMATION_DURATION}
								values={`${prev().from + 0.5 - props.padding}; ${curr().from + 0.5 - props.padding}`}
								calcMode="spline"
								keySplines={`${1/3} ${2/3} ${2/3} 1`}
								keyTimes="0; 1"
								fill="freeze"
								repeatCount={1}
							/>
							<Animate
								attributeName="width"
								dur={ANIMATION_DURATION}
								values={`${prev().to - prev().from + 2*props.padding}; ${curr().to - curr().from + 2*props.padding}`}
								calcMode="spline"
								keySplines={`${1/3} ${2/3} ${2/3} 1`}
								keyTimes="0; 1"
								fill="freeze"
								repeatCount={1}
							/>
						</>}
					</Show>
				</rect>
			}
		</Match>
		<Match when={enabled() && props.prev}>
			{prev =>
				<rect
					x={prev().from + 0.5 - props.padding} y="-0.5"
					width={prev().to - prev().from + 2*props.padding}
					height={props.height}
					rx="0.1"
					fill={props.fill}
				>
					<Animate
						attributeName="opacity"
						dur={ANIMATION_DURATION}
						from="1" to="0"
						fill="freeze"
						repeatCount={1}
					/>
				</rect>
			}
		</Match>
	</Switch>;
}

export default function Visualizer() {
	let seqPatternPending: [SeqPattern, number | undefined] = [
		[{ min: 0, max: 999, count: 20 }],
		undefined,
	];
	let seqPatternInput!: HTMLInputElement;
	const [seqPattern, setSeqPattern] = createSignal(seqPatternPending[0]);
	const [seed, setSeed] = createSignal(seqPatternPending[1] ?? newSeed());
	const [index, setIndex] = createSignal(0);
	const [animate, setAnimate] = createSignal(false);
	const [player, setPlayer] = createSignal<ReturnType<typeof setInterval>>();

	const seq = createMemo(() => randomSeq(seqPattern(), seed()));
	const frames = createMemo(() => lisRun(seq()));
	const dimension = createMemo(() => {
		const frames_ = frames();
		const { width, height } = layoutDense(frames_[frames_.length - 1].tree, 0, 0);
		return { width, height };
	});
	const frame = createMemo(() => frames()[index()]);
	const lastFrame = createMemo(() => frames()[index() - 1] as Snapshot | undefined);
	const height = createMemo(() => Math.max(2, dimension().height));

	const inputId = nanoid();

	function play(step: Step) {
		function advance() {
			const frames_ = frames();
			const index_ = index();
			if(index_ == frames_.length - 1)
				return false;
			setAnimate(true);
			setIndex(index_ + 1);
			if(frames_[index_ + 1].step >= step)
				return false;
			return true;
		}

		stop();
		if(advance())
			setPlayer(setInterval(() => {
				if(!advance())
					setPlayer();
			}, 1000));
	}
	function stop() {
		setPlayer();
	}

	createEffect(() => {
		const player_ = player();
		onCleanup(() => clearInterval(player_));
	});

	return <AnimateContext.Provider value={animate}>
		<Canvas
			width={dimension().width} padding={0.1}
			height={height()}
			nodes={(() => {
				const next = frame().next;
				return next === undefined
					? [{ x: 0, y: 0, value: frame().tree }]
					: [
						{ x: 0, y: 0, value: frame().tree },
						{
							x: 0, y: 1,
							value: {
								value: {
									value: next,
									highlight: false,
									animation: lastFrame()?.next === undefined
											? { visible: false as const }
											: undefined,
								},
								children: [],
							},
						},
					];
			})()}
			renderNode={u =>
				<g transform={`translate(${u.x}, ${u.y})`}>
					<circle
						class="fill-[light-dark(#9ff,#266)]"
						r="0.3"
					/>
					<circle
						class="fill-bg stroke-fg transition-decoration"
						fill-opacity={u.value.highlight ? 0 : 1}
						r="0.3"
						stroke-width={STROKE_WIDTH}
					>
						<Show when={u.value.animation?.highlight}>
							{hl =>
								<Animate
									attributeName="fill-opacity"
									dur={ANIMATION_DURATION}
									from={hl() ? 0 : 1}
									to={u.value.highlight ? 0 : 1}
									fill="freeze"
									repeatCount={1}
								/>
							}
						</Show>
					</circle>
					<text
						class="fill-fg [font:0.2px_var(--font-code)] pointer-events-none"
						y="0.08"
						text-anchor="middle"
					>
						{u.value.value ?? '-∞'}
					</text>
					<Show when={u.value.animation?.visible}>
						<Animate
							attributeName="opacity"
							dur={ANIMATION_DURATION}
							from={0}
							to={1}
							fill="freeze"
							repeatCount={1}
						/>
					</Show>
					<Show when={u.value.animation?.coord}>
						{coord =>
							<AnimateTransform
								attributeName="transform"
								type="translate"
								values={`${coord().x} ${coord().y}; ${u.x} ${u.y}`}
								dur={ANIMATION_DURATION}
								calcMode="spline"
								keySplines={`${1/3} ${2/3} ${2/3} 1`}
								keyTimes="0; 1"
								fill="freeze"
								repeatCount={1}
							/>
						}
					</Show>
				</g>
			}
			renderEdge={u => <Show when={u.parent}>
				{parent =>
					<line
						class="stroke-fg"
						x1={u.x} y1={u.y}
						x2={parent().x} y2={parent().y}
						stroke-width={STROKE_WIDTH}
					>
						<Show when={u.value.animation?.coord}>
							{coord => <>
								<Animate
									attributeName="x1"
									values={`${coord().x}; ${u.x}`}
									dur={ANIMATION_DURATION}
									calcMode="spline"
									keySplines={`${1/3} ${2/3} ${2/3} 1`}
									keyTimes="0; 1"
									fill="freeze"
									repeatCount={1}
								/>
								<Animate
									attributeName="y1"
									values={`${coord().y}; ${u.y}`}
									dur={ANIMATION_DURATION}
									calcMode="spline"
									keySplines={`${1/3} ${2/3} ${2/3} 1`}
									keyTimes="0; 1"
									fill="freeze"
									repeatCount={1}
								/>
							</>}
						</Show>
						<Show when={parent().value.animation?.coord}>
							{coord => <>
								<Animate
									attributeName="x1"
									values={`${coord().x}; ${parent().x}`}
									dur={ANIMATION_DURATION}
									calcMode="spline"
									keySplines={`${1/3} ${2/3} ${2/3} 1`}
									keyTimes="0; 1"
									fill="freeze"
									repeatCount={1}
								/>
								<Animate
									attributeName="y1"
									values={`${coord().y}; ${parent().y}`}
									dur={ANIMATION_DURATION}
									calcMode="spline"
									keySplines={`${1/3} ${2/3} ${2/3} 1`}
									keyTimes="0; 1"
									fill="freeze"
									repeatCount={1}
								/>
							</>}
						</Show>
						<Show when={u.value.animation?.edgeVisible}>
							<Animate
								attributeName="opacity"
								dur={ANIMATION_DURATION}
								from="0"
								to="1"
								fill="freeze"
								repeatCount={1}
							/>
						</Show>
					</line>
				}
			</Show>}
		>
			<RectArea
				curr={frame().bisect} prev={lastFrame()?.bisect}
				height={height()}
				padding={0.1}
				fill="#00ffff60"
			/>
			<RectArea
				curr={(() => {
					const at = frame().bisect?.at;
					return at !== undefined
						? { from: at, to: at + 1 }
						: undefined;
				})()}
				prev={(() => {
					const at = lastFrame()?.bisect?.at;
					return at !== undefined
						? { from: at, to: at + 1 }
						: undefined;
				})()}
				height={height()}
				padding={-0.1}
				fill="#ff000060"
			/>
		</Canvas>
		<p class="m-0 text-right">
			{index()}/{frames().length - 1}
		</p>
		<input type="range"
			class="w-full"
			value={index()}
			min="0" max={frames().length - 1}
			on:input={e => batch(() => {
				setAnimate(false);
				stop();
				setIndex(e.target.valueAsNumber);
			})}
		/>
		<p class="flex flex-wrap justify-center gap-2 mt-2">
			<button on:click={() => play(Step.Finish)}>끝까지 실행</button>
			<button on:click={() => play(Step.Step)}>한 단계씩</button>
			<button on:click={() => play(Step.Loop)}>한 루프씩</button>
			<button on:click={() => stop()}>정지</button>
		</p>
		<p class="flex flex-wrap items-center gap-2 mt-2">
			<label for={inputId}>
				수열 패턴
			</label>
			<input ref={seqPatternInput}
				id={inputId}
				class="flex-auto"
				required value="20*0~999"
				on:input={e => {
					const parsed = parsePattern(e.target.value);
					if(parsed === undefined)
						seqPatternInput.setCustomValidity('올바른 패턴을 입력해 주세요.');
					else {
						seqPatternInput.setCustomValidity('');
						seqPatternPending = parsed;
					}
				}}
			/>
			<button on:click={() => {
				if(seqPatternInput.validity.valid)
					batch(() => {
						setSeqPattern(seqPatternPending[0]);
						setSeed(seqPatternPending[1] ?? newSeed());
						setIndex(0);
						setAnimate(false);
					});
			}}>
				적용
			</button>
		</p>
	</AnimateContext.Provider>;
}