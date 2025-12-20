import type { GrfFn, GrfProg } from './lang';
import { BUILTIN_DECL } from './lang';

type Terminal = 'ident' | '=' | ';' | '.' | '(' | ')' | 'nat' | ',' | '/' | '+' | '#' | '^' | '?';
type Nonterminal = 'Rec' | 'Def' | 'Fn' | 'Fn,+' | 'Term' | 'Main' | 'nat,*' | 'nat,+';
type Payload = {
	ident: string,
	nat: bigint,
	'=': {},
	';': {},
	'.': {},
	'(': {},
	')': {},
	',': {},
	'/': {},
	'+': {},
	'#': {},
	'^': {},
	'?': {},
	Rec: {
		defs: Node<'Def'>[],
		body: Node<'Main'>,
	},
	Def: {
		ident: Node<'ident'>,
		def: Node<'Fn'>,
	},
	Fn: {
		term: Node<'Term'>,
	} | {
		term: null,
		car: Node<'Fn'>,
		cdr: Node<'Fn'>[] | Node<'nat'>,
	},
	'Fn,+': Node<'Fn'>[],
	Term: {
		type: 'c',
		arity: Node<'nat'>,
		value: Node<'nat'>,
	} | {
		type: 's',
	} | {
		type: 'p',
		arity: Node<'nat'>,
		index: Node<'nat'>,
	} | {
		type: 'r',
		base: Node<'Fn'>,
		inductive: Node<'Fn'>,
	} | {
		type: 'm',
		pred: Node<'Fn'>,
	} | {
		type: 'i',
		ident: Node<'ident'>,
	},
	Main: {
		fn: Node<'Fn'>,
		args: Node<'nat'>[],
	},
	'nat,+': Node<'nat'>[],
	'nat,*': Node<'nat'>[],
};

type Node<T extends Terminal | Nonterminal> = {
	from: number,
	to: number,
	type: T,
	payload: Payload[T],
};
type NodeTerm = Node<'ident'> | Node<'='> | Node<';'> | Node<'.'> | Node<'('> | Node<')'> | Node<'nat'> | Node<','> | Node<'/'> | Node<'+'> | Node<'#'> | Node<'^'> | Node<'?'>;

const SYMBOL_NAME: Partial<Record<Terminal | Nonterminal, string>> = {
	ident: '식별자',
	nat: '자연수',
	'Rec': '',
	'Def': '함수 정의',
	'Fn': '함수',
	'Fn,+': '함수 목록',
	'Term': '함수 항',
	'Main': '주 함수 호출',
	'nat,*': '인자 목록',
	'nat,+': '인자 목록',
};
const 가: Set<Terminal | Nonterminal> = new Set(['ident', '=', '(', ')', 'nat', '/', '+', '?', 'Def', 'Fn']);

type InternalResult<T, E> = {
	success: true,
	value: T,
} | {
	success: false,
	from: number,
	to: number,
	error: E,
};

function success<T, E>(value: T): InternalResult<T, E> {
	return {
		success: true,
		value,
	};
}
function map<T, U, E>(parsed: InternalResult<T, E>, f: (x: T) => U): InternalResult<U, E> {
	return parsed.success
		? {
			success: true,
			value: f(parsed.value),
		}
		: parsed;
};

