export interface Job {
	prerequisites: Set<Job>
	name: string
}
