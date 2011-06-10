
Q is a tool for making and composing asynchronous promises in
JavaScript.

An asynchronous promise is an object that represents the eventual
return value (fulfillment) or thrown exception of (rejection) of a
function that could not respond before returning without blocking,
like file system, inter-process, and network operations.  An eventual
"resolution" is either a fulfillment or a rejection.

The Q module can be loaded as:

-   a ``<script>`` tag (creating a ``Q`` global variable)
-   a NodeJS module, or generally a CommonJS module
-   a RequireJS module

Q is designed to work well with jQuery, Dojo, and as part of an
ecosystem of NodeJS NPM packages, many of which also work in browsers,
including:

-   [qq](https://github.com/kriskowal/qq)
    infinite queues, deep and shallow object resolution,
    map/reduce helpers, lazy objects
-   [q-fs](https://github.com/kriskowal/q-fs)
    file system
-   [promised-io](https://github.com/gozala/promised-io)
    alternate file system, same in spirit
-   [q-http](https://github.com/kriskowal/q-http)
    http client and server
-   [q-comm](https://github.com/kriskowal/q-comm)
    remote objects
-   [jaque](https://github.com/kriskowal/jaque)
    promising HTTP server, JSGI middleware
-   [teleport](https://github.com/gozala/teleport)
    browser-side module promises

Q conforms to many proposed standards, mostly by Kris Zyp and myself,
with mentoring from Mark Miller: [UncommonJS/Promises][]
[CommonJS/Promises/A][], [CommonJS/Promises/B][], and
[CommonJS/Promises/D][].  Q is based on Tyler Close's ``ref_send``
API for [Waterken][].

[UncommonJS/Promises]: https://github.com/kriskowal/uncommonjs/blob/master/promises/specification.md
[CommonJS/Promises/A]: http://wiki.commonjs.org/wiki/Promises/A
[CommonJS/Promises/B]: http://wiki.commonjs.org/wiki/Promises/B
[CommonJS/Promises/D]: http://wiki.commonjs.org/wiki/Promises/D
[Waterken]: http://waterken.sourceforge.net/

To install the most recent  Q and QQ packages on NodeJS with NPM:

    $ curl http://npmjs.org/install.sh | sh
    $ npm install q qq
    $ node examples/test.js



EXAMPLES
--------

The ``"q/util"`` module has moved to its own package and repository.
It is now [QQ][].  Since it is used in the following examples, I've
added it to the list of modules to install.  QQ provides everything in
Q plus some derrived utility functions.

[QQ]: https://github.com/kriskowal/qq


## ``defer``

This example provides a promise-oriented ``delay`` function
based on the callback-oriented ``setTimeout`` function.

    function delay(ms) {
        var deferred = Q.defer();
        setTimeout(deferred.resolve, ms);
        return deferred.promise;
    }


This example takes a promise and returns a promise that will
be rejected if the given promise is not fulfilled in a
timely fashion.

    function timeout(promise, ms) {
        var deferred = Q.defer();
        Q.when(promise, deferred.resolve);
        Q.when(delay(ms), function () {
            deferred.reject("Timed out");
        });
        return deferred.promise;
    }


This example wraps Node's file listing function, returning a
promise instead of accepting a callback.

    var FS = require("fs"); // from Node

    function list(path) {
        path = String(path);
        var result = Q.defer();
        FS.readdir(path, function (error, list) {
            if (error)
                return result.reject(error);
            else
                result.resolve(list);
        });
        return result.promise;
    }


## ``when``

This example illustrates how the ``when`` primitive can be
used to observe the fulfillment of a promise.

    var bPromise = Q.when(aPromise, function (aValue) {
        return bValue;
    });

*   If ``aPromise`` is fulfilled, the callback is called in a future
    turn of the even loop with the fulfilled value as ``aValue``.
*   If ``aPromise`` is rejected, ``bPromise`` will be resolved with
    ``aPromise`` (the rejection will be forwarded).
*   ``bPromise`` is eventually resolved with ``bValue``.
*   ``aPromise`` does not actually need to be a promise.  It can be any
    value, in which case it is treated as an already fulfilled
    promise.
*   ``bValue`` does not actually need to be a value.  It can be a
    promise, which would further defer the resolution of ``bPromise``.
*   If the fulfillment callback throws an exception, ``bPromise`` will
    be rejected with the thrown error as the reason.


This example illustrates how the ``when`` primitive can be used to
observe either the fulfillment or rejection of a promise.  

    var bPromise = Q.when(aPromise, function (aValue) {
        return bValue;
    }, function (aReason) {
        return bValue; // or
        throw bReason;
    });

*   If ``aPromise`` is rejected, the second callback, the rejection
    callback, will be called with the reason for the rejection as
    ``aReason``.
*   The value returned by the rejection callback will be used to
    resolve ``bPromise``.
*   If the rejection callback throws an error, ``bPromise`` will be
    rejected with the error as the reason.
*   Unlike a ``try`` and ``catch`` block, the rejection callback will not
    be called if the fulfillment callback throws an error or returns a
    rejection.  To observe an exception thrown in either the
    fulfillment or the rejection callback, another ``when`` block must
    be used to observe the rejection of ``bPromise``.

In general,

*   If the rejection callback is falsy and ``aPromise`` is rejected, the
    rejection will be forwarded to ``bPromise``.
*   If the fulfillment callback is falsy and ``aPromise`` is fulfilled,
    the fulfilled value will be forwarded to ``bPromise``.


## Node File-system Examples

In Node, this example reads itself and writes itself out in
all capitals.

    var Q = require("q");
    var FS = require("q-fs");

    var text = FS.read(__filename);
    Q.when(text, function (text) {
        console.log(text.toUpperCase());
    });

You can also perform actions in parallel.  This example
reads two files at the same time and returns an array of
promises for the results.

    var Q = require("qq");
    var FS = require("q-fs");

    var self = FS.read(__filename);
    var passwd = FS.read("/etc/passwd");
    Q.join(self, passwd, function (self, passwd) {
        console.log(__filename + ':', self.length);
        console.log('/etc/passwd:', passwd.length);
    });

This example reads all of the files in the same directory as
the program and notes the length of each, in the order in
which they are finished reading.

    var Q = require("q");
    var FS = require("q-fs");

    var list = FS.list(__dirname);
    var files = Q.when(list, function (list) {
        list.forEach(function (fileName) {
            var content = FS.read(fileName);
            Q.when(content, function (content) {
                console.log(fileName, content.length);
            });
        });
    });

This example reads all of the files in the same directory as
the program and notes the length of each, in the order in
which they were listed.

    var Q = require("qq");
    var FS = require("q-fs");

    var list = FS.list(__dirname);
    var files = Q.when(list, function (list) {
        return list.reduce(function (ready, fileName) {
            var content = FS.read(fileName);
            return Q.join(ready, content, function (ready, content) {
                console.log(fileName, content.length);
            });
        });
    });


## Parallel Join

Promises can be used to do work either in parallel or
serial, depending on whether you wait for one promise to be
fulfilled before beginning work on a second.  To do a
parallel join, begin work and get promises and use nested
``when`` blocks to create a single promise that will be
resolved when both inputs are resolved, or when the first is
rejected.

    var aPromise = aFunction();
    var bPromise = bFunction();
    var cPromise = Q.when(aPromise, function (aValue) {
        return Q.when(bPromise, function (bValue) {
            return cValue;
        });
    });

For short, you can use the ``join`` function in ``qq``.

    var Q = require("qq");
    var aPromise = aFunction();
    var bPromise = bFunction();
    Q.join(aPromise, bPromise, function (aValue, bValue) {
        return cValue;
    });

If a piece of work can be done on each value in an array in
parallel, you can use either a ``forEach`` loop or a ``reduce``
loop to create a ``done`` promise.

    var done;
    array.forEach(function (value) {
        var work = doWork(value); 
        done = Q.when(done, function () {
            return work;
        });
    });
    return done;

It is a bit more concise with a ``reduce`` loop.

    return array.reduce(function (done, value) {
        var work = doWork(value);
        return Q.when(done, function () {
            return work;
        });
    }, undefined);


## Serial Join

If you have two pieces of work and the second cannot be done
until the first completes, you can also use nested ``when``
blocks.

    var aPromise = aFunction();
    var cPromise = Q.when(aPromise, function (aValue) {
        var bPromise = bFunction(aValue);
        return Q.when(bPromise, function bValue) {
            return cValue;
        });
    });

If you can do work on each value in an array, but want to do
them in order and one at a time, you can use ``forEach`` or
``reduce`` loop.

    var done;
    array.forEach(function (value) {
        done = Q.when(done, function () {
            return doWork(value); 
        });
    });
    return done;

It is more concise with ``reduce``.

    return array.reduce(function (done, value) {
        return Q.when(done, function () {
            return doWork(value);
        });
    });


## Recovery

You can use the rejection callback of ``when`` blocks to
recover from failure.  Supposing that ``doIt`` will
intermittently fail (perhaps because of network conditions),
``justDoIt`` will just keep trying indifinitely.

    function justDoIt(value) {
        var work = doIt(value);
        work = timeout(1000, work);
        return Q.when(work, function (work) {
            return work;
        }, function errback(reason) {
            // just do it again
            return justDoIt(value);
        });
    }

This will not blow out the stack because ``when`` blocks
guarantee that the fulfillment and rejection callbacks will
only be called on their own turn of the event loop.


## Conditional Array Serial Join

Consider the process of looking for the first directory in
an array of paths that contains a particular file.  To do
this with a synchronous file API is very straight-forward.

    function find(basePaths, soughtPath) {
        for (var i = 0, ii = basePaths.length; i < ii; i++) {
            var consideredPath = FS.join(basePaths[i], soughtPath);
            if (FS.isFile(consideredPath))
                return consideredPath;
        }
        throw new Error("Can't find.");
    }

To do this with an asynchronous ``FS.isFile`` is more
elaborate.  It is a serial iteration, but it halts at the
first success.  This can be accomplished by creating a chain
of functions, each making progress on the returned promise
until the matching path is found, otherwise returning the
value returned by the next function in line, until all
options are exhausted and returning a rejection.

    function find(basePaths, soughtPath) {
        var find = basePaths.reduceRight(function (otherwise, basePath) {
            return function () {
                var consideredPath = FS.join(basePath, soughtPath);
                var isFile = FS.isFile(consideredPath);
                return Q.when(isFile, function (isFile) {
                    if (isFile) {
                        return consideredPath;
                    } else {
                        return otherwise();
                    }
                });
            };
        }, function otherwise() {
            throw new Error("Can't find");
        });
        return find();
    }


THE HALLOWED API
----------------


## ``when(value, callback_opt, errback_opt)``

Arranges for a callback to be called:

-   with the value as its sole argument
-   in a future turn of the event loop
-   if and when the value is or becomes a fully resolved

Arranges for errback to be called:

-   with a value respresenting the reason why the object will
    never be resolved, typically a string.
-   in a future turn of the event loop
-   if the value is a promise and
    -   if and when the promise is rejected

Returns a promise:

-   that will resolve to the value returned by either the callback
    or errback, if either of those functions are called, or
-   that will be rejected if the value is rejected and no errback
    is provided, thus forwarding rejections by default.

The value may be truly _any_ value.

The callback and errback may be falsy, in which case they will not
be called.

Guarantees:

-   The callback will not be called before when returns.
-   The errback will not be called before when returns.
-   The callback will not be called more than once.
-   The errback will not be called more than once.
-   If the callback is called, the errback will never be called.
-   If the errback is called, the callback will never be called.
-   If a promise is never resolved, neither the callback or the
    errback will ever be called.

THIS IS COOL

-   You can set up an entire chain of causes and effects in the
    duration of a single event and be guaranteed that any invariants
    in your lexical scope will not...vary.
-   You can both receive a promise from a sketchy API and return a
    promise to some other sketchy API and, as long as you trust this
    module, all of these guarantees are still provided.
-   You can use when to compose promises in a variety of ways, for
    example:

INTERSECTION

    function and(a, b) {
        return Q.when(a, function (a) {
            return Q.when(b, function (b) {
                // ...
            });
        })
    }


## ``defer()``

Returns a "deferred" object with a:

-   ``promise`` property
-   ``resolve(value)`` function
-   ``reject(reason)`` function

The promise is suitable for passing as a value to the ``when`` function.

Calling resolve with a promise notifies all observers that they must now
wait for that promise to resolve.

Calling resolve with a rejected promise notifies all observers that the
promise will never be fully resolved with the rejection reason.  This
forwards through the the chain of ``when`` calls and their returned
promises until it reaches a ``when`` call that has an ``errback``.

Calling resolve with a fully resolved value notifies all observers that
they may proceed with that value in a future turn.  This forwards
through the ``callback`` chain of any pending ``when`` calls.

Calling reject with a reason is equivalent to resolving with a
rejection.

In all cases where the resolution of a promise is set, (promise,
rejection, value) the resolution is permanent and cannot be reset.  All
future observers of the resolution of the promise will be notified of
the resolved value, so it is safe to call ``when`` on a promise
regardless of whether it has been or will be resolved.


THIS IS COOL

The Deferred separates the promise part from the resolver part. So:

-   You can give the promise to any number of consumers and all of them
    will observe the resolution independently.  Because the capability
    of observing a promise is separated from the capability of resolving
    the promise, none of the recipients of the promise have the ability
    to "trick" other recipients with misinformation.

-   You can give the resolver to any number of producers and whoever
    resolves the promise first wins.  Furthermore, none of the producers
    can observe that they lost unless you give them the promise part
    too.


UNION

    function or(a, b) {
        var union = Q.defer();
        Q.when(a, union.resolve);
        Q.when(b, union.resolve);
        return union.promise;
    }


## ``ref(value)``

If value is a promise, returns the promise.

If value is not a promise, returns a promise that has already been
resolved with the given value.


## ``def(value)``

Annotates a value, wrapping it in a promise, such that that it is a
local promise object which cannot be serialized and sent to resolve a
remote promise.

A def'ed value will respond to the `isDef` message without a rejection
so remote promise communication libraries can distinguish it from
non-def values.


## ``reject(reason)``

Returns a promise that has already been rejected with the given reason.

This is useful for conditionally forwarding a rejection through an
errback.

    Q.when(API.getPromise(), function (value) {
        return doSomething(value);
    }, function (reason) {
        if (API.stillPossible())
            return API.tryAgain();
        else
            return reject(reason);
    })

Unconditionally forwarding a rejection is equivalent to omitting an
errback on a when call.


## ``isPromise(value)``

Returns whether the given value is a promise.


## ``isResolved(value)``

Returns whether the given value is fully resolved.  The given value may
be any value, including but not limited to promises returned by defer()
and ref(). Rejected promises are not considered resolved.


## ``isRejected(value)``

Returns whether the given value is a rejected promise.



## ``end(promise)``

Accepts a promise that is intended to be the last promise in a chain of
promises.  If an error propagates to the end of the promise chain, it
will be thrown as an exception and handled by either NodeJS or the
browser as an uncaught exception.


## ``enqueue(callback Function)``

Calls ``callback`` in a future turn.


ADVANCED API
------------

The ``ref`` promise constructor establishes the basic API for performing
operations on objects: "get", "put", "post", and "del".  This set of
"operators" can be extended by creating promises that respond to
messages with other operator names, and by sending corresponding
messages to those promises.


## ``makePromise(descriptor, fallback_opt, valueOf_opt)``

Creates a stand-alone promise that responds to messages.  These messages
have an operator like "when", "get", "put", and "post", corresponding to
each of the above methods for sending messages to promises.

The descriptor is an object with function properties (methods)
corresponding to operators.  When the made promise receives a message
and a corresponding operator exists in the descriptor, the method gets
called with the variadic arguments sent to the promise.  If no
descriptor exists, the fallback method is called with the operator, and
the subsequent variadic arguments instead.  These functions return a
promise for the eventual resolution of the promise returned by the
message-sender.  The default fallback returns a rejection.

The `valueOf` function, if provided, overrides the `valueOf` method of
the returned promise.  This is useful for providing information about
the promise in the same turn of the event loop.  For example, resolved
promises return their resolution value and rejections return an object
that is recognized by `isRejected`.


## ``send(value, operator, ...args)``

Sends an arbitrary message to a promise.

Care should be taken not to introduce control-flow hazards and secuirity
holes when forwarding messages to promises.  The methods above,
particularly ``when``, are carefully crafted to prevent a poorly crafted
or malicious promise from breaking the invariants like not applying
callbacks multiple times or in the same turn of the event loop.



Copyright 2009-2011 Kristopher Michael Kowal
MIT License (enclosed)

