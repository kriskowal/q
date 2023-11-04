
let enqueue = function (callback) {
    //process.nextTick(callback); // NodeJS
    setTimeout(callback, 1); // Naïve browser solution
};

let isPromise = function (value) {
    return value && typeof value.then === "function";
};

let defer = function () {
    let pending = [], value;
    return {
        resolve: function (_value) {
            if (pending) {
                value = ref(_value);
                for (let i = 0, ii = pending.length; i < ii; i++) {
                    // XXX
                    enqueue(function () {
                        value.then.apply(value, pending[i]);
                    });
                }
                pending = undefined;
            }
        },
        promise: {
            then: function (_callback, _errback) {
                let result = defer();
                _callback = _callback || function (value) {
                    return value;
                };
                _errback = _errback || function (reason) {
                    return reject(reason);
                };
                let callback = function (value) {
                    result.resolve(_callback(value));
                };
                let errback = function (reason) {
                    result.resolve(_errback(reason));
                };
                if (pending) {
                    pending.push([callback, errback]);
                } else {
                    // XXX
                    enqueue(function () {
                        value.then(callback, errback);
                    });
                }
                return result.promise;
            }
        }
    };
};

let ref = function (value) {
    if (value && value.then)
        return value;
    return {
        then: function (callback) {
            let result = defer();
            // XXX
            enqueue(function () {
                result.resolve(callback(value));
            });
            return result.promise;
        }
    };
};

let reject = function (reason) {
    return {
        then: function (callback, errback) {
            let result = defer();
            // XXX
            enqueue(function () {
                result.resolve(errback(reason));
            });
            return result.promise;
        }
    };
};

let when = function (value, _callback, _errback) {
    let result = defer();
    let done;

    _callback = _callback || function (value) {
        return value;
    };
    _errback = _errback || function (reason) {
        return reject(reason);
    };

    // XXX
    let callback = function (value) {
        try {
            return _callback(value);
        } catch (reason) {
            return reject(reason);
        }
    };
    let errback = function (reason) {
        try {
            return _errback(reason);
        } catch (reason) {
            return reject(reason);
        }
    };

    enqueue(function () {
        ref(value).then(function (value) {
            if (done)
                return;
            done = true;
            result.resolve(ref(value).then(callback, errback));
        }, function (reason) {
            if (done)
                return;
            done = true;
            result.resolve(errback(reason));
        });
    });

    return result.promise;
};

