// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2013 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/*global -WeakMap */
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

var asap = require("asap");
var WeakMap = require("weak-map");

function isObject(value) {
    return value === Object(value);
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p && handlers.get(p); p = handlers.get(p).became) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(this, arguments);
    };
}

// end of long stack traces

var handlers = new WeakMap();

function inspect(promise) {
    var handler = handlers.get(promise);
    if (!handler || !handler.became) {
        return handler;
    }
    handler = followHandler(handler);
    handlers.set(promise, handler);
    return handler;
}

function followHandler(handler) {
    if (!handler.became) {
        return handler;
    } else {
        handler.became = followHandler(handler.became);
        return handler.became;
    }
}

var theViciousCycleError = new Error("Can't resolve a promise with itself");
var theViciousCycleRejection = reject(theViciousCycleError);
var theViciousCycleHandler = inspect(theViciousCycleRejection);

var thenables = new WeakMap();

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
module.exports = Q;
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (isPromise(value)) {
        return value;
    } else if (isThenable(value)) {
        if (!thenables.has(value)) {
            thenables.set(value, new Promise(new ThenableHandler(value)));
        }
        return thenables.get(value);
    } else {
        return new Promise(new FulfilledHandler(value));
    }
}

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    return new Promise(new RejectedHandler(reason));
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {

    var handler = new DeferredHandler();
    var promise = new Promise(handler);
    var deferred = new Deferred(promise);

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    return deferred;
}

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(questions) {
    // XXX deprecated behavior
    if (Q.isPromise(questions)) {
        console.warn("Q.all no longer directly unwraps a promise. Use Q(array).all()");
        return Q(questions).all();
    }
    var countDown = 0;
    var deferred = defer();
    var answers = Array(questions.length);
    Array.prototype.forEach.call(questions, function (promise, index) {
        var handler;
        if (
            isPromise(promise) &&
            (handler = promise.inspect()).state === "fulfilled"
        ) {
            answers[index] = handler.value;
        } else {
            ++countDown;
            Q(promise).then(
                function (value) {
                    answers[index] = value;
                    if (--countDown === 0) {
                        deferred.resolve(answers);
                    }
                },
                deferred.reject,
                function (progress) {
                    deferred.notify({ index: index, value: progress });
                }
            );
        }
    });
    if (countDown === 0) {
        deferred.resolve(answers);
    }
    return deferred.promise;
}

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(questions) {
    // XXX deprecated behavior
    if (Q.isPromise(questions)) {
        console.warn("Q.allSettled no longer directly unwraps a promise. Use Q(array).allSettled()");
        return Q(questions).allSettled();
    }
    return all(questions.map(function (promise) {
        promise = Q(promise);
        function regardless() {
            return promise.inspect();
        }
        return promise.then(regardless, regardless);
    }));
}

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, message) {
    return Q(object).timeout(ms, message);
};

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q.spread([x, y], function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become fulfilled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be fulfilled
 */
Q.race = race;
function race(answerPs) {
    return new Promise(function(deferred) {
        answerPs.forEach(function(answerP) {
            Q(answerP).then(deferred.resolve, deferred.reject);
        });
    });
}

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] = function (callback) {
    return Q(callback).dispatch("post", [void 0, []]);
};

/**
 * TODO
 */
Q.fapply = function (callback, args) {
    return Q(callback).dispatch("post", [void 0, args]);
};

/**
 * TODO
 */
