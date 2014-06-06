<!-- vim:ts=4:sts=4:sw=4:et:tw=70 -->

## 2.0.2 :warning: BACKWARD INCOMPATIBILITY

This is an experimental release train, based on a rewrite of Q. The full
interface of version 1 is supported but portions of the interface issue
deprecation warnings. Deprecated features will be removed outright in version 3.

 - :warning: As of `1.0`, Q will require ECMAScript 5. Using `es5-shim`,
   nor even `es5-sham`, is not sufficient to make legacy engines
   compatible because Q requires a WeakMap shim that depends on ES5
   properties.  The `0.9` version train will continue to support older
   browsers and will attempt to provide a forward-compatible feature set
   if you take care to eliminate all deprecation warnings before
   migrating.
 - :warning: Release management has changed.  The source for this
   library is `q.js` and is only suitable for consumption as a CommonJS,
   ergo Node.js, module.  Releases are created using `grunt`, including
   `release/q.js`, which is suitable for use as a `<script>`, and
   `release/amd/q.js`, which is suitable for use as an AMD module.  All
   new versions will be published to S3.
 - :warning: Q now depends on an ASAP package and a WeakMap shim.  If
   you are using an AMD loader, you will need to bring in
   https://github.com/kriskowal/asap and
   https://github.com/drses/weak-map.  If you are using Q as a
   `<script>`, this has been embedded in the release.  If you are using
   Q in Node.js, the dependency is taken care of by `npm`.
 - :warning: Withdrew support for SpiderMonkey style generators.  Only
   ES6 generators are supported.
 - :warning: `fapply`, `fcall`, and `fbind` have been deprecated in
   both the `Q` and `promise` forms. These methods have been replaced
   by `apply`, `call`, and `bind` on the `Promise` prototype, making a
   promise for a function partially “isomorphic” with the function
   itself. The `Q.fbind` with no arguments case has been replaced by
   `Q.function`, which is better suited for decorating methods and
   functions to ensure that they return promises and capture errors.
   The `Q.fcall` with no additional arguments case has been replaced
   by `Q.try`.
 - :warning: `Q.try` is no longer an alias for `fcall`. `Q.try` does
   not accept additional arguments. To call a promise for a function
   with arguments, use `Q(function).call(thisp, ...args)` or `apply`.
 - :warning: `post` has been deprecated. As this is an uncommon case
   with an inadequate name, if you need to spread arguments into
   `invoke`, you can take the long road, either calling `invoke.apply`
   or using `promise.dispatch("invoke", [name, args])` directly.
 - :warning: `Q.all` no longer reuses the input array for the output
   array.
 - :warning: `Q.all` and `Q.allSettled` no longer accept a promise.  Use
   `Q(promise).all()` or `.allSettled()`.  The original behavior is
   deprecated.
 - :warning: `valueOf` has been removed.  Please use `inspect().value`
   instead.
 - :warning: The promise protocol no longer supports "set", "delete",
   and "apply" operations.  Function application is a special case of
   "post" with an undefined method name, and an additional "thisp"
   argument for support of "fbind". The "when" message is now called
   simply "then".  As such, this version of Q is not compatible with
   Q-Connection `v0.5`.
 - :warning: The old progress notification system has been removed.
   Try the new estimated time to completion feature.
 - :warning: `denodeify` now only takes the function to decorate and does not
   partially apply arguments. It now also takes a second argument
   that determines whether the decorated function needs a variadic or named
   argument nodeback.
 - :warning: `makeNodeResolver` no longer implicitly captures variadic arguments
   in an array. The user must pass `true` to resolve with an array of variadic
   arguments. The user may pass an array of names to resolve with an object with
   the corresponding properties for each argument.
 - Promises now support vicious cycle detection.  If a deferred promise
   ultimately depends upon its own resolution, it will be rejected with
   the singleton vicious cycle error.
 - The methods `Q.push` and `promise.pull` have been added, as well as
   `Q.isPortable` for marking local and remote objects as portable across
   Q Connection.
 - The method `promise.iterate` has been added to request a promise for a remote
   iterator.

### Promise Constructor

Q now supports a `Promise` constructor with two forms.  `new
Promise(callback(resolve, reject))` and `new Promise(promiseHandler)`.  Promise
handlers are a new concept and will serve as the basis for extensibility. The
`Promise` constructor is intended to be at least compatible with ECMAScript 6’s
`Promise`.

Introduced:

-   `Promise(setup(resolve, reject))` for constructing promises of all kinds.
-   `Promise.resolve` for coercing values to promises, wrapping thenables, and
    passing other promises through.

