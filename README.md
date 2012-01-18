[![Build Status](https://secure.travis-ci.org/kriskowal/q.png)](http://travis-ci.org/kriskowal/q)

If a function cannot return a value or throw an exception without
blocking, it can return a promise instead.  A promise is an object
that represents the return value or the thrown exception that the
function may eventually provide.  A promise can also be used as a
proxy for a [remote object][Q-Comm] to overcome latency.

[Q-Comm]: https://github.com/kriskowal/q-comm

On the first pass, promises can mitigate the “[Pyramid of
Doom][POD]”: the situation where code marches to the right faster
than it marches forward.

[POD]: http://calculist.org/blog/2011/12/14/why-coroutines-wont-work-on-the-web/

```javascript
step1(function (value1) {
    step2(value1, function(value2) {
        step3(value2, function(value3) {
            step4(value3, function(value4) {
                // Do something with value4
            });
        });
    });
});
```

With a promise library, you can flatten the pyramid.

```javascript
Q.call(step1)
.then(step2)
.then(step3)
.then(step4)
.then(function (value4) {
    // Do something with value4
}, function (error) {
    // Handle any error from step1 through step4
})
.end();
```

With this approach, you also get implicit error propagation,
just like ``try``, ``catch``, and ``finally``.  An error in
``step1`` will flow all the way to ``step5``, where it’s
caught and handled.

The callback approach is called an “inversion of control”.
A function that accepts a callback instead of a return value
is saying, “Don’t call me, I’ll call you.”.  Promises
[un-invert][IOC] the inversion, cleanly separating the
handling of input argument from the handling of control
flow.  This simplifies the use and creation of API’s,
particularly variadic parameters (spread and rest
arguments).

[IOC]: http://www.slideshare.net/domenicdenicola/callbacks-promises-and-coroutines-oh-my-the-evolution-of-asynchronicity-in-javascript


Getting Started
===============

The Q module can be loaded as:

-   a ``<script>`` tag (creating a ``Q`` global variable)
-   a NodeJS and CommonJS module available from NPM as the ``q``
    package
-   a RequireJS module

Please join the Q-Continuum [mailing list](https://groups.google.com/forum/#!forum/q-continuum).

Q can exchange promises with jQuery and Dojo and the following libraries
are based on Q.

-   [q-fs](https://github.com/kriskowal/q-fs)
    file system
-   [q-http](https://github.com/kriskowal/q-http)
    http client and server
-   [q-comm](https://github.com/kriskowal/q-comm)
    remote objects
-   [jaque](https://github.com/kriskowal/jaque)
    promising HTTP server, JSGI middleware

[Many other projects](http://search.npmjs.org/#/q) in NPM use Q
internally or provide Q promises.


Tutorial
========

Promises have a ``then`` method, which you can use to get the eventual
return value (fulfillment) or thrown exception (rejection).

```javascript
foo()
.then(function (value) {
}, function (reason) {
})
```

If ``foo`` returns a promise that gets fulfilled later with a return
value, the first function (the value handler) will be called with the
value.  However, if the ``foo`` function gets rejected later by a
thrown exception, the second function (the error handler) will be
called with the error.


## Propagation

The ``then`` method returns a promise, which in this example, I’m
assigning to ``bar``.

```javascript
var bar = foo()
.then(function (value) {
}, function (reason) {
})
```

The ``bar`` variable becomes a new promise for the return value of
either handler.  Since a function can only either return a value or
throw an exception, only one handler will ever be called and it will
be responsible for resolving ``bar``.

-   If you return a value in a handler, ``bar`` will get fulfilled.

-   If you throw an exception in a handler ``bar`` will get rejected.

-   If you return a **promise** in a handler, ``bar`` will “become”
    that promise.  Being able to become a new promise is useful for
    managing delays, combining results, or recovering from errors.

If the ``foo()`` promise gets rejected and you omit the error handler,
the **error** will go to ``bar``:

```javascript
var bar = foo()
.then(function (value) {
})
```

If the ``foo()`` promise gets fulfilled and you omit the value
handler, the **value** will go to ``bar``:

```javascript
var bar = foo()
.then(null, function (error) {
})
```

Q promises provide a ``fail`` shorthand for ``then`` when you are only
interested in handling the error:

```javascript
var bar = foo()
.fail(function (error) {
})
```

They also have a ``fin`` function that is like a ``finally`` clause.
The final handler gets called, with no arguments, when the promise
returned by ``foo()`` either returns a value or throws an error.  The
value returned or error thrown by ``foo()`` passes directly to ``bar``.

```javascript
var bar = foo()
.fin(function () {
    // close files, database connections, stop servers, conclude tests
})
```

-   If the handler returns a value, the value is ignored
-   If the handler throws an error, the error passes to ``bar``
-   If the handler returns a promise, ``bar`` gets postponed.  The
    eventual value or error has the same effect as an immediate return
    value or thrown error: a value would be ignored, an error would be
    forwarded.

## Chaining

There are two ways to chain promises.  You can chain promises either
inside or outside handlers.  The next two examples are equivalent.

```javascript
return foo()
.then(function (fooValue) {
    return bar(fooValue)
    .then(function (barValue) {
        // if we get here without an error,
        // the value retuned here
        // or the exception thrown here
        // resolves the promise returned
        // by the first line
    })
})
```

```javascript
return foo()
.then(function (fooValue) {
    return bar(fooValue);
})
.then(function (barValue) {
    // if we get here without an error,
    // the value retuned here
    // or the exception thrown here
    // resolves the promise returned
    // by the first line
})
```

The only difference is nesting.  It’s useful to nest handlers if you
need to capture both ``fooValue`` and ``barValue`` in the last
handler.

```javascript
function eventualAdd(a, b) {
    return a.then(function (a) {
        return b.then(function (b) {
            return a + b;
        });
    });
}
```


## Combination

You can turn an array of promises into a promise for the whole,
fulfilled array using ``all``.

```javascript
return Q.all([
    eventualAdd(2, 2),
    eventualAdd(10, 20)
])
```

If you have a promise for an array, you can use ``spread`` as a
replacement for ``then``.  The ``spread`` function “spreads” the
values over the arguments of the value handler.  The error handler
will get called at the first sign of failure.  That is, whichever of
the recived promises fails first gets handled by the error handler.

```javascript
function eventualAdd(a, b) {
    return Q.all([a, b])
    .spread(function (a, b) {
        return a + b;
    })
}
```

But ``spread`` calls ``all`` initially, so you can skip it in chains.

```javascript
return foo()
.then(function (name, location) {
    return [name, FS.read(location, "utf-8")];
})
.spread(function (name, text) {
})
```


## Handling Errors

One sometimes-unintuive aspect of promises is that if you throw an
exception in the value handler, it will not be be caught by the error
handler.

```javascript
foo()
.then(function (value) {
    throw new Error("Can't bar.");
}, function (error) {
    // We only get here if "foo" fails
})
```

To see why this is, consider the parallel between promises and
``try``/``catch``. We are ``try``-ing to execute ``foo()``: the error
handler represents a ``catch`` for ``foo()``, while the value handler
represents code that happens *after* the ``try``/``catch`` block.
That code then needs its own ``try``/``catch`` block.

In terms of promises, this means chaining your error handler:

```javascript
foo()
.then(function (value) {
    throw new Error("Can't bar.");
})
.fail(function (error) {
    // We get here with either foo's error or bar's error
})
```


## The End

When you get to the end of a chain of promises, you should either
return the last promise or end the chain.  Since handlers catch
errors, it’s an unfortunate pattern that the exceptions can go
unobserved.

So, either return it,

```javascript
return foo()
.then(function () {
    return "bar";
})
```

Or, end it.

```javascript
foo()
.then(function () {
    return "bar";
})
.end()
```

Ending a promise chain makes sure that, if an error doesn’t get
handled before the end, it will get rethrown and reported.

This is a stopgap. We are exploring ways to make unhandled errors
visible without any explicit handling.


## The Beginning

Everything above assumes you get a promise from somewhere else.  This
is the common case.  Every once in a while, you will need to create a
promise from scratch.

You can create a promise from a value using ``Q.call``.  This returns a
promise for 10.

```javascript
return Q.call(function () {
    return 10;
});
```

You can also use ``call`` to get a promise for an exception.

```javascript
return Q.call(function () {
    throw new Error("Can't do it");
})
```

As the name implies, ``call`` can call functions, or even promised
functions.  This uses the ``eventualAdd`` function above to add two
numbers.  The second argument is the ``this`` object to pass into the
function.

```javascript
return Q.call(eventualAdd, null, 2, 2);
```

When nothing else will do the job, you can use ``defer``, which is
where all promises ultimately come from.

```javascript
var deferred = Q.defer();
FS.readFile("foo.txt", "utf-8", function (error, text) {
    if (error) {
        deferred.reject(new Error(error));
    } else {
        deferred.resolve(text);
    }
});
return deferred.promise;
```

Note that a deferred can be resolved with a value or a promise.  The
``reject`` function is a shorthand for resolving with a rejected
promise.

```javascript
var rejection = Q.call(function () {
    throw new Error("Can't do it");
});
deferred.resolve(rejection);
```

This is a simplified implementation of ``Q.delay``.

```javascript
function delay(ms) {
    var deferred = Q.defer();
    setTimeout(deferred.resolve, ms);
    return deferred.promise;
}
```

This is a simplified implementation of ``Q.timeout``

```javascript
function timeout(promise, ms) {
    var deferred = Q.defer();
    Q.when(promise, deferred.resolve);
    Q.when(delay(ms), function () {
        deferred.reject("Timed out");
    });
    return deferred.promise;
}
```


## The Middle

If you are using a function that may return a promise, but just might
return a value if it doesn’t need to defer, you can use the “static”
methods of the Q library.

The ``when`` function is the static equivalent for ``then``.

```javascript
return Q.when(valueOrPromise, function (value) {
}, function (error) {
});
```

All of the other methods on a promise have static analogs with the
same name.

The following are equivalent:

```javascript
return Q.all([a, b]);
```

```javascript
return Q.call(function () {
    return [a, b];
})
.all();
```

When working with promises provided by other libraries, you should
convert it to a Q promise.  Not all promise libraries make the same
guarantees as Q and certainly don’t provide all of the same methods.
Most libraries only provide a partially functional ``then`` method.
This thankfully is all we need to turn them into vibrant Q promises.

```javascript
return Q.when($.ajax(...))
.then(function () {
})
```

If there is any chance that the promise you receive is not a Q promise
as provided by your library, you should wrap it using a Q function.
You can even use ``Q.call`` as a shorthand.

```javascript
return Q.call($.ajax, $, ...)
.then(function () {
})
```


## Over the Wire

A promise can serve as a proxy for another object, even a remote
object.  There are methods that allow you to optimistically manipulate
properties or call functions.  All of these interactions return
promises, so they can be chained.

```
direct manipulation         using a promise as a proxy
--------------------------  -------------------------------
value.foo                   promise.get("foo")
value.foo = value           promise.put("foo", value)
delete value.foo            promise.del("foo")
value.foo(...args)          promise.post("foo", [args])
value.foo(...args)          promise.invoke("foo", ...args)
value(...args)              promise.apply(null, [args])
value(...args)              promise.call(null, ...args)
value.call(thisp, ...args)  promise.apply(thisp, [args])
value.apply(thisp, [args])  promise.call(thisp, ...args)
```

If the promise is a proxy for a remote object, you can shave
round-trips by using these functions instead of ``then``.  To take
advantage of promises for remote objects, check out [Q-Comm][].

[Q-Comm]: https://github.com/kriskowal/q-comm

Even in the case of non-remote objects, these methods can be used as
shorthand for particularly-simple value handlers. For example, you
can replace

```javascript
return Q.call(function () {
    return [{ foo: "bar" }, { foo: "baz" }];
})
.then(function (value) {
    return value[0].foo;
})
```

with

```javascript
return Q.call(function () {
    return [{ foo: "bar" }, { foo: "baz" }];
})
.get(0)
.get("foo")
```


## Adapting Node

There is a ``node`` method on deferreds that is handy for the NodeJS
callback pattern.

```javascript
var deferred = Q.defer();
FS.readFile("foo.txt", "utf-8", deferred.node());
return deferred.promise;
```

And there’s a ``Q.ncall`` function for shorter.

```javascript
return Q.ncall(FS.readFile, FS, "foo.txt", "utf-8");
```

There is also a ``Q.node`` function that that creates a reusable
wrapper.

```javascript
var readFile = Q.node(FS.readFile, FS)
return readFile("foo.txt", "utf-8");
```


API
---

## ``when(value, fulfilled_opt, rejected_opt)``

Arranges for ``fulfilled`` to be called:

-   with the value as its sole argument
-   in a future turn of the event loop
-   if and when the value is or becomes a fully resolved

Arranges for ``rejected`` to be called:

-   with a value respresenting the reason why the object will
    never be resolved, typically an ``Error`` object.
-   in a future turn of the event loop
-   if the value is a promise and
    -   if and when the promise is rejected

Returns a promise:

-   that will resolve to the value returned by either of the
    callbacks, if either of those functions are called, or
-   that will be rejected if the value is rejected and no
    ``rejected`` callback is provided, thus forwarding
    rejections by default.

The value may be truly __any__ value.  It can be a function.
It can be a promise.

Either callback may be falsy, in which case it will not be
called.

Guarantees:

-   ``fulfilled`` will not be called before when returns.
-   ``rejected`` will not be called before when returns.
-   ``fulfilled`` will not be called more than once.
-   ``rejected`` will not be called more than once.
-   If ``fulfilled`` is called, ``rejected`` will never be called.
-   If ``rejected`` is called, ``fulfilled`` will never be called.
-   If a promise is never resolved, neither callback will
    ever be called.

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
-   ``node()`` function

The promise is suitable for passing as a value to the
``when`` function, among others.

Calling resolve with a promise notifies all observers that
they must now wait for that promise to resolve.

Calling resolve with a rejected promise notifies all
observers that the promise will never be fully resolved with
the rejection reason.  This forwards through the the chain
of ``when`` calls and their returned promises until it
reaches a ``when`` call that has a ``rejected`` callback.

Calling resolve with a fully resolved value notifies all
observers that they may proceed with that value in a future
turn.  This forwards through the ``fulfilled`` chain of any
pending ``when`` calls.

Calling ``reject`` with a reason is equivalent to resolving
with a rejection.

In all cases where the resolution of a promise is set,
(promise, rejection, value) the resolution is permanent and
cannot be reset.  All future observers of the resolution of
the promise will be notified of the resolved value, so it is
safe to call ``when`` on a promise regardless of whether it
has been or will be resolved.

Calling ``node()`` returns a callback suitable for passing
to a Node function.


THIS IS COOL

The Deferred separates the promise part from the resolver
part. So:

-   You can give the promise to any number of consumers and
    all of them will observe the resolution independently.
    Because the capability of observing a promise is
    separated from the capability of resolving the promise,
    none of the recipients of the promise have the ability
    to "trick" other recipients with misinformation.

-   You can give the resolver to any number of producers and
    whoever resolves the promise first wins.  Furthermore,
    none of the producers can observe that they lost unless
    you give them the promise part too.


UNION

    function or(a, b) {
        var union = Q.defer();
        Q.when(a, union.resolve);
        Q.when(b, union.resolve);
        return union.promise;
    }


## ``resolve(value)``

If value is a promise, returns the promise.

If value is not a promise, returns a promise that has
already been fulfilled with the given value.


## ``reject(reason)``

Returns a promise that has already been rejected with the
given reason.

This is useful for conditionally forwarding a rejection
through an errback.

    Q.when(API.getPromise(), function (value) {
        return doSomething(value);
    }, function (reason) {
        if (API.stillPossible()) {
            return API.tryAgain();
        } else {
            return Q.reject(reason);
        }
    })

Unconditionally forwarding a rejection is equivalent to
omitting an errback on a when call.

    Q.when(API.getPromise(), function (value) {
        return doSomething(value);
    }, function (reason) {
        return Q.reject(reason);
    })

Simplifies to:

    Q.when(API.getPromise(), function (value) {
        return doSomething(value);
    })


## ``isPromise(value)``

Returns whether the given value is a promise.


## ``isResolved(value)``

Returns whether the given value is fulfilled or rejected.
Non-promise values are equivalent to fulfilled promises.


## ``isFulfilled(value)``

Returns whether the given value is fulfilled.  Non-promise
values are equivalent to fulfilled promises.


## ``isRejected(value)``

Returns whether the given value is a rejected promise.


## ``end(promise)``

Accepts a promise that is intended to be the last promise in
a chain of promises.  If an error propagates to the end of
the promise chain, it will be thrown as an exception and
handled by either NodeJS or the browser as an uncaught
exception.


## ``enqueue(callback Function)``

Calls ``callback`` in a future turn.


ADVANCED API
------------

The ``ref`` promise constructor establishes the basic API
for performing operations on objects: "get", "put", "del",
"post", "apply", and "keys".  This set of "operators" can be
extended by creating promises that respond to messages with
other operator names, and by sending corresponding messages
to those promises.


## ``makePromise(handlers, fallback_opt, valueOf_opt)``

Creates a stand-alone promise that responds to messages.
These messages have an operator like "when", "get", "put",
and "post", corresponding to each of the above functions for
sending messages to promises.

The ``handlers`` are an object with function properties
corresponding to operators.  When the made promise receives
a message and a corresponding operator exists in the
``handlers``, the function gets called with the variadic
arguments sent to the promise.  If no ``handlers`` object
exists, the ``fallback`` function is called with the operator,
and the subsequent variadic arguments instead.  These
functions return a promise for the eventual resolution of
the promise returned by the message-sender.  The default
fallback returns a rejection.

The ``valueOf`` function, if provided, overrides the
``valueOf`` function of the returned promise.  This is useful
for providing information about the promise in the same turn
of the event loop.  For example, resolved promises return
their resolution value and rejections return an object that
is recognized by ``isRejected``.


## ``send(value, operator, ...args)``

Sends an arbitrary message to a promise.

Care should be taken not to introduce control-flow hazards
and security holes when forwarding messages to promises.
The functions above, particularly ``when``, are carefully
crafted to prevent a poorly crafted or malicious promise
from breaking the invariants like not applying callbacks
multiple times or in the same turn of the event loop.


## ``get(object, name)``

Returns a promise for the named property of an object,
albeit a promise for an object.


## ``put(object, name, value)``

Returns a promise to set the named property of an object,
albeit a promise, to the given value.


## ``del(object, name)``

Returns a promise to delete the named property of an object,
albeit a promise.


## ``post(object, name, arguments)``

Returns a promise to call the named function property of an
eventually fulfilled object with the given array of
arguments.  The object itself is ``this`` in the function.


## ``invoke(object, name, ...arguments)``

Returns a promise to call the named function property of an
eventually fulfilled object with the given variadic
arguments.  The object itself is ``this`` in the function.


## ``keys(object)``

Returns a promise for an array of the property names of the
eventually fulfilled object.


## ``apply(function, this, arguments)``

Returns a promise for the result of calling an eventually
fulfilled function, with the given values for the ``this``
and ``arguments`` array in that function.


## ``call(function, this, ...arguments)``

Returns a promise for the result of eventually calling the
fulfilled function, with the given context and variadic
arguments.


## ``all([...promises])``

Returns a promise for an array of the fulfillment of each
respective promise, or rejects when the first promise is
rejected.


## ``fail(promise, callback())``

Accepts a promise and captures rejection with the callback,
giving the callback an opportunity to recover from the
failure.  If the promise gets rejected, the return value of
the callback resolves the returned promise.  Otherwise, the
fulfillment gets forwarded.


## ``fin(promise, callback())``

Like a ``finally`` clause, allows you to observe either the
fulfillment or rejection of a callback, but to do so without
modifying the final value.  This is useful for collecting
resources regardless of whether a job succeeded, like
closing a database connection, shutting a server down, or
deleting an unneeded key from an object. The callback 
receives no arguments.


## ``end(promise)``

Accepts a promise and returns ``undefined``, to terminate a
chain of promises at the end of a program.  If the promise
is rejected, throws it as an exception in a future turn of
the event loop.

Since exceptions thrown in ``when`` callbacks are consumed
and transformed into rejections, exceptions are easy to
accidentally silently ignore.  It is furthermore non-trivial
to get those exceptions reported since the obvious way to do
this is to use ``when`` to register a rejection callback,
where ``throw`` would just get consumed again.  ``end``
arranges for the error to be thrown in a future turn of the
event loop, so it won't be caught; it will cause the
exception to emit a browser's ``onerror`` event or NodeJS's
``process`` ``"uncaughtException"``.


## ``async(generatorFunction)``

This is an experimental tool for converting a generator
function into a deferred function.  This has the potential
of reducing nested callbacks in engines that support
``yield``.  See ``examples/async-generators/README.md`` for
further information.


## ``node(nodeFunction)``

Wraps a Node function so that it returns a promise instead
of accepting a callback.

```javascript
var readFile = FS.node(FS.readFile);
readFile("foo.txt")
.then(function (text) {
});
```

The ``this`` of the call gets forwarded.

```javascript
var readFile = FS.node(FS.readFile);
FS.readFile.call(FS, "foo.txt")
.then(function (text) {
});
```

The ``node`` call can also be used to bind and partially
apply.

```javascript
var readFoo = FS.node(FS.readFile, FS, "foo.txt");
readFoo()
.then(function (text) {
});
```


## ``ncall(nodeFunction, thisp, ...args)``

Calls a Node function, returning a promise so you don’t have
to pass a callback.

```javascript
Q.ncall(FS.readFile, FS, "foo.txt")
.then(function (text) {
});
```


Chaining
--------

Promises created by the Q API support chaining for some
functions.  The ``this`` promise becomes the first argument
of the corresponding Q API function.  For example, the
following are equivalent:

-   ``when(promise, fulfilled)`` and
    ``promise.then(fulfilled)``.
-   ``end(promise)`` and ``promise.end()``.

The following functions are supported for chaining:

-   ``.when`` (``.then``)
-   ``.get``
-   ``.put``
-   ``.del``
-   ``.post``
-   ``.invoke``
-   ``.apply``
-   ``.call``
-   ``.keys``
-   ``.all``
-   ``.fin``
-   ``.end``


Copyright 2009-2011 Kristopher Michael Kowal
MIT License (enclosed)

