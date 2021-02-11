export interface Job {
	getName(): string
	getPrerequisitesIterable(): Iterable<Job>
	isSource(): boolean
	getNumPrerequisites(): number
}
