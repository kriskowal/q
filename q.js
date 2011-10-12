// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * Copyright 2009-2011 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 */

(function (definition, undefined) {

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // The use of "undefined" in the arguments is a
    // micro-optmization for compression systems, permitting
    // every occurrence of the "undefined" variable to be
    // replaced with a single-character.

    // RequireJS
    if (typeof define === "function") {
        define(function (require, exports, module) {
            definition(require, exports, module);
        });
    // CommonJS
    } else if (typeof exports === "object") {
        definition(require, exports, module);
    // <script>
    } else {
        Q = definition(undefined, {}, {});
    }

})(function (serverSideRequire, exports, module, undefined) {
"use strict";


var nextTick;
try {
    // Narwhal, Node (with a package, wraps process.nextTick)
    nextTick = serverSideRequire("event-queue").enqueue;
} catch (e) {
    // browsers
    if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // linked list of tasks (single, with head node)
        var head = {}, tail = head;
        channel.port1.onmessage = function () {
            var next = head.next;
            var task = next.task;
            head = next;
            task();
        };
        nextTick = function (task) {
            tail = tail.next = {task: task};
            channel.port2.postMessage();
        };
    } else {
        // old browsers
        nextTick = function (task) {
            setTimeout(task, 0);
        };
    }
}

// useful for an identity stub and default resolvers
function identity (x) {return x;}

// shims
var shim = function (object, name, shim) {
    if (!object[name])
        object[name] = shim;
    return object[name];
};

var freeze = shim(Object, "freeze", identity);

var create = shim(Object, "create", function (prototype) {
    var Type = function () {};
    Type.prototype = prototype;
    return new Type();
});

var keys = shim(Object, "keys", function (object) {
    var keys = [];
    for (var key in object)
        keys.push(key);
    return keys;
});

var reduce = Array.prototype.reduce || function (callback, basis) {
    var i = 0,
        ii = this.length;
    // concerning the initial value, if one is not provided
    if (arguments.length == 1) {
        // seek to the first value in the array, accounting
        // for the possibility that is is a sparse array
        do {
            if (i in this) {
                basis = this[i++];
                break;
            }
            if (++i >= ii)
                throw new TypeError();
        } while (1);
    }
    // reduce
    for (; i < ii; i++) {
        // account for the possibility that the array is sparse
        if (i in this) {
            basis = callback(basis, this[i], i);
        }
    }
    return basis;
};

var isStopIteration = function (exception) {
    return Object.prototype.toString.call(exception)
        === "[object StopIteration]";
};

// Abbreviations for performance and minification
var slice = Array.prototype.slice;
var nil = null;
var valueOf = function (value) {
    if (value === undefined || value === nil) {
        return value;
    } else {
        return value.valueOf();
    }
};

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
exports.enqueue = // XXX enqueue deprecated
exports.nextTick = nextTick;

/**
 * Constructs a {promise, resolve} object.
 *
 * The resolver is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke the resolver with any value that is
 * not a function. To reject the promise, invoke the resolver with a rejection
 * object. To put the promise in the same state as another promise, invoke the
 * resolver with that other promise.
 */
exports.defer = defer;

function defer() {
    // if "pending" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the pending array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the ref promise because it handles both fully
    // resolved values and other promises gracefully.
    var pending = [], value;

    var promise = create(Promise.prototype);

    promise.promiseSend = function () {
        var args = slice.call(arguments);
        if (pending) {
            pending.push(args);
        } else {
            nextTick(function () {
                value.promiseSend.apply(value, args);
            });
        }
    };

    promise.valueOf = function () {
        if (pending)
            return promise;
        return value.valueOf();
    };

    var resolve = function (resolvedValue) {
        var i, ii, task;
        if (!pending)
            return;
        value = ref(resolvedValue);
        reduce.call(pending, function (undefined, pending) {
            nextTick(function () {
                value.promiseSend.apply(value, pending);
            });
        }, undefined);
        pending = undefined;
        return value;
    };

    return {
        "promise": freeze(promise),
        "resolve": resolve,
        "reject": function (reason) {
            return resolve(reject(reason));
        }
    };
}

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * put(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
exports.makePromise = Promise;
function Promise(descriptor, fallback, valueOf) {

    if (fallback === undefined) {
        fallback = function (op) {
            return reject("Promise does not support operation: " + op);
        };
    }

    var promise = create(Promise.prototype);

    promise.promiseSend = function (op, resolved /* ...args */) {
        var args = slice.call(arguments, 2);
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(descriptor, args);
            } else {
                result = fallback.apply(descriptor, [op].concat(args));
            }
        } catch (exception) {
            result = reject(exception);
        }
        return (resolved || identity)(result);
    };

    if (valueOf)
        promise.valueOf = valueOf;

    return freeze(promise);
};

