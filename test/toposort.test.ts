import {NodeJob, createTopoSort} from '../src/toposort';

console.log("---t1---");

const f:NodeJob = {jobID : 1, requirements : (new Set<number>()).add(2).add(3), preReqTo: new Set(), oriNumPreReqTo: 0};
const s:NodeJob = {jobID : 2, requirements: new Set<number>(), preReqTo: new Set(), oriNumPreReqTo: 0};
const t:NodeJob = {jobID : 3, requirements: new Set<number>(), preReqTo: new Set(), oriNumPreReqTo: 0};
const fo:NodeJob = {jobID: 4, requirements: (new Set<number>()).add(3), preReqTo: new Set(), oriNumPreReqTo: 0}

console.log("---t2---");

const test2N1:NodeJob = {jobID : 1, requirements : new Set<number>(), preReqTo : new Set(), oriNumPreReqTo: 0};
const test2N2:NodeJob = {jobID : 2, requirements : (new Set<number>()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
const test2N3:NodeJob = {jobID : 3, requirements : (new Set<number>()).add(2), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test2N1,test2N2, test2N3] as Array<NodeJob>);

console.log("---t3---");

const test3N1:NodeJob = {jobID : 1, requirements : new Set<number>(), preReqTo : new Set(), oriNumPreReqTo: 0};
const test3N2:NodeJob = {jobID : 2, requirements : (new Set<number>()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
const test3N3:NodeJob = {jobID : 3, requirements : (new Set<number>()).add(2).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
const test3N4:NodeJob = {jobID : 4, requirements : (new Set<number>()).add(2).add(3), preReqTo : new Set(), oriNumPreReqTo: 0};
const test3N5:NodeJob = {jobID : 5, requirements : (new Set<number>()).add(4), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test3N1, test3N2, test3N3, test3N4, test3N5] as Array<NodeJob>);

console.log("---t4---");

const test4N1:NodeJob = {jobID : 1, requirements : new Set<number>(), preReqTo : new Set(), oriNumPreReqTo: 0};
const test4N2:NodeJob = {jobID : 2, requirements : new Set<number>(), preReqTo : new Set(), oriNumPreReqTo: 0};
const test4N4:NodeJob = {jobID : 4, requirements : (new Set<number>()).add(2).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
const test4N5:NodeJob = {jobID : 5, requirements : (new Set<number>()).add(4), preReqTo : new Set(), oriNumPreReqTo: 0};
const test4N6:NodeJob = {jobID : 6, requirements : (new Set<number>()).add(4).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
const test4N7:NodeJob = {jobID : 7, requirements : (new Set<number>()).add(6).add(8), preReqTo : new Set(), oriNumPreReqTo: 0};
const test4N8:NodeJob = {jobID : 8, requirements : (new Set<number>()), preReqTo : new Set(), oriNumPreReqTo: 0};
const test4N9:NodeJob = {jobID : 9, requirements : (new Set<number>()).add(7).add(8), preReqTo : new Set(), oriNumPreReqTo: 0};
const test4N10:NodeJob = {jobID : 10, requirements : (new Set<number>()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
const test4N11:NodeJob = {jobID : 11, requirements : (new Set<number>()).add(10).add(9), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test4N1, test4N2 , test4N4, test4N5 , test4N6, test4N7, test4N8, test4N9, test4N10, test4N11] as Array<NodeJob>);

console.log("---t5---");

const test5N1:NodeJob = {jobID : 1, requirements : (new Set<number>()), preReqTo : new Set(), oriNumPreReqTo: 0};
const test5N2:NodeJob = {jobID : 2, requirements : (new Set<number>()), preReqTo : new Set(), oriNumPreReqTo: 0};
const test5N3:NodeJob = {jobID : 3, requirements : (new Set<number>()), preReqTo : new Set(), oriNumPreReqTo: 0};
const test5N4:NodeJob = {jobID : 4, requirements : (new Set<number>()), preReqTo : new Set(), oriNumPreReqTo: 0};
const test5N5:NodeJob = {jobID : 5, requirements : (new Set<number>()), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test5N1,test5N3, test5N2, test5N4, test5N5] as Array<NodeJob>);

console.log("---t6---")

const test6N1:NodeJob = {jobID : 1, requirements : (new Set<number>()), preReqTo : new Set(), oriNumPreReqTo: 0};
const test6N2:NodeJob = {jobID : 2, requirements : (new Set<number>()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
const test6N3:NodeJob = {jobID : 3, requirements : (new Set<number>()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
const test6N4:NodeJob = {jobID : 4, requirements : (new Set<number>()).add(2).add(3), preReqTo : new Set(), oriNumPreReqTo: 0};
const test6N5:NodeJob = {jobID : 5, requirements : (new Set<number>()).add(4), preReqTo : new Set(), oriNumPreReqTo: 0};
const test6N6:NodeJob = {jobID : 6, requirements : (new Set<number>()).add(4), preReqTo : new Set(), oriNumPreReqTo: 0};
const test6N7:NodeJob = {jobID : 7, requirements : (new Set<number>()).add(6), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test6N7, test6N6, test6N5, test6N4, test6N3, test6N2, test6N1] as Array<NodeJob>);

console.log("---t7---")

const test7N1:NodeJob = {jobID : 1, requirements : (new Set<number>()), preReqTo : new Set(), oriNumPreReqTo: 0};
const test7N2:NodeJob = {jobID : 2, requirements : (new Set<number>()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
const test7N3:NodeJob = {jobID : 3, requirements : (new Set<number>()).add(2), preReqTo : new Set(), oriNumPreReqTo: 0};
const test7N4:NodeJob = {jobID : 4, requirements : (new Set<number>()).add(1).add(6), preReqTo : new Set(), oriNumPreReqTo: 0};
const test7N5:NodeJob = {jobID : 5, requirements : (new Set<number>()).add(3), preReqTo : new Set(), oriNumPreReqTo: 0};
const test7N6:NodeJob = {jobID : 6, requirements : (new Set<number>()).add(5), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test7N1,test7N3,test7N5,test7N2,test7N4,test7N6] as Array<NodeJob>);

console.log("----End----");

test('createTopoSort', () => {
	expect(createTopoSort( [f,s,t,fo] as Array<NodeJob>)).toBe((new Set<number>()).add(3).add(2).add(1).add(4));
  expect(createTopoSort([test2N1,test2N2, test2N3] as Array<NodeJob>)).toBe((new Set<number>()).add(1).add(2).add(3));
})
