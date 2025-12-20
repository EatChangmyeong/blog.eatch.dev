export type GrfFn = {
	type: 'c',
	arity: number,
	value: bigint,
} | {
	type: 's',
} | {
	type: 'p',
	arity: number,
	index: number,
} | {
	type: '.',
	car: GrfFn,
	cdr: GrfFn[],
} | {
	type: 'r',
	base: GrfFn,
	inductive: GrfFn,
} | {
	type: 'm',
	pred: GrfFn,
} | {
	type: '_',
	fn: keyof typeof BUILTIN_DECL,
};
export type GrfProg = [GrfFn, bigint[]];
export type BuiltinSymbol = keyof typeof BUILTIN_DECL;

export const BUILTIN_DECL = {
	add: 2,
	pred: 1,
	sub: 2,
	mul: 2,
	div: 2,
	mod: 2,
	pow: 2,
	eq: 2,
	ne: 2,
	lt: 2,
	le: 2,
	gt: 2,
	ge: 2,
	and: 2,
	or: 2,
	not: 1,
	if: 2,
} satisfies Record<string, number>;