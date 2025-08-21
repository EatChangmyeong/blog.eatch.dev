export default {
	notation: {
		alg: {
			$: 'https://tc39.es/ecma262/multipage/notational-conventions.html#sec-algorithm-conventions',
			runtime: {
				returnifabrupt_short: 'https://tc39.es/ecma262/multipage/notational-conventions.html#sec-returnifabrupt-shorthands',
			},
			math: 'https://tc39.es/ecma262/multipage/notational-conventions.html#sec-mathematical-operations',
			value: 'https://tc39.es/ecma262/multipage/notational-conventions.html#sec-value-notation',
		},
	},
	type: {
		lang: {
			$: 'https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types',
			boolean: 'https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types-boolean-type',
			string: {
				$: 'https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types-string-type',
				concat: 'https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#string-concatenation',
			},
			numeric: {
				number: {
					$: 'https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types-number-type',
					add: 'https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-add',
				},
				bigint: 'https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types-bigint-type',
			},
			object: 'https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-object-type',
		},
		spec: {
			list: 'https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-list-and-record-specification-type',
		},
	},
	abs: {
		conv: {
			toprimitive: 'https://tc39.es/ecma262/multipage/abstract-operations.html#sec-toprimitive',
			tonumeric: 'https://tc39.es/ecma262/multipage/abstract-operations.html#sec-tonumeric',
			tonumber: {
				$: 'https://tc39.es/ecma262/multipage/abstract-operations.html#sec-tonumber',
				string: {
					stringtonumber: 'https://tc39.es/ecma262/multipage/abstract-operations.html#sec-stringtonumber',
					stringnumericvalue: 'https://tc39.es/ecma262/multipage/abstract-operations.html#sec-runtime-semantics-stringnumericvalue',
				},
			},
			tostring: 'https://tc39.es/ecma262/multipage/abstract-operations.html#sec-tostring',
		},
		test: {
			sametype: 'https://tc39.es/ecma262/multipage/abstract-operations.html#sec-sametype',
			islooselyequal: 'https://tc39.es/ecma262/multipage/abstract-operations.html#sec-islooselyequal',
			isstrictlyequal: 'https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal',
		},
	},
	syn: {
		eval: 'https://tc39.es/ecma262/multipage/syntax-directed-operations.html#sec-evaluation',
	},
	expr: {
		unary: {
			prod: 'https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#prod-UnaryExpression',
			typeof: {
				eval: 'https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-typeof-operator-runtime-semantics-evaluation',
			},
		},
		additive: {
			add: {
				eval: 'https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-addition-operator-plus-runtime-semantics-evaluation',
			},
		},
		assign: {
			applystringornumericbinaryoperator: 'https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-applystringornumericbinaryoperator',
			evaluatestringornumericbinaryexpression: 'https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-evaluatestringornumericbinaryexpression',
		},
	},
	num: {
		math: {
			fn: {
				max: 'https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.max',
				min: 'https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.min',
			},
		},
	},
};
