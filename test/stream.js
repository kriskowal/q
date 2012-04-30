var Q = require("../q");

var renewalInterval = 1e10; // a long time

function makeQueue() {
    var ends = Q.defer();
    return {
        "send": function (value) {
            var next = Q.defer();
            ends.resolve({
                "head": value,
                "tail": next.promise
            });
            ends.resolve = next.resolve;
        },
        "next": function () {
            var result = Q.get(ends.promise, "head");
            ends.promise = Q.get(ends.promise, "tail");
            return result;
        }
    };
}

function makeStream(label) {
    var result = Q.defer();
    var queue = makeQueue();

    var outstanding = 0;
    var closed;

    function send(value) {
        outstanding++;
        if (!closed) {
            queue.send(value);
        }
        // ignore attempts to send values to a
        // closed stream.
    }

    function close() {
        closed = true;
        // we are not actually closed
        // until the last value gets emitted
    }

    function forEach(callback, thisp) {
        Q.when(queue.next(), function (value) {
            outstanding--;
            // summon the next iteration
            forEach(callback, thisp);
            // handle this iteration
            return Q.call(callback, thisp, value)
            // resolve if this was the last
            // value out the door.
            .fin(function () {
                if (outstanding === 0 && closed) {
                    console.log("CLOSED", label);
                    result.resolve();
                }
            });
        })
        .end();
        return result.promise;
    }

    var promise = Q.makePromise({
        "forEach": forEach,
        "all": function () {
            var object = [];
            forEach(function (value) {
                object.push(value);
            });
            return Q.when(result.promise, function () {
                return object;
            });
        },
        "map": function (callback, thisp) {
            var map = makeStream(label + "|map");
            forEach(function (value) {
                Q.call(callback, thisp, value)
                .then(map.send)
                .end()
            })
            Q.when(result.promise, map.close);
            return map.promise;
        },
        "filter": function (callback, thisp) {
            var filter = makeStream(label + "|filter");
            forEach(function (value) {
                Q.call(callback, thisp, value)
                .then(function (guard) {
                    if (guard) {
                        filter.send(value);
                    }
                })
                .end()
            })
            Q.when(result.promise, filter.close);
            return filter.promise;
        },
        "reduce": function (callback, basis, thisp) {
            var i = 0;
            forEach(function (value) {
                basis = Q.when(basis, function (basis) {
                    return Q.call(callback, thisp, basis, value, i++, result.promise);
                });
            })
            return Q.when(result.promise, function () {
                return basis;
            });
        }
    }, function fallback(op) {
        var args = Array.prototype.slice.call(arguments);
        return Q.send.apply(this, [result.promise].concat(args));
    });

    return {
        send: send,
        close: close,
        promise: promise
    };
};

var stream = makeStream("sequence");

stream.promise
.map(function (n) {
    console.log("mapping", n);
    return Q.delay(n, 0)
    .fin(function () {
        console.log("emitting", n);
    })
})
.filter(function (n) {
    console.log("filtering", n);
    return n % 2;
})
.reduce(function (old, n) {
    console.log('reducing', old, n);
    return old + n;
}, 0)
.then(function (result) {
    console.log("result", result);
})
.end()

var n = 0;
var handle = setInterval(function () {
    stream.send(n++);
    if (n === 10) {
        console.log("CLOSING");
        stream.close();
    }
}, 10);

Q.when(stream.promise, function () {
    clearInterval(handle);
});

