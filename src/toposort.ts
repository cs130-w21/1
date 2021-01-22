interface Node{
    jobID: number;
    requirements : Set<number>;
    preReqTo : Set<number>;
    oriNumPreReqTo : number;
}
//working on the assumption that we are given the requirements and prereqs
//for a target

function findSources(dict: any){
    const sourceJOBIDs: Array<number> = [];

    //go through each node
    for (const curNode of dict.values()) {
        //checking if job is a source
        //having no requirements
        if (curNode.requirements.size == 0) {
            sourceJOBIDs.push(curNode.jobID);
        }
    }
    return sourceJOBIDs;
}

function createDict_and_fill_empty_fields(manyNodes: Array<Node>){
    const dict = new Map();

    for (const curNode of manyNodes){
        dict.set(curNode.jobID,curNode);
    }
    for(const node of dict.values()){
        if(node.requirements.size > 0){//it is a nonempty set
            for(const req of node.requirements){
                dict.get(req).preReqTo.add(node.jobID);
                dict.get(req).oriNumPreReqTo++;
            }
        }
    }
    return dict;
}


function createTopoSort(manyNodes: Array<Node>){

    let finalSortedList: Array<number> = [];
    //places all nodes into the dictionary
    const dict = createDict_and_fill_empty_fields(manyNodes);

    //console.log("Amount of Nodes in Dictionary " + dict.size);
    while(dict.size > 0) {
        //find sources
        const source = findSources(dict);
        if(source.length == 0){
            //if there are no sources then each target has a requirement and there is no source
            //we cannot proceed
            console.log("There are circular dependencies\nInvalid Makefile");
            return [];
        }
        //console.log("Sources for round " + roundNum + ": " + source);

        const sortFunction = function (a:number,b:number){
            if(dict.get(a).oriNumPreReqTo > dict.get(b).oriNumPreReqTo){ return -1;}
            if(dict.get(a).oriNumPreReqTo < dict.get(b).oriNumPreReqTo){ return 1;}
            return 0;
        }
        const sortedSource = source.sort(sortFunction);
        //console.log(sortedSource);

        finalSortedList = finalSortedList.concat(sortedSource);

        for(const jobID of source) {
            const curNode = dict.get(jobID);
            if (curNode.preReqTo.size > 0) {
                //preReqTo is a set containing everything that the current Job is a prerequisite to
                //we are going to remove requisite of this current job from its prerequisite to
                for (const preReqTo of curNode.preReqTo) {
                    dict.get(preReqTo).requirements.delete(jobID);
                }
            }
            //remove the source from the dict
            dict.delete(jobID);
        }

        /*for(let entry of dict.values()) {
            console.log(entry.jobID);
            console.log(entry.requirements);
            console.log(entry.preReqTo);
        }*/
    }
    //we have finished creating the DAG
    //well when we do create it, we do not know if want to put it into queue or something
    console.log(finalSortedList);
    return finalSortedList;
}