import { strict as assert } from 'assert'
import { Job } from '../Job/Job'
import { NormalJob } from '../Job/NormalJob'

interface JobAndDependency {
	job: Job
	hasDependent: boolean
}

interface TargetLineAndCommands {
	targetLine: string
	commands: string[]
}

const targetLineRegexWithPrereqs = /^.+: update target '(.+)' due to: (.+)$/
const targetLineRegexWithoutPrereqs = /^.+: target '(.+)' does not exist$/

// Extract target and prerequisites from target line. It must match one of two regular expressions.
function extractInfoFromTargetLine(targetLine: string) {
	const matchesWithPrereqs = targetLineRegexWithPrereqs.exec(targetLine)
	const matchesWithoutPrereqs = targetLineRegexWithoutPrereqs.exec(targetLine)

	let target: string
	let prerequisiteJobTargets: string[]
	if (matchesWithPrereqs && matchesWithPrereqs[1] && matchesWithPrereqs[2]) {
		target = matchesWithPrereqs[1]
		prerequisiteJobTargets = matchesWithPrereqs[2].split(' ')
	} else {
		assert(
			matchesWithoutPrereqs && matchesWithoutPrereqs[1],
			`Target line was rejected by regex: ${targetLine}.`,
		)
		target = matchesWithoutPrereqs[1]
		prerequisiteJobTargets = []
	}

	return { target, prerequisiteJobTargets }
}

function extractTargetLinesAndCommands(traceLines: string[]) {
	const targetLinesWithCommands: TargetLineAndCommands[] = []

	for (const line of traceLines) {
		if (
			targetLineRegexWithPrereqs.test(line) ||
			targetLineRegexWithoutPrereqs.test(line)
		) {
			targetLinesWithCommands.push({ targetLine: line, commands: [] })
		} else {
			assert(
				targetLinesWithCommands.length > 0,
				'Makefile command supplied before any targets',
			)
			targetLinesWithCommands[
				targetLinesWithCommands.length - 1
			]?.commands.push(line)
		}
	}

	return targetLinesWithCommands
}

/**
 * Algorithm bs.
 *
 * @param targetLinesWithCommands - The targets and their associated commands.
 * @returns the root jobs
 */
function constructDAGFromTargetsAndCommands(
	targetLinesWithCommands: TargetLineAndCommands[],
) {
	// We need to know whether a Job has dependents so we can isolate the root jobs later.
	const targetToJAD = new Map<string, JobAndDependency>()

	// Construct DAG.
	for (const { targetLine, commands } of targetLinesWithCommands) {
		// Extract target and prerequisites from target line.
		const { target, prerequisiteJobTargets } = extractInfoFromTargetLine(
			targetLine,
		)

		// Find all prerequisite jobs. If no Job has some target, then the target is (hopefully) a preexisting file and we can ignore it. Also marks prerequisite Jobs as having dependents.
		const prerequisiteJobs: Set<Job> = new Set()
		for (const prerequisiteJobTarget of prerequisiteJobTargets) {
			const prerequisiteJobAndDependency = targetToJAD.get(
				prerequisiteJobTarget,
			)

			if (prerequisiteJobAndDependency) {
				prerequisiteJobs.add(prerequisiteJobAndDependency.job)
				prerequisiteJobAndDependency.hasDependent = true
			}
		}

		// We should not be seeing the same target twice.
		assert(
			!targetToJAD.has(target),
			`Target "${target}" exists twice in the provided Makefile trace.`,
		)
		targetToJAD.set(target, {
			job: new NormalJob(target, commands, prerequisiteJobs),
			hasDependent: false,
		})
	}

	const rootJobs = new Set<Job>()
	for (const jobAndDependency of targetToJAD.values()) {
		if (!jobAndDependency.hasDependent) {
			rootJobs.add(jobAndDependency.job)
		}
	}

	return rootJobs
}

export function makefileTraceToJobTree(trace: string): Set<Job> {
	const traceLines = trace.split('\n')

	// Jobs are intended to be immutable, so its easiest to compile all the information for a single Job at once.
	const targetLinesWithCommands: TargetLineAndCommands[] = extractTargetLinesAndCommands(
		traceLines,
	)

	return constructDAGFromTargetsAndCommands(targetLinesWithCommands)
}