function check(tree: Node<'Rec'>): InternalResult<GrfProg, string> {
	function rec(tree: Node<'Rec'>): InternalResult<GrfProg, string> {
		for(const eqn of tree.payload.defs) {
			const checked = def(eqn);
			if(!checked.success)
				return checked;
		}
		return main(tree.payload.body);
	}
	function def(tree: Node<'Def'>): InternalResult<undefined, string> {
		if(env.has(tree.payload.ident.payload))
			return {
				success: false,
				from: tree.from,
				to: tree.to,
				error: `식별자 ${tree.payload.ident.payload}을/를 덮어쓸 수 없습니다.`,
			};

		const checked = fn(tree.payload.def);
		if(!checked.success)
			return checked;
		env.set(tree.payload.ident.payload, checked.value);
		return success(undefined);
	}
	function fn(tree: Node<'Fn'>, arity?: number): InternalResult<[number, GrfFn], string> {
		if(tree.payload.term)
			return term(tree.payload.term, arity);

		const cdr = Array.isArray(tree.payload.cdr)
			? tree.payload.cdr
			: [];
		const carArity = cdr.length;
		const newCdr = [];
		const car = fn(tree.payload.car, carArity);
		let cdrArity = 0;
		if(!car.success)
			return car;
		if(Array.isArray(tree.payload.cdr)) {
			const cdrHead = fn(cdr[0], arity);
			if(!cdrHead.success)
				return cdrHead;
			cdrArity = cdrHead.value[0];
			newCdr.push(cdrHead.value[1]);
			for(let i = 1; i < cdr.length; i++) {
				const cdrTail = fn(cdr[i], cdrArity);
				if(!cdrTail.success)
					return cdrTail;
				newCdr.push(cdrTail.value[1]);
			}
		} else
			cdrArity = Number(tree.payload.cdr.payload);
		const checkedArity = arityCheck(tree, arity, cdrArity);
		if(!checkedArity.success)
			return checkedArity;
		return success([checkedArity.value, {
			type: '.',
			car: car.value[1],
			cdr: newCdr,
		}]);
	}
	function term(tree: Node<'Term'>, arity?: number): InternalResult<[number, GrfFn], string> {
		switch(tree.payload.type) {
			case 'c': {
				const checkedArity = arityCheck(tree, arity, Number(tree.payload.arity.payload));
				if(!checkedArity.success)
					return checkedArity;
				return success([checkedArity.value, {
					type: 'c',
					arity: checkedArity.value,
					value: tree.payload.value.payload,
				}]);
			}
			case 's': {
				const checkedArity = arityCheck(tree, arity, 1);
				if(!checkedArity.success)
					return checkedArity;
				return success([1, { type: 's' }]);
			}
			case 'p': {
				const checkedArity = arityCheck(tree, arity, Number(tree.payload.arity.payload));
				if(!checkedArity.success)
					return checkedArity;
				const index = Number(tree.payload.index.payload);
				if(index >= checkedArity.value)
					return {
						success: false,
						from: tree.payload.index.from,
						to: tree.payload.index.to,
						error: `${checkedArity.value}변수함수의 ${index}번째 인자를 사용할 수 없습니다. \`#\` 함수의 인자 번호는 0부터 시작합니다.`,
					};
				return success([checkedArity.value, {
					type: 'p',
					arity: checkedArity.value,
					index: index,
				}]);
			}
			case 'r': {
				if(arity === 0)
					return {
						success: false,
						from: tree.from,
						to: tree.to,
						error: '`^` 연산자로 0변수함수를 생성할 수 없습니다.',
					};
				const base = fn(tree.payload.base, arity === undefined ? undefined : arity - 1);
				if(!base.success)
					return base;
				const baseArity = base.value[0];
				const inductive = fn(tree.payload.inductive, baseArity + 2);
				if(!inductive.success)
					return inductive;
				return success([baseArity + 1, {
					type: 'r',
					base: base.value[1],
					inductive: inductive.value[1],
				}]);
			}
			case 'm': {
				const pred = fn(tree.payload.pred, arity === undefined ? undefined : arity + 1);
				if(!pred.success)
					return pred;
				if(pred.value[0] === 0)
					return {
						success: false,
						from: tree.from,
						to: tree.to,
						error: '`?` 연산자에 0변수함수를 전달할 수 없습니다.',
					};
				return success([pred.value[0] - 1, {
					type: 'm',
					pred: pred.value[1],
				}]);
			}
			case 'i': {
				const f = env.get(tree.payload.ident.payload);
				if(!f)
					return {
						success: false,
						from: tree.from,
						to: tree.to,
						error: `정의하지 않은 식별자 ${tree.payload.ident.payload}을/를 사용했습니다.`,
					};
				const checkedArity = arityCheck(tree, arity, f[0]);
				if(!checkedArity.success)
					return checkedArity;
				return success(f);
			}
		}
	}
	function main(tree: Node<'Main'>): InternalResult<GrfProg, string> {
		const checked = fn(tree.payload.fn, tree.payload.args.length);
		if(!checked.success)
			return checked;
		return success([checked.value[1], tree.payload.args.map(x => x.payload)]);
	}
	function arityCheck(node: Node<Terminal | Nonterminal>, expected: number | undefined, actual: number, nullary?: boolean): InternalResult<number, string> {
		if(expected !== undefined && expected !== actual)
			return {
				success: false,
				from: node.from,
				to: node.to,
				error: `${expected}변수함수가 올 곳에 ${actual}변수${nullary ? ' 표시' : '함수'}를 입력받았습니다.`,
			};
		return {
			success: true,
			value: actual,
		};
	}

	const env = new Map<string, [number, GrfFn]>(
		Object.entries(BUILTIN_DECL).map(([id, arity]) => [id, [arity, {
			type: '_',
			fn: id as keyof typeof BUILTIN_DECL,
		}]])
	);
	return rec(tree);
}

