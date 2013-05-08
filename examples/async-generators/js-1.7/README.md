
/!\ Warning: The behavior described here corresponds to a dead-end fork
of JavaScript used in FireFox.  If you can, use ES6-style generators,
described [in the parent directory](../).  Currently Q works with both
kinds of generators, but perhaps in a year or so, support for the older
SpiderMonkey generators will go away.

Examples of SpiderMonkey-style generators:

    function count() {
        var i = 0;
        while (true) {
            yield i++;
        }
    }

    var counter = count();
    count.next() === 0;
    count.next() === 1;
    count.next() === 2;

In this case it's just like ES6 generators, but with ``function``
instead of ``function*``.  Like ES6 generators, ``yield`` can also
return a value, if the ``send`` method of a generator is used instead of
``next``:

    var buffer = (function () {
        var x;
        while (true) {
            x = yield x;
        }
    }());

    buffer.send(1) === undefined
    buffer.send("a") === 1
    buffer.send(2) === "a"
    buffer.next() === 2
    buffer.next() === undefined
    buffer.next() === undefined

We can use ``yield`` to wait for a promise to resolve.

    var eventualAdd = Q.async(function (oneP, twoP) {
        var one = yield oneP;
        var two = yield twoP;
        Q.return(one + two);
    });

    eventualAdd(eventualOne, eventualTwo)
    .then(function (three) {
        three === 3;
    });

Note!  SpiderMonkey does not allow return values in generators.  To work
around that, call the ``Q.return`` function, as used above, instead of
using a ``return`` statement.  ``Q.return`` will go away at some point
when SpiderMonkey switches to ES6 style.
