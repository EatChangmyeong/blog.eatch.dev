import type { GrfFn, BuiltinSymbol, GrfProg } from './lang';

export type Thunk = IterableIterator<undefined, bigint>;

const BUILTIN_DEF: Record<BuiltinSymbol, (args: Thunk[]) => Thunk> = {
	add: function*([x, y]: Thunk[]) { return (yield* x) + (yield* y); },
	pred: function*([x]: Thunk[]) {
		const result = yield* x;
		return result === 0n ? 0n : result;
	},
	sub: function*([x, y]: Thunk[]) {
		const result = (yield* x) - (yield* y);
		return result < 0n ? 0n : result;
	},
	mul: function*([x, y]: Thunk[]) { return (yield* x)*(yield* y); },
	div: function*([x, y]: Thunk[]) {
		const denom = yield* y;
		if(denom === 0n)
			return 0n;
		return (yield* x)/denom;
	},
	mod: function*([x, y]: Thunk[]) {
		const denom = yield* y;
		if(denom === 0n)
			return yield* x;
		return (yield* x)%denom;
	},
	pow: function*([x, y]: Thunk[]) { return (yield* x)**(yield* y); },
	eq: function*([x, y]: Thunk[]) { return BigInt((yield* x) === (yield* y)); },
	ne: function*([x, y]: Thunk[]) { return BigInt((yield* x) !== (yield* y)); },
	lt: function*([x, y]: Thunk[]) { return BigInt((yield* x) < (yield* y)); },
	le: function*([x, y]: Thunk[]) { return BigInt((yield* x) <= (yield* y)); },
	gt: function*([x, y]: Thunk[]) { return BigInt((yield* x) > (yield* y)); },
	ge: function*([x, y]: Thunk[]) { return BigInt((yield* x) >= (yield* y)); },
	and: function*([x, y]: Thunk[]) { return BigInt((yield* x) && (yield* y)); },
	or: function*([x, y]: Thunk[]) { return BigInt((yield* x) || (yield* y)); },
	not: function*([x]: Thunk[]) { return BigInt(!(yield* x)); },
	if: function*([x, y]: Thunk[]) { return BigInt(!(yield* x) || (yield* y)); },
};

function unfuse<T = unknown, TReturn = any>(gen: IterableIterator<T, TReturn>): IterableIterator<T, TReturn> {
	let value: { value: TReturn } | undefined;
	return {
		next() {
			if(!value) {
				const t = gen.next();
				if(!t.done)
					return t;
				value = { value: t.value };
			}
			return {
				value: value.value,
				done: true,
			};
		},
		[Symbol.iterator]() {
			return this;
		},
	};
}
function constant(x: bigint): Thunk {
	return unfuse((function*() {
		return x;
	})());
}

function apply(f: GrfFn, xs: Thunk[]): Thunk {
	return unfuse((function*() {
		yield;
		switch(f.type) {
			case 'c':
			return f.value;
			case 's':
			return (yield* xs[0]) + 1n;
			case 'p':
			return yield* xs[f.index];
			case '.':
			return yield* apply(f.car, f.cdr.map(g => apply(g, xs)));
			case 'r': {
				const [n_, ...xs_] = xs;
				let g = apply(f.base, xs_);
				const n = yield* n_;
				for(let i = 0n; i < n; i++)
					g = apply(f.inductive, [constant(i), g, ...xs_]);
				return yield* g;
			}
			case 'm':
				for(let i = 0n;; i++) {
					const test = yield* apply(f.pred, [constant(i), ...xs]);
					if(test === 0n)
						return i;
				}
			case '_':
			return yield* BUILTIN_DEF[f.fn](xs);
		}
	})());
}

export function toThunk(f: GrfProg): Thunk {
	return apply(f[0], f[1].map(constant));
}