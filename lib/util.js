
var QUTIL = exports;
var UTIL = require("util");
var Q = require("q");

UTIL.update(QUTIL, Q);

/**
 * @param {Number} timeout
 * @returns {Promise * undefined} a promise for `undefined`
 * that will resolve after `timeout` miliseconds.
 */
QUTIL.delay = function (timeout) {
    var deferred = Q.defer();
    setTimeout(deferred.resolve, timeout);
    return deferred.promise;
};

/** */
QUTIL.reduce = function (values, callback, basis) {
    return Q.when(values, function (values) {
        return values.reduce(function (values, value) {
            return Q.when(values, function (values) {
                return Q.when(value, function (value) {
                    return callback(values, value);
                });
            });
        }, basis);
    });
};

/**
 * @param {Array * Promise} values that may include promises.
 * @returns {Promise * Array} a promise for an array of each
 * resolved value respectively.
 */
QUTIL.all = function (values) {
    return QUTIL.reduce(values, function (values, value) {
        return values.concat([value]);
    }, []);
};

/**
 */
QUTIL.forEach = function (values, callback, thisp) {
    var last;
    return Q.when(values.forEach(function (value) {
        last = Q.when(last, function () {
            return Q.when(value, function (value) {
                return callback.call(thisp, value);
            });
        });
    }), function () {
        return last;
    });
};

/**
 * @param {Array * Promise} values a promise for an array of
 * promises.
 * @returns {Promise * Array} a promise for the sum of the
 * resolved.
 */
QUTIL.sum = function (values) {
    return QUTIL.reduce(values, function (values, value) {
        return values + value;
    }, 0);
};

/**
 * Wraps a `when` block
 * @param {Array * Promise}
 * @param {Function} resolved
 * @param {Function} rejected optional
 */
QUTIL.whenAll = function (values, resolved, rejected) {
    return Q.when(QUTIL.all(values), resolved, rejected);
};

QUTIL.deep = function (object) {
    return Q.when(object, function (object) {
        if (UTIL.no(object)) {
            return object;
        } if (Array.isArray(object)) {
            return QUTIL.all(object.map(QUTIL.deep));
        } else if (typeof object === "object") {
            return QUTIL.whenAll(UTIL.mapApply(object, function (key, value) {
                return Q.when(QUTIL.deep(value), function (value) {
                    return [key, value];
                });
            }), function (pairs) {
                return UTIL.object(pairs);
            });
        } else {
            return object;
        }
    });
};

/**
 * @param {Array * Promise} values
 * @param {Function} callback
 * @param {Promise * Object} thisp optional this object for
 * the callback
 * @returns {Array * Promise} an array of promises for the
 * returned results of the callback on each respective
 * resolved value.
 */
QUTIL.mapDefer = function (values, callback, thisp) {
    return values.map(function (value) {
        return Q.when(value, function (value) {
            return Q.when(thisp, function (thisp) {
                return callback.call(thisp);
            });
        });
    });
};

/**
 * @param {Array * Promise} values
 * @param {Function} callback
 * @param {Promise * Object} thisp optional this object for
 * the callback
 * @returns {Promise * Array} a promise for an array of the
 * returned results of the callback on each respective
 * resolved value.
 */
QUTIL.map = function (values, callback, thisp) {
    return QUTIL.all(QUTIL.mapDefer(values, callback, thisp));
};

QUTIL.loop = function (provider, block) {
    function loop() {
        Q.when(provider(), function (value) {
            Q.when(block(value), function (result) {
                if (result !== false)
                    loop();
            });
        });
    }
    loop();
};

/**
 * A promise queue.  Each promise returned by get is
 * eventually resolved by a value given to put, in the order
 * in which they are requested and received.
 */
QUTIL.Queue = function (max) {
    if (max === undefined)
        max = Infinity;
    var self = Object.create(QUTIL.Queue.prototype);
    var promises = [];
    var resolvers = [];

    function grow() {
        if (promises.length > max || resolvers.length > max)
            return false;
        var deferred = Q.defer();
        promises.push(deferred.promise);
        resolvers.push(deferred.resolve);
        return true;
    };

    /***
     * @returns a promise
     */
    self.get = function () {
        if (!promises.length) {
            if (!grow())
                return Q.reject("queue jammed");
        }
        return promises.shift();
    };

    /***
     * @param value a resolution
     */
    self.put = function (value) {
        if (!resolvers.length) {
            if (!grow())
                return Q.reject("queue jammed");
        }
        resolvers.shift()(value);
    };

    return self;
};

QUTIL.Buffer = function () {
    var self = Object.create(QUTIL.Buffer.prototype);
    var buffer = [];
    var ready = Q.defer();

    function flush() {
        return Q.when(ready.promise, function () {
            if (buffer.length) {
                return buffer.splice(0, buffer.length);
            } else {
                ready = Q.defer();
                return flush();
            }
        });
    }

    function get() {
        return Q.when(ready.promise, function () {
            if (buffer.length) {
                return buffer.shift();
            } else {
                ready = Q.defer();
                return get();
            }
        });
    }

    self.get = function () {
        return get();
    };

    self.flush = function () {
        return flush();
    };

    self.put = function (value) {
        buffer.push(value);
        ready.resolve();
    };

    return self;
};

/* demo */
if (module === require.main) {
    QUTIL.whenAll([
        1,2,3,Q.when(QUTIL.delay(1000), function () {return 4})
    ], function (values) {
        print(values);
    });
}