// provide thenables, CommonJS/Promises/A
Promise.prototype.then = function (fulfilled, rejected) {
    return when(this, fulfilled, rejected);
};

// Chainable methods
reduce.call(
    [
        "when", "send",
        "get", "put", "del",
        "post", "invoke",
        "keys",
        "apply", "call",
        "all", "wait", "join",
        "fail", "fin", "spy", // XXX spy deprecated
        "view", "viewInfo",
        "timeout", "delay",
        "end"
    ],
    function (prev, name) {
        Promise.prototype[name] = function () {
            return exports[name].apply(
                exports,
                [this].concat(slice.call(arguments))
            );
        };
    },
    undefined
)

Promise.prototype.toSource = function () {
    return this.toString();
};

Promise.prototype.toString = function () {
    return '[object Promise]';
};

freeze(Promise.prototype);

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
exports.isPromise = isPromise;
function isPromise(object) {
    return object && typeof object.promiseSend === "function";
};

/**
 * @returns whether the given object is a resolved promise.
 */
exports.isResolved = isResolved;
function isResolved(object) {
    return !isPromise(valueOf(object));
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
exports.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(valueOf(object)) && !isRejected(object);
};

/**
 * @returns whether the given object is a rejected promise.
 */
exports.isRejected = isRejected;
function isRejected(object) {
    object = valueOf(object);
    if (object === undefined || object === nil)
        return false;
    return !!object.promiseRejected;
}

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
exports.reject = reject;
function reject(reason) {
    return Promise({
        "when": function (rejected) {
            return rejected ? rejected(reason) : reject(reason);
        }
    }, function fallback(op) {
        return reject(reason);
    }, function valueOf() {
        var rejection = create(reject.prototype);
        rejection.promiseRejected = true;
        rejection.reason = reason;
        return rejection;
    });
}

reject.prototype = create(Promise.prototype, {
    constructor: { value: reject }
});

/**
 * Constructs a promise for an immediate reference.
 * @param value immediate reference
 */
exports.ref = ref;
function ref(object) {
    // If the object is already a Promise, return it directly.  This enables
    // the ref function to both be used to created references from
    // objects, but to tolerably coerce non-promises to refs if they are
    // not already Promises.
    if (isPromise(object))
        return object;
    // assimilate thenables, CommonJS/Promises/A
    if (object && typeof object.then === "function") {
        var result = defer();
        object.then(result.resolve, result.reject);
        return result.promise;
    }
    return Promise({
        "when": function (rejected) {
            return object;
        },
        "get": function (name) {
            return object[name];
        },
        "put": function (name, value) {
            return object[name] = value;
        },
        "del": function (name) {
            return delete object[name];
        },
        "post": function (name, value) {
            return object[name].apply(object, value);
        },
        "apply": function (self, args) {
            return object.apply(self, args);
        },
        "viewInfo": function () {
            var on = object;
            var properties = {};
            while (on) {
                Object.getOwnPropertyNames(on).forEach(function (name) {
                    if (!properties[name])
                        properties[name] = typeof on[name];
                });
                on = Object.getPrototypeOf(on);
            }
            return {
                "type": typeof object,
                "properties": properties
            }
        },
        "keys": function () {
            return keys(object);
        }
    }, undefined, function valueOf() {
        return object;
    });
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the 'isDef' message
 * without a rejection.
 */
exports.master =
exports.def = def;
function def(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op) {
        var args = slice.call(arguments);
        return send.apply(undefined, [object].concat(args));
    }, function () {
        return valueOf(object);
    });
}

exports.viewInfo = viewInfo;
function viewInfo(object, info) {
    object = ref(object);
    if (info) {
        return Promise({
            "viewInfo": function () {
                return info;
            }
        }, function fallback(op) {
            var args = slice.call(arguments);
            return send.apply(undefined, [object].concat(args));
        }, function () {
            return valueOf(object);
        });
    } else {
        return send(object, "viewInfo")
    }
}

