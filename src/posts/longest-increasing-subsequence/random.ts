import { uniformInt } from 'pure-rand/distribution/uniformInt';
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';

export type SeqPattern = {
	min: number,
	max: number,
	count?: number,
}[];

export function parsePattern(patternStr: string): [SeqPattern, number | undefined] | undefined {
	const pat: SeqPattern = [];

	patternStr = patternStr.replaceAll(/\s/g, '');
	const splitSeed = patternStr.split('@');
	if(splitSeed.length > 2)
		return;
	const splitPat = splitSeed[0].split(',');
	if(splitPat.length == 0)
		return;
	for(const str of splitPat) {
		const match = /^(?:(\d+)\*)?(\d+)(?:~(\d+))?$/.exec(str);
		if(match === null)
			return;
		const [count, min, max] = (match as (string | undefined)[])
			.slice(1)
			.map(x => x === undefined ? undefined : +x);
		if(
			min === undefined ||
			count !== undefined && count < 1 ||
			min < 0 || min > 9999 ||
			max !== undefined && (max < min || max > 9999)
		)
			return;
		pat.push({ min, max: max ?? min, count });
	}
	const seed = splitSeed[1] === undefined
		? undefined
		: +splitSeed[1];
	if(seed !== undefined && Number.isNaN(seed))
		return;
	return [pat, seed];
}

export function newSeed() {
	return Math.floor(0x100000000*Math.random());
}
export function randomSeq(pattern: SeqPattern, seed: number): number[] {
	const rng = xoroshiro128plus(seed);
	const seq: number[] = [];
	for(const { min, max, count = 1 } of pattern)
		for(let i = 0; i < count; i++)
			seq.push(uniformInt(rng, min, max));
	return seq;
}