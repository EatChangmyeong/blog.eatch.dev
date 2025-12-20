import { createMemo, createSignal } from 'solid-js';
import type { Error as CompileError } from './parser';
import type { Thunk } from './eval';
import { compile } from './parser';
import { toThunk } from './eval';

const SCRIPT =
`sqr = mul . (#0/1, #0/1);
sqrt = ?(not . gt . (sqr . + . #0/2, #1/2));

sqrt(16)`;

type RunnerState = {
	state: 'ready',
} | {
	state: 'compileError',
	error: CompileError,
} | {
	state: 'runtimeError',
	error: Error,
} | {
	state: 'running',
	thunk: Thunk,
	abort: AbortController,
} | {
	state: 'paused',
	thunk: Thunk,
} | {
	state: 'finished',
	value: bigint,
};

export default function GrfRunner() {
	let textarea!: HTMLTextAreaElement;
	const [state, setState] = createSignal<RunnerState>({ state: 'ready' });
	const message = createMemo(() => {
		const state_ = state();
		switch(state_.state) {
			case 'ready':
			return '';
			case 'compileError':
			return `${state_.error.pos[0] + 1}:${state_.error.pos[1] + 1}: ${state_.error.error}`;
			case 'runtimeError':
			return `${state_.error}`;
			case 'running':
			return '(실행 중)';
			case 'paused':
			return '(일시정지됨)';
			case 'finished':
			return `= ${state_.value}`;
		}
	});
	const isError = createMemo(() => {
		const state_ = state();
		return state_.state === 'compileError' || state_.state === 'runtimeError';
	});
	const pauseButtonBehavior = createMemo(() => {
		const state_ = state();
		switch(state_.state) {
			case 'ready':
			case 'compileError':
			case 'runtimeError':
			case 'finished':
			return;
			case 'running':
			return 'pause';
			case 'paused':
			return 'resume';
		}
	});

	function startEvalLoop(thunk: Thunk): AbortController {
		const abort = new AbortController();
		const { port1, port2 } = new MessageChannel();
		port2.addEventListener('message', () => {
			try {
				if(abort.signal.aborted)
					return;
				const next = thunk.next();
				if(next.done) {
					setState({
						state: 'finished',
						value: next.value,
					});
					return;
				}
				port1.postMessage(undefined);
			} catch(e) {
				setState({
					state: 'runtimeError',
					error: e as Error,
				});
				console.error(e);
			}
		});
		port2.start();
		port1.postMessage(undefined);
		return abort;
	}
	function reset() {
		const state_ = state();
		if(state_.state === 'running')
			state_.abort.abort();
		setState({ state: 'ready' });
	}
	function run() {
		reset();
		const compiled = compile(textarea.value);
		if(compiled.success) {
			const thunk = toThunk(compiled.value);
			setState({
				state: 'running',
				thunk,
				abort: startEvalLoop(thunk),
			});
		} else {
			setState({
				state: 'compileError',
				error: compiled,
			});
			textarea.setSelectionRange(compiled.fromUTF16, compiled.toUTF16, 'forward');
			textarea.focus();
		}
	}
	function togglePause() {
		const state_ = state();
		switch(state_.state) {
			case 'running':
				state_.abort.abort();
				setState({
					state: 'paused',
					thunk: state_.thunk,
				});
			break;
			case 'paused':
				setState({
					state: 'running',
					thunk: state_.thunk,
					abort: startEvalLoop(state_.thunk),
				});
			break;
		}
	}

	return <>
		<textarea
			ref={textarea}
			class="-code b-none p-2 w-full min-h-20 h-40 resize-y"
		>
			{SCRIPT}
		</textarea>
		<div class="flex items-start gap-2 mt-2">
			<p classList={{
				'flex-auto': true,
				'overflow-x-auto': true,
				'text-#f00': isError(),
				'@dark:text-#f88': isError(),
			}} style={{ margin: '0' }}>
				{message()}
			</p>
			<button class="flex-none" disabled={pauseButtonBehavior() === undefined} on:click={togglePause}>
				{pauseButtonBehavior() === 'resume' ? '계속' : '일시정지'}
			</button>
			<button class="flex-none" on:click={run}>실행</button>
		</div>
	</>;
}