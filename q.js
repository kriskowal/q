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
    // every occurrence of the "undefined" variable bo be
    // replaced with a single-character.

    // RequireJS
    if (typeof define === "function") {
        define(function (require, exports) {
            definition(require, exports);
        });
    // CommonJS
    } else if (typeof exports === "object") {
        definition(require, exports);
    // <script>
    } else {
        definition(undefined, Q = {});
    }

})(function (serverSideRequire, exports, undefined) {
"use strict";


var enqueue;
try {
    // Narwhal, Node (with a package, wraps process.nextTick)
    enqueue = serverSideRequire("event-queue").enqueue;
} catch (e) {
    // browsers
    enqueue = function (task) {
        setTimeout(task, 0);
    };
}

// useful for an identity stub and default resolvers
function identity (x) {return x}

// ES5 shims
var freeze = Object.freeze || identity;
var create = Object.create || function create(prototype) {
    var Type = function () {};
    Type.prototype = prototype;
    return new Type();
}
var reduce = Array.prototype.reduce || function (callback, basis) {
    for (var i = 0, ii = this.length; i < ii; i++) {
        basis = callback(basis, this[i], i);
    }
    return basis;
};

var print = typeof console === "undefined" ? identity : function (message) {
    console.log(message);
};

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
exports.enqueue = enqueue;

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
        var args = Array.prototype.slice.call(arguments);
        if (pending) {
            pending.push(args);
        } else {
            forward.apply(undefined, [value].concat(args));
        }
    };

    promise.valueOf = function () {
        if (pending)
            return promise;
        return valueOf(value);
    };

    var resolve = function (resolvedValue) {
        var i, ii, task;
        if (!pending)
            return;
        value = ref(resolvedValue);
        for (i = 0, ii = pending.length; i < ii; ++i) {
            forward.apply(undefined, [value].concat(pending[i]));
        }
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
        var args = Array.prototype.slice.call(arguments, 2);
        var result;
        if (descriptor[op])
            result = descriptor[op].apply(descriptor, args);
        else
            result = fallback.apply(descriptor, [op].concat(args));
        resolved = resolved || identity;
        return resolved(result);
    };

    if (valueOf)
        promise.valueOf = valueOf;

    return freeze(promise);
};

// provide thenables, CommonJS/Promises/A
Promise.prototype.then = function (fulfilled, rejected) {
    return when(this, fulfilled, rejected);
};

Promise.prototype.wait = function () {
    return reduce.call(arguments, function (self, next) {
        return when(next, function () {
            return self;
        });
    }, this);
};

Promise.prototype.join = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this);
    var callback = args.pop();
    return reduce.call(args, function (done, next, i) {
        return when(next, function (next) {
            return when(done, function () {
                args[i] = next;
            });
        });
    }, undefined)
    .then(function () {
        return callback.apply(undefined, args);
    });
};

Promise.prototype.end = function () {
    end(this);
};

Promise.prototype.report = function (error) {
    if (!error) {
        error = new Error("REPORT");
    } else if (!error.message) {
        error = new Error(error || "REPORT");
    }
    return when(this, undefined, function (reason) {
        print(error && error.stack || error);
        print(reason && reason.stack || reason);
        return reject(reason);
    });
};

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
    return !isPromise(valueOf(object.valueOf()));
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
    if (object === undefined || object === null)
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
        return Promise({}, function fallback(op, rejected) {
            if (op !== "when") {
                return when(object, function (value) {
                    return ref(value).promiseSend.apply(null, arguments);
                });
            } else {
                var result = defer();
                object.then(result.resolve, result.reject);
                return result.promise;
            }
        });
    }
    return Promise({
        "when": function (rejected) {
            return object;
        },
        "get": function (name) {
            if (object === undefined || object === null)
                return reject("Cannot access property " + name + " of " + object);
            return object[name];
        },
        "put": function (name, value) {
            if (object === undefined || object === null)
                return reject("Cannot set property " + name + " of " + object + " to " + value);
            return object[name] = value;
        },
        "del": function (name) {
            if (object === undefined || object === null)
                return reject("Cannot delete property " + name + " of " + object);
            return delete object[name];
        },
        "post": function (name, value) {
            if (object === undefined || object === null)
                return reject("" + object + " has no methods");
            var method = object[name];
            if (!method)
                return reject("No such method " + name + " on object " + object);
            if (!method.apply)
                return reject("Property " + name + " on object " + object + " is not a method");
            return object[name].apply(object, value);
        },
        "keys": function () {
            return Object.keys(object);
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
exports.def = def;
function def(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op) {
        var args = Array.prototype.slice.call(arguments);
        return send.apply(undefined, [object].concat(args));
    }, function valueOf() {
        return object.valueOf();
    });
}

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

    forward(ref(value), "when", function (value) {
        if (done)
            return;
        done = true;
        deferred.resolve(ref(value).promiseSend("when", _fulfilled, _rejected));
    }, function (reason) {
        if (done)
            return;
        done = true;
        deferred.resolve(_rejected(reason));
    });
    return deferred.promise;
}

/**
 * Like "when", but attempts to return a fulfilled value in
 * the same turn. If the given value is fulfilled and the
 * value returned by the fulfilled callback is fulfilled,
 * asap returns the latter value in the same turn.
 * Otherwise, it returns a promise that will be resolved in
 * a future turn.
 *
 * This method is an experiment in providing an API that can
 * unify synchronous and asynchronous API's.  An API that
 * uses "asap" guarantees that, if it is provided fully
 * resolved values, it will produce fully resolved values or
 * throw exceptions, but if it is provided asynchronous
 * promises, it will produce asynchronous promises.
 *
 * /!\ WARNING: this method is experimental and likely to be
 * removed on the grounds that it probably will result in
 * composition hazards.
 */
exports.asap = function (value, fulfilled, rejected) {
    fulfilled = fulfilled || identity;
    if (isFulfilled(value)) {
        return valueOf(fulfilled(valueOf(value)))
    } else if (isRejected(value)) {
        var reason = value.valueOf().reason;
        if (rejected) {
            return rejected(reason);
        } else {
            throw reason;
        }
    } else {
        return when(value, fulfilled, rejected);
    }
};

var valueOf = function (value) {
    if (value === undefined || value === null) {
        return value;
    } else {
        return value.valueOf();
    }
};

/**
 * Constructs a promise method that can be used to safely observe resolution of
 * a promise for an arbitrarily named method like "propfind" in a future turn.
 *
 * "Method" constructs methods like "get(promise, name)" and "put(promise)".
 */
exports.Method = Method;
function Method (op) {
    return function (object) {
        var args = Array.prototype.slice.call(arguments, 1);
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
    var args = Array.prototype.slice.call(arguments, 2);
    forward.apply(undefined, [
        ref(object),
        op,
        deferred.resolve
    ].concat(args));
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
    var args = Array.prototype.slice.call(arguments, 2);
    return post(value, name, args);
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually resolved object
 */
exports.keys = Method("keys");

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 */
exports.end = end;
function end(promise) {
    when(promise, undefined, function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        enqueue(function () {
            throw error;
        });
    });
}

/*
 * Enqueues a promise operation for a future turn.
 */
function forward(promise /* ... */) {
    var args = Array.prototype.slice.call(arguments, 1);
    enqueue(function () {
        promise.promiseSend.apply(promise, args);
    });
}

});
