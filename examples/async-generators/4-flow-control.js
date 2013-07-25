var Q = require('../../q');

// we get back blocking semantics - can use promises
// with if, while, for etc
var filter = Q.async(function*(promises,test) {
    var results = [];
    for(var i = 0; i < promises.length; i++) {
        var val = yield promises[i];
        if(test(val)) results.push(val);
    }
    return results;
});

var alreadyResolved = Q;
var promises = [
    Q.delay("a",500),
    Q.delay("d",1000),
    alreadyResolved("l")
];

filter(promises,function(letter) {
    return "f" > letter;
}).done(function(all) {
    console.log(all); // [ "a", "d" ]
});


// we can use try and catch to handle rejected promises
var logRejections = Q.async(function*(work) {
    try {
        yield work;
        console.log("Never end up here");
    } catch(e) {
        console.log("Caught:",e);
    }
});

var reject = Q.defer();
reject.reject("Oh dear");
logRejections(reject.promise); // Caught: Oh dear