### Progress

Also, this edition introduces a better way to track “progress”, that is, to
track the estimated time to completion. Estimated time to completion allows
promises to compose the aggregate estimate from multiple promises. Particularly,
`Q.all` accepts the longest estimate as its own. The `then` method now accepts
in place of a `progress` function, a number of milliseconds that the fulfillment
handler is expected to take to resolve.

The new interface is:

```js
var promise = new Q.Promise(function (resolve, reject, setEstimate) {
    setTimeout(resolve, 1000);
    setEstimate(Date.now() + 1000);
});
// or
var deferred = Q.defer();
setTimeout(deferred.resolve, 1000);
deferred.setEstimate(Date.now() + 1000);
var promise = deferred.promise;

var estimate = promise.getEstimate(); // now + 1s
promise.observeEstimate(function (estimate) {
    // estimate === now + 1s
});
```

The `observeEstimate` function will receive a notification in its own event once
initially and thereafter for each time the `setEstimate` function issues an
update. `setEstimate` does not dispatch notifications synchronously.

Updates to a promise’s estimated time to completion can be converted to a
progress ratio knowing the start time and current time.

    progress = (now - start) / (estimate - start)

Likewise, if a promise knows its progress percentage (perhaps in terms of bytes
downloaded over the content length) and when it started, it can update the
estimated time to completion.

    estimate = start + (now - start) / progress

