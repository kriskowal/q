
var Q = require('../q');

exports['test ref assimilation'] = function (ASSERT, done) {
    Q.ref({
        "then": function (resolved, rejected) {
            resolved(10);
        }
    })
    .then(function (value) {
        ASSERT.equal(value, 10, 'thenable resolved');
        return value + 10;
    })
    .then(function (value) {
        ASSERT.equal(value, 20, 'thenable chained');
        return value + 10;
    })
    .then(function (value) {
        ASSERT.equal(value, 30, 'thenable chained again');
    })
    .fin(done);
}

exports['test when assimilation'] = function (ASSERT, done) {
    Q.when({
        "then": function (resolved, rejected) {
            resolved(10);
        }
    }, function (value) {
        ASSERT.equal(value, 10, 'thenable resolved');
        return value + 10;
    })
    .then(function (value) {
        ASSERT.equal(value, 20, 'thenable chained');
        return value + 10;
    })
    .then(function (value) {
        ASSERT.equal(value, 30, 'thenable chained again');
    })
    .fin(done);
}

exports['test ref assimilation and piplining'] = function (ASSERT, done) {
    Q.ref({
        "then": function (resolved, rejected) {
            resolved([10]);
        }
    })
    .get(0)
    .then(function (value) {
        ASSERT.equal(value, 10, 'thenable resolved');
        return value + 10;
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done);
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