function parse(tokens: NodeTerm[], eof: number): InternalResult<Node<'Rec'>, string> {
	type Expect = [(Terminal | undefined)[], Terminal | undefined];
	type Reducer<T extends Terminal | Nonterminal, U> = (t: Node<T>) => U;

	type R1_0 = Node<'Rec'>;
	type R1_1 = Reducer<'Main', R1_0>;
	const r1: R1_1 = main => ({
		type: 'Rec',
		from: main.from,
		to: main.to,
		payload: {
			defs: [],
			body: main,
		},
	});
	type R2_0 = Node<'Rec'>;
	type R2_1 = Reducer<'Def', R2_0>;
	type R2_2 = Reducer<'Rec', R2_1>;
	const r2: R2_2 = rec => def => ({
		type: 'Rec',
		from: def.from,
		to: rec.to,
		payload: {
			defs: [def, ...rec.payload.defs],
			body: rec.payload.body,
		},
	});
	type R3_0 = Node<'Def'>;
	type R3_1 = Reducer<'ident', R3_0>;
	type R3_2 = Reducer<'=', R3_1>;
	type R3_3 = Reducer<'Fn', R3_2>;
	type R3_4 = Reducer<';', R3_3>;
	const r3: R3_4 = ({ to }) => fn => () => ident => ({
		type: 'Def',
		from: ident.from,
		to,
		payload: {
			ident,
			def: fn,
		},
	});
	type R4_0 = Node<'Fn'>;
	type R4_1 = Reducer<'Term', R4_0>;
	const r4: R4_1 = term => ({
		type: 'Fn',
		from: term.from,
		to: term.to,
		payload: { term },
	});
	type R5_0 = Node<'Fn'>;
	type R5_1 = Reducer<'Fn', R5_0>;
	type R5_2 = Reducer<'.', R5_1>;
	type R5_3 = Reducer<'Term', R5_2>;
	const r5: R5_3 = term => () => fn => ({
		type: 'Fn',
		from: fn.from,
		to: term.to,
		payload: {
			term: null,
			car: fn,
			cdr: [{
				type: 'Fn',
				from: term.from,
				to: term.to,
				payload: { term },
			}],
		},
	});
	type R6_0 = Node<'Fn'>;
	type R6_1 = Reducer<'Fn', R6_0>;
	type R6_2 = Reducer<'.', R6_1>;
	type R6_3 = Reducer<'(', R6_2>;
	type R6_4 = Reducer<'Fn,+', R6_3>;
	type R6_5 = Reducer<')', R6_4>;
	const r6: R6_5 = ({ to }) => fns => () => () => fn => ({
		type: 'Fn',
		from: fn.from,
		to,
		payload: {
			term: null,
			car: fn,
			cdr: fns.payload,
		},
	});
	type R7_0 = Node<'Fn'>;
	type R7_1 = Reducer<'Fn', R7_0>;
	type R7_2 = Reducer<'.', R7_1>;
	type R7_3 = Reducer<'(', R7_2>;
	type R7_4 = Reducer<'nat', R7_3>;
	type R7_5 = Reducer<')', R7_4>;
	const r7: R7_5 = ({ to }) => nat => () => () => fn => ({
		type: 'Fn',
		from: fn.from,
		to,
		payload: {
			term: null,
			car: fn,
			cdr: nat,
		},
	});
	type R8_0 = Node<'Fn,+'>;
	type R8_1 = Reducer<'Fn', R8_0>;
	const r8: R8_1 = fn => ({
		type: 'Fn,+',
		from: fn.from,
		to: fn.to,
		payload: [fn],
	});
	type R9_0 = Node<'Fn,+'>;
	type R9_1 = Reducer<'Fn', R9_0>;
	type R9_2 = Reducer<',', R9_1>;
	const r9: R9_2 = ({ to }) => fn => ({
		type: 'Fn,+',
		from: fn.from,
		to,
		payload: [fn],
	});
	type R10_0 = Node<'Fn,+'>;
	type R10_1 = Reducer<'Fn', R10_0>;
	type R10_2 = Reducer<',', R10_1>;
	type R10_3 = Reducer<'Fn,+', R10_2>;
	const r10: R10_3 = fns => () => fn => ({
		type: 'Fn,+',
		from: fn.from,
		to: fns.to,
		payload: [fn, ...fns.payload],
	});
	type R11_0 = Node<'Term'>;
	type R11_1 = Reducer<'=', R11_0>;
	type R11_2 = Reducer<'nat', R11_1>;
	type R11_3 = Reducer<'/', R11_2>;
	type R11_4 = Reducer<'nat', R11_3>;
	const r11: R11_4 = arity => () => nat => ({ from }) => ({
		type: 'Term',
		from,
		to: arity.to,
		payload: {
			type: 'c',
			arity,
			value: nat,
		},
	});
	type R12_0 = Node<'Term'>;
	type R12_1 = Reducer<'+', R12_0>;
	const r12: R12_1 = ({ from, to }) => ({
		type: 'Term',
		from,
		to,
		payload: {
			type: 's',
		},
	});
	type R13_0 = Node<'Term'>;
	type R13_1 = Reducer<'#', R13_0>;
	type R13_2 = Reducer<'nat', R13_1>;
	type R13_3 = Reducer<'/', R13_2>;
	type R13_4 = Reducer<'nat', R13_3>;
	const r13: R13_4 = arity => () => nat => ({ from }) => ({
		type: 'Term',
		from,
		to: arity.to,
		payload: {
			type: 'p',
			arity,
			index: nat,
		},
	});
	type R14_0 = Node<'Term'>;
	type R14_1 = Reducer<'^', R14_0>;
	type R14_2 = Reducer<'(', R14_1>;
	type R14_3 = Reducer<'Fn', R14_2>;
	type R14_4 = Reducer<',', R14_3>;
	type R14_5 = Reducer<'Fn', R14_4>;
	type R14_6 = Reducer<')', R14_5>;
	const r14: R14_6 = ({ to }) => inductive => () => base => () => ({ from }) => ({
		type: 'Term',
		from,
		to,
		payload: {
			type: 'r',
			base,
			inductive,
		},
	});
	type R15_0 = Node<'Term'>;
	type R15_1 = Reducer<'?', R15_0>;
	type R15_2 = Reducer<'(', R15_1>;
	type R15_3 = Reducer<'Fn', R15_2>;
	type R15_4 = Reducer<')', R15_3>;
	const r15: R15_4 = ({ to }) => fn => () => ({ from }) => ({
		type: 'Term',
		from,
		to,
		payload: {
			type: 'm',
			pred: fn,
		},
	});
	type R16_0 = Node<'Term'>;
	type R16_1 = Reducer<'ident', R16_0>;
	const r16: R16_1 = ident => ({
		type: 'Term',
		from: ident.from,
		to: ident.to,
		payload: {
			type: 'i',
			ident: ident,
		},
	});
	type R17_0 = Node<'Main'>;
	type R17_1 = Reducer<'Fn', R17_0>;
	type R17_2 = Reducer<'(', R17_1>;
	type R17_3 = Reducer<'nat,*', R17_2>;
	type R17_4 = Reducer<')', R17_3>;
	const r17: R17_4 = ({ to }) => nats => () => fn => ({
		type: 'Main',
		from: fn.from,
		to,
		payload: {
			fn,
			args: nats.payload,
		},
	});
	type R18_0 = Node<'nat,*'>;
	const r18: (pos: number) => R18_0 = pos => ({
		type: 'nat,*',
		from: pos,
		to: pos,
		payload: [],
	});
	type R19_0 = Node<'nat,*'>;
	type R19_1 = Reducer<'nat,+', R19_0>;
	const r19: R19_1 = nats => ({
		type: 'nat,*',
		from: nats.from,
		to: nats.to,
		payload: nats.payload,
	});
	type R20_0 = Node<'nat,+'>;
	type R20_1 = Reducer<'nat', R20_0>;
	const r20: R20_1 = nat => ({
		type: 'nat,+',
		from: nat.from,
		to: nat.to,
		payload: [nat],
	});
	type R21_0 = Node<'nat,+'>;
	type R21_1 = Reducer<'nat', R21_0>;
	type R21_2 = Reducer<',', R21_1>;
	const r21: R21_2 = ({ to }) => nat => ({
		type: 'nat,+',
		from: nat.from,
		to,
		payload: [nat],
	});
	type R22_0 = Node<'nat,+'>;
	type R22_1 = Reducer<'nat', R22_0>;
	type R22_2 = Reducer<',', R22_1>;
	type R22_3 = Reducer<'nat,+', R22_2>;
	const r22: R22_3 = nats => () => nat => ({
		type: 'nat,+',
		from: nat.from,
		to: nats.to,
		payload: [nat, ...nats.payload],
	});

	function q0(): InternalResult<Node<'Rec'>, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'Rec'> | Node<'Main'> | Node<'Def'> | Node<'Fn'> | Node<'Term'>, Expect>;
		switch(tok?.type) {
			case 'ident':
				reduced = map(q5(), r => r(tok));
			break;
			case '=':
				reduced = map(q7(), r => r(tok));
			break;
			case '+':
				reduced = map(q8(), r => r(tok));
			break;
			case '#':
				reduced = map(q9(), r => r(tok));
			break;
			case '^':
				reduced = map(q10(), r => r(tok));
			break;
			case '?':
				reduced = map(q11(), r => r(tok));
			break;
			default:
			return fail(['ident', '=', '+', '#', '^', '?'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			switch(tok.type) {
				case 'Rec':
				return map(q1(), r => r(tok));
				case 'Main':
					reduced = map(q2(), r => r(tok));
				break;
				case 'Def':
					reduced = map(q3(), r => r(tok));
				break;
				case 'Fn':
					reduced = map(q4(), r => r(tok));
				break;
				case 'Term':
					reduced = map(q6(), r => r(tok));
				break;
			}
		}
	}
	function q1(): InternalResult<Reducer<'Rec', Node<'Rec'>>, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case undefined:
				push(tok);
			return success(ret => ret);
			default:
			return fail([undefined], tok ?? eof);
		}
	}
	function q2(): InternalResult<R1_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case undefined:
				push(tok);
			return success(r1);
			default:
			return fail([undefined], tok ?? eof);
		}
	}
	function q3(): InternalResult<R2_1, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'Rec'> | Node<'Main'> | Node<'Def'> | Node<'Fn'> | Node<'Term'>, Expect>;
		switch(tok?.type) {
			case 'ident':
				reduced = map(q5(), r => r(tok));
			break;
			case '=':
				reduced = map(q7(), r => r(tok));
			break;
			case '+':
				reduced = map(q8(), r => r(tok));
			break;
			case '#':
				reduced = map(q9(), r => r(tok));
			break;
			case '^':
				reduced = map(q10(), r => r(tok));
			break;
			case '?':
				reduced = map(q11(), r => r(tok));
			break;
			default:
			return fail(['ident', '=', '+', '#', '^', '?'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			switch(tok.type) {
				case 'Rec':
				return map(q12(), r => r(tok));
				case 'Main':
					reduced = map(q2(), r => r(tok));
				break;
				case 'Def':
					reduced = map(q3(), r => r(tok));
				break;
				case 'Fn':
					reduced = map(q4(), r => r(tok));
				break;
				case 'Term':
					reduced = map(q6(), r => r(tok));
				break;
			}
		}
	}
	function q4(): InternalResult<R5_1 | R6_1 | R7_1 | R17_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '.':
			return map(q14(), r => r(tok));
			case '(':
			return map(q13(), r => r(tok));
			default:
			return fail(['.', '('], tok ?? eof);
		}
	}
	function q5(): InternalResult<R3_1 | R16_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '=':
			return map(q15(), r => r(tok));
			case '.':
			case '(':
				push(tok);
			return success(r16);
			default:
			return fail(['=', '.', '('], tok ?? eof);
		}
	}
	function q6(): InternalResult<R4_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r4);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}
	function q7(): InternalResult<R11_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case 'nat':
			return map(q16(), r => r(tok));
			default:
			return fail(['nat'], tok ?? eof);
		}
	}
	function q8(): InternalResult<R12_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r12);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}
	function q9(): InternalResult<R13_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case 'nat':
			return map(q17(), r => r(tok));
			default:
			return fail(['nat'], tok ?? eof);
		}
	}
	function q10(): InternalResult<R14_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '(':
			return map(q18(), r => r(tok));
			default:
			return fail(['('], tok ?? eof);
		}
	}
	function q11(): InternalResult<R15_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '(':
			return map(q19(), r => r(tok));
			default:
			return fail(['('], tok ?? eof);
		}
	}
	function q12(): InternalResult<R2_2, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case undefined:
				push(tok);
			return success(r2);
			default:
			return fail([undefined], tok ?? eof);
		}
	}
	function q13(): InternalResult<R17_2, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'nat,*'> | Node<'nat,+'>, Expect>;
		switch(tok?.type) {
			case ')':
				push(tok);
				reduced = success(r18(tok.from));
			break;
			case 'nat':
				reduced = map(q22(), r => r(tok));
			break;
			default:
			return fail(['nat', ')'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			switch(tok.type) {
				case 'nat,*':
				return map(q20(), r => r(tok));
				case 'nat,+':
					reduced = map(q21(), r => r(tok));
				break;
			}
		}
	}
	function q14(): InternalResult<R5_2 | R6_2 | R7_2, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'Term'>, Expect>;
		switch(tok?.type) {
			case 'ident':
				reduced = map(q25(), r => r(tok));
			break;
			case '=':
				reduced = map(q7(), r => r(tok));
			break;
			case '(':
			return map(q24(), r => r(tok));
			case '+':
				reduced = map(q8(), r => r(tok));
			break;
			case '#':
				reduced = map(q9(), r => r(tok));
			break;
			case '^':
				reduced = map(q10(), r => r(tok));
			break;
			case '?':
				reduced = map(q11(), r => r(tok));
			break;
			default:
			return fail(['ident', '=', '(', '+', '#', '^', '?'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			switch(tok.type) {
				case 'Term':
				return map(q23(), r => r(tok));
			}
		}
	}
	function q15(): InternalResult<R3_2, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'Fn'> | Node<'Term'> | R3_2, Expect>;
		switch(tok?.type) {
			case 'ident':
				reduced = map(q25(), r => r(tok));
			break;
			case '=':
				reduced = map(q7(), r => r(tok));
			break;
			case '+':
				reduced = map(q8(), r => r(tok));
			break;
			case '#':
				reduced = map(q9(), r => r(tok));
			break;
			case '^':
				reduced = map(q10(), r => r(tok));
			break;
			case '?':
				reduced = map(q11(), r => r(tok));
			break;
			default:
			return fail(['ident', '=', '+', '#', '^', '?'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			if(typeof tok === 'function')
				return success(tok);
			switch(tok.type) {
				case 'Fn':
					reduced = map(q26(), r => r(tok));
				break;
				case 'Term':
					reduced = map(q6(), r => r(tok));
				break;
			}
		}
	}
	function q16(): InternalResult<R11_2, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '/':
			return map(q27(), r => r(tok));
			default:
			return fail(['/'], tok ?? eof);
		}
	}
	function q17(): InternalResult<R13_2, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '/':
			return map(q28(), r => r(tok));
			default:
			return fail(['/'], tok ?? eof);
		}
	}
	function q18(): InternalResult<R14_2, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'Fn'> | Node<'Term'> | R14_2, Expect>;
		switch(tok?.type) {
			case 'ident':
				reduced = map(q25(), r => r(tok));
			break;
			case '=':
				reduced = map(q7(), r => r(tok));
			break;
			case '+':
				reduced = map(q8(), r => r(tok));
			break;
			case '#':
				reduced = map(q9(), r => r(tok));
			break;
			case '^':
				reduced = map(q10(), r => r(tok));
			break;
			case '?':
				reduced = map(q11(), r => r(tok));
			break;
			default:
			return fail(['ident', '=', '+', '#', '^', '?'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			if(typeof tok === 'function')
				return success(tok);
			switch(tok.type) {
				case 'Fn':
					reduced = map(q29(), r => r(tok));
				break;
				case 'Term':
					reduced = map(q6(), r => r(tok));
				break;
			}
		}
	}
	function q19(): InternalResult<R15_2, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'Fn'> | Node<'Term'> | R15_2, Expect>;
		switch(tok?.type) {
			case 'ident':
				reduced = map(q25(), r => r(tok));
			break;
			case '=':
				reduced = map(q7(), r => r(tok));
			break;
			case '+':
				reduced = map(q8(), r => r(tok));
			break;
			case '#':
				reduced = map(q9(), r => r(tok));
			break;
			case '^':
				reduced = map(q10(), r => r(tok));
			break;
			case '?':
				reduced = map(q11(), r => r(tok));
			break;
			default:
			return fail(['ident', '=', '+', '#', '^', '?'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			if(typeof tok === 'function')
				return success(tok);
			switch(tok.type) {
				case 'Fn':
					reduced = map(q30(), r => r(tok));
				break;
				case 'Term':
					reduced = map(q6(), r => r(tok));
				break;
			}
		}
	}
	function q20(): InternalResult<R17_3, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ')':
			return map(q31(), r => r(tok));
			default:
			return fail([')'], tok ?? eof);
		}
	}
	function q21(): InternalResult<R19_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ')':
				push(tok);
			return success(r19);
			default:
			return fail([')'], tok ?? eof);
		}
	}
	function q22(): InternalResult<R20_1 | R21_1 | R22_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ')':
				push(tok);
			return success(r20);
			case ',':
			return map(q32(), r => r(tok));
			default:
			return fail([')', ','], tok ?? eof);
		}
	}
	function q23(): InternalResult<R5_3, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r5);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}
	function q24(): InternalResult<R6_3 | R7_3, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'Fn'> | Node<'Term'> | Node<'Fn,+'>, Expect>;
		switch(tok?.type) {
			case 'ident':
				reduced = map(q25(), r => r(tok));
			break;
			case '=':
				reduced = map(q7(), r => r(tok));
			break;
			case 'nat':
			return map(q34(), r => r(tok));
			case '+':
				reduced = map(q8(), r => r(tok));
			break;
			case '#':
				reduced = map(q9(), r => r(tok));
			break;
			case '^':
				reduced = map(q10(), r => r(tok));
			break;
			case '?':
				reduced = map(q11(), r => r(tok));
			break;
			default:
			return fail(['ident', '=', 'nat', '+', '#', '^', '?'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			switch(tok.type) {
				case 'Fn':
					reduced = map(q35(), r => r(tok));
				break;
				case 'Term':
					reduced = map(q6(), r => r(tok));
				break;
				case 'Fn,+':
				return map(q33(), r => r(tok));
			}
		}
	}
	function q25(): InternalResult<R16_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r16);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}
	function q26(): InternalResult<R3_3 | R5_1 | R6_1 | R7_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			return map(q36(), r => r(tok));
			case '.':
			return map(q14(), r => r(tok));
			default:
			return fail([';', '.'], tok ?? eof);
		}
	}
	function q27(): InternalResult<R11_3, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case 'nat':
			return map(q37(), r => r(tok));
			default:
			return fail(['nat'], tok ?? eof);
		}
	}
	function q28(): InternalResult<R13_3, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case 'nat':
			return map(q38(), r => r(tok));
			default:
			return fail(['nat'], tok ?? eof);
		}
	}
	function q29(): InternalResult<R5_1 | R6_1 | R7_1 | R14_3, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '.':
			return map(q14(), r => r(tok));
			case ',':
			return map(q39(), r => r(tok));
			default:
			return fail(['.', ','], tok ?? eof);
		}
	}
	function q30(): InternalResult<R5_1 | R6_1 | R7_1 | R15_3, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '.':
			return map(q14(), r => r(tok));
			case ')':
			return map(q40(), r => r(tok));
			default:
			return fail(['.', ')'], tok ?? eof);
		}
	}
	function q31(): InternalResult<R17_4, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case undefined:
				push(tok);
			return success(r17);
			default:
			return fail([undefined], tok ?? eof);
		}
	}
	function q32(): InternalResult<R21_2 | R22_2, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'nat,+'>, Expect>;
		switch(tok?.type) {
			case ')':
				push(tok);
			return success(r21);
			case 'nat':
				reduced = map(q22(), r => r(tok));
			break;
			default:
			return fail(['nat', ')'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			switch(tok.type) {
				case 'nat,+':
				return map(q41(), r => r(tok));
			}
		}
	}
	function q33(): InternalResult<R6_4, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ')':
			return map(q42(), r => r(tok));
			default:
			return fail([')'], tok ?? eof);
		}
	}
	function q34(): InternalResult<R7_4, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ')':
			return map(q43(), r => r(tok));
			default:
			return fail([')'], tok ?? eof);
		}
	}
	function q35(): InternalResult<R5_1 | R6_1 | R7_1 | R8_1 | R9_1 | R10_1, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '.':
			return map(q14(), r => r(tok));
			case ')':
				push(tok);
			return success(r8);
			case ',':
			return map(q44(), r => r(tok));
			default:
			return fail(['.', ')', ','], tok ?? eof);
		}
	}
	function q36(): InternalResult<R3_4, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case 'ident':
			case '=':
			case '+':
			case '#':
			case '^':
			case '?':
				push(tok);
			return success(r3);
			default:
			return fail(['ident', '=', '+', '#', '^', '?'], tok ?? eof);
		}
	}
	function q37(): InternalResult<R11_4, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r11);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}
	function q38(): InternalResult<R13_4, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r13);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}
	function q39(): InternalResult<R14_4, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'Fn'> | Node<'Term'> | R14_4, Expect>;
		switch(tok?.type) {
			case 'ident':
				reduced = map(q25(), r => r(tok));
			break;
			case '=':
				reduced = map(q7(), r => r(tok));
			break;
			case '+':
				reduced = map(q8(), r => r(tok));
			break;
			case '#':
				reduced = map(q9(), r => r(tok));
			break;
			case '^':
				reduced = map(q10(), r => r(tok));
			break;
			case '?':
				reduced = map(q11(), r => r(tok));
			break;
			default:
			return fail(['ident', '=', '+', '#', '^', '?'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			if(typeof tok === 'function')
				return success(tok);
			switch(tok.type) {
				case 'Fn':
					reduced = map(q45(), r => r(tok));
				break;
				case 'Term':
					reduced = map(q6(), r => r(tok));
				break;
			}
		}
	}
	function q40(): InternalResult<R15_4, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r15);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}
	function q41(): InternalResult<R22_3, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ')':
				push(tok);
			return success(r22);
			default:
			return fail([')'], tok ?? eof);
		}
	}
	function q42(): InternalResult<R6_5, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r6);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}
	function q43(): InternalResult<R7_5, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r7);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}
	function q44(): InternalResult<R9_2 | R10_2, Expect> {
		const tok = pop();
		let reduced: InternalResult<Node<'Fn'> | Node<'Fn,+'> | Node<'Term'>, Expect>;
		switch(tok?.type) {
			case 'ident':
				reduced = map(q25(), r => r(tok));
			break;
			case '=':
				reduced = map(q7(), r => r(tok));
			break;
			case ')':
				push(tok);
			return success(r9);
			case '+':
				reduced = map(q8(), r => r(tok));
			break;
			case '#':
				reduced = map(q9(), r => r(tok));
			break;
			case '^':
				reduced = map(q10(), r => r(tok));
			break;
			case '?':
				reduced = map(q11(), r => r(tok));
			break;
			default:
			return fail(['ident', '=', ')', '+', '#', '^', '?'], tok ?? eof);
		}
		while(true) {
			if(!reduced.success)
				return reduced;
			const tok = reduced.value;
			switch(tok.type) {
				case 'Fn':
					reduced = map(q35(), r => r(tok));
				break;
				case 'Term':
					reduced = map(q6(), r => r(tok));
				break;
				case 'Fn,+':
				return map(q46(), r => r(tok));
			}
		}
	}
	function q45(): InternalResult<R5_1 | R6_1 | R7_1 | R14_5, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case '.':
			return map(q14(), r => r(tok));
			case ')':
			return map(q47(), r => r(tok));
			default:
			return fail(['.', ')'], tok ?? eof);
		}
	}
	function q46(): InternalResult<R10_3, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ')':
				push(tok);
			return success(r10);
			default:
			return fail([')'], tok ?? eof);
		}
	}
	function q47(): InternalResult<R14_6, Expect> {
		const tok = pop();
		switch(tok?.type) {
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
				push(tok);
			return success(r14);
			default:
			return fail([';', '.', '(', ')', ','], tok ?? eof);
		}
	}

	function fail<T>(expected: (Terminal | undefined)[], actual: NodeTerm | number): InternalResult<T, Expect> {
		return {
			success: false,
			from: typeof actual === 'object'
				? actual.from
				: actual,
			to: typeof actual === 'object'
				? actual.to
				: actual,
			error: [expected, typeof actual === 'object' ? actual.type : undefined],
		};
	}
	function pop(): NodeTerm | undefined {
		if(iter.length !== 0)
			return iter.pop();
	}
	function push(tok: NodeTerm | undefined) {
		if(tok !== undefined)
			iter.push(tok);
	}

	function symbolName(type: Terminal | Nonterminal): [string, '이' | '가', string] {
		const
			name = SYMBOL_NAME[type] ?? `'${type}'`,
			이 = 가.has(type) ? '가' : '이';
		return [name, 이, `${name}${이}`];
	}
	const iter = [...tokens].reverse();
	const parsed = q0();
	if(parsed.success)
		return parsed;

	const [expected, actual] = parsed.error;
	let eofExpected = expected.some(x => x === undefined);
	const expectedArr: Terminal[] = expected.filter(x => x !== undefined);
	return {
		...parsed,
		error: `${
			expectedArr.length !== 0
				? `${
					expectedArr.map(x => symbolName(x)[0]).join(', ')
				}${
					eofExpected ? ' 혹은 ' : `${symbolName(expectedArr[expectedArr.length - 1])[1]} 올 `
				}`
				: ''
		}${
			eofExpected
				? '코드가 끝날 '
				: ''
		}위치에${
			actual === undefined
				? '서 코드가 끝났습니다'
				: ` ${symbolName(actual)[2]} 올 수 없습니다`
		}.`
	};
}