The old progress notification API, including `deferred.notify` and `then(f, r,
progress) will not cause any errors but wont’t send any notifications either.
The feature may be partially restored as a status notification system, but the
behavior will probably change.

### Node.js Bridge

Q 1 supported a wide variety of `n*` methods for bridging to Node.js. In
practice, few of these were used. This release scales back support for the
Node.js bridge to the essential `promise.nodeify`, `Q.denodeify`, and
`Q.ninvoke`.

The beahvior of `denodeify` has been altered to match the behavior of
[RSVP.js][]’s `denodeify`. The version of this method in Q v1 would infer that
the method provided a variable number of arguments (variadic arguments) if the
nodeback was called with more than one non-error argument. This leaves a glaring
ambiguity. With the new interface, whether to collect variadic arguments into an
array, capture arguments by name into an object, or just pass the sole value
argument is decided by a second parameter to `denodeify`. Omitted, you get the
usual Node.js style callback. With `true`, you get variadic arguments. With an
array of names, the arguments will be captured on an object literal with their
respective name.

[RSVP.js]: https://github.com/tildeio/rsvp.js/

The `makeNodeResolver` function has been deprecated and no longer supports the
implicit variadic behavior.

### Deprecations

These have migration shims that simply throw errors.

-   `Q.set`, `promise.set`
-   `Q.delete`, `promise.delete`
-   `Q.makePromise` in favor of the new `Promise` constructor and
    promise handler.

The following methods of `Q` are deprecated in favor of their equivalents on the
`promise` prototype:

-   `thenResolve`, `thenReject`, `isPending`, `isFulfilled`,
    `isRejected`, `dispatch`, `get`, `post`, `invoke`, `keys`

Other deprecations:

-   `Q.master` is no longer needed
-   `Q.resolve` in favor of `Q` or `Promise.resolve`
-   `Q.fulfill` in favor of `Q` or `Promise.resolve`
-   `Q.isPromiseAlike` in favor of `Q.isThenable`
-   `Q.nearer` in favor of `promise.inspect`
-   `Q.fail` and `promise.fail` in favor of `promise.catch`
-   `Q.fin` and `promise.fin` in favor of `promise.finally`
-   `Q.mapply` and `promise.mapply` in favor of `promise.post`
-   `Q.send` and `promise.send` in favor of `promise.invoke`
-   `Q.mcall` and `promise.mcall` in favor of `promise.invoke`
-   `Q.promise` in favor of `new Q.Promise` with a function
-   `Q.makePromise` in favor of `new Q.Promise` with a handler object
-   `promise.fbind` in favor of `Q.fbind`
-   `promise.passByCopy()` in favor of `Q.passByCopy(promise)`,
    provisionally

But the following experimental aliases are deprecated and do not exist
in `q/node`:

-   `nsend` for `ninvoke`
-   `nmcall` for `ninvoke`
-   `nmapply` for `npost`

## 1.0.0

:cake: This is all but a re-release of version 0.9, which has settled
into a gentle maintenance mode and rightly deserves an official 1.0.
An ambitious 2.0 release is already around the corner, but 0.9/1.0
have been distributed far and wide and demand long term support.

 - Q will now attempt to post a debug message in browsers regardless
   of whether window.Touch is defined. Chrome at least now has this
   property regardless of whether touch is supported by the underlying
   hardware.
 - Remove deprecation warning from `promise.valueOf`. The function is
   called by the browser in various ways so there is no way to
   distinguish usage that should be migrated from usage that cannot be
   altered.

## 0.9.7

 - :warning: `q.min.js` is no longer checked-in.  It is however still
   created by Grunt and NPM.
 - Fixes a bug that inhibited `Q.async` with implementations of the new
   ES6 generators.
 - Fixes a bug with `nextTick` affecting Safari 6.0.5 the first time a
   page loads when an `iframe` is involved.
 - Introduces `passByCopy`, `join`, and `race`.
 - Shows stack traces or error messages on the console, instead of
   `Error` objects.
 - Elimintates wrapper methods for improved performance.
 - `Q.all` now propagates progress notifications of the form you might
   expect of ES6 iterations, `{value, index}` where the `value` is the
   progress notification from the promise at `index`.

## 0.9.6

 - Fixes a bug in recognizing the difference between compatible Q
   promises, and Q promises from before the implementation of "inspect".
   The latter are now coerced.
 - Fixes an infinite asynchronous coercion cycle introduced by former
   solution, in two independently sufficient ways.  1.) All promises
   returned by makePromise now implement "inspect", albeit a default
   that reports that the promise has an "unknown" state.  2.) The
   implementation of "then/when" is now in "then" instead of "when", so
   that the responsibility to "coerce" the given promise rests solely in
   the "when" method and the "then" method may assume that "this" is a
   promise of the right type.
 - Refactors `nextTick` to use an unrolled microtask within Q regardless
   of how new ticks a requested. #316 @rkatic

## 0.9.5

 - Introduces `inspect` for getting the state of a promise as
   `{state: "fulfilled" | "rejected" | "pending", value | reason}`.
 - Introduces `allSettled` which produces an array of promises states
   for the input promises once they have all "settled".  This is in
   accordance with a discussion on Promises/A+ that "settled" refers to
   a promise that is "fulfilled" or "rejected".  "resolved" refers to a
   deferred promise that has been "resolved" to another promise,
   "sealing its fate" to the fate of the successor promise.
 - Long stack traces are now off by default.  Set `Q.longStackSupport`
   to true to enable long stack traces.
 - Long stack traces can now follow the entire asynchronous history of a
   promise, not just a single jump.
 - Introduces `spawn` for an immediately invoked asychronous generator.
   @jlongster
 - Support for *experimental* synonyms `mapply`, `mcall`, `nmapply`,
   `nmcall` for method invocation.

## 0.9.4

 - `isPromise` and `isPromiseAlike` now always returns a boolean 
   (even for falsy values). #284 @lfac-pt
 - Support for ES6 Generators in `async` #288 @andywingo
 - Clear duplicate promise rejections from dispatch methods #238 @SLaks
 - Unhandled rejection API #296 @domenic
   `stopUnhandledRejectionTracking`, `getUnhandledReasons`,
   `resetUnhandledRejections`.

## 0.9.3

 - Add the ability to give `Q.timeout`'s errors a custom error message. #270
   @jgrenon
 - Fix Q's call-stack busting behavior in Node.js 0.10, by switching from
   `process.nextTick` to `setImmediate`. #254 #259
 - Fix Q's behavior when used with the Mocha test runner in the browser, since
   Mocha introduces a fake `process` global without a `nextTick` property. #267
 - Fix some, but not all, cases wherein Q would give false positives in its
   unhandled rejection detection (#252). A fix for other cases (#238) is
   hopefully coming soon.
 - Made `Q.promise` throw early if given a non-function.

## 0.9.2

 - Pass through progress notifications when using `timeout`. #229 @omares
 - Pass through progress notifications when using `delay`.
 - Fix `nbind` to actually bind the `thisArg`. #232 @davidpadbury

## 0.9.1

 - Made the AMD detection compatible with the RequireJS optimizer's `namespace`
   option. #225 @terinjokes
 - Fix side effects from `valueOf`, and thus from `isFulfilled`, `isRejected`,
   and `isPending`. #226 @benjamn

## 0.9.0

This release removes many layers of deprecated methods and brings Q closer to
alignment with Mark Miller’s TC39 [strawman][] for concurrency. At the same
time, it fixes many bugs and adds a few features around error handling. Finally,
it comes with an updated and comprehensive [API Reference][].

[strawman]: http://wiki.ecmascript.org/doku.php?id=strawman:concurrency
[API Reference]: https://github.com/kriskowal/q/wiki/API-Reference

### API Cleanup

The following deprecated or undocumented methods have been removed.
Their replacements are listed here:

<table>
   <thead>
      <tr>
         <th>0.8.x method</th>
         <th>0.9 replacement</th>
      </tr>
   </thead>
   <tbody>
      <tr>
         <td><code>Q.ref</code></td>
         <td><code>Q</code></td>
      </tr>
      <tr>
         <td><code>call</code>, <code>apply</code>, <code>bind</code> (*)</td>
         <td><code>fcall</code>/<code>invoke</code>, <code>fapply</code>/<code>post</code>, <code>fbind</code></td>
      </tr>
      <tr>
         <td><code>ncall</code>, <code>napply</code> (*)</td>
         <td><code>nfcall</code>/<code>ninvoke</code>, <code>nfapply</code>/<code>npost</code></td>
      </tr>
      <tr>
         <td><code>end</code></td>
         <td><code>done</code></td>
      </tr>
      <tr>
         <td><code>put</code></td>
         <td><code>set</code></td>
      </tr>
      <tr>
         <td><code>node</code></td>
         <td><code>nbind</code></td>
      </tr>
      <tr>
         <td><code>nend</code></td>
         <td><code>nodeify</code></td>
      </tr>
      <tr>
         <td><code>isResolved</code></td>
         <td><code>isPending</code></td>
      </tr>
      <tr>
         <td><code>deferred.node</code></td>
         <td><code>deferred.makeNodeResolver</code></td>
      </tr>
      <tr>
         <td><code>Method</code>, <code>sender</code></td>
         <td><code>dispatcher</code></td>
      </tr>
      <tr>
         <td><code>send</code></td>
         <td><code>dispatch</code></td>
      </tr>
      <tr>
         <td><code>view</code>, <code>viewInfo</code></td>
         <td>(none)</td>
      </tr>
   </tbody>
</table>


(*) Use of ``thisp`` is discouraged. For calling methods, use ``post`` or
``invoke``.

### Alignment with the Concurrency Strawman

-   Q now exports a `Q(value)` function, an alias for `resolve`.
    `Q.call`, `Q.apply`, and `Q.bind` were removed to make room for the
    same methods on the function prototype.
-   `invoke` has been aliased to `send` in all its forms.
-   `post` with no method name acts like `fapply`.

### Error Handling

-   Long stack traces can be turned off by setting `Q.stackJumpLimit` to zero.
    In the future, this property will be used to fine tune how many stack jumps
    are retained in long stack traces; for now, anything nonzero is treated as
    one (since Q only tracks one stack jump at the moment, see #144). #168
-   In Node.js, if there are unhandled rejections when the process exits, they
    are output to the console. #115

### Other

-   `delete` and `set` (née `put`) no longer have a fulfillment value.
-   Q promises are no longer frozen, which
    [helps with performance](http://code.google.com/p/v8/issues/detail?id=1858).
-   `thenReject` is now included, as a counterpart to `thenResolve`.
-   The included browser `nextTick` shim is now faster. #195 @rkatic.

### Bug Fixes

-   Q now works in Internet Explorer 10. #186 @ForbesLindesay
-   `fbind` no longer hard-binds the returned function's `this` to `undefined`.
    #202
-   `Q.reject` no longer leaks memory. #148
-   `npost` with no arguments now works. #207
-   `allResolved` now works with non-Q promises ("thenables"). #179
-   `keys` behavior is now correct even in browsers without native
    `Object.keys`. #192 @rkatic
-   `isRejected` and the `exception` property now work correctly if the
    rejection reason is falsy. #198

### Internals and Advanced

-   The internal interface for a promise now uses
    `dispatchPromise(resolve, op, operands)` instead of `sendPromise(op,
    resolve, ...operands)`, which reduces the cases where Q needs to do
    argument slicing.
-   The internal protocol uses different operands. "put" is now "set".
    "del" is now "delete". "view" and "viewInfo" have been removed.
-   `Q.fulfill` has been added. It is distinct from `Q.resolve` in that
    it does not pass promises through, nor coerces promises from other
    systems. The promise becomes the fulfillment value. This is only
    recommended for use when trying to fulfill a promise with an object that has
    a `then` function that is at the same time not a promise.

## 0.8.12
- Treat foreign promises as unresolved in `Q.isFulfilled`; this lets `Q.all`
  work on arrays containing foreign promises. #154
- Fix minor incompliances with the [Promises/A+ spec][] and [test suite][]. #157
  #158

[Promises/A+ spec]: http://promises-aplus.github.com/promises-spec/
[test suite]: https://github.com/promises-aplus/promises-tests

## 0.8.11

 - Added ``nfcall``, ``nfapply``, and ``nfbind`` as ``thisp``-less versions of
   ``ncall``, ``napply``, and ``nbind``. The latter are now deprecated. #142
 - Long stack traces no longer cause linearly-growing memory usage when chaining
   promises together. #111
 - Inspecting ``error.stack`` in a rejection handler will now give a long stack
   trace. #103
 - Fixed ``Q.timeout`` to clear its timeout handle when the promise is rejected;
   previously, it kept the event loop alive until the timeout period expired.
   #145 @dfilatov
 - Added `q/queue` module, which exports an infinite promise queue
   constructor.

## 0.8.10

 - Added ``done`` as a replacement for ``end``, taking the usual fulfillment,
   rejection, and progress handlers. It's essentially equivalent to
   ``then(f, r, p).end()``.
 - Added ``Q.onerror``, a settable error trap that you can use to get full stack
   traces for uncaught errors. #94
 - Added ``thenResolve`` as a shortcut for returning a constant value once a
   promise is fulfilled. #108 @ForbesLindesay
 - Various tweaks to progress notification, including propagation and
   transformation of progress values and only forwarding a single progress
   object.
 - Renamed ``nend`` to ``nodeify``. It no longer returns an always-fulfilled
   promise when a Node callback is passed.
 - ``deferred.resolve`` and ``deferred.reject`` no longer (sometimes) return
   ``deferred.promise``.
 - Fixed stack traces getting mangled if they hit ``end`` twice. #116 #121 @ef4
 - Fixed ``ninvoke`` and ``npost`` to work on promises for objects with Node
   methods. #134
 - Fixed accidental coercion of objects with nontrivial ``valueOf`` methods,
   like ``Date``s, by the promise's ``valueOf`` method. #135
 - Fixed ``spread`` not calling the passed rejection handler if given a rejected
   promise.

## 0.8.9

 - Added ``nend``
 - Added preliminary progress notification support, via
   ``promise.then(onFulfilled, onRejected, onProgress)``,
   ``promise.progress(onProgress)``, and ``deferred.notify(...progressData)``.
 - Made ``put`` and ``del`` return the object acted upon for easier chaining.
   #84
 - Fixed coercion cycles with cooperating promises. #106

## 0.8.7

 - Support [Montage Require](http://github.com/kriskowal/mr)

## 0.8.6

 - Fixed ``npost`` and ``ninvoke`` to pass the correct ``thisp``. #74
 - Fixed various cases involving unorthodox rejection reasons. #73 #90
   @ef4
 - Fixed double-resolving of misbehaved custom promises. #75
 - Sped up ``Q.all`` for arrays contain already-resolved promises or scalar
   values. @ForbesLindesay
 - Made stack trace filtering work when concatenating assets. #93 @ef4
 - Added warnings for deprecated methods. @ForbesLindesay
 - Added ``.npmignore`` file so that dependent packages get a slimmer
   ``node_modules`` directory.

## 0.8.5

 - Added preliminary support for long traces (@domenic)
 - Added ``fapply``, ``fcall``, ``fbind`` for non-thisp
   promised function calls.
 - Added ``return`` for async generators, where generators
   are implemented.
 - Rejected promises now have an "exception" property.  If an object
   isRejected(object), then object.valueOf().exception will
   be the wrapped error.
 - Added Jasmine specifications
 - Support Internet Explorers 7–9 (with multiple bug fixes @domenic)
 - Support Firefox 12
 - Support Safari 5.1.5
 - Support Chrome 18

## 0.8.4

 - WARNING: ``promise.timeout`` is now rejected with an ``Error`` object
   and the message now includes the duration of the timeout in
   miliseconds.  This doesn't constitute (in my opinion) a
   backward-incompatibility since it is a change of an undocumented and
   unspecified public behavior, but if you happened to depend on the
   exception being a string, you will need to revise your code.
 - Added ``deferred.makeNodeResolver()`` to replace the more cryptic
   ``deferred.node()`` method.
 - Added experimental ``Q.promise(maker(resolve, reject))`` to make a
   promise inside a callback, such that thrown exceptions in the
   callback are converted and the resolver and rejecter are arguments.
   This is a shorthand for making a deferred directly and inspired by
   @gozala’s stream constructor pattern and the Microsoft Windows Metro
   Promise constructor interface.
 - Added experimental ``Q.begin()`` that is intended to kick off chains
   of ``.then`` so that each of these can be reordered without having to
   edit the new and former first step.

## 0.8.3

 - Added ``isFulfilled``, ``isRejected``, and ``isResolved``
   to the promise prototype.
 - Added ``allResolved`` for waiting for every promise to either be
   fulfilled or rejected, without propagating an error. @utvara #53
 - Added ``Q.bind`` as a method to transform functions that
   return and throw into promise-returning functions. See
   [an example](https://gist.github.com/1782808). @domenic
 - Renamed ``node`` export to ``nbind``, and added ``napply`` to
   complete the set. ``node`` remains as deprecated. @domenic #58
 - Renamed ``Method`` export to ``sender``.  ``Method``
   remains as deprecated and will be removed in the next
   major version since I expect it has very little usage.
 - Added browser console message indicating a live list of
   unhandled errors.
 - Added support for ``msSetImmediate`` (IE10) or ``setImmediate``
   (available via [polyfill](https://github.com/NobleJS/setImmediate))
   as a browser-side ``nextTick`` implementation. #44 #50 #59
 - Stopped using the event-queue dependency, which was in place for
   Narwhal support: now directly using ``process.nextTick``.
 - WARNING: EXPERIMENTAL: added ``finally`` alias for ``fin``, ``catch``
   alias for ``fail``, ``try`` alias for ``call``, and ``delete`` alias
   for ``del``.  These properties are enquoted in the library for
   cross-browser compatibility, but may be used as property names in
   modern engines.

## 0.8.2

 - Deprecated ``ref`` in favor of ``resolve`` as recommended by
   @domenic.
 - Update event-queue dependency.

## 0.8.1

 - Fixed Opera bug. #35 @cadorn
 - Fixed ``Q.all([])`` #32 @domenic

## 0.8.0

 - WARNING: ``enqueue`` removed.  Use ``nextTick`` instead.
   This is more consistent with NodeJS and (subjectively)
   more explicit and intuitive.
 - WARNING: ``def`` removed.  Use ``master`` instead.  The
   term ``def`` was too confusing to new users.
 - WARNING: ``spy`` removed in favor of ``fin``.
 - WARNING: ``wait`` removed. Do ``all(args).get(0)`` instead.
 - WARNING: ``join`` removed. Do ``all(args).spread(callback)`` instead.
 - WARNING: Removed the ``Q`` function module.exports alias
   for ``Q.ref``. It conflicts with ``Q.apply`` in weird
   ways, making it uncallable.
 - Revised ``delay`` so that it accepts both ``(value,
   timeout)`` and ``(timeout)`` variations based on
   arguments length.
 - Added ``ref().spread(cb(...args))``, a variant of
   ``then`` that spreads an array across multiple arguments.
   Useful with ``all()``.
 - Added ``defer().node()`` Node callback generator.  The
   callback accepts ``(error, value)`` or ``(error,
   ...values)``.  For multiple value arguments, the
   fulfillment value is an array, useful in conjunction with
   ``spread``.
 - Added ``node`` and ``ncall``, both with the signature
   ``(fun, thisp_opt, ...args)``.  The former is a decorator
   and the latter calls immediately.  ``node`` optional
   binds and partially applies.  ``ncall`` can bind and pass
   arguments.

## 0.7.2

 - Fixed thenable promise assimilation.

## 0.7.1

 - Stopped shimming ``Array.prototype.reduce``. The
   enumerable property has bad side-effects.  Libraries that
   depend on this (for example, QQ) will need to be revised.

## 0.7.0 - :warning: BACKWARD INCOMPATIBILITY

 - WARNING: Removed ``report`` and ``asap``
 - WARNING: The ``callback`` argument of the ``fin``
   function no longer receives any arguments. Thus, it can
   be used to call functions that should not receive
   arguments on resolution.  Use ``when``, ``then``, or
   ``fail`` if you need a value.
 - IMPORTANT: Fixed a bug in the use of ``MessageChannel``
   for ``nextTick``.
 - Renamed ``enqueue`` to ``nextTick``.
 - Added experimental ``view`` and ``viewInfo`` for creating
   views of promises either when or before they're
   fulfilled.
 - Shims are now externally applied so subsequent scripts or
   dependees can use them.
 - Improved minification results.
 - Improved readability.

## 0.6.0 - :warning: BACKWARD INCOMPATIBILITY

 - WARNING: In practice, the implementation of ``spy`` and
   the name ``fin`` were useful.  I've removed the old
   ``fin`` implementation and renamed/aliased ``spy``.
 - The "q" module now exports its ``ref`` function as a "Q"
   constructor, with module systems that support exports
   assignment including NodeJS, RequireJS, and when used as
   a ``<script>`` tag. Notably, strictly compliant CommonJS
   does not support this, but UncommonJS does.
 - Added ``async`` decorator for generators that use yield
   to "trampoline" promises. In engines that support
   generators (SpiderMonkey), this will greatly reduce the
   need for nested callbacks.
 - Made ``when`` chainable.
 - Made ``all`` chainable.

## 0.5.3

 - Added ``all`` and refactored ``join`` and ``wait`` to use
   it.  All of these will now reject at the earliest
   rejection.

## 0.5.2

 - Minor improvement to ``spy``; now waits for resolution of
   callback promise.

## 0.5.1

 - Made most Q API methods chainable on promise objects, and
   turned the previous promise-methods of ``join``,
   ``wait``, and ``report`` into Q API methods.
 - Added ``apply`` and ``call`` to the Q API, and ``apply``
   as a promise handler.
 - Added ``fail``, ``fin``, and ``spy`` to Q and the promise
   prototype for convenience when observing rejection,
   fulfillment and rejection, or just observing without
   affecting the resolution.
 - Renamed ``def`` (although ``def`` remains shimmed until
   the next major release) to ``master``.
 - Switched to using ``MessageChannel`` for next tick task
   enqueue in browsers that support it.

## 0.5.0 - :warning: MINOR BACKWARD INCOMPATIBILITY

 - Exceptions are no longer reported when consumed.
 - Removed ``error`` from the API.  Since exceptions are
   getting consumed, throwing them in an errback causes the
   exception to silently disappear.  Use ``end``.
 - Added ``end`` as both an API method and a promise-chain
   ending method.  It causes propagated rejections to be
   thrown, which allows Node to write stack traces and
   emit ``uncaughtException`` events, and browsers to
   likewise emit ``onerror`` and log to the console.
 - Added ``join`` and ``wait`` as promise chain functions,
   so you can wait for variadic promises, returning your own
   promise back, or join variadic promises, resolving with a
   callback that receives variadic fulfillment values.

## 0.4.4

 - ``end`` no longer returns a promise. It is the end of the
   promise chain.
 - Stopped reporting thrown exceptions in ``when`` callbacks
   and errbacks.  These must be explicitly reported through
   ``.end()``, ``.then(null, Q.error)``, or some other
   mechanism.
 - Added ``report`` as an API method, which can be used as
   an errback to report and propagate an error.
 - Added ``report`` as a promise-chain method, so an error
   can be reported if it passes such a gate.

## 0.4.3

 - Fixed ``<script>`` support that regressed with 0.4.2
   because of "use strict" in the module system
   multi-plexer.

## 0.4.2

 - Added support for RequireJS (jburke)

## 0.4.1

 - Added an "end" method to the promise prototype,
   as a shorthand for waiting for the promise to
   be resolved gracefully, and failing to do so,
   to dump an error message.

## 0.4.0 - :warning: BACKWARD INCOMPATIBLE*

 - *Removed the utility modules. NPM and Node no longer
   expose any module except the main module.  These have
   been moved and merged into the "qq" package.
 - *In a non-CommonJS browser, q.js can be used as a script.
   It now creates a Q global variable.
 - Fixed thenable assimilation.
 - Fixed some issues with asap, when it resolves to
   undefined, or throws an exception.

## 0.3.0 - :warning: BACKWARD-INCOMPATIBLE

 - The `post` method has been reverted to its original
   signature, as provided in Tyler Close's `ref_send` API.
   That is, `post` accepts two arguments, the second of
   which is an arbitrary object, but usually invocation
   arguments as an `Array`.  To provide variadic arguments
   to `post`, there is a new `invoke` function that posts
   the variadic arguments to the value given in the first
   argument.
 - The `defined` method has been moved from `q` to `q/util`
   since it gets no use in practice but is still
   theoretically useful.
 - The `Promise` constructor has been renamed to
   `makePromise` to be consistent with the convention that
   functions that do not require the `new` keyword to be
   used as constructors have camelCase names.
 - The `isResolved` function has been renamed to
   `isFulfilled`.  There is a new `isResolved` function that
   indicates whether a value is not a promise or, if it is a
   promise, whether it has been either fulfilled or
   rejected.  The code has been revised to reflect this
   nuance in terminology.

## 0.2.10

 - Added `join` to `"q/util"` for variadically joining
   multiple promises.

## 0.2.9

 - The future-compatible `invoke` method has been added,
   to replace `post`, since `post` will become backward-
   incompatible in the next major release.
 - Exceptions thrown in the callbacks of a `when` call are
   now emitted to Node's `"uncaughtException"` `process`
   event in addition to being returned as a rejection reason.

## 0.2.8

 - Exceptions thrown in the callbacks of a `when` call
   are now consumed, warned, and transformed into
   rejections of the promise returned by `when`.

## 0.2.7

 - Fixed a minor bug in thenable assimilation, regressed
   because of the change in the forwarding protocol.
 - Fixed behavior of "q/util" `deep` method on dates and
   other primitives. Github issue #11.

## 0.2.6

 - Thenables (objects with a "then" method) are accepted
   and provided, bringing this implementation of Q
   into conformance with Promises/A, B, and D.
 - Added `makePromise`, to replace the `Promise` function
   eventually.
 - Rejections are now also duck-typed. A rejection is a
   promise with a valueOf method that returns a rejection
   descriptor. A rejection descriptor has a
   "promiseRejected" property equal to "true" and a
   "reason" property corresponding to the rejection reason.
 - Altered the `makePromise` API such that the `fallback`
   method no longer receives a superfluous `resolved` method
   after the `operator`.  The fallback method is responsible
   only for returning a resolution.  This breaks an
   undocumented API, so third-party API's depending on the
   previous undocumented behavior may break.

## 0.2.5

 - Changed promises into a duck-type such that multiple
   instances of the Q module can exchange promise objects.
   A promise is now defined as "an object that implements the
   `promiseSend(op, resolved, ...)` method and `valueOf`".
 - Exceptions in promises are now captured and returned
   as rejections.

## 0.2.4

 - Fixed bug in `ref` that prevented `del` messages from
   being received (gozala)
 - Fixed a conflict with FireFox 4; constructor property
   is now read-only.

## 0.2.3

 - Added `keys` message to promises and to the promise API.

## 0.2.2

 - Added boilerplate to `q/queue` and `q/util`.
 - Fixed missing dependency to `q/queue`.

## 0.2.1

 - The `resolve` and `reject` methods of `defer` objects now
   return the resolution promise for convenience.
 - Added `q/util`, which provides `step`, `delay`, `shallow`,
   `deep`, and three reduction orders.
 - Added `q/queue` module for a promise `Queue`.
 - Added `q-comm` to the list of compatible libraries.
 - Deprecated `defined` from `q`, with intent to move it to
   `q/util`.

## 0.2.0 - :warning: BACKWARD INCOMPATIBLE

 - Changed post(ref, name, args) to variadic
   post(ref, name, ...args). BACKWARD INCOMPATIBLE
 - Added a def(value) method to annotate an object as being
   necessarily a local value that cannot be serialized, such
   that inter-process/worker/vat promise communication
   libraries will send messages to it, but never send it
   back.
 - Added a send(value, op, ...args) method to the public API, for
   forwarding messages to a value or promise in a future turn.

## 0.1.9

 - Added isRejected() for testing whether a value is a rejected
   promise.  isResolved() retains the behavior of stating
   that rejected promises are not resolved.

## 0.1.8

 - Fixed isResolved(null) and isResolved(undefined) [issue #9]
 - Fixed a problem with the Object.create shim

## 0.1.7

 - shimmed ES5 Object.create in addition to Object.freeze
   for compatibility on non-ES5 engines (gozala)

## 0.1.6

 - Q.isResolved added
 - promise.valueOf() now returns the value of resolved
   and near values
 - asap retried
 - promises are frozen when possible

## 0.1.5

 - fixed dependency list for Teleport (gozala)
 - all unit tests now pass (gozala)

## 0.1.4

 - added support for Teleport as an engine (gozala)
 - simplified and updated methods for getting internal
   print and enqueue functions universally (gozala)

## 0.1.3

 - fixed erroneous link to the q module in package.json

## 0.1.2

 - restructured for overlay style package compatibility

## 0.1.0

 - removed asap because it was broken, probably down to the
   philosophy.

## 0.0.3

 - removed q-util
 - fixed asap so it returns a value if completed

## 0.0.2

 - added q-util

## 0.0.1

 - initial version

