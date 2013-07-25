var Q = require('../../q');

function delay(millis, answer) {
    const deferredResult = Q.defer();
    setTimeout(function() {
        deferredResult.resolve(answer);
    }, millis);
    return deferredResult.promise;
}

function alreadyResolved(answer) {
    const deferredResult = Q.defer();
    deferredResult.resolve(answer)
    return deferredResult.promise;
}

var waitForAll = Q.async(function*() {
    var ps = [
        delay(500,"a"),
        delay(1000,"b"),
        alreadyResolved("c")
    ];

    var results = [];
    for(var i = 0; i < ps.length; i++) {
        results.push( yield ps[i] );
    }
    return results;
});

waitForAll().then(function(all) {
    console.log(all);
});
