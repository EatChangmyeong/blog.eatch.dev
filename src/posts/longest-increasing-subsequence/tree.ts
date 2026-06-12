export type Tree<T> = {
	value: T,
	children: Tree<T>[],
};
export type PositionedNode<T> = {
	value: T,
	x: number,
	y: number,
	parent: PositionedNode<T> | undefined,
};

export function layoutSparse<T>(u: Tree<T>, x: number, y: number): {
	nodes: PositionedNode<T>[],
	x: number,
	y: number,
	width: number,
	height: number,
} {
	function go(u: Tree<T>, x: number, y: number, parent: PositionedNode<T> | undefined): [number, number] {
		let width = 1;
		let height = 0;
		const u_ = {
			value: u.value,
			x, y, parent,
		};
		nodes.push(u_);
		for(const v of u.children) {
			const [w, h] = go(v, x + 1, y + height, u_);
			width = Math.max(width, w + 1);
			height += h;
		}
		return [width, Math.max(height, 1)];
	}

	const nodes: PositionedNode<T>[] = [];
	const [width, height] = go(u, x, y, undefined);
	return { nodes, x, y, width, height };
}
export function layoutDense<T>(u: Tree<T>, x: number, y: number): {
	nodes: PositionedNode<T>[],
	x: number,
	y: number,
	width: number,
	height: number,
} {
	type Shape = [number, number][];
	type T_ = {
		value: T,
		delta: number[],
	};

	function measure(u: Tree<T>): [Tree<T_>, Shape] {
		const shape: Shape = [[0, 1]];
		const delta: number[] = [];
		const children = u.children.map(v => {
			const [v_, s] = measure(v);
			let d = 0;
			for(let i = 0; i < s.length && i + 1 < shape.length; i++)
				d = Math.max(d, shape[i + 1][1] - s[i][0]);
			for(let i = 0; i < s.length; i++)
				if(i + 1 < shape.length)
					shape[i + 1][1] = s[i][1] + d;
				else
					shape.push([s[i][0] + d, s[i][1] + d]);
			delta.push(d);
			return v_;
		});
		return [
			{
				value: {
					value: u.value,
					delta,
				},
				children,
			},
			shape,
		];
	}
	function go(u: Tree<T_>, x: number, y: number, parent: PositionedNode<T> | undefined) {
		const u_ = {
			value: u.value.value,
			x, y, parent,
		};
		nodes.push(u_);
		for(let i = 0; i < u.children.length; i++)
			go(u.children[i], x + 1, y + u.value.delta[i], u_);
	}

	const nodes: PositionedNode<T>[] = [];
	const [measured, shape] = measure(u);
	go(measured, x, y, undefined);
	return {
		nodes, x, y,
		width: shape.length,
		height: shape.reduce((acc, [, x]) => Math.max(acc, x), 0),
	};
}