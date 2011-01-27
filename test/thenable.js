
var Q = require('q');

exports['test assimilation'] = function (ASSERT, done) {
    Q.when({
        "then": function (resolved, rejected) {
            resolved(10);
        }
    }, function (value) {
        ASSERT.ok(true, 'thenable resolved');
        done();
    }, function () {
        ASSERT.ok(false, 'thenable rejected');
        done();
    })
}

exports['test provision'] = function (ASSERT, done) {
    Q.when(10).then(function (value) {
        return value + 10;
    }).then(function (value) {
        return value + 20;
    }).then(function (value) {
        ASSERT.equal(value, 40, 'chained promises');
        done();
    })
}

if (module == require.main)
    require('test').run(exports)

