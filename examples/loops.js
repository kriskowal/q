"use strict";

var Q = require("../q");

/*
 * Q.while examples
 */

//share state using closures
//this is harder to understand but allows you to use easily pass
//resolve / response reasons down the chain
var whileClosure = { updateSucceeded: false };
var afterWhile = Q.while(
    function() { return whileClosure.updateSucceeded; },
    function() {
        httpService.post("update url")
            .then(function(r) {
                whileClosure.updateSucceeded = true;    //set the success flag to true so the condition will pass
                return Q.resolve(r);                    //returns the resolution info for the next item in the chain
            })
            .catch(function(r) {
                return Q.resolve(r);                     //resolves and swallows the error; this forces the while to
                                                         //run again and attempt the HTTP update again.
            });
    }
);

//share state using previousIterationResult
afterWhile = Q.while(
    function(previousIterationResult) { return previousIterationResult; },
    function() {
        httpService.post("update url")
            .then(function() {
                return Q.resolve(true);     //returns true to be used by the condition
            })
            .catch(function(r) {
                return Q.resolve(false);    //swallows the error; returns false so the loop will run again
                                            //and retry the HTTP update
            });
    }
);

//handling errors inside the loop body
var whileClosure = { updateSucceeded: false };
afterWhile = Q.while(
    function() { return whileClosure.updateSucceeded; },
    function() {
        httpService.post("update url")
            .then(function(r) {
                whileClosure.updateSucceeded = true;    //set the success flag to true so the condition will pass
                return Q.resolve(r);                    //returns the resolution info for the next item in the chain
            })
            .catch(function(r) {
                if(typeof(r.status) !== "undefined" && r.status === 500 && r.data.errorCode === "SERVER BUSY") {
                    return Q.resolve(r.data.errorCode); //resolves and swallows the error;
                                                        //we only want to rerun if the server is too busy; for other
                                                        //failures we want the promise to fail
                } else {
                    return Q.reject(r.data.errorCode);  //we need to RE reject the promise or Q will treat it as handled
                }
            });
    }
);

//testing Q.while promises can be tricky.  You often need to create spy's which reject one time
//and resolve the next time.  Use a function like createRejectOnce for this.
describe("function with a Q.while", function() {
    it("loops if the POST fails", function() {
        spyOn(httpService, "post").and.callFake(createRejectOnce("BUSY"));

        myFunctionWithWhile();

        expect(httpService.calls.count()).toBe(2);  //if the loop succeeded, the httpService would have been called
                                                    //a second time
    });
});

function createRejectOnce(reason) {
    var firstRun = true;
    return function() {
        if(firstRun) {
            firstRun = false;
            return Q.reject(reason);
        } else {
            return Q.resolve();
        }
    }
}

/*
 * Q.for examples
 */

// simple for - in each iteration we ask the user for input
var items = [
    {id: 1},
    {id: 2},
    {id: 3}
];
var afterFor = Q.for(0, items.length, function(i, previousResult) {
    return uiService.promptForInput("Please enter item #" + (i+1) + " name.");
});

//finding an item in a list - similar to break;
var ixFoundId = null;
afterFor = Q.for(0, items.length, function(i, previousResult) {
    if(items[i].id === 2) {
        ixFoundId = i;
        return Q.reject("break");     //reject to stop loop.  equiv of break in sync for loop
                                      //using 'break' keyword will cause the forPromise to be resolved
                                      //even though the body rejected
    } else {
        return Q.resolve();
    }
});

//handling errors in loop body
afterFor = Q.for(0, items.length, function(i, previousResult) {
    return uiService.promptForInput("Please enter item #" + (i+1) + " name.")
        .catch(function(r) {
            if(r === "cancel") {
                return Q.resolve();     //swallow the cancel error so the we can process the remaining items
            } else {
                return Q.reject(r);     //we need to RE reject so Q will treat it as unhandled
            }
        });
});