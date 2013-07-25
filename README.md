[![Build Status](https://secure.travis-ci.org/kriskowal/q.png?branch=master)](http://travis-ci.org/kriskowal/q)

<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>

If a function cannot return a value or throw an exception without
blocking, it can return a promise instead.  A promise is an object
that represents the return value or the thrown exception that the
function may eventually provide.  A promise can also be used as a
proxy for a [remote object][Q-Connection] to overcome latency.

[Q-Connection]: https://github.com/kriskowal/q-connection

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
Q.fcall(promisedStep1)
.then(promisedStep2)
.then(promisedStep3)
.then(promisedStep4)
.then(function (value4) {
    // Do something with value4
})
.catch(function (error) {
    // Handle any error from all above steps
})
.done();
```

With this approach, you also get implicit error propagation, just like `try`,
`catch`, and `finally`.  An error in `promisedStep1` will flow all the way to
the `catch` function, where it’s caught and handled.  (Here `promisedStepN` is
a version of `stepN` that returns a promise.)

The callback approach is called an “inversion of control”.
A function that accepts a callback instead of a return value
is saying, “Don’t call me, I’ll call you.”.  Promises
[un-invert][IOC] the inversion, cleanly separating the input
arguments from control flow arguments.  This simplifies the
use and creation of API’s, particularly variadic,
rest and spread arguments.

[IOC]: http://www.slideshare.net/domenicdenicola/callbacks-promises-and-coroutines-oh-my-the-evolution-of-asynchronicity-in-javascript


## Getting Started

The Q module can be loaded as:

-   A ``<script>`` tag (creating a ``Q`` global variable): ~2.5 KB minified and
    gzipped.
-   A Node.js and CommonJS module, available in [npm](https://npmjs.org/) as
    the [q](https://npmjs.org/package/q) package
-   An AMD module
-   A [component](https://github.com/component/component) as ``microjs/q``
-   Using [bower](http://bower.io/) as ``q``
-   Using [NuGet](http://nuget.org/) as [Q](https://nuget.org/packages/q)

Q can exchange promises with jQuery, Dojo, When.js, WinJS, and more.
Additionally, there are many libraries that produce and consume Q promises for
everything from file system/database access or RPC to templating. For a list of
some of the more popular ones, see [Libraries][].

Please join the Q-Continuum [mailing list](https://groups.google.com/forum/#!forum/q-continuum).

[Libraries]: https://github.com/kriskowal/q/wiki/Libraries


## Tutorial

Promises have a ``then`` method, which you can use to get the eventual
return value (fulfillment) or thrown exception (rejection).

```javascript
promiseMeSomething()
.then(function (value) {
}, function (reason) {
});
```

If ``promiseMeSomething`` returns a promise that gets fulfilled later
with a return value, the first function (the fulfillment handler) will be
called with the value.  However, if the ``promiseMeSomething`` function
gets rejected later by a thrown exception, the second function (the
rejection handler) will be called with the exception.

Note that resolution of a promise is always asynchronous: that is, the
fulfillment or rejection handler will always be called in the next turn of the
event loop (i.e. `process.nextTick` in Node). This gives you a nice
guarantee when mentally tracing the flow of your code, namely that
``then`` will always return before either handler is executed.


### Propagation

The ``then`` method returns a promise, which in this example, I’m
assigning to ``outputPromise``.

```javascript
var outputPromise = getInputPromise()
.then(function (input) {
}, function (reason) {
});
```

The ``outputPromise`` variable becomes a new promise for the return
value of either handler.  Since a function can only either return a
value or throw an exception, only one handler will ever be called and it
will be responsible for resolving ``outputPromise``.

-   If you return a value in a handler, ``outputPromise`` will get
    fulfilled.

-   If you throw an exception in a handler, ``outputPromise`` will get
    rejected.

-   If you return a **promise** in a handler, ``outputPromise`` will
    “become” that promise.  Being able to become a new promise is useful
    for managing delays, combining results, or recovering from errors.

If the ``getInputPromise()`` promise gets rejected and you omit the
rejection handler, the **error** will go to ``outputPromise``:

```javascript
var outputPromise = getInputPromise()
.then(function (value) {
});
```

If the input promise gets fulfilled and you omit the fulfillment handler, the
**value** will go to ``outputPromise``:

```javascript
var outputPromise = getInputPromise()
.then(null, function (error) {
});
```

Q promises provide a ``fail`` shorthand for ``then`` when you are only
interested in handling the error:

```javascript
var outputPromise = getInputPromise()
.fail(function (error) {
});
```

If you are writing JavaScript for modern engines only or using
CoffeeScript, you may use `catch` instead of `fail`.

Promises also have a ``fin`` function that is like a ``finally`` clause.
The final handler gets called, with no arguments, when the promise
returned by ``getInputPromise()`` either returns a value or throws an
error.  The value returned or error thrown by ``getInputPromise()``
passes directly to ``outputPromise`` unless the final handler fails, and
may be delayed if the final handler returns a promise.

```javascript
var outputPromise = getInputPromise()
.fin(function () {
    // close files, database connections, stop servers, conclude tests
});
```

-   If the handler returns a value, the value is ignored
-   If the handler throws an error, the error passes to ``outputPromise``
-   If the handler returns a promise, ``outputPromise`` gets postponed.  The
    eventual value or error has the same effect as an immediate return
    value or thrown error: a value would be ignored, an error would be
    forwarded.

If you are writing JavaScript for modern engines only or using
CoffeeScript, you may use `finally` instead of `fin`.


### Chaining

There are two ways to chain promises.  You can chain promises either
inside or outside handlers.  The next two examples are equivalent.

```javascript
return getUsername()
.then(function (username) {
    return getUser(username)
    .then(function (user) {
        // if we get here without an error,
        // the value returned here
        // or the exception thrown here
        // resolves the promise returned
        // by the first line
    })
});
```

```javascript
return getUsername()
.then(function (username) {
    return getUser(username);
})
.then(function (user) {
    // if we get here without an error,
    // the value returned here
    // or the exception thrown here
    // resolves the promise returned
    // by the first line
});
```

The only difference is nesting.  It’s useful to nest handlers if you
need to capture multiple input values in your closure.

```javascript
function authenticate() {
    return getUsername()
    .then(function (username) {
        return getUser(username);
    })
    // chained because we will not need the user name in the next event
    .then(function (user) {
        return getPassword()
        // nested because we need both user and password next
        .then(function (password) {
            if (user.passwordHash !== hash(password)) {
                throw new Error("Can't authenticate");
            }
        });
    });
}
```


### Combination

You can turn an array of promises into a promise for the whole,
fulfilled array using ``all``.

```javascript
return Q.all([
    eventualAdd(2, 2),
    eventualAdd(10, 20)
]);
```

If you have a promise for an array, you can use ``spread`` as a
replacement for ``then``.  The ``spread`` function “spreads” the
values over the arguments of the fulfillment handler.  The rejection handler
will get called at the first sign of failure.  That is, whichever of
the recived promises fails first gets handled by the rejection handler.

```javascript
function eventualAdd(a, b) {
    return Q.spread([a, b], function (a, b) {
        return a + b;
    })
}
```

But ``spread`` calls ``all`` initially, so you can skip it in chains.

```javascript
return getUsername()
.then(function (username) {
    return [username, getUser(username)];
})
.spread(function (username, user) {
});
```

The ``all`` function returns a promise for an array of values.  When this
promise is fulfilled, the array contains the fulfillment values of the original
promises, in the same order as those promises.  If one of the given promises
is rejected, the returned promise is immediately rejected, not waiting for the
rest of the batch.  If you want to wait for all of the promises to either be
fulfilled or rejected, you can use ``allSettled``.

```javascript
Q.allSettled(promises)
.then(function (results) {
    results.forEach(function (result) {
        if (result.state === "fulfilled") {
            var value = result.value;
        } else {
            var reason = result.reason;
        }
    });
});
```


### Sequences

If you have a number of promise-producing functions that need
to be run sequentially, you can of course do so manually:

```javascript
return foo(initialVal).then(bar).then(baz).then(qux);
```

However, if you want to run a dynamically constructed sequence of
functions, you'll want something like this:

```javascript
var funcs = [foo, bar, baz, qux];

var result = Q(initialVal);
funcs.forEach(function (f) {
    result = result.then(f);
});
return result;
```

You can make this slightly more compact using `reduce`:

```javascript
return funcs.reduce(function (soFar, f) {
    return soFar.then(f);
}, Q(initialVal));
```

Or, you could use th ultra-compact version:

```javascript
return funcs.reduce(Q.when, Q());
```


### Handling Errors

One sometimes-unintuive aspect of promises is that if you throw an
exception in the fulfillment handler, it will not be be caught by the error
handler.

```javascript
return foo()
.then(function (value) {
    throw new Error("Can't bar.");
}, function (error) {
    // We only get here if "foo" fails
});
```

To see why this is, consider the parallel between promises and
``try``/``catch``. We are ``try``-ing to execute ``foo()``: the error
handler represents a ``catch`` for ``foo()``, while the fulfillment handler
represents code that happens *after* the ``try``/``catch`` block.
That code then needs its own ``try``/``catch`` block.

In terms of promises, this means chaining your rejection handler:

```javascript
return foo()
.then(function (value) {
    throw new Error("Can't bar.");
})
.fail(function (error) {
    // We get here with either foo's error or bar's error
});
```


### Progress Notification

It's possible for promises to report their progress, e.g. for tasks that take a
long time like a file upload. Not all promises will implement progress
notifications, but for those that do, you can consume the progress values using
a third parameter to ``then``:

```javascript
return uploadFile()
.then(function () {
    // Success uploading the file
}, function (err) {
    // There was an error, and we get the reason for error
}, function (progress) {
    // We get notified of the upload's progress as it is executed
});
```

Like `fail`, Q also provides a shorthand for progress callbacks
called `progress`:

```javascript
return uploadFile().progress(function (progress) {
    // We get notified of the upload's progress
});
```


### The End

When you get to the end of a chain of promises, you should either
return the last promise or end the chain.  Since handlers catch
errors, it’s an unfortunate pattern that the exceptions can go
unobserved.

So, either return it,

```javascript
return foo()
.then(function () {
    return "bar";
});
```

Or, end it.

```javascript
foo()
.then(function () {
    return "bar";
})
.done();
```

Ending a promise chain makes sure that, if an error doesn’t get
handled before the end, it will get rethrown and reported.

This is a stopgap. We are exploring ways to make unhandled errors
visible without any explicit handling.


### The Beginning

Everything above assumes you get a promise from somewhere else.  This
is the common case.  Every once in a while, you will need to create a
promise from scratch.

#### Using ``Q.fcall``

You can create a promise from a value using ``Q.fcall``.  This returns a
promise for 10.

```javascript
return Q.fcall(function () {
    return 10;
});
```

You can also use ``fcall`` to get a promise for an exception.

```javascript
return Q.fcall(function () {
    throw new Error("Can't do it");
});
```

As the name implies, ``fcall`` can call functions, or even promised
functions.  This uses the ``eventualAdd`` function above to add two
numbers.

```javascript
return Q.fcall(eventualAdd, 2, 2);
```

#### Using Deferreds

If you have to interface with asynchronous functions that are callback-based
instead of promise-based, Q provides a few shortcuts (like ``Q.nfcall`` and
friends). But much of the time, the solution will be to use *deferreds*.

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
// this:
deferred.reject(new Error("Can't do it"));

// is shorthand for:
var rejection = Q.fcall(function () {
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
    delay(ms).then(function () {
        deferred.reject(new Error("Timed out"));
    });
    return deferred.promise;
}
```

Finally, you can send a progress notification to the promise with
``deferred.notify``.

For illustration, this is a wrapper for XML HTTP requests in the browser. Note
that a more [thorough][XHR] implementation would be in order in practice.

[XHR]: https://github.com/montagejs/mr/blob/71e8df99bb4f0584985accd6f2801ef3015b9763/browser.js#L29-L73

```javascript
function requestOkText(url) {
    var request = new XMLHttpRequest();
    var deferred = Q.defer();

    request.open("GET", url, true);
    request.onload = onload;
    request.onerror = onerror;
    request.onprogress = onprogress;
    request.send();

    function onload() {
        if (request.status === 200) {
            deferred.resolve(request.responseText);
        } else {
            deferred.reject(new Error("Status code was " + request.status));
        }
    }

    function onerror() {
        deferred.reject(new Error("Can't XHR " + JSON.stringify(url)));
    }

    function onprogress(event) {
        deferred.notify(event.loaded / event.total);
    }

    return deferred.promise;
}
```

Below is an example of how to use this ``requestOkText`` function:

```javascript
requestOkText("http://localhost:3000")
.then(function (responseText) {
    // If the HTTP response returns 200 OK, log the response text.
    console.log(responseText);
}, function (error) {
    // If there's an error or a non-200 status code, log the error.
    console.error(error);
}, function (progress) {
    // Log the progress as it comes in.
    console.log("Request progress: " + Math.round(progress * 100) + "%");
});
```


### The Middle

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
return Q.fcall(function () {
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
return Q($.ajax(...))
.then(function () {
});
```

If there is any chance that the promise you receive is not a Q promise
as provided by your library, you should wrap it using a Q function.
You can even use ``Q.invoke`` as a shorthand.

```javascript
return Q.invoke($, 'ajax', ...)
.then(function () {
});
```


### Over the Wire

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
value(...args)              promise.fapply([args])
value(...args)              promise.fcall(...args)
```

If the promise is a proxy for a remote object, you can shave
round-trips by using these functions instead of ``then``.  To take
advantage of promises for remote objects, check out [Q-Connection][].

[Q-Connection]: https://github.com/kriskowal/q-connection

Even in the case of non-remote objects, these methods can be used as
shorthand for particularly-simple fulfillment handlers. For example, you
can replace

```javascript
return Q.fcall(function () {
    return [{ foo: "bar" }, { foo: "baz" }];
})
.then(function (value) {
    return value[0].foo;
});
```

with

```javascript
return Q.fcall(function () {
    return [{ foo: "bar" }, { foo: "baz" }];
})
.get(0)
.get("foo");
```


### Adapting Node

If you're working with functions that make use of the Node.js callback pattern,
where callbacks are in the form of `function(err, result)`, Q provides a few
useful utility functions for converting between them. The most straightforward
are probably `Q.nfcall` and `Q.nfapply` ("Node function call/apply") for calling
Node.js-style functions and getting back a promise:

```javascript
return Q.nfcall(FS.readFile, "foo.txt", "utf-8");
return Q.nfapply(FS.readFile, ["foo.txt", "utf-8"]);
```

If you are working with methods, instead of simple functions, you can easily
run in to the usual problems where passing a method to another function—like
`Q.nfcall`—"un-binds" the method from its owner. To avoid this, you can either
use `Function.prototype.bind` or some nice shortcut methods we provide:

```javascript
return Q.ninvoke(redisClient, "get", "user:1:id");
return Q.npost(redisClient, "get", ["user:1:id"]);
```

You can also create reusable wrappers with `Q.denodeify` or `Q.nbind`:

```javascript
var readFile = Q.denodeify(FS.readFile);
return readFile("foo.txt", "utf-8");

var redisClientGet = Q.nbind(redisClient.get, redisClient);
return redisClientGet("user:1:id");
```

Finally, if you're working with raw deferred objects, there is a
`makeNodeResolver` method on deferreds that can be handy:

```javascript
var deferred = Q.defer();
FS.readFile("foo.txt", "utf-8", deferred.makeNodeResolver());
return deferred.promise;
```


### Long Stack Traces

Q comes with optional support for “long stack traces,” wherein the `stack`
property of `Error` rejection reasons is rewritten to be traced along
asynchronous jumps instead of stopping at the most recent one. As an example:

```js
function theDepthsOfMyProgram() {
  Q.delay(100).done(function explode() {
    throw new Error("boo!");
  });
}

theDepthsOfMyProgram();
```

usually would give a rather unhelpful stack trace looking something like

```
Error: boo!
    at explode (/path/to/test.js:3:11)
    at _fulfilled (/path/to/test.js:q:54)
    at resolvedValue.promiseDispatch.done (/path/to/q.js:823:30)
    at makePromise.promise.promiseDispatch (/path/to/q.js:496:13)
    at pending (/path/to/q.js:397:39)
    at process.startup.processNextTick.process._tickCallback (node.js:244:9)
```

But, if you turn this feature on by setting

```js
Q.longStackSupport = true;
```

then the above code gives a nice stack trace to the tune of

```
Error: boo!
    at explode (/path/to/test.js:3:11)
From previous event:
    at theDepthsOfMyProgram (/path/to/test.js:2:16)
    at Object.<anonymous> (/path/to/test.js:7:1)
```

Note how you can see the the function that triggered the async operation in the
stack trace! This is very helpful for debugging, as otherwise you end up getting
only the first line, plus a bunch of Q internals, with no sign of where the
operation started.

This feature does come with somewhat-serious performance and memory overhead,
however. If you're working with lots of promises, or trying to scale a server
to many users, you should probably keep it off. But in development, go for it!


### Primer on Iterators and Generators

EcmaScript 6 introduces a brand of iterators to JavaScript.  Contact
your local JavaScript engine for information on how to try them out.
They have appeared in very recent versions of V8 (Chrome and Node) and
SpiderMonkey (Firefox) but are hidden behind flags at time of writing.

An iterator is an object that has a `next` method.  The `next` method
returns an "iteration", which is an object that conveys either a value
or whether the iterator has reached its end using `value` and `done`
properties.  The EcmaScript 6 draft spec [calls][] the "iteration" the
"iterator result object".

[calls]: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-15.19.4.3.4

```javascript
iteration.next() // {value: 1}
iteration.next() // {value: 2}
iteration.next() // {value: 3}
iteration.next() // {done: true}
```

EcmaScript 6 also introduces generator functions.  A generator function
is a "shallow coroutine", a function that pauses and resumes at explicit
"yield" expressions.  When called, a generator function returns an
iterator.

```javascript
function *range(start, stop, step) {
    while (start < step) {
        yield start;
        start += step;
    }
}

var iterator = range(0, Infinity, 1);
iterator.next() // {value: 0};
iterator.next() // {value: 1};
iterator.next() // {value: 2};
```

The `next` method gains the ability to convey the return value of the
generator function in addition to communicating that the iteration has
come to an end.

```javascript
function *startRace() {
    yield 3;
    yield 2;
    yield 1;
    return "Go!";
}

var starter = startRace();
starter.next() // {value: 3};
starter.next() // {value: 2};
starter.next() // {value: 1};
starter.next() // {value: 'Go!', done: true};
```

With generators, the `next` method also gains the ability to
convey a value for the `yield` expression, making it both the sender and
receiver of information.  If the generator throws an exception while
trying to reach the next `yield`, the `next` method will throw that
exception.

```javascript
function *contrivedExample(previous) {
    while (true) {
        previous = yield previous + 1;
    }
}

var oneUp = contrivedExample(0);
oneUp.next(100) // {value: 1}
oneUp.next(-100) // {value: 101}
oneUp.next() // {value: -99}
```


### Asynchronous Iterators

This library introduces the notion of an asynchronous iterator.  The
`next` function again gains a new ability.  Instead of returning an
iteration, it returns a promise for an iteration.  Additionally, the
iteration may have an `index` property, so if you are iterating an
array, you can use `iteratation.index` to infer the index that
`iteration.value` came from.  Implementing `next` is sufficent for Q to
recognize a value that is an iterator.

Of course, just as with a normal iterator, the `iteration.value` may be
a promise as well, separating the issue of synchronizing the order of
delivery from the issue of synchronizing the order of the resolution of
the transported values.

Implementing an `iterate` or `iterator` method is sufficient for Q to
recognize an iterable and iterate it accordingly.  `iterator` because
SpiderMonkey established that precedent, `iterate` because that's what
it should be and because ES6 did not continue that precedent, favoring
private names, and thus avoiding the duck-type issue entirely.

Q can consume iterators and can produce asynchronous iterators using the
functions `forEach`, `map`, `reduce`, and `buffer`.


### Promises as Streams

A promise for an iterable can be used as a stream, including the ability
to moderate the rate of consumption to approach the rate of production,
which is often called "back pressure" in the Unix pipe metaphore.

Q provides the methods `forEach`, `map`, `reduce`, and `buffer` for
using a promise as a stream.  The `all` method can also accumulate
values from a stream.

The stream functions all accept optional `maxInFlight` and `notify`
arguments.  `maxInFlight` determines the upper limit on how many
concurrent operations the function can schedule and the default varies.
`notify` is an optional callback that provides the current `inFlight`
and shared `maxInFlight` values for an operation.


#### map

The `map` method consumes up to `maxInFlight` values from the input
stream while processing those values.  It takes a callback that may
return a promise for a corresponding value and produces a stream of
those values.  Values are consumed at the same rate as the callback.

In this example, we transform a stream of user identifiers into a stream
of users, getting user information from the database, piplining up to
100 requests at any given time.

```javascript
Q(userIds).map(function (id) {
    return getUserForId(id);
}, 100)
.all(function (users) {
    // all users available in memory.
    // this might not be a good idea.
})
.done();
```

To enforce serial processing, `maxInFlight` may be set to 1.  By
default, it is infinite.

The output stream closes when the input has been consumed in its
entirety *and* all results have been queued on the output stream.

#### forEach

The `forEach` method consumes up to `maxInFlight` values from the input
stream while processing those values.  It takes a callback that may
return a promise *for scheuduling and synchronization purposes only*.
The fulfillment of the callback is ignored, but rejections propagate and
halt the loop.

This example starts as the previous.  We consume the stream of users one
at a time with an artificial delay of 100 milliseconds between printing
each user's name.  When the list is finished, we print an underline.

```javascript
Q(userIds).map(function (id) {
    return getUserForId(id);
}, 100)
.forEach(function (user) {
    console.log(user.name);
    return Q.delay(100);
})
.then(function () {
    console.log("-----");
})
.done();
```

Note that the artificial delay on the `forEach` may dominate the
scheduling constraints.  As such, the `map` operation might slow down,
accumulating up to 100 users on its output stream but requesting a new
one once every 100ms on average.

#### reduce

The `reduce` method, much like its forebear on `Array.prototype`,
accepts an aggregator function.  It also takes an optional `basis`, and
once you've opted in to having a basis instead of just using the first
value from the source, you can also provide `maxInFlight` and `notify`.

In this example, we accumulate a sum using a combinator (Code-ish for
"combiner") that returns a promise.

```javascript
Q(source).reduce(function (sum, number) {
    return slowCombinator(sum, number);
}, 1, 100);
```

Not being able to specify `maxInFlight` or `notify` without opting into
a basis is a known and unsolved wart of the interface.  For your
consolation, most reductions have an appropriate "identity" for
reduction, like 0 for computing a sum of numbers, 1 for computing a
product of numbers, empty arrays and strings for concatenation, null for
just about anything else, but streams of heterogenous values can be
problematic.

The default `maxInFlight` is infinite. Values are aggregated as they
come, and if the aggregator is slow, the reduction may overschedule the
process and saturate memory.  Remember, the major performance benefit of
using Node follows from all IO operations being asynchronous, but when
the process runs out of real memory, swapping virtual memory pages is
inherently *synchronous*.

`reduce` eventually consumes all of the values from the input and
aggregates them opportunistically.  That is, as each value from the
input becomes available, it is placed in a pool of values that can be
aggregated.  Up to `maxInFlight` values will be plucked from that pool
and sent off for aggregation using the given callback, first-to-come:
first-served.  When the aggregator completes, the new compound value
returns to the pool.  In the end, there will only be one value in the
pool and that is the result.

Note that if the source comes from a `map`, both `map` and `reduce` are
opportunistic.  A `map` will stream values as they become available,
regardless of the order or timing of the mapping relation (barring
exceptions).

```javascript
Q([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
.map(function (n) {
    return Q(n).delay(Math.random() * 1000);
})
.reduce(function (total, n) {
    console.log('combining', n, 'with', total, 'for', total + n, 'so far');
    return total + n;
}, 0)
.then(function (total) {
    console.log('grand total', total);
})
.done();
```

For output like:

```
combining 9 with 0 for 9 so far
combining 3 with 9 for 12 so far
combining 5 with 12 for 17 so far
combining 2 with 17 for 19 so far
combining 8 with 19 for 27 so far
combining 6 with 27 for 33 so far
combining 1 with 33 for 34 so far
combining 7 with 34 for 41 so far
combining 4 with 41 for 45 so far
combining 10 with 45 for 55 so far
grand total 55
```

Note that throttling the mapper or reducer limits the range of values available
to the combiner.

```javascript
var Q = require("./q");
Q([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
.map(function (n) {
    return Q(n).delay(Math.random() * 1000);
}) // <- could be constrained here
.reduce(function (total, n) {
    console.log('combining', n, 'with', total, 'for', total + n, 'so far');
    return total + n;
}, 0, 3) // <- extra argument here
.then(function (total) {
    console.log('grand total', total);
})
.done();
```

For output that favors earlier values initially:

```
combining 1 with 0 for 1 so far
combining 3 with 1 for 4 so far
combining 2 with 4 for 6 so far
combining 7 with 6 for 13 so far
combining 5 with 13 for 18 so far
combining 4 with 18 for 22 so far
combining 9 with 22 for 31 so far
combining 6 with 31 for 37 so far
combining 10 with 37 for 47 so far
combining 8 with 47 for 55 so far
grand total 55
```

If `maxInFlight` is 1, `reduce` is serial, equivalent to the
left-to-right `reduce` on `Array.prototype`.  A right-to-left reduce
does not make sense for streams, but you can use `all` and `invoke`
`reduceRight` on the resulting array.

```javascript
Q([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
.map(function (n) {
    return Q(n).delay(Math.random() * 1000);
})
.all()
.invoke("reduceRight", function (total, number) {
    console.log('adding', number, 'to', total, 'for', total + number, 'so far');
    return total + number;
})
.then(function (total) {
    console.log("Grand total", total);
})
.done();
```

Which accumulates all of the input in memory and walks from right to left.

```
adding 9 to 10 for 19 so far
adding 8 to 19 for 27 so far
adding 7 to 27 for 34 so far
adding 6 to 34 for 40 so far
adding 5 to 40 for 45 so far
adding 4 to 45 for 49 so far
adding 3 to 49 for 52 so far
adding 2 to 52 for 54 so far
adding 1 to 54 for 55 so far
Grand total 55
```

Note that the output is in exactly the reverse order of the input, despite the
randomization produced by `map`.  This is because `map` has communicated the
iteration `index` from the input array to the output stream and `all` has
reassembled the array in its original order.  The strict order is not an
indication that `map` yielded the values in that order.

#### buffer

The `buffer` method sends its input directly to its output, accumulating some
number of values in memory.  This is useful for reducing latency delays when
consuming iterations from a remote iterator.

In this example, there is a remote array.  We want to log every value
from that remote array and do not want to wait for all of them to
accumulate in local memory.

```javascript
Q(remoteArray)
.forEach(function (value) {
    console.log(value);
})
.done();
```

We also do not want to reenact this scenario:

```
next()
wait one round trip time (typically 60ms)
log one value
next()
wait one round trip time
log one value
...
```

To achive this, we add a buffer.

```javascript
Q(remoteArray)
.buffer(100)
.forEach(function (value) {
    console.log(value);
})
.done();
```

Thus, the replay would look more like:

```
next() 100 times
wait one round trip time
log one value
next()
log one value
next()
...
```


### Infinite Promise Queue

An infinite promise queue is a first-on-first-off (FIFO) structure.  It
has two methods, `get` and `put`, which are implicitly bound to the
queue and can safely be passed as functions.

The `get` method returns a promise and the `put` method resolves the
respective promise.  Unlike a synchronous queue, because `get` returns a
promise, you can call `get` before calling `put`.  The consumer and
producer side of a queue do not need to even be aware of each other's
existence.  Also, because `put` accepts values or promises, the promises
returned by `get` do not need to be resolved in order.

In this example, note that we call `get` once immediately, and then we
call `get` again after the first promise is resolved.  This should
ensure that the first and second messages are logged in order.

Note that we wait 100 milliseconds before putting anything on the queue.
At that time, we put *a promise* for the first message on the queue, and
resolve the second message immediately.  Thus, the second message is
fulfilled first, before the consumer has even asked for it.

```javascript
var Queue = require("q").Queue;
var queue = Queue();

return queue.get()
.then(function (first) {
    console.log(first);
    return queue.get()
})
.then(function (second) {
    console.log(second);
})
.done();

Q.delay(100)
.then(function () {
    queue.put(Q("Hello").delay(100));
    queue.put("World");
})
.done();
```

In summary, an infinite asynchronous promise queue is a fascinating
machine that preserves consistent FIFO rules, but relaxes all rules
about the order in which values are produced or consumed.  In addition,
the implementation is incredibly succinct.  It is a variation on a
singly linked list, a Lisp list.

```javascript
var ends = Q.defer();
this.put = function (value) {
    var next = Q.defer();
    ends.resolve({
        head: value,
        tail: next.promise
    });
    ends.resolve = next.resolve;
};
this.get = function () {
    var result = ends.promise.get("head");
    ends.promise = ends.promise.get("tail");
    return result;
};
```

Note that `get` and `put` are implicitly bound to the Queue.  This means
that these functions can be vended to producers and consumers
separately, allowing fine grain control over which actors have the
capability to consume and produce.


### Asynchronous Semaphores

A queue can be used as an asynchronous semaphore.  A railroad semaphore
is a sign or light that says whether it is safe for a train to proceed
down a certain track.  The far more pervasive traffic light by rights
could be called a semaphore, but motorists are still asleep at the
wheel.

Semaphores in programming usually guard the usage of a limited resource,
like a pool of file descriptors or database connections.  Semaphores are
a generalization on mutual exclusion (mutex) where there can be more
than one resource in the pool.

With an infinite promise queue, you would put all your resources in the
queue initially.  Competitors would `get` a promise for that resource
when one becomes available, and return that resource to the queue with
`put` when they are finished.

```javascript
var pool = Queue();

pool.put(resource1);
pool.put(resource2);
pool.put(resource3);

pool.get().then(function (resource) {
    return useResource(resource)
    .finally(function () {
        pool.put(resource);
    });
})
```

Q provides a `Semaphore` constructor that it uses internally for
scheduling.  Such resource pools abstractly represent the number of
additional jobs that may be performed concurrently, as represented by
the `maxInFlight` argument of `forEach`, `map`, `reduce`, and `buffer`.
As such, the resource itself is undefined, but the pool size is variable
and `undefined` implies that the resource is infinite.  Since modeling
an infinite promise queue in memory is not practical, the `Semaphore`
constructor returns a queue that resolves any `get` request immediately,
and ignores all `put` requests.

```javascript
var limited = Semaphore(3);
var infinite = Semaphore();
```


### Queue Iterator

A Queue implements `iterate`, which returns an asynchronous iterator.
This allows us to very simply use an infinite promise queue as a
transport for iterations.

```javascript
var queue = Queue();
var iterator = queue.iterate();

iterator.next()
.then(function (iteration) {
    console.log(iteration.value);
})
.done();
```

In keeping with the Principle of Least-authority, the iterator only has
the authority to consume values from the queue.

Note that since queues are iteraable, we can use `forEach`, `map`,
`reduce`, and `buffer` as described above on promises for iterables and,
in fact, the latter three *return* promises for queue iterators.


### Queue Generator

A queue generator provides a convenient interface for transporting
iterations to a queue iterator through a queue.  Queue generators are
not generator functions, but are analogous.  The generator has methods
`yield`, `return`, and `throw` that model the behavior of the eponymous
keyword inside a generator function.  `yield` produces an iteration with
a given `value` and an optional `index`.  `return` produces a terminal
iteration with an optional "return" value.  `throw` produces a rejected
promise for an iteration.

```javascript
var queue = Queue();
var iterator = queue.iterate();
var generator = queue.generate();

generator.yield(3);
generator.yield(2);
generator.yield(1);
generator.return("Go!");
```

The `forEach` method of a promise for an iterable works with queue
iterators in the same way it would with a generator iterator, even to
the point of treating the return value as the resolution of the
completion promise.

```javascript
Q(iterator).forEach(function (countDown) {
    console.log(countDown);
})
.then(function (go) {
    console.log(go);
})
```


### Pipes

One of the fundamental scheduling mechanisms of Unix is a pipe.  A pipe
is a finite buffer of kernel memory shared by two processes.  If the
producer fills the buffer faster than the consumer drains it, this is a
signal to the operating system that the consumer must be put to sleep
until an attempt to write to that buffer is guaranteed to succeed.

This library provides an analogous pipe for internal scheduling
purposes.  It is very unlikely that you will need to use it directly
since it is an implementation detail of `forEach`, `map`, `reduce`, and
`buffer`.

A pipe contains a scheduling semaphore of a particular size (`undefined`
again means unlimited) that determines the number of concurrent jobs
that may be undertaken between taking a value from the input and placing
a result in the output.  The pipe *does* presume a one to one
correspondence between values taken from input and placed in output.

The pipe consists of an `input` queue, an `output` queue, and an
internal scheduling queue.  The user provides an iterable for the true
input source.  Once `maxInFlight` values have been drawn from the true
input, the pipe ensures that additional values will only be requested
after the same quantity of values are consumed from the true output.

This is an implementation for a scheduling buffer, eliding very few
details of the actual implementation.

```javascript
var pipe = new Q.Pipe(source, maxInFlight);
var inbox = pipe.input.iterate();

function job() {
    // waits for a value to become available
    inbox.next().then(function (iteration) {
        // as long as they're coming, keep asking
        job();
        // start this job
        return process(iteration.value);
    })
    .then(function (result) {
        outbox.yield(result);
    })
}
job();

var outbox = pipe.output.generate();
return pipe.output.iterate();
```

One elided detail is that the input may be a promise for a remote
iterable, in which case we do not need to have a local iterator but can
instead send the "iterate" message to the remote and get a promise for a
remote iterator on which we may invoke the remote "next" method to
transfer remote iterations on demand.


### Generators for Control-flow

A generator can be used as a "trampouline" for promises to regain use of
all of the control flow abstractions afforded to us by JavaScript.  The
`async` method decorates a generator function and turns it into a
function that returns a promise for the eventual return value of the
generator, but internally uses the `yield` to explicitly pause the
current event and wait for that promise to resolve.  When that promise
resolves, the `yield` expression either takes on the fulfillment value
or throws an exception right into the the generator function's control
flow and stack.

The `spawn` method is equivalent to decorating a function with `async`,
immediately invoking it, and using `done` to ensure that errors are
handled.

In this example, we have a an asynchronous generator function that
consumes iterations from an iterator, waits for the iteration's value,
waits for the iteration's index, then calls the map function waiting for
its result.  It then accumulates the sum of all the mapped results and
returns the aggregate value, finally fulfilling the returned promise.

```javascript
var asyncMapSum = Q.async(function *(source, map) {
    map = yield map;
    var sum = 0;
    do {
        var iteration = yield source.next();
        sum += yield map(
            yield iteration.value,
            yield iteration.index
        );
    } while (!iteration.done);
    return sum;
});

Q.spawn(function () {
    var sum = yield asyncMapSum(range(0, 10, 1), function (number) {
        return askServerForCorrespondingValue(number);
    });
    console.log(sum);
});
```


## Reference

A method-by-method [Q API reference][reference] is available on the wiki.

[reference]: https://github.com/kriskowal/q/wiki/API-Reference


## More Examples

A growing [examples gallery][examples] is available on the wiki, showing how Q
can be used to make everything better. From XHR to database access to accessing
the Flickr API, Q is there for you.

[examples]: https://github.com/kriskowal/q/wiki/Examples-Gallery


## Tests

You can view the results of the Q test suite [in your browser][tests]!

[tests]: https://rawgithub.com/kriskowal/q/master/spec/q-spec.html

---

Copyright 2009-2013 Kristopher Michael Kowal
MIT License (enclosed)

