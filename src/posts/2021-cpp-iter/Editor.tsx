import type { JSXElement, Ref } from "solid-js";
import { createSignal, Index, mergeProps, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import shuffle from 'knuth-shuffle-seeded';

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type EditMode = 'Ins' | 'Ovr' | 'Inc';
type ContentState = {
	cursor: number,
	select: number,
	rtl: boolean,
	editMode: EditMode,
	buffer: Digit[],
};
type Callback = (content: ContentState) => void;
type CtrlMouse = {
	type: 'mouse',
	event: 'down' | 'drag',
	shift?: boolean,
	fn?: (x: IndexerAbsolute) => Callback,
};
type CtrlKey = {
	type: 'key',
	ctrl?: boolean,
	shift?: boolean,
};
type CtrlKey1 = {
	key: string,
	repeat?: boolean | Callback,
	fn?: Callback,
};
type CtrlKeyA = {
	key: string[],
	repeat?: boolean | ((key: string) => Callback),
	fn?: ((key: string) => Callback),
};
type CtrlDesc = {
	display: JSXElement,
	desc: string | ((content: ContentState) => string),
} | {
	display?: undefined,
	desc?: undefined,
};
type CtrlPre =
	(
		CtrlMouse |
		CtrlKey & (CtrlKey1 | CtrlKeyA)
	) &
	CtrlDesc;
type Ctrl = CtrlPre & { fn: {} };
type CtrlMap = { type: string, ctrl: Ctrl[] }[];
type CtrlPreMap = { type: string, ctrl: CtrlPre[] }[];
type IndexerBase = { type: 'begin' | 'end' | 'sbegin' | 'send' | 'anchor', offset: number };
type IndexerAbsolute = { type: 'absolute', offset: number };
type IndexerCursor = { type: 'cursor', offset: number, fallback: IndexerBase };
type Indexer = IndexerBase | IndexerCursor | IndexerAbsolute;
type Props = {
	output: boolean,
	randomAccess: boolean,
	overtype: boolean,
	rtl: boolean,
	range: boolean,
	rangeOps: boolean,
	equalRange: boolean,
	controls: boolean,
};

const DIGIT_KEYS = [
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	')', '!', '@', '#', '$', '%', '^', '&', '*', '(',
	'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9',
];

let editorCount = 0;

function minmax(x: number, y: number): [number, number] {
	return [
		Math.min(x, y),
		Math.max(x, y),
	];
}

function isValidControl(ctrl: CtrlPre): ctrl is Ctrl {
	return ctrl.fn !== undefined;
}
function use<T, U>(dep: T, fn: (dep: T & {}) => U): U | undefined {
	if(dep !== undefined && dep !== null)
		return fn(dep);
}

function begin(offset = 0): IndexerBase {
	return { type: 'begin', offset };
}
function end(offset = 0): IndexerBase {
	return { type: 'end', offset };
}
function sbegin(offset = 0): IndexerBase {
	return { type: 'sbegin', offset };
}
function send(offset = 0): IndexerBase {
	return { type: 'send', offset };
}
function anchor(offset = 0): IndexerBase {
	return { type: 'anchor', offset };
}
function cursor(offset: number, fallback: IndexerBase): IndexerCursor {
	return { type: 'cursor', offset, fallback };
}

function asDigit(str: string): Digit {
	switch(str) {
		case '0': case ')': case 'Numpad0':
		return 0;
		case '1': case '!': case 'Numpad1':
		return 1;
		case '2': case '@': case 'Numpad2':
		return 2;
		case '3': case '#': case 'Numpad3':
		return 3;
		case '4': case '$': case 'Numpad4':
		return 4;
		case '5': case '%': case 'Numpad5':
		return 5;
		case '6': case '^': case 'Numpad6':
		return 6;
		case '7': case '&': case 'Numpad7':
		return 7;
		case '8': case '*': case 'Numpad8':
		return 8;
		case '9': case '(': case 'Numpad9':
		return 9;
	}
	throw new RangeError(`${str} is not a valid digit key`);
}
function randomDigit(): Digit {
	return Math.floor(10*Math.random()) as Digit;
}
function randomArray(length: number, sorted: boolean): Digit[] {
	const result = [...Array(length)].map(randomDigit);
	if(sorted)
		result.sort((a, b) => a - b);
	return result;
}

function 로(x: number): string {
	return x%10 == 1 || x%10 == 2 || x%10 == 4 || x%10 == 5 || x%10 == 7 || x%10 == 8 || x%10 == 9
		? '로'
		: '으로';
}

function CellTd(props: {
	highlight?: boolean,
	children: JSXElement,
}) {
	return (
		<td
			classList={{
				'b-0.25rem': true,
				'b-solid': true,
				'p-0': true,
				'w-13': true,
				'h-12': true,
				'b-#e2e2e2': true,
				'@dark:b-#4a4a4a': true,
				'text-#fff': props.highlight,
				'@dark:text-#000': props.highlight,
				'bg-#564a7e': props.highlight,
				'@dark:bg-#d5cafe': props.highlight,
				'text-#000': !props.highlight,
				'@dark:text-#fff': !props.highlight,
				'bg-#fff': !props.highlight,
				'@dark:bg-#202020': !props.highlight,
			}}
		>{props.children}</td>
	);
}
function CellBlink(props: {
	ref?: Ref<HTMLDivElement>,
	invisible?: boolean,
	children: JSXElement,
}) {
	return (
		<div
			ref={props.ref}
			classList={{
				'absolute': true,
				'left-1': true,
				'top-1': true,
				'w-12': true,
				'h-12': true,
				'text-#fff': true,
				'@dark:text-#000': true,
				'bg-#564a7e': true,
				'@dark:bg-#d5cafe': true,
				'invisible': props.invisible,
			}}
		>{props.children}</div>
	);
}
export default function Editor(props_: Partial<Props>) {
	const
		props = mergeProps(
			{
				output: false,
				randomAccess: false,
				overtype: false,
				rtl: false,
				range: false,
				rangeOps: false,
				equalRange: false,
				controls: true,
			} satisfies Props,
			props_
		),
		shouldSort = props.range && props.rangeOps && props.equalRange && !props.output,
		statusId = `-editor-status-${editorCount + 1}`,
		controlsId = `-editor-controls-${editorCount + 1}`,
		[resetLen, setResetLen] = createSignal(10),
		[content, setContent] = createStore<ContentState>(init());
	let cursorElement!: HTMLDivElement;
	editorCount++;

	function init(): ContentState {
		return {
			cursor: 0,
			select: 0,
			rtl: false,
			editMode: 'Ins',
			buffer: randomArray(resetLen(), shouldSort),
		};
	}

	const
		resolveIndex = (index: Indexer, rtl_?: boolean) => (content: ContentState): number => {
			const
				resolved = index.type == 'cursor'
					? content.cursor != content.select
						? index.fallback
						: anchor(index.offset)
					: index,
				endBase = content.buffer.length,
				[leftBase, rightBase] = minmax(content.cursor, content.select),
				backward = rtl(rtl_)(content),
				base = resolved.type == 'absolute'
					? 0
				: resolved.type == 'anchor'
					? content.cursor
				: backward
					? resolved.type == 'begin'
						? endBase
					: resolved.type == 'end'
						? 0
					: resolved.type == 'sbegin'
						? rightBase
						: leftBase
				: resolved.type == 'begin'
					? 0
				: resolved.type == 'end'
					? endBase
				: resolved.type == 'sbegin'
					? leftBase
					: rightBase,
				sign = resolved.type == 'absolute' || !backward
					? 1
					: -1;
			return Math.max(0, Math.min(endBase, Math.round(base + sign*resolved.offset)));
		},
		mouseToIndex = props.randomAccess
			? (e: MouseEvent): IndexerAbsolute => {
				const
					len = content.buffer.length,
					remPerCell = 3.25,
					remPadding = 0.25,
					pxPerRem = (e.target as HTMLElement).scrollWidth/(remPerCell*len + remPadding);
				return { type: 'absolute', offset: (e.offsetX/pxPerRem - remPadding/2)/remPerCell };
			}
			: undefined,
		moveTo = (ix: Indexer, rtl_?: boolean) => (content: ContentState) =>
			content.cursor = content.select = resolveIndex(ix, rtl_)(content),
		selectTo = props.range
			? (ix: Indexer, rtl_?: boolean) => (content: ContentState) =>
				content.cursor = resolveIndex(ix, rtl_)(content)
			: undefined,
		selectFromTo = props.range
			? (from: Indexer, to: Indexer, rtl_?: boolean) => (content: ContentState) => {
				content.select = resolveIndex(from, rtl_)(content);
				content.cursor = resolveIndex(to, rtl_)(content);
			}
			: undefined,
		deref = (ix: Indexer, rtl_?: boolean) => (content: ContentState): Digit => {
			const
				resolved = resolveIndex(ix, rtl_)(content),
				arrIx = resolved + (rtl(rtl_)(content) ? -1 : 0);
			if(arrIx < 0 || content.buffer.length <= arrIx)
				throw new RangeError(`index ${arrIx} out of range 0..${content.buffer.length}`);
			return content.buffer[arrIx];
		},
		selectedRange = (behavior?: 'backspace' | 'delete', rtl_?: boolean) => (content: ContentState): [number, number] => {
			const
				bias = behavior == 'backspace'
					? -1
				: behavior == 'delete'
					? 1
				: content.editMode == 'Ins'
					? 0
					: 1,
				[biasLeft, biasRight] = minmax(0, bias);
			return minmax(
				resolveIndex(cursor(biasLeft, sbegin()), rtl_)(content),
				resolveIndex(cursor(biasRight, send()), rtl_)(content)
			);
		},
		getSelected = (rtl_?: boolean) => (content: ContentState): Digit[] => {
			const
				[left, right] = selectedRange(undefined, rtl_)(content),
				result = [...content.buffer.slice(left, right)];
			if(rtl(rtl_)(content))
				result.reverse();
			return result;
		},
		insert = props.output
			? (digits: Digit[], behavior?: 'before' | 'after' | 'select', rtl_?: boolean) => (content: ContentState) => {
				const
					rtl__ = rtl(rtl_)(content),
					resolvedBehavior = behavior ?? (content.editMode != 'Ovr' ? 'after' : 'before');
				if(rtl__)
					digits.reverse();
				content.buffer.splice(resolveIndex(anchor(), rtl__)(content), 0, ...digits);
				if(rtl__)
					moveTo(anchor(digits.length), false)(content);
				if(resolvedBehavior == 'after')
					moveTo(anchor(digits.length), rtl__)(content);
				else if(resolvedBehavior == 'select')
					(selectTo ?? moveTo)(anchor(digits.length), rtl__)(content);
			}
			: undefined,
		delete_ = props.output
			? (behavior?: 'backspace' | 'delete', rtl_?: boolean) => (content: ContentState): Digit[] => {
				const
					[left, right] = selectedRange(behavior, rtl_)(content),
					result = content.buffer.splice(left, right - left);
				moveTo(begin(left), false)(content);
				if(rtl(rtl_)(content))
					result.reverse();
				return result;
			}
			: undefined,
		updateRange = props.output
			? (
				f: (digits: Digit[]) => Digit[],
				deleteBehavior?: 'backspace' | 'delete',
				insertBehavior?: 'before' | 'after' | 'select',
				rtl_?: boolean
			) => (content: ContentState) => {
				const
					before = delete_!(deleteBehavior, rtl_)(content),
					after = f(before);
				insert!(after, insertBehavior, rtl_)(content);
			}
			: undefined,
		sort = props.range && props.output && props.rangeOps
			? (digits: Digit[]) => digits.sort((a, b) => a - b)
			: undefined,
		reverse = props.range && props.output && props.rangeOps
			? (digits: Digit[]) => digits.reverse()
			: undefined,
		find = props.range && props.rangeOps
			? (digit: Digit, rtl_?: boolean) => (content: ContentState) => {
				const found = getSelected(rtl_)(content)
					.findIndex(x => x == digit);
				moveTo(found == -1 ? send() : sbegin(found), rtl_)(content);
			}
			: undefined,
		unique = props.range && props.output && props.rangeOps
			? (digits: Digit[]) =>
				digits.filter((digit, i) => i == 0 || digits[i - 1] != digit)
			: undefined,
		shuffle_ = props.range && props.output && props.rangeOps
			? shuffle
			: undefined,
		binarySearch = props.rangeOps
			? (f: (digit: Digit) => boolean, rtl_?: boolean) => (content: ContentState): Indexer => {
				let
					begin_ = 0,
					end_ = content.buffer.length;
				while(begin_ < end_) {
					const
						mid = Math.floor((begin_ + end_)/2),
						digit = deref(begin(mid), rtl_)(content);
					if(f(digit))
						begin_ = mid + 1;
					else
						end_ = mid;
				}
				return begin(begin_);
			}
			: undefined,
		equalRange = props.rangeOps && props.equalRange
			? (digit: Digit, rtl_?: boolean) => (content: ContentState): [Indexer, Indexer] => [
				binarySearch!(x => x < digit, rtl_)(content),
				binarySearch!(x => x <= digit, rtl_)(content),
			]
			: undefined,
		nextEditMode = (content: ContentState) =>
			props.overtype
				? content.editMode == 'Ins'
					? 'Ovr'
				: content.editMode == 'Inc'
					? 'Ins'
				: props.output
					? 'Inc'
					: 'Ins'
				: 'Ins',
		toggleEditMode = props.overtype
			? (content: ContentState) =>
				content.editMode = nextEditMode(content)
			: undefined,
		rtl = (backward?: boolean) => (content: ContentState) =>
			backward ?? content.rtl,
		nextRtl = (content: ContentState) =>
			props.rtl
				? !content.rtl
				: false,
		toggleRtl = props.rtl
			? (content: ContentState) =>
				content.rtl = nextRtl(content)
			: undefined;
	function editModeString(mode: EditMode) {
		return mode == 'Ins'
			? '삽입'
		: props.output
			? mode == 'Ovr'
				? '수정 (커서 고정)'
				: '수정 (커서 이동)'
			: '수정';
	}
	function rtlString(rtl: boolean) {
		return rtl
			? '우횡서'
			: '좌횡서';
	}

	const controls: CtrlMap = ([
		{
			type: '이동',
			ctrl: [
				{
					type: 'mouse',
					event: 'down',
					shift: false,
					display: '클릭',
					desc: '클릭한 곳으로 이동',
					fn: (x: IndexerAbsolute) => moveTo(x, false),
				},
				{
					type: 'key',
					key: 'ArrowLeft',
					shift: false,
					display: <kbd>←</kbd>,
					desc: '왼쪽으로 이동',
					fn: moveTo(cursor(-1, sbegin()), false),
					repeat: true,
				},
				{
					type: 'key',
					key: 'ArrowRight',
					shift: false,
					display: <kbd>→</kbd>,
					desc: '오른쪽으로 이동',
					fn: moveTo(cursor(1, send()), false),
					repeat: true,
				},
				{
					type: 'key',
					key: 'Home',
					shift: false,
					display: <kbd>Home</kbd>,
					desc: '시작점으로 이동',
					fn: moveTo(begin()),
				},
				{
					type: 'key',
					key: 'End',
					shift: false,
					display: <kbd>End</kbd>,
					desc: '끝점으로 이동',
					fn: moveTo(end()),
				},
			],
		},
		{
			type: '선택',
			ctrl: [
				{
					type: 'mouse',
					event: 'down',
					shift: true,
					display: <><kbd>Shift</kbd>+클릭</>,
					desc: '클릭한 곳까지 선택',
					fn: use(selectTo, selectTo =>
						(x: IndexerAbsolute) => selectTo(x, false)
					),
				},
				{
					type: 'mouse',
					event: 'drag',
					fn: (x: IndexerAbsolute) => (selectTo ?? moveTo)(x, false),
				},
				{
					type: 'key',
					key: 'ArrowLeft',
					shift: true,
					display: <><kbd>Shift</kbd>+<kbd>←</kbd></>,
					desc: '왼쪽으로 선택',
					fn: selectTo?.(anchor(-1), false),
					repeat: true,
				},
				{
					type: 'key',
					key: 'ArrowLeft',
					shift: true,
					fn: moveTo(cursor(-1, sbegin()), false),
					repeat: true,
				},
				{
					type: 'key',
					key: 'ArrowRight',
					shift: true,
					display: <><kbd>Shift</kbd>+<kbd>→</kbd></>,
					desc: '오른쪽으로 선택',
					fn: selectTo?.(anchor(1), false),
					repeat: true,
				},
				{
					type: 'key',
					key: 'ArrowRight',
					shift: true,
					fn: moveTo(cursor(1, send()), false),
					repeat: true,
				},
				{
					type: 'key',
					key: 'Home',
					shift: true,
					display: <><kbd>Shift</kbd>+<kbd>Home</kbd></>,
					desc: '시작점까지 선택',
					fn: selectTo?.(begin()),
				},
				{
					type: 'key',
					key: 'Home',
					shift: true,
					fn: moveTo(begin()),
				},
				{
					type: 'key',
					key: 'End',
					shift: true,
					display: <><kbd>Shift</kbd>+<kbd>End</kbd></>,
					desc: '끝점까지 선택',
					fn: selectTo?.(end()),
				},
				{
					type: 'key',
					key: 'End',
					shift: true,
					fn: moveTo(end()),
				},
				{
					type: 'key',
					key: 'a',
					ctrl: true,
					display: <><kbd>Shift</kbd>+<kbd>A</kbd></>,
					desc: '모두 선택',
					fn: selectFromTo?.(begin(), end()),
				},
			],
		},
		{
			type: '범위 연산',
			ctrl: [
				{
					type: 'key',
					key: DIGIT_KEYS,
					ctrl: true,
					shift: false,
					display: <><kbd>Ctrl</kbd>+<kbd>0</kbd>~<kbd>9</kbd></>,
					desc: '선택 영역에서 같은 숫자 검색',
					fn: use(find, find =>
						(key: string) => find(asDigit(key))
					),
				},
				{
					type: 'key',
					key: DIGIT_KEYS,
					ctrl: true,
					shift: true,
					display: <><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>0</kbd>~<kbd>9</kbd></>,
					desc: shouldSort
						? '같은 숫자 선택'
						: '정렬하고 같은 숫자 선택',
					fn: use(equalRange, equalRange =>
						(key: string) => (content: ContentState) => {
							if(sort) {
								selectFromTo!(begin(), end())(content);
								updateRange!(sort)(content);
							}
							const [from, to] = equalRange(asDigit(key))(content);
							selectFromTo!(from, to)(content);
						}
					),
				},
			],
		},
		{
			type: '일반 편집',
			ctrl: [
				{
					type: 'key',
					key: DIGIT_KEYS,
					ctrl: false,
					display: <><kbd>0</kbd>~<kbd>9</kbd></>,
					desc: content => editModeString(content.editMode),
					fn: use(updateRange, updateRange =>
						(key: string) => updateRange(() => [asDigit(key)])
					),
					repeat: true,
				},
				{
					type: 'key',
					key: 'Backspace',
					ctrl: false,
					display: <kbd>Backspace</kbd>,
					desc: '지우기',
					fn: delete_?.('backspace'),
					repeat: true,
				},
				{
					type: 'key',
					key: 'Delete',
					ctrl: false,
					display: <kbd>Delete</kbd>,
					desc: '앞으로 지우기',
					fn: delete_?.('delete'),
					repeat: true,
				},
			],
		},
		{
			type: '범위 편집',
			ctrl: [
				{
					type: 'key',
					key: 'f',
					ctrl: true,
					display: <><kbd>Ctrl</kbd>+<kbd>F</kbd></>,
					desc: '선택 영역 뒤집기',
					fn: use(reverse, reverse =>
						updateRange?.(reverse, undefined, 'select')
					),
				},
				{
					type: 'key',
					key: 'u',
					ctrl: true,
					display: <><kbd>Ctrl</kbd>+<kbd>U</kbd></>,
					desc: '선택 영역에서 중복 제거',
					fn: use(unique, unique =>
						updateRange?.(unique, undefined, 'select')
					),
				},
				{
					type: 'key',
					key: 's',
					ctrl: true,
					display: <><kbd>Ctrl</kbd>+<kbd>S</kbd></>,
					desc: '선택 영역 섞기',
					fn: use(shuffle_, shuffle_ =>
						updateRange?.(shuffle_, undefined, 'select')
					),
				},
			],
		},
		{
			type: '기타',
			ctrl: [
				{
					type: 'key',
					key: 'Insert',
					ctrl: false,
					shift: false,
					display: <kbd>Insert</kbd>,
					desc: content => `${editModeString(nextEditMode(content))} 모드로 전환`,
					fn: toggleEditMode,
				},
				{
					type: 'key',
					key: 'r',
					ctrl: true,
					display: <><kbd>Ctrl</kbd>+<kbd>R</kbd></>,
					desc: content => `${rtlString(nextRtl(content))}로 전환`,
					fn: toggleRtl,
				},
			],
		},
	] satisfies CtrlPreMap as CtrlPreMap)
		.map((x) => ({
			...x,
			ctrl: x.ctrl.filter(isValidControl),
		}));
	function matchMouseDown(e: MouseEvent): Callback | undefined {
		const { button, shiftKey } = e;
		if(!mouseToIndex || button != 0)
			return;
		for(const { ctrl: category } of controls)
			for(const ctrl of category)
				if(
					ctrl.type == 'mouse' &&
					ctrl.event == 'down' &&
					(ctrl.shift === undefined || ctrl.shift == shiftKey)
				)
					return ctrl.fn(mouseToIndex(e));
	}
	function matchMouseDrag(e: MouseEvent): Callback | undefined {
		const { buttons, shiftKey } = e;
		if(!mouseToIndex || !(buttons & 1))
			return;
		for(const { ctrl: category } of controls)
			for(const ctrl of category)
				if(
					ctrl.type == 'mouse' &&
					ctrl.event == 'drag' &&
					(ctrl.shift === undefined || ctrl.shift == shiftKey)
				)
					return ctrl.fn(mouseToIndex(e));
	}
	function matchKeyboard({ key, ctrlKey, shiftKey, repeat }: KeyboardEvent): Callback | undefined {
		for(const { ctrl: category } of controls)
			for(const ctrl of category)
				if(
					ctrl.type == 'key' &&
					(ctrl.ctrl === undefined || ctrl.ctrl == ctrlKey) &&
					(ctrl.shift === undefined || ctrl.shift == shiftKey)
				)
					if(typeof ctrl.key == 'string') {
						const ctrl_ = ctrl as CtrlKey1 & { fn: {} };
						if(ctrl_.key == key)
							if(!repeat)
								return ctrl_.fn;
							else if(ctrl_.repeat)
								return typeof ctrl_.repeat == 'boolean'
									? ctrl_.fn
									: ctrl_.repeat;
					} else {
						const ctrl_ = ctrl as CtrlKeyA & { fn: {} };
						if(ctrl_.key.includes(key))
							if(!repeat)
								return ctrl_.fn(key);
							else if(ctrl_.repeat)
								return typeof ctrl_.repeat == 'boolean'
									? ctrl_.fn(key)
									: ctrl_.repeat(key);
					}
	}
	const displayControl = (ctrl: Ctrl) => (content: ContentState): JSXElement => {
		if(ctrl.display && (mouseToIndex || ctrl.type != 'mouse'))
			return <tr>
				<td class="font-bold text-center">{ctrl.display}</td>
				<td class="text-left">{typeof ctrl.desc == 'string'
					? ctrl.desc
					: ctrl.desc(content)
				}</td>
			</tr>;
	};

	function statusMessage() {
		const
			msg = [],
			left = Math.min(content.cursor, content.select),
			right = Math.max(content.cursor, content.select);
		if(props.overtype)
			msg.push(editModeString(content.editMode));
		if(props.rtl)
			msg.push(rtlString(content.rtl));
		msg.push(`${content.buffer.length}글자 중 ${
			content.cursor == content.select
				? `${content.cursor}칸`
				: `${left}-${right}`
		}`);
		return msg.join(' · ');
	}

	return <>
		<div>
			<div
				class="
					relative
					m-auto outline-none w-fit max-w-100%
					font-monospace font-bold text-center text-6 leading-12 whitespace-nowrap
					opacity-75 focus:opacity-100
					overflow-x-auto overflow-y-hidden
					motion-safe:transition-opacity motion-safe:duration-200ms
				"
				tabindex="0"
				aria-describedby={statusId}
				aria-details={controlsId}
				on:mousedown={e => {
					const ctrl = matchMouseDown(e);
					if(ctrl) {
						setContent(produce(ctrl));
						cursorElement.scrollIntoView({ block: 'nearest' });
					}
				}}
				on:mousemove={e => {
					const ctrl = matchMouseDrag(e);
					if(ctrl) {
						setContent(produce(ctrl));
						cursorElement.scrollIntoView({ block: 'nearest' });
					}
				}}
				on:keydown={e => {
					const ctrl = matchKeyboard(e);
					if(ctrl) {
						e.preventDefault();
						setContent(produce(ctrl));
						cursorElement.scrollIntoView({ block: 'nearest' });
					}
				}}
			>
				<table class="mx-0.4rem border-collapse w-max h-14">
					<tbody class="pointer-events-none">
						<tr>
							<Index each={content.buffer}>
								{(x, i) =>
									<CellTd
										highlight={
											content.select <= i && i < content.cursor ||
											content.cursor <= i && i < content.select
										}
									>
										{x()}
									</CellTd>
								}
							</Index>
						</tr>
					</tbody>
				</table>
				<Show
					when={content.cursor == content.select
						? {
							invisible: false,
							range: selectedRange()(content),
						}
						: {
							invisible: true,
							range: [content.cursor, content.cursor]
						}
					}
					keyed
				>{
					({ invisible, range: [from, to] }) =>
						<div
							classList={{
								absolute: true,
								'top-0': true,
								'pointer-events-none': true,
								'motion-safe:animate-blink': true,
								invisible
							}}
							style={{
								left: `${0.4 + 3.25*from}rem`,
							}}
						>
							<Show
								when={from != to}
								fallback={<>
									<div
										ref={cursorElement}
										classList={{
											absolute: true,
											'w-1': true,
											'h-14': true,
											'bg-#564a7e': true,
											'@dark:bg-#d5cafe': true,
											invisible
										}}
									/>
									<Show when={props.rtl}>
										<div classList={{
											absolute: true,
											'top-0.4rem': true,
											'right--1': content.rtl,
											'w-0.65rem': true,
											'h-1': true,
											'bg-#564a7e': true,
											'@dark:bg-#d5cafe': true,
											invisible
										}} />
									</Show>
								</>}
							>
								<CellBlink ref={cursorElement} invisible={invisible}>
									{content.buffer[from]}
								</CellBlink>
							</Show>
						</div>
				}</Show>
			</div>
			<div class="flex flex-row flex-wrap justify-between items-center">
				<p class="flex-none">
					<label>
						길이 <input
							type="number" required value="10" min="0" max="1024"
							on:input={e => {
								if(e.target.validity.valid)
									setResetLen(e.target.valueAsNumber);
							}}
						/>
					</label>{로(resetLen())}{' '}
					<button on:click={() => {
						setContent(init);
					}}>{props.output
						? '초기화'
						: '다시 생성'
					}</button>
				</p>
				<p id={statusId} class="flex-none">
					{statusMessage()}
				</p>
			</div>
		</div>
		<details open={props.controls}>
			<summary>조작</summary>
			<div id={controlsId} class="flex flex-row flex-wrap justify-center items-start gap-2 overflow-x-auto">
				<Index each={controls}>
					{category =>
						category()
							.ctrl
							.filter(ctrl => ctrl.desc !== undefined).length != 0 &&
							<table class="flex-none">
								<caption class="font-bold">
									{category().type}
								</caption>
								<tbody>
									<Index each={category().ctrl}>
										{ctrl => displayControl(ctrl())(content)}
									</Index>
								</tbody>
							</table>
					}
				</Index>
			</div>
		</details>
	</>;
}