function lex(str: string): InternalResult<NodeTerm[], string> {
	function q0(i: number): InternalResult<[number, Terminal | undefined], undefined> {
		const cls = charClass(chars[i]);
		switch(cls) {
			case 'A':
			case '_':
			return q2(i + 1);
			case '0':
			return q6(i + 1);
			case ' ':
			case '\n':
			return q4(i + 1);
			case '/':
			return q5(i + 1);
			case '=':
			case ';':
			case '.':
			case '(':
			case ')':
			case ',':
			case '+':
			case '#':
			case '^':
			case '?':
			return success([i + 1, cls]);
			default:
			return fail(i);
		}
	}
	function q1(i: number): InternalResult<[number, 'nat'], undefined> {
		switch(charClass(chars[i])) {
			case '0':
			return q6(i + 1);
			default:
			return fail(i);
		}
	}
	function q2(i: number): InternalResult<[number, 'ident'], undefined> {
		let attempt: InternalResult<[number, 'ident'], undefined> = fail(i);
		switch(charClass(chars[i])) {
			case 'A':
			case '0':
			case '_':
				attempt = q2(i + 1);
			break;
		}
		return retry(
			attempt,
			success([i, 'ident'])
		);
	}
	function q3(i: number): InternalResult<[number, undefined], undefined> {
		let attempt: InternalResult<[number, undefined], undefined> = fail(i);
		switch(charClass(chars[i])) {
			default:
				attempt = q3(i + 1);
			break;
			case '\n':
			return success([i + 1, undefined]);
			case undefined:
			break;
		}
		return retry(
			attempt,
			success([i, undefined])
		);
	}
	function q4(i: number): InternalResult<[number, undefined], undefined> {
		let attempt: InternalResult<[number, undefined], undefined> = fail(i);
		switch(charClass(chars[i])) {
			case ' ':
			case '\n':
				attempt = q4(i + 1);
			break;
		}
		return retry(
			attempt,
			success([i, undefined])
		);
	}
	function q5(i: number): InternalResult<[number, '/' | undefined], undefined> {
		let attempt: InternalResult<[number, undefined], undefined> = fail(i);
		switch(charClass(chars[i])) {
			case '/':
				attempt = q3(i + 1);
			break;
		}
		return retry(
			attempt,
			success([i, '/'])
		);
	}
	function q6(i: number): InternalResult<[number, 'nat'], undefined> {
		let attempt: InternalResult<[number, 'nat'], undefined> = fail(i);
		switch(charClass(chars[i])) {
			case '0':
				attempt = q6(i + 1);
			break;
			case '_':
				attempt = q1(i + 1);
			break;
		}
		return retry(
			attempt,
			success([i, 'nat'])
		);
	}

	function fail<T>(pos: number): InternalResult<T, undefined> {
		return {
			success: false,
			from: pos,
			to: pos,
			error: undefined,
		};
	}
	function retry<T, U>(lhs: InternalResult<[number, T], undefined>, rhs: InternalResult<[number, U], undefined>): InternalResult<[number, T | U], undefined> {
		return lhs.success
			? lhs
			: rhs;
	}

	function charClass(char: string | undefined): 'A' | '0' | ' ' | '_' | '\n' | '/' | '=' | ';' | '.' | '(' | ')' | ',' | '+' | '#' | '^' | '?' | null | undefined {
		if(char === undefined)
			return undefined;
		if('A' <= char && char <= 'Z' || 'a' <= char && char <= 'z')
			return 'A';
		if('0' <= char && char <= '9')
			return '0';
		if(char == '_' || char == '\n' || char == '/' || char == '=' || char == ';' || char == '.' || char == '(' || char == ')' || char == ',' || char == '+' || char == '#' || char == '^' || char == '?')
			return char;
		if('\t' <= char && char <= '\r' || char == ' ' || char == '\xa0')
			return ' ';
		return null;
	}

	const tokens: NodeTerm[] = [];
	const chars = [...str];
	let i = 0;
	while(i < chars.length) {
		const parsed = q0(i);
		if(!parsed.success)
			return {
				...parsed,
				error: '잘못된 토큰을 입력받았습니다.',
			};
		const [to, type] = parsed.value;
		if(type !== undefined)
			if(type === 'ident')
				tokens.push({
					from: i,
					to,
					type,
					payload: chars.slice(i, to).join(''),
				});
			else if(type === 'nat')
				tokens.push({
					from: i,
					to,
					type,
					payload: BigInt(chars.slice(i, to).filter(x => x !== '_').join('')),
				});
			else
				tokens.push({
					from: i,
					to,
					type,
					payload: {},
				});
		i = to;
	}
	return success(tokens);
}

