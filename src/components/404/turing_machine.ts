export type Transition<
	Symbol extends number,
	State extends number
> = [Symbol, boolean, State | null];
export type Rule<
	Symbol extends number,
	State extends number
> = Record<Symbol, Transition<Symbol, State>>;
export type TuringMachine<
	Symbol extends number,
	State extends number
> = Record<State, Rule<Symbol, State>>;

// Skelet's 43 holdouts: https://bbchallenge.org/skelet
export default [
	[[[1,true,2],[1,true,4]],[[1,true,null],[1,true,3]],[[1,false,3],[0,true,3]],[[1,true,0],[1,false,4]],[[0,true,1],[0,false,2]]],
	[[[1,true,2],[0,false,4]],[[1,true,null],[0,false,2]],[[1,false,3],[0,true,0]],[[1,false,0],[1,false,3]],[[1,true,0],[0,false,1]]],
	[[[1,true,2],[0,false,0]],[[1,true,null],[1,true,4]],[[1,false,3],[0,true,1]],[[1,false,0],[1,false,2]],[[0,true,2],[1,true,3]]],
	[[[1,true,2],[0,false,3]],[[1,true,null],[0,true,4]],[[1,false,3],[1,true,2]],[[1,true,4],[1,false,0]],[[1,true,1],[0,true,3]]],
	[[[1,true,2],[1,true,0]],[[1,true,null],[0,true,3]],[[1,false,3],[0,true,4]],[[1,true,0],[0,false,2]],[[1,false,2],[0,true,1]]],
	[[[1,true,2],[0,false,1]],[[1,true,null],[0,false,3]],[[1,true,3],[0,false,0]],[[1,false,4],[0,true,2]],[[1,false,2],[1,false,4]]],
	[[[1,true,2],[0,false,1]],[[1,true,null],[1,false,4]],[[1,true,3],[1,true,0]],[[1,false,0],[0,true,3]],[[0,false,0],[1,false,2]]],
	[[[1,true,2],[0,false,1]],[[1,true,null],[0,false,2]],[[1,true,3],[0,true,2]],[[0,false,4],[1,true,2]],[[0,false,0],[1,false,4]]],
	[[[1,true,2],[1,false,3]],[[1,true,null],[0,true,2]],[[1,false,0],[1,true,2]],[[1,false,4],[0,false,0]],[[1,true,1],[0,true,4]]],
	[[[1,true,2],[0,true,0]],[[1,true,null],[0,true,2]],[[0,false,3],[1,true,0]],[[1,true,1],[1,false,4]],[[1,false,3],[0,false,4]]],
	[[[1,true,2],[0,true,0]],[[1,true,null],[0,false,0]],[[0,false,3],[1,true,0]],[[0,false,4],[1,false,3]],[[1,true,0],[0,false,1]]],
	[[[1,true,2],[0,true,4]],[[1,true,null],[1,true,4]],[[0,false,3],[1,true,0]],[[0,true,0],[1,false,2]],[[1,false,2],[0,true,1]]],
	[[[1,true,2],[0,false,1]],[[1,true,null],[1,false,0]],[[0,true,3],[1,false,4]],[[0,false,4],[1,true,2]],[[1,false,2],[0,false,0]]],
	[[[1,true,1],[1,true,null]],[[1,false,2],[0,false,4]],[[1,true,3],[0,false,1]],[[0,true,3],[1,true,0]],[[0,false,2],[0,true,0]]],
	[[[1,true,1],[1,true,null]],[[1,true,2],[1,false,1]],[[1,false,3],[1,true,4]],[[1,false,1],[0,false,3]],[[1,true,0],[0,true,2]]],
	[[[1,true,1],[1,true,null]],[[0,false,2],[1,true,3]],[[1,false,3],[1,false,2]],[[1,true,4],[0,true,4]],[[0,true,0],[0,false,1]]],
	[[[1,true,1],[1,true,null]],[[0,false,2],[1,true,4]],[[0,false,3],[1,false,2]],[[1,true,0],[1,false,1]],[[0,true,1],[0,true,0]]],
	[[[1,true,1],[1,true,null]],[[0,true,2],[0,false,3]],[[1,true,3],[0,false,4]],[[1,true,4],[0,true,0]],[[1,false,2],[0,false,3]]],
	[[[1,true,1],[1,true,null]],[[0,true,2],[0,true,1]],[[1,false,2],[0,false,3]],[[1,true,0],[0,false,4]],[[0,false,0],[0,false,4]]],
	[[[1,true,1],[1,true,null]],[[0,true,2],[1,true,3]],[[0,false,3],[1,true,2]],[[1,false,4],[0,true,0]],[[1,true,0],[0,false,4]]],
	[[[1,true,2],[1,true,4]],[[1,true,0],[1,true,null]],[[1,false,3],[0,false,4]],[[1,false,1],[1,false,4]],[[1,false,2],[0,true,0]]],
	[[[1,true,2],[0,true,4]],[[1,false,0],[1,true,null]],[[1,false,3],[0,true,0]],[[0,false,3],[1,false,1]],[[0,true,2],[0,false,1]]],
	[[[1,true,2],[0,false,2]],[[0,true,3],[1,true,null]],[[1,false,3],[0,true,4]],[[1,true,2],[0,false,4]],[[1,false,0],[1,true,1]]],
	[[[1,true,2],[1,true,0]],[[1,false,4],[1,true,null]],[[1,false,3],[0,false,3]],[[0,false,1],[0,true,4]],[[0,true,0],[1,false,2]]],
	[[[1,true,2],[0,false,0]],[[1,true,0],[1,true,null]],[[1,false,3],[1,true,4]],[[1,false,0],[0,false,3]],[[0,true,4],[0,false,1]]],
	[[[1,true,2],[1,false,4]],[[1,false,3],[1,true,null]],[[1,true,3],[0,true,2]],[[1,false,0],[1,true,3]],[[1,false,1],[0,false,0]]],
	[[[1,true,2],[0,false,4]],[[0,true,4],[1,true,null]],[[1,true,3],[0,true,1]],[[1,false,0],[0,true,0]],[[0,false,0],[1,false,4]]],
	[[[1,true,2],[0,true,4]],[[1,false,3],[1,true,null]],[[1,true,1],[1,true,4]],[[1,false,0],[1,false,4]],[[1,true,0],[0,false,3]]],
	[[[1,true,2],[0,false,3]],[[0,true,0],[1,true,null]],[[1,false,0],[0,true,3]],[[1,false,4],[1,true,1]],[[1,true,2],[0,false,2]]],
	[[[1,true,2],[0,true,4]],[[1,false,2],[1,true,null]],[[0,false,3],[1,true,0]],[[1,false,0],[0,false,4]],[[1,false,1],[0,true,4]]],
	[[[1,true,2],[0,false,1]],[[0,false,4],[1,true,null]],[[0,true,3],[1,true,2]],[[1,true,4],[0,true,2]],[[1,false,0],[0,false,2]]],
	[[[1,true,2],[0,false,4]],[[0,true,2],[1,true,null]],[[0,true,3],[0,true,1]],[[1,false,3],[0,false,0]],[[1,false,0],[1,true,3]]],
	[[[1,true,2],[1,false,3]],[[1,false,4],[1,true,null]],[[0,true,3],[0,true,2]],[[1,false,1],[0,false,0]],[[1,false,0],[1,true,4]]],
	[[[1,true,2],[1,false,3]],[[1,false,4],[1,true,null]],[[0,true,3],[0,true,2]],[[1,false,1],[0,false,0]],[[1,false,0],[1,true,0]]],
	[[[1,true,2],[1,false,3]],[[1,false,4],[1,true,null]],[[0,true,3],[0,true,2]],[[1,false,1],[0,false,0]],[[1,false,0],[0,false,0]]],
	[[[1,true,2],[1,false,4]],[[1,false,3],[1,true,null]],[[0,true,3],[0,true,2]],[[1,false,1],[1,true,0]],[[1,true,3],[0,false,0]]],
	[[[1,true,2],[0,false,1]],[[1,false,2],[1,true,null]],[[0,true,3],[0,false,3]],[[1,false,0],[0,true,4]],[[1,true,3],[1,true,4]]],
	[[[1,true,2],[0,true,2]],[[1,true,3],[1,true,null]],[[0,true,1],[0,false,3]],[[0,false,4],[1,true,0]],[[1,false,0],[1,false,4]]],
	[[[1,true,1],[1,true,3]],[[1,false,2],[1,true,null]],[[1,false,4],[1,false,3]],[[1,true,4],[0,false,2]],[[1,true,0],[0,true,3]]],
	[[[1,true,1],[0,true,0]],[[1,false,2],[1,true,null]],[[0,false,2],[0,false,3]],[[1,true,4],[0,true,1]],[[0,true,4],[1,true,0]]],
	[[[1,true,1],[0,false,0]],[[1,true,2],[1,true,null]],[[0,true,3],[1,false,4]],[[1,true,4],[0,true,0]],[[1,false,2],[0,false,0]]],
	[[[1,true,1],[0,false,4]],[[1,true,2],[1,true,null]],[[0,true,3],[0,true,2]],[[1,false,3],[0,false,0]],[[0,false,1],[0,false,4]]],
	[[[1,true,1],[0,false,0]],[[0,true,2],[1,true,null]],[[1,false,2],[1,true,3]],[[1,true,4],[1,false,0]],[[0,true,1],[0,false,3]]]
] satisfies TuringMachine<0 | 1, 0 | 1 | 2 | 3 | 4>[];