import { parseJobRequest } from '../../src/Network/JobRequest'

describe('parseJobRequest', () => {
	it('accepts a valid job request', () => {
		// Arrange
		const valid = {
			image: 'alpine:latest',
			target: 'all',
		}

		// Act
		const parsed = parseJobRequest(JSON.stringify(valid))

		// Assert
		expect(parsed).toStrictEqual(valid)
	})

	it('rejects an ill-typed job request', () => {
		// Arrange
		const missing = { image: 'alpine:latest' }
		const badType = { image: 'alpine:latest', target: 420.69 }

		// Act
		const missingParsed = parseJobRequest(JSON.stringify(missing))
		const badTypeParsed = parseJobRequest(JSON.stringify(badType))

		// Assert
		expect(missingParsed).toBeUndefined()
		expect(badTypeParsed).toBeUndefined()
	})

	it('rejects a syntactically invalid job request', () => {
		// Arrange
		const bogus = 'hello world!'

		// Act
		const parsed = parseJobRequest(bogus)

		// Assert
		expect(parsed).toBeUndefined()
	})
})