Q.fcall = function (callback /*, ...args*/) {
    return Q(callback).dispatch("post", [void 0, Array.prototype.slice.call(arguments, 1)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = Array.prototype.slice.call(arguments, 1);
    return function fbound() {
        return promise.dispatch("post", [
            void 0,
            args.concat(Array.prototype.slice.call(arguments)),
            this
        ]);
    };
};

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
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
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;
            try {
                result = generator[verb](arg);
            } catch (exception) {
                return reject(exception);
            }
            if (result.done) {
                return result.value;
            } else {
                return Q(result.value).then(callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.async(makeGenerator)().done();
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}


// Thus begins the section dedicated to the Promise

/**
 * TODO
 */
Q.Promise = Promise;
function Promise(handler) {
    if (!(this instanceof Promise)) {
        return new Promise(handler);
    }
    if (typeof handler === "function") {
        var setup = handler;
        var deferred = defer();
        handler = inspect(deferred.promise);
        try {
            setup(deferred);
        } catch (reason) {
            deferred.reject(reason);
        }
    }
    handlers.set(this, handler);
}

/**
 * TODO
 */
Promise.cast = function (value) {
    return Q(value);
};

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return isObject(object) && !!handlers.get(object);
}

/**
 * TODO
 */
Q.isThenable = isThenable;
function isThenable(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * TODO
 */
Promise.prototype.inspect = function () {
    // the second layer captures only the relevant "state" properties of the
    // handler to prevent leaking the capability to access or alter the
    // handler.
    return inspect(this).inspect();
};

/**
 * TODO
 */
Promise.prototype.isPending = function isPending() {
    return inspect(this).state === "pending";
};

/**
 * TODO
 */
Promise.prototype.isFulfilled = function isFulfilled() {
    return inspect(this).state === "fulfilled";
};

/**
 * TODO
 */
Promise.prototype.isRejected = function isRejected() {
    return inspect(this).state === "rejected";
};

/**
 * TODO
 */
Promise.prototype.toString = function () {
    return "[object Promise]";
};

/**
 * TODO
 */
Promise.prototype.then = function then(fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    asap(function () {
        inspect(self).dispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "then", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    inspect(this).dispatch(void 0, "then", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

/**
 * TODO
 */
Promise.prototype.thenResolve = function thenResolve(value) {
    return this.then(function () { return value; });
};

/**
 * TODO
 */
Promise.prototype.thenReject = function thenReject(reason) {
    return this.then(function () { throw reason; });
};

/**
 * TODO
 */
Promise.prototype.all = function () {
    return this.then(Q.all);
};

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(Q.allSettled);
};

/**
 * TODO
 */
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * TODO
 */
Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * TODO
 */
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param onfulfilled
 * @param onrejected
 * @param onprogress
 */
Promise.prototype.done = function done(fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        asap(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `asap` calls due to an unnecessary `then`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    // Bind the error handler to the current Node.js domain
    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * TODO
 */
Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    asap(function () {
        inspect(self).dispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * TODO
 */
Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * TODO
 */
Promise.prototype.post = function (name, args, thisp) {
    return this.dispatch("post", [name, args, thisp]);
};

/**
 * TODO
 */
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, Array.prototype.slice.call(arguments, 1)]);
};

/**
 * TODO
 */
Promise.prototype.fapply = function (args) {
    return this.dispatch("post", [void 0, args]);
};

/**
 * TODO
 */
Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("post", [void 0, Array.prototype.slice.call(arguments)]);
};

/**
 * TODO
 */
Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * TODO
 */
Promise.prototype.spread = function (fulfilled, rejected, progressed) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected, progressed);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Promise.prototype.timeout = function (ms, message) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */

Promise.prototype.delay = function (ms) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, ms);
        return deferred.promise;
    });
};

/**
 * TODO
 */
Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            asap(function () {
                nodeback(null, value);
            });
        }, function (error) {
            asap(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};


// Thus begins the portion dedicated to the deferred

function Deferred(promise) {
    this.promise = promise;
    // A deferred has an intrinsic promise, denoted by its hidden handler
    // property.  The promise property of the deferred may be assigned to a
    // different promise (as it is in a Queue), but the intrinsic promise does
    // not change.
    handlers.set(this, inspect(promise));
    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);
    this.notify = this.notify.bind(this);
}

/**
 * TODO
 */
