/!\ Warning: The behavior described here is likely to be quickly
obseleted by developments in standardization and implementation.  Tread
with care.

Q has an ``async`` function.  This can be used to
decorate a generator function such that ``yield`` is
effectively equivalent to ``await`` or ``defer`` syntax as
supported by languages like Go and, reportedly, C#3.

Generator functions are presently on the standards track for ES6.  As of
May 2013, they are only fully supported by bleeding edge V8, which
hasn't made it out to a released Chromium yet but will probably be in
Chromium 29.  Generators have been in SpiderMonkey for years, but in an
older pre-standard form based on Python's design.  The Traceur
transpiler also still uses Python-style generators, which were part of
an older ES6 draft.

Q's ``async`` function supports both kinds of generators.  These
examples will use the ES6 style.  See the examples and notes in
[js-1.7](js-1.7/) for more on getting these to work with SpiderMonkey.

```js
function* count() {
    var i = 0;
    while (true) {
        yield i++;
    }
}

var counter = count();
count.next() === 0;
count.next() === 1;
count.next() === 2;
```

``yield`` can also return a value, if the ``send`` method of
a generator is used instead of ``next``.

```js
var buffer = (function* () {
    var x;
    while (true) {
        x = yield x;
    }
}());

buffer.send(1) === undefined;
buffer.send("a") === 1;
buffer.send(2) === "a";
buffer.next() === 2;
buffer.next() === undefined;
buffer.next() === undefined;
```

We can use ``yield`` to wait for a promise to resolve.

```js
var eventualAdd = Q.async(function* (oneP, twoP) {
    var one = yield oneP;
    var two = yield twoP;
    return one + two;
});

eventualAdd(eventualOne, eventualTwo)
.then(function (three) {
    three === 3;
});
```

To use these in SpiderMonkey, change ``function*`` to ``function``.
Also, in this last example, SpiderMonkey does not allow return values in
generators.  To work around that, call the ``Q.return`` function instead
of using a ``return`` statement.  ``Q.return`` will go away at some
point when SpiderMonkey switches to ES6 style.
