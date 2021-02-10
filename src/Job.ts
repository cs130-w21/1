export interface Job {
	getName(): string
	getPrerequisitesIterable(): Iterable<Job>
	isSource(): boolean
	toString(): string
	getNumPrerequisites(): number
}
