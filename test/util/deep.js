
var Q = require('q/util');

[
    ['undefined', function () {}],
    ['null', function () {return null}],
    ['number', function () {return 0}],
    ['boolean', function () {return false}],
    ['date', function () {return new Date()}],
].forEach(function (pair) {
    exports['test ' + pair[0]] = function (ASSERT, done) {
        var value1 = pair[1]();
        Q.when(Q.deep(value1), function (value2) {
            ASSERT.strictEqual(value1, value2, 'shallow ' + pair[0]);
            done();
        }, function (reason) {
            ASSERT.ok(false, reason);
            done();
        });
    }
});

if (module == require.main)
    require('test').run(exports)

