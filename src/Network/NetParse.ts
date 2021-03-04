import * as t from 'io-ts'
import { parseJSON, toError, isLeft } from 'fp-ts/Either'

/**
 * Parse a strongly typed object from its JSON serialization.
 * @param type - An io-ts codec that accepts JSON-compatible objects as input.
 * @param input - The JSON source to parse.
 * @returns The parsed type instance, or undefined if the input is invalid.
 */
export function parse<A>(
	type: t.Type<A, unknown, unknown>,
	input: string,
): A | undefined {
	// Doing this the functional way was taking a lot more time than it does in Haskell ;)
	const parsed = parseJSON(input, toError)
	if (isLeft(parsed)) {
		return undefined
	}

	const decoded = type.decode(parsed.right)
	if (isLeft(decoded)) {
		return undefined
	}

	return decoded.right
}

/**
 * Utility function that fails to compile unless the expression is impossible.
 * It's useful for ensuring that a `switch` statement handles all cases.
 * @see https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-exhaustiveness-checking
 *
 * @param x - The expression that should never happen.
 *
 * @throws {@link TypeError}
 * If the function actually gets called.
 */
export function unexpected(x: never): never {
	throw new TypeError(`Unexpected ${x as string}`)
}
