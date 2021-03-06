import { parse, unexpected } from '../../src/Network/NetParse'
import { Request } from '../../src/Network/Request'

describe('parse', () => {
	it('accepts a valid request', () => {
		// Arrange
		const valid = { action: 'job', image: 'alpine:latest', target: 'all' }

		// Act
		const parsed = parse(Request, JSON.stringify(valid))

		// Assert
		expect(parsed).toStrictEqual(valid)
	})

	it('rejects an ill-typed request', () => {
		// Arrange
		const missing = { image: 'alpine:latest', target: 'all' }
		const badType = { action: 'job', image: 'alpine:latest', target: 420.69 }
		const wrongTag = { action: 'get', image: 'alpine:latest', target: 'all' }

		// Act
		const missingParsed = parse(Request, JSON.stringify(missing))
		const badTypeParsed = parse(Request, JSON.stringify(badType))
		const wrongTagParsed = parse(Request, JSON.stringify(wrongTag))

		// Assert
		expect(missingParsed).toBeUndefined()
		expect(badTypeParsed).toBeUndefined()
		expect(wrongTagParsed).toBeUndefined()
	})

	it('rejects a syntactically invalid request', () => {
		// Arrange
		const bogus = 'hello world!'

		// Act
		const parsed = parse(Request, bogus)

		// Assert
		expect(parsed).toBeUndefined()
	})
})

describe('unexpected', () => {
	it('throws with useful message if actually called', () => {
		// Arrange
		const NEVER_VALUE = 'The quick brown fox'

		// Act + Assert
		expect(() => unexpected(NEVER_VALUE as never)).toThrow(NEVER_VALUE)
	})
})
