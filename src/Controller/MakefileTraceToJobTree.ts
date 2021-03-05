import { strict as assert } from 'assert'
import { Job } from '../Job/Job'
import { NormalJob } from '../Job/NormalJob'

/**
 * A Job and whether or not it has a dependent.
 *
 * Used during DAG construction.
 */
interface JobAndDependency {
	job: Job
	hasDependent: boolean
}

/**
 * A list of target-lines and their associated command-lines.
 *
 * Used during trace parsing.
 */
interface TargetLineAndCommands {
	targetLine: string
	commands: string[]
}

// Regexes used when interpreting target-lines.
const targetLineRegexWithPrereqs = /^.+: update target '(.+)' due to: (.+)$/
const targetLineRegexWithoutPrereqs = /^.+: target '(.+)' does not exist$/

/**
 * Reads a line from a trace containing a target.
 * Extracts the target and any referenced prerequisites.
 *
 * The target line must match one of two recognized Regular Expressions.
 *
 * @param targetLine - a line from a trace containing a target.
 * @returns the target and prerequisites.
 */
function extractInfoFromTargetLine(
	targetLine: string,
): { readonly target: string; readonly prerequisiteJobTargets: string[] } {
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

/**
 * Reads a trace.
 * Extracts a list of lines containing targets, and the associated command-lines to build that target.
 *
 * Considers any line matching one of two Regular Expressions to be a target line.
 * Any other lines are command lines.
 *
 * @param traceLines - an array of strings.
 * @returns a list of target-lines and their associated commands.
 */
function extractTargetLinesAndCommands(
	traceLines: string[],
): TargetLineAndCommands[] {
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
				`Makefile command supplied before any targets:\n${line}`,
			)
			targetLinesWithCommands[
				targetLinesWithCommands.length - 1
			]?.commands.push(line)
		}
	}

	return targetLinesWithCommands
}

/**
 * Creates a DAG tree of Jobs from a list of targets and their associated commands.
 *
 * @param targetLinesWithCommands - the targets and their associated commands.
 * @returns the tree's root jobs.
 */
function constructDAGFromTargetsAndCommands(
	targetLinesWithCommands: TargetLineAndCommands[],
): Set<Job> {
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
		const prerequisiteFiles: Set<string> = new Set()
		for (const prerequisiteJobTarget of prerequisiteJobTargets) {
			const prerequisiteJobAndDependency = targetToJAD.get(
				prerequisiteJobTarget,
			)

			if (prerequisiteJobAndDependency) {
				prerequisiteJobs.add(prerequisiteJobAndDependency.job)
				prerequisiteJobAndDependency.hasDependent = true
			} else {
				prerequisiteFiles.add(prerequisiteJobTarget)
			}
		}

		// We should not be seeing the same target twice.
		assert(
			!targetToJAD.has(target),
			`Target "${target}" exists twice in the provided Makefile trace.`,
		)
		targetToJAD.set(target, {
			job: new NormalJob({
				target,
				commands,
				prerequisiteJobs,
				prerequisiteFiles,
			}),
			hasDependent: false,
		})
	}

	// Get root jobs.
	const rootJobs = new Set<Job>()
	for (const jobAndDependency of targetToJAD.values()) {
		if (!jobAndDependency.hasDependent) {
			rootJobs.add(jobAndDependency.job)
		}
	}

	return rootJobs
}

/**
 * Filters an array of trace-lines.
 * Removes lines that are unnecessary to the DAG constructor.
 *
 * @param traceLines - an array of strings, each of which is a line from a trace.
 * @returns the filtered array of strings.
 */
function filterTraceLines(traceLines: string[]): string[] {
	let filteredTraceLines = traceLines

	// The first line could be make entering a directory.
	if (
		filteredTraceLines[0] &&
		/^make: Entering directory '.*'$/.exec(filteredTraceLines[0])
	) {
		filteredTraceLines = filteredTraceLines.slice(1)
	}

	// The last line could be the emptry string (if the file ends in a newline).
	if (filteredTraceLines[filteredTraceLines.length - 1] === '') {
		filteredTraceLines = filteredTraceLines.slice(0, -1)
	}

	// The last line could be the make leaving a directory.
	if (
		filteredTraceLines.length > 0 &&
		/^make: Leaving directory '.*'$/.exec(
			filteredTraceLines[filteredTraceLines.length - 1],
		)
	) {
		filteredTraceLines = filteredTraceLines.slice(0, -1)
	}

	return filteredTraceLines
}

/**
 * Creates a DAG tree of Jobs from a trace.
 *
 * @param trace - the output from a call to 'make --trace --dry-run'.
 * @returns the tree's root jobs.
 */
export function makefileTraceToJobTree(trace: string): Set<Job> {
	const traceLines = trace.split('\n')
	const filteredTraceLines = filterTraceLines(traceLines)

	// Jobs are intended to be immutable, so its easiest to compile all the information for a single Job at once.
	const targetLinesWithCommands: TargetLineAndCommands[] = extractTargetLinesAndCommands(
		filteredTraceLines,
	)

	return constructDAGFromTargetsAndCommands(targetLinesWithCommands)
}
