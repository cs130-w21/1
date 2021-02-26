import { parse } from '../../src/Network/NetParse'
import { JobRequest } from '../../src/Network/JobRequest'

describe('parse', () => {
	it('accepts a valid job request', () => {
		// Arrange
		const valid = { image: 'alpine:latest', target: 'all' }

		// Act
		const parsed = parse(JobRequest, JSON.stringify(valid))

		// Assert
		expect(parsed).toStrictEqual(valid)
	})

	it('rejects an ill-typed job request', () => {
		// Arrange
		const missing = { image: 'alpine:latest' }
		const badType = { image: 'alpine:latest', target: 420.69 }

		// Act
		const missingParsed = parse(JobRequest, JSON.stringify(missing))
		const badTypeParsed = parse(JobRequest, JSON.stringify(badType))

		// Assert
		expect(missingParsed).toBeUndefined()
		expect(badTypeParsed).toBeUndefined()
	})

	it('rejects a syntactically invalid job request', () => {
		// Arrange
		const bogus = 'hello world!'

		// Act
		const parsed = parse(JobRequest, bogus)

		// Assert
		expect(parsed).toBeUndefined()
	})
})
