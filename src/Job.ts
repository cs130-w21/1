export interface Job {
	prerequisites: Set<Job>
}

export interface JobWithDependents extends Job {
	dependents: Set<JobWithDependents>
	prerequisites: Set<JobWithDependents>
}
