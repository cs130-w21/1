export interface Job {
	name: string
	incompletePrerequisites: Set<Job>
	isSource(): boolean
	toString(): string
}
