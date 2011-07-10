
/!\ Warning: The behavior described here is likely to be quickly
obseleted by developments in standardization and implementation.  Tread
with care.

Q now has an ``async`` function.  This can be used to
decorate a generator function such that ``yield`` is
effectively equivalent to ``await`` or ``defer`` syntax as
supported by languages like Go and, reportedly, C#3.

Generator functions are presently only supported by
SpiderMonkey, but they are standards track, and very similar
down to details to generators in Python.

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

``yield`` can also return a value, if the ``send`` method of
a generator is used instead of ``next``.

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
        return one + two;
    });

    eventualAdd(eventualOne, eventualTwo)
    .then(function (three) {
        three === 3;
    });

Or, at least we could.  For now, SpiderMonkey does not allow
return values in generators.  When they do, ``Q.async`` will
properly fulfill the result of eventualAdd.  Until then,
``eventualAdd`` will resolve to ``undefined`` when the job
is done, when the generator throws ``StopIteration``.

As a stop-gap, you can fake the return value by tacking a
``value`` property on an explicitly thrown
``StopIteration``, as in Example 1, in this directory.

