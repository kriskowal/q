
// Tyler Close
// Ported and revised by Kris Kowal
//
// This API varies from Tyler Closes ref_send in the
// following ways:
//
// * Promises can be resolved to function values.
// * Promises can be resolved to null or undefined.
// * Promises are distinguishable from arbitrary functions.
// * The promise API is abstracted with a Promise constructor
//   that accepts a descriptor that receives all of the
//   messages forwarded to that promise and handles the
//   common patterns for message receivers.  The promise
//   constructor also takes optional fallback and valueOf
//   methods which handle the cases for missing handlers on
//   the descriptor (rejection by default) and the valueOf
//   call (which returns the promise itself by default)
// * near(ref) has been changed to Promise.valueOf() in
//   keeping with JavaScript's existing Object.valueOf().
// * variadic arguments are used internally where
//   applicable. However, I have not altered the Q.post()
//   API to expand variadic arguments since Tyler Close
//   informed the CommonJS list that it would restrict
//   usage patterns for web_send, posting arbitrary JSON
//   objects as the "arguments" over HTTP.

/*
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * ref_send.js version: 2009-05-11
 */

/* 
 * Copyright 2009-2010 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 */

/*whatsupdoc*/

// - the enclosure ensures that this module will function properly both as a
// CommonJS module and as a script in the browser.  In CommonJS, this module
// exports the "Q" API.  In the browser, this script creates a "Q" object in
// global scope.
// - the use of "undefined" on the enclosure is a micro-optmization for
// compression systems, permitting every occurrence of the "undefined" keyword
// bo be replaced with a single-character.
(function (exports, undefined) {
"use strict";

var enqueue;
try {
    // Narwhal, Node (with a package, wraps process.nextTick)
    enqueue = require("event-queue").enqueue;
} catch(e) {
    // browsers
    enqueue = function (task) {
        setTimeout(task, 0);
    };
}

var print;
if (typeof console !== "undefined") {
    // browsers in debug mode, Node
    print = function (message) {
        console.log(message);
    };
} else if (typeof require !== "undefined") {
    // Narwhal
    print = require("system").print;
} else {
    // browsers otherwise
    print = function () {}
}

// useful for an identity stub and default resolvers
function identity (x) {return x}

// ES5 shims
var freeze = Object.freeze || identity;
var create = Object.create || function create(prototype) {
    var Type = function () {};
    Type.prototype = prototype;
    object = new Type();
}

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

    promise.emit = function () {
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
        return value.valueOf();
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
    };

    return {
        "promise": freeze(promise),
        "resolve": resolve,
        "reject": function (reason) {
            resolve(reject(reason));
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
exports.Promise = Promise;

function Promise(descriptor, fallback, valueOf) {

    if (fallback === undefined) {
        fallback = function (op) {
            return reject("Promise does not support operation: " + op);
        };
    }

    var promise = create(Promise.prototype);

    promise.emit = function (op, resolved /* ...args */) {
        resolved = resolved || identity;
        var args = Array.prototype.slice.call(arguments, 2);
        var result;
        if (descriptor[op])
            result = descriptor[op].apply(descriptor, args);
        else
            result = fallback.apply(descriptor, arguments);
        return resolved(result);
    };

    if (valueOf)
        promise.valueOf = valueOf;

    return freeze(promise);
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
 * Otherwise it is a resolved value.
 */
exports.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
};

/**
 * @returns whether the given object is a fully
 * resolved value.
 */
exports.isResolved = isResolved;
function isResolved(object) {
    return !isPromise(object.valueOf());
};

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
    }, function fallback(op, resolved) {
        var rejection = reject(reason);
        return resolved ? resolved(rejection) : rejection;
    });
}

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
    return Promise({
        "when": function (rejected) {
            return object;
        },
        "get": function (name) {
            return object[name];
        },
        "put": function (name, value) {
            object[name] = value;
        },
        "delete": function (name) {
            delete object[name];
        },
        "post": function (name, args) {
            return object[name].apply(object, args);
        }
    }, undefined, function valueOf() {
        return object;
    });
}

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that resolved and rejected will be called only once.
 * 2. that either the resolved callback or the rejected callback will be
 *    called, but not both.
 * 3. that resolved and rejected will not be called in this turn.
 *
 * @param value     promise or immediate reference to observe
 * @param resolve function to be called with the resolved value
 * @param rejected  function to be called with the rejection reason
 * @return promise for the return value from the invoked callback
 */
exports.when = when;
function when(value, resolved, rejected) {
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks
    forward(ref(value), "when", function (value) {
        if (done)
            return;
        done = true;
        deferred.resolve(ref(value).emit("when", resolved, rejected));
    }, function (reason) {
        if (done)
            return;
        done = true;
        deferred.resolve(rejected ? rejected(reason) : reject(reason));
    });
    return deferred.promise;
}

/**
 * Like "when", but attempts to return a fully resolved
 * value in the same turn. If the given value is fully
 * resolved, and the value returned by the resolved
 * callback is fully resolved, asap returns the latter
 * value in the same turn. Otherwise, it returns a promise
 * that will be resolved in a future turn.
 *
 * This method is an experiment in providing an API
 * that can unify synchronous and asynchronous API's.
 * An API that uses "asap" guarantees that, if it
 * is provided fully resolved values, it would produce
 * fully resolved values, but if it is provided
 * asynchronous promises, it will produce asynchronous
 * promises.
 *
 * /!\ WARNING: this method is expiermental and likely
 * to be removed on the grounds that it probably
 * will result in composition hazards.
 */
exports.asap = function (value, resolved, rejected) {
    resolved = resolved || identity;
    if (isResolved(value))
        return resolved(value.valueOf()).valueOf();
    else
        return when(value, resolved, rejected);
};

/**
 * Constructs a promise method that can be used to safely observe resolution of
 * a promise for an arbitrarily named method like "propfind" in a future turn.
 *
 * "Method" constructs methods like "get(promise, name)" and "put(promise)".
 */
exports.Method = Method;
function Method (methodName) {
    return function (object) {
        var deferred = defer();
        var args = Array.prototype.slice.call(arguments, 1);
        forward.apply(undefined, [
            ref(object),
            methodName,
            deferred.resolve
        ].concat(args));
        return deferred.promise;
    };
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
 * @param argv      array of invocation arguments
 * @return promise for the return value
 */
exports.post = Method("post");

/**
 * Guarantees that the give promise resolves to a defined, non-null value.
 */
exports.defined = function (value) {
    return exports.when(value, function (value) {
        if (value === undefined || value === null)
            return reject("Resolved undefined value: " + value);
        return value;
    });
};

/**
 * Throws an error with the given reason.
 */
exports.error = function (reason) {
    if (!(reason instanceof Error))
        reason = new Error(reason);
    throw reason;
};

/*
 * Enqueues a promise operation for a future turn.
 */
function forward(promise /*, op, resolved, ... */) {
    var args = Array.prototype.slice.call(arguments, 1);
    enqueue(function () {
        try {
            promise.emit.apply(promise, args);
        } catch (exception) {
            print(exception.stack || exception);
        }
    });
}

// Complete the closure: use either CommonJS exports or browser global Q object
// for the exports internally.
})(
    typeof exports !== "undefined" ?
    exports :
    this["/q"] = {}
);

