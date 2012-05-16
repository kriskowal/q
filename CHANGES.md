<!-- vim:ts=4:sts=4:sw=4:et:tw=60 -->

## Next major

 - WARNING: The undocumented ``Method`` export will be
   removed.  Use ``sender(op)``.
 - WARNING: The deprecated ``node`` export will be removed.
   Use ``nbind``.
 - WARNING: The deprecated ``deferred.node()`` interface will be
   removed.  Use ``deferred.makeNodeResolver()``.
 - WARNING: The deprecated ``call``, ``apply``, and ``bind`` are
   replaced with ``fcall``, ``fapply``, and ``fbind``.  Use of a
   ``thisp`` is discouraged.  For calling methods, use ``post`` or
   ``invoke``.
 - WARNING: The undocumented ``view`` and ``viewInfo`` will be removed.

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

## 0.7.0 - BACKWARD INCOMPATIBILITY

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

## 0.6.0 - BACKWARD INCOMPATIBILITY

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

## 0.5.0 - MINOR BACKWARD INCOMPATIBILITY

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

## 0.4.0 - BACKWARD INCOMPATIBLE*

 - *Removed the utility modules. NPM and Node no longer
   expose any module except the main module.  These have
   been moved and merged into the "qq" package.
 - *In a non-CommonJS browser, q.js can be used as a script.
   It now creates a Q global variable.
 - Fixed thenable assimilation.
 - Fixed some issues with asap, when it resolves to
   undefined, or throws an exception.

## 0.3.0 - BACKWARD-INCOMPATIBLE

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

## 0.2.0 - BACKWARD INCOMPATIBLE

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