exports.view = function (object) {
    return viewInfo(object).when(function (info) {
        var view;
        if (info.type === "function") {
            view = function () {
                return apply(object, undefined, arguments);
            };
        } else {
            view = {};
        }
        var properties = info.properties || {};
        Object.keys(properties).forEach(function (name) {
            if (properties[name] === "function") {
                view[name] = function () {
                    return post(object, name, arguments);
                };
            }
        });
        return ref(view);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value     promise or immediate reference to observe
 * @param fulfilled function to be called with the fulfilled value
 * @param rejected  function to be called with the rejection reason
 * @return promise for the return value from the invoked callback
 */
exports.when = when;
function when(value, fulfilled, rejected) {
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return fulfilled ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(reason) {
        try {
            return rejected ? rejected(reason) : reject(reason);
        } catch (exception) {
            return reject(exception);
        }
    }

    nextTick(function () {
        ref(value).promiseSend("when", function (value) {
            if (done)
                return;
            done = true;
            deferred.resolve(
                ref(value)
                .promiseSend("when", _fulfilled, _rejected)
            );
        }, function (reason) {
            if (done)
                return;
            done = true;
            deferred.resolve(_rejected(reason));
        });
    });

    return deferred.promise;
}

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  This presently only works in
 * Firefox/Spidermonkey, however, this code does not cause syntax
 * errors in older engines.  This code should continue to work and
 * will in fact improve over time as the language improves.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 *  - in present implementations of generators, when a generator
 *    function is complete, it throws ``StopIteration``, ``return`` is
 *    a syntax error in the presence of ``yield``, so there is no
 *    observable return value. There is a proposal[1] to add support
 *    for ``return``, which would permit the value to be carried by a
 *    ``StopIteration`` instance, in which case it would fulfill the
 *    promise returned by the asynchronous generator.  This can be
 *    emulated today by throwing StopIteration explicitly with a value
 *    property.
 *
 *  [1]: http://wiki.ecmascript.org/doku.php?id=strawman:async_functions#reference_implementation
 *
 */
exports.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is a reason/error
        var continuer = function (verb, arg) {
            var result;
            try {
                result = generator[verb](arg);
            } catch (exception) {
                if (isStopIteration(exception)) {
                    return exception.value;
                } else {
                    return reject(exception);
                }
            }
            return when(result, callback, errback);
        };
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "send");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * Constructs a promise method that can be used to safely observe resolution of
 * a promise for an arbitrarily named method like "propfind" in a future turn.
 *
 * "Method" constructs methods like "get(promise, name)" and "put(promise)".
 */
exports.Method = Method;
function Method (op) {
    return function (object) {
        var args = slice.call(arguments, 1);
        return send.apply(undefined, [object, op].concat(args));
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param ...args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
exports.send = send;
function send(object, op) {
    var deferred = defer();
    var args = slice.call(arguments, 2);
    object = ref(object);
    nextTick(function () {
        object.promiseSend.apply(
            object,
            [op, deferred.resolve].concat(args)
        );
    });
    return deferred.promise;
}

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
exports.get = Method("get");

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
exports.put = Method("put");

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
exports.del = Method("del");

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `ref` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
var post = exports.post = Method("post");

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
exports.invoke = function (value, name) {
    var args = slice.call(arguments, 2);
    return post(value, name, args);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param context   the context object (this) for the call
 * @param args      array of application arguments
 */
var apply = exports.apply = Method("apply");

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param context   the context object (this) for the call
 * @param ...args   array of application arguments
 */
exports.call = function (value, context) {
    var args = slice.call(arguments, 2);
    return apply(value, context, args);
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually resolved object
 */
exports.keys = Method("keys");

// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
exports.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = promises.length;
        var values = [];
        if (countDown === 0)
            return ref(values);
        var deferred = defer();
        reduce.call(promises, function (undefined, promise, index) {
            when(promise, function (answer) {
                values[index] = answer;
                if (--countDown === 0)
                    deferred.resolve(values);
            }, deferred.reject);
        }, undefined);
        return deferred.promise;
    });
}

/**
 */
exports.wait = function (promise) {
    return all(arguments).get(0);
};

/**
 */
exports.join = function () {
    var args = slice.call(arguments);
    var callback = args.pop();
    return all(args).then(function (args) {
        return callback.apply(undefined, args);
    });
};

/**
 */
exports.fail = fail;
function fail(promise, rejected) {
    return when(promise, undefined, rejected);
}

/**
 */
exports.spy = // XXX spy deprecated
exports.fin = fin;
function fin(promise, callback) {
    return when(promise, function (value) {
        return when(callback(), function () {
            return value;
        });
    }, function (reason) {
        return when(callback(), function () {
            return reject(reason);
        });
    });
}

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 */
exports.end = end;
function end(promise) {
    when(promise, undefined, function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        nextTick(function () {
            throw error;
        });
    });
}

/**
 */
exports.timeout = timeout;
function timeout(promise, timeout) {
    var deferred = defer();
    when(promise, deferred.resolve, deferred.reject);
    setTimeout(function () {
        deferred.reject("Timed out");
    }, timeout);
    return deferred.promise;
}

/**
 */
exports.delay = delay;
function delay(promise, timeout) {
    var deferred = defer();
    setTimeout(function () {
        deferred.resolve(promise);
    }, timeout);
    return deferred.promise;
}

/*
 * In module systems that support ``module.exports`` assignment or exports
 * return, allow the ``ref`` function to be used as the ``Q`` constructor
 * exported by the "q" module.
 */
for (var name in exports)
    ref[name] = exports[name];
module.exports = ref;
return ref;

});
