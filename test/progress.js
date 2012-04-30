var Q = require("../q");

function foo(ticks) {
    return Q.promise(function (resolve, reject, progress) {
        var at = 0;
        function tick() {
            if (at >= ticks) {
                resolve();
            } else {
                setTimeout(tick, 100);
            }
            progress(at++ / ticks);
        }
        tick();
    });
}

function analyze(promise) {
    var deferred = Q.defer();
    Q.when(promise, deferred.resolve, deferred.reject, function (progress, time) {
        var duration = time / 1000;
        var rate = progress / duration;
        var estimate = (1 - progress) * rate * 1000;
        deferred.progress(progress, estimate);
    })
    return deferred.promise;
}

/*
foo(10)
.to(analyze)
.progress(function (progress, estimate) {
    console.log("reticulating splines:", (progress * 100).toFixed(0) + "% in " + (estimate / 1000).toFixed(2) + " seconds");
})
.then(function (value) {
    console.log("splines reticulated");
})
.end()
*/

/*
Q.promise(function (resolve, reject, progress) {
    Q.begin()
    .then(function (value, time) {
        return foo(5)
        .progress(function(ratio, time) {
            progress(ratio * 5/10);
        })
    })
    .then(function (value, time) {
        return foo(2)
        .progress(function(ratio, time) {
            progress(5/10 + ratio * 2/10);
        })
    })
    .then(function (value, time) {
        return foo(3)
        .progress(function(ratio, time) {
            progress(7/10 + 3/10 * ratio);
        })
    })
    .then(resolve, reject);
})
.progress(function (ratio, time) {
    console.log("reticulating splines:", ratio, time.toFixed());
})
.then(function (value, time) {
    console.log("splines reticulated:", time.toFixed());
})
.end()
*/

Q.begin()
.then(function () {
    return foo(5)
    .progress(function () {
    })
})
.progress(function (ratio, time) {
    console.log(ratio, time);
})
.end();

