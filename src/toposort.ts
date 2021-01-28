interface NodeJob {
	jobID: number
	requirements: Set<number>
	prereqTo: Set<number>
}
type JobDictionary = Map<number, NodeJob> // maps a jobid to the job
//working on the assumption that we are given the requirements and prereqs
//for a target

function getSourceIDs(dict: JobDictionary) {
	return Array.from(dict.values())
		.filter((job) => job.requirements.size == 0)
		.map((job) => job.jobID)
}

function getJobDictionary(jobs: Array<NodeJob>) {
	const jobDict: JobDictionary = jobs.reduce((map, job) => {
		map.set(job.jobID, job)
		return map
	}, new Map())

	for (const job of jobDict.values()) {
		for (const requirement of job.requirements) {
			jobDict.get(requirement)?.prereqTo.add(job.jobID)
		}
	}
	return jobDict
}

export function topoSortJobs(jobs: Array<NodeJob>): number[] {
	const sortedJobIDs: Array<number> = []

	//places all nodes into the dictionary
	const jobDict = getJobDictionary(jobs)

	while (jobDict.size > 0) {
		//find sources
		const sourceIDs = getSourceIDs(jobDict)

		if (sourceIDs.length == 0) {
			//if there are no sources then each target has a requirement and there is no source
			//we cannot proceed
			console.log('There are circular dependencies\nInvalid Makefile')
			return []
		}
		//console.log("Sources for round " + roundNum + ": " + source);

		sourceIDs.sort((sourceID1, sourceID2) => {
			const source1 = jobDict.get(sourceID1)
			const source2 = jobDict.get(sourceID2)

			if (source1 && source2) {
				return source1.prereqTo.size - source2.prereqTo.size
			} else {
				throw 'huh'
			}
		})

		sortedJobIDs.push(...sourceIDs)

		for (const sourceID of sourceIDs) {
			const source = jobDict.get(sourceID)

			if (source) {
				for (const prereqTo of source.prereqTo) {
					const targetJob = jobDict.get(prereqTo)

					if (targetJob) {
						targetJob.requirements.delete(sourceID)
					} else {
						throw 'huh'
					}
				}
			} else {
				throw 'huh'
			}

			jobDict.delete(sourceID)
		}
	}

	return sortedJobIDs
}