Deferred.prototype.resolve = function (value) {
    var handler = inspect(this);
    if (!handler.messages) {
        return;
    }
    handler.become(Q(value));
};

/**
 * TODO
 */
Deferred.prototype.reject = function (reason) {
    var handler = inspect(this);
    if (!handler.messages) {
        return;
    }
    handler.become(reject(reason));
};

/**
 * TODO
 */
Deferred.prototype.notify = function (progress) {
    var handler = inspect(this);
    if (!handler.messages) {
        return;
    }
    handler.notify(progress);
};


// Thus ends the public interface

// Thus begins the portion dedicated to handlers

function FulfilledHandler(value) {
    this.value = value;
}

FulfilledHandler.prototype.state = "fulfilled";

FulfilledHandler.prototype.inspect = function () {
    return {state: "fulfilled", value: this.value};
};

FulfilledHandler.prototype.dispatch = function (resolve, op, operands) {
    var result;
    if (op === "then" || op === "get" || op === "post" || op === "keys") {
        try {
            result = this[op].apply(this, operands);
        } catch (exception) {
            result = reject(exception);
        }
    } else {
        var error = new Error(
            "Fulfilled promises do not support the " + op + " operator"
        );
        result = reject(error);
    }
    if (resolve) {
        resolve(result);
    }
};

FulfilledHandler.prototype.then = function () {
    return this.value;
};

FulfilledHandler.prototype.get = function (name) {
    return this.value[name];
};

FulfilledHandler.prototype.post = function (name, args, thisp) {
    if (name === null || name === void 0) {
        // function application
        return this.value.apply(thisp, args);
    } else {
        // method invocation
        return this.value[name].apply(this.value, args);
    }
};

FulfilledHandler.prototype.keys = function () {
    return Object.keys(this.value);
};


function RejectedHandler(reason) {
    this.reason = reason;
    // Note that the reason has not been handled.
    trackRejection(this, reason);
}

RejectedHandler.prototype.state = "rejected";

RejectedHandler.prototype.inspect = function () {
    return {state: "rejected", reason: this.reason};
};

RejectedHandler.prototype.dispatch = function (resolve, op, operands) {
    var result;
    if (op === "then") {
        result = this.then(resolve, operands[0]);
    } else {
        result = this;
    }
    if (resolve) {
        resolve(result);
    }
};

RejectedHandler.prototype.then = function (resolve, rejected) {
    if (rejected) {
        untrackRejection(this);
    }
    return rejected ? rejected(this.reason) : this;
};


function DeferredHandler() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    this.messages = [];
    this.progressListeners = [];
}

DeferredHandler.prototype.state = "pending";

DeferredHandler.prototype.inspect = function () {
    return {state: "pending"};
};

DeferredHandler.prototype.dispatch = function (resolve, op, operands) {
    this.messages.push([resolve, op, operands]);
    if (op === "then" && operands[1]) { // progress operand
        this.progressListeners.push(operands[1]);
    }
};

DeferredHandler.prototype.become = function (promise) {
    this.became = theViciousCycleHandler;
    var handler = inspect(promise);
    this.became = handler;

    handlers.set(promise, handler);
    this.promise = void 0;

    this.messages.forEach(function (message) {
        // TODO figure out whether this asap is necessary.  makeQ does not
        // have it.
        asap(function () {
            var handler = inspect(promise);
            handler.dispatch.apply(handler, message);
        });
    });

    this.messages = void 0;
    this.progressListeners = void 0;
};

DeferredHandler.prototype.notify = function (progress) {
    this.progressListeners.forEach(function (progressListener) {
        asap(function () {
            progressListener(progress);
        });
    });
};


function ThenableHandler(thenable) {
    this.thenable = thenable;
    this.became = null;
}