export type Error = {
	pos: [number, number],
	fromUTF16: number,
	toUTF16: number,
	error: string,
};
export type Result<T> = {
	success: true,
	value: T,
} | { success: false } & Error;
export function compile(str: string): Result<GrfProg> {
	function error(err: {
		from: number,
		to: number,
		error: string,
	}): Result<never> {
		function indexToPos(index: number): [number, number] {
			let from = 0, to = lines.length - 1;
			while(from < to) {
				const mid = Math.floor((from + to)/2);
				if(index < lines[mid + 1].index)
					to = mid;
				else
					from = mid + 1;
			}
			return [from, index - lines[from].index];
		}
		return {
			success: false,
			pos: indexToPos(err.from),
			fromUTF16: chars.slice(0, err.from).join('').length,
			toUTF16: chars.slice(0, err.to).join('').length,
			error: err.error,
		};
	}

	const lines: {
		index: number,
		chars: string[],
	}[] = [{
		index: 0,
		chars: [],
	}];
	const chars = [...str];
	for(const [i, char] of chars.entries()) {
		lines[lines.length - 1].chars.push(char);
		if(char === '\n')
			lines.push({
				index: i + 1,
				chars: [],
			});
	}
	const lexed = lex(str);
	if(!lexed.success)
		return error(lexed);
	const parsed = parse(lexed.value, chars.length);
	if(!parsed.success)
		return error(parsed);
	const checked = check(parsed.value);
	if(!checked.success)
		return error(checked);
	return checked;
}