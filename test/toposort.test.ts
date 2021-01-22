import {createTopoSort} from '../src/toposort'; 

console.log("---t1---")

let f = {jobID : 1, requirements : (new Set).add(2).add(3), preReqTo: new Set(), oriNumPreReqTo: 0};
let s = {jobID : 2, requirements: new Set(), preReqTo: new Set(), oriNumPreReqTo: 0};
let t = {jobID : 3, requirements: new Set(), preReqTo: new Set(), oriNumPreReqTo: 0};
let fo = {jobID: 4, requirements: (new Set).add(3), preReqTo: new Set(), oriNumPreReqTo: 0}

createTopoSort( [f,s,t,fo] as Array<Node>);

console.log("---t2---");

let test2N1 = {jobID : 1, requirements : new Set(), preReqTo : new Set(), oriNumPreReqTo: 0};
let test2N2 = {jobID : 2, requirements : (new Set()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
let test2N3 = {jobID : 3, requirements : (new Set()).add(2), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test2N1,test2N2, test2N3] as Array<Node>);

console.log("---t3---");

let test3N1 = {jobID : 1, requirements : new Set(), preReqTo : new Set(), oriNumPreReqTo: 0};
let test3N2 = {jobID : 2, requirements : (new Set()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
let test3N3 = {jobID : 3, requirements : (new Set()).add(2).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
let test3N4 = {jobID : 4, requirements : (new Set()).add(2).add(3), preReqTo : new Set(), oriNumPreReqTo: 0};
let test3N5 = {jobID : 5, requirements : (new Set()).add(4), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test3N1, test3N2, test3N3, test3N4, test3N5] as Array<Node>);

console.log("---t4---");

let test4N1 = {jobID : 1, requirements : new Set(), preReqTo : new Set(), oriNumPreReqTo: 0};
let test4N2 = {jobID : 2, requirements : new Set(), preReqTo : new Set(), oriNumPreReqTo: 0};
let test4N4 = {jobID : 4, requirements : (new Set()).add(2).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
let test4N5 = {jobID : 5, requirements : (new Set()).add(4), preReqTo : new Set(), oriNumPreReqTo: 0};
let test4N6 = {jobID : 6, requirements : (new Set()).add(4).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
let test4N7 = {jobID : 7, requirements : (new Set()).add(6).add(8), preReqTo : new Set(), oriNumPreReqTo: 0};
let test4N8 = {jobID : 8, requirements : (new Set()), preReqTo : new Set(), oriNumPreReqTo: 0};
let test4N9 = {jobID : 9, requirements : (new Set()).add(7).add(8), preReqTo : new Set(), oriNumPreReqTo: 0};
let test4N10 = {jobID : 10, requirements : (new Set()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
let test4N11 = {jobID : 11, requirements : (new Set()).add(10).add(9), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test4N1, test4N2 , test4N4, test4N5 , test4N6, test4N7, test4N8, test4N9, test4N10, test4N11] as Array<Node>);

console.log("---t5---");

let test5N1 = {jobID : 1, requirements : (new Set()), preReqTo : new Set(), oriNumPreReqTo: 0};
let test5N2 = {jobID : 2, requirements : (new Set()), preReqTo : new Set(), oriNumPreReqTo: 0};
let test5N3 = {jobID : 3, requirements : (new Set()), preReqTo : new Set(), oriNumPreReqTo: 0};
let test5N4 = {jobID : 4, requirements : (new Set()), preReqTo : new Set(), oriNumPreReqTo: 0};
let test5N5 = {jobID : 5, requirements : (new Set()), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test5N1,test5N3, test5N2, test5N4, test5N5] as Array<Node>);

console.log("---t6---")

let test6N1 = {jobID : 1, requirements : (new Set()), preReqTo : new Set(), oriNumPreReqTo: 0};
let test6N2 = {jobID : 2, requirements : (new Set()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
let test6N3 = {jobID : 3, requirements : (new Set()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
let test6N4 = {jobID : 4, requirements : (new Set()).add(2).add(3), preReqTo : new Set(), oriNumPreReqTo: 0};
let test6N5 = {jobID : 5, requirements : (new Set()).add(4), preReqTo : new Set(), oriNumPreReqTo: 0};
let test6N6 = {jobID : 6, requirements : (new Set()).add(4), preReqTo : new Set(), oriNumPreReqTo: 0};
let test6N7 = {jobID : 7, requirements : (new Set()).add(6), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test6N7, test6N6, test6N5, test6N4, test6N3, test6N2, test6N1] as Array<Node>);

console.log("---t7---")

let test7N1 = {jobID : 1, requirements : (new Set()), preReqTo : new Set(), oriNumPreReqTo: 0};
let test7N2 = {jobID : 2, requirements : (new Set()).add(1), preReqTo : new Set(), oriNumPreReqTo: 0};
let test7N3 = {jobID : 3, requirements : (new Set()).add(2), preReqTo : new Set(), oriNumPreReqTo: 0};
let test7N4 = {jobID : 4, requirements : (new Set()).add(1).add(6), preReqTo : new Set(), oriNumPreReqTo: 0};
let test7N5 = {jobID : 5, requirements : (new Set()).add(3), preReqTo : new Set(), oriNumPreReqTo: 0};
let test7N6 = {jobID : 6, requirements : (new Set()).add(5), preReqTo : new Set(), oriNumPreReqTo: 0};

createTopoSort([test7N1,test7N3,test7N5,test7N2,test7N4,test7N6] as Array<Node>);

console.log("----End----");