ThenableHandler.prototype.cast = function () {
    if (!this.became) {
        var deferred = defer();
        var thenable = this.thenable;
        asap(function () {
            try {
                thenable.then(
                    deferred.resolve,
                    deferred.reject,
                    deferred.notify
                );
            } catch (exception) {
                deferred.reject(exception);
            }
        });
        this.became = inspect(deferred.promise);
    }
    return this.became;
};

ThenableHandler.prototype.dispatch = function (resolve, op, args) {
    this.cast().dispatch(resolve, op, args);
};


//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var unhandledReasonsDisplayed = false;
var trackUnhandledRejections = true;
function displayUnhandledReasons() {
    if (
        !unhandledReasonsDisplayed &&
        typeof window !== "undefined" &&
        window.console
    ) {
        console.warn("[Q] Unhandled rejection reasons (should be empty):",
                     unhandledReasons);
    }

    unhandledReasonsDisplayed = true;
}

function logUnhandledReasons() {
    for (var i = 0; i < unhandledReasons.length; i++) {
        var reason = unhandledReasons[i];
        console.warn("Unhandled rejection reason:", reason);
    }
}

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;
    unhandledReasonsDisplayed = false;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;

        // Show unhandled rejection reasons if Node exits without handling an
        // outstanding rejection.  (Note that Browserify presently produces a
        // `process` global without the `EventEmitter` `on` method.)
        if (typeof process !== "undefined" && process.on) {
            process.on("exit", logUnhandledReasons);
        }
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
    displayUnhandledReasons();
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = unhandledRejections.indexOf(promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    if (typeof process !== "undefined" && process.on) {
        process.removeListener("exit", logUnhandledReasons);
    }
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();


// DEPRECATED

Q.nextTick = deprecate(asap, "nextTick", "asap package");

Q.resolve = deprecate(Q, "resolve", "Q");

Q.fulfill = deprecate(Q, "fulfill", "Q");

Q.isPromiseAlike = deprecate(isThenable, "isPromiseAlike", "isThenable");

Q.when = deprecate(function (value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}, "when", "Q(value).then");

Q.fail = deprecate(function (value, rejected) {
    return Q(value)["catch"](rejected);
}, "Q.fail", "Q(value).catch");

Q.fin = deprecate(function (value, regardless) {
    return Q(value)["finally"](regardless);
}, "Q.fin", "Q(value).finally");

Q.progress = deprecate(function (value, rejected) {
    return Q(value).progress(rejected);
}, "Q.progress", "Q(value).progress");

Q.thenResolve = deprecate(function (promise, value) {
    return Q(promise).thenResolve(value);
}, "thenResolve", "Q(value).thenResolve");

Q.thenReject = deprecate(function (promise, reason) {
    return Q(promise).thenResolve(reason);
}, "thenResolve", "Q(value).thenResolve");

Q.isPending = deprecate(function (value) {
    return Q(value).isPending();
}, "isPending", "Q(value).isPending");

Q.isFulfilled = deprecate(function (value) {
    return Q(value).isFulfilled();
}, "isFulfilled", "Q(value).isFulfilled");

Q.isRejected = deprecate(function (value) {
    return Q(value).isRejected();
}, "isRejected", "Q(value).isRejected");

Q.master = deprecate(function (value) {
    return value;
}, "master", "no longer necessary");

Q.makePromise = function () {
    throw new Error("makePromise is no longer supported");
};

Q.dispatch = deprecate(function (value, op, operands) {
    return Q(value).dispatch(op, operands);
}, "dispatch", "Q(value).dispatch");

Q.get = deprecate(function (object, name) {
    return Q(object).get(name);
}, "get", "Q(value).get");

Q.keys = deprecate(function (object) {
    return Q(object).keys();
}, "keys", "Q(value).keys");

Q.post = deprecate(function (object, name, args) {
    return Q(object).post(name, args);
}, "post", "Q(value).post");

Q.mapply = deprecate(function (object, name, args) {
    return Q(object).post(name, args);
}, "post", "Q(value).post");

Q.send = deprecate(function (object, name) {
    return Q(object).post(name, Array.prototype.slice.call(arguments, 2));
}, "send", "Q(value).invoke");

Q.set = function () {
    throw new Error("Q.set no longer supported");
};

Q["delete"] = function () {
    throw new Error("Q.delete no longer supported");
};

Q.nearer = deprecate(function (value) {
    if (Q.isPromise(value) && value.isFulfilled()) {
        return value.inspect().value;
    } else {
        return value;
    }
}, "nearer", "inspect().value (+nuances)");

Promise.prototype.fail = deprecate(function (rejected) {
    return this["catch"](rejected);
}, "fail", "catch");

Promise.prototype.fin = deprecate(function (regardless) {
    return this["finally"](regardless);
}, "fin", "finally");

Promise.prototype.set = function () {
    throw new Error("Promise set no longer supported");
};

Promise.prototype["delete"] = function () {
    throw new Error("Promise delete no longer supported");
};

// alternative proposed by Redsandro, dropped in favor of post to streamline
// the interface
Promise.prototype.mapply = deprecate(function (name, args, thisp) {
    return this.dispatch("post", [name, args, thisp]);
}, "mapply", "post");

Promise.prototype.fbind = deprecate(function () {
    return Q.fbind.apply(Q, [this].concat(Array.prototype.slice.call(arguments)));
}, "promise.fbind", "Q.fbind");

// alternative proposed by Mark Miller, dropped in favor of invoke
Promise.prototype.send = deprecate(function () {
    return this.dispatch("post", [name, Array.prototype.slice.call(arguments, 1)]);
}, "send", "invoke");

// alternative proposed by Redsandro, dropped in favor of invoke
Promise.prototype.mcall = deprecate(function () {
    return this.dispatch("post", [name, Array.prototype.slice.call(arguments, 1)]);
}, "mcall", "invoke");

Promise.prototype.passByCopy = deprecate(function (value) {
    return value;
}, "passByCopy", "Q.passByCopy");

Q.promise = deprecate(Promise, "promise", "Promise");

// Deprecated Node.js shorthands

var NQ = require("./node");
(function () {
    for (var name in NQ) {
        Q[name] = NQ[name];
    }
})();

Deferred.prototype.makeNodeResolver = deprecate(function () {
    return NQ.makeNodeResolver(this.resolve);
}, "makeNodeResolver", "q/node makeNodeResolver");

Promise.prototype.nfapply = deprecate(function (args) {
    return NQ.nfapply(this, args);
}, "nfapply", "q/node nfapply");

Promise.prototype.nfcall = deprecate(function () {
    return NQ.nfapply(this, Array.prototype.slice.call(arguments));
}, "nfcall", "q/node nfcall");

Promise.prototype.nfbind = deprecate(function () {
    return NQ.nfbind(this, Array.prototype.slice.call(arguments));
}, "nfbind", "q/node nfbind");

Q.nmapply = deprecate(NQ.nmapply, "nmapply", "q/node nmapply");

var npost = function (name, args) {
    return NQ.npost(this, name, args);
};

Promise.prototype.nmapply = deprecate(npost, "nmapply", "q/node nmapply");
Promise.prototype.npost = deprecate(npost, "npost", "q/node npost");

Q.nsend = deprecate(NQ.ninvoke, "nsend", "q/node ninvoke");
Q.nmcall = deprecate(NQ.ninvoke, "nmcall", "q/node ninvoke");

var ninvoke = function (name) {
    return NQ.npost(this, name, Array.prototype.slice.call(arguments, 1));
};

Promise.prototype.nsend = deprecate(ninvoke, "nsend", "q/node ninvoke");
Promise.prototype.nmcall = deprecate(ninvoke, "nmcall", "q/node ninvoke");
Promise.prototype.ninvoke = deprecate(ninvoke, "ninvoke", "q/node ninvoke");

