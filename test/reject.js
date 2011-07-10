
var Q = require('../q');

exports['test reject: isRejected, isResolved, isFulfilled'] = function (ASSERT, done) {
    var future = false;
    var reason = {};
    var rejection = Q.reject(reason);
    ASSERT.ok(Q.isRejected(rejection), 'should be rejected in current turn');
    ASSERT.ok(!Q.isFulfilled(rejection), 'should not be fulfilled in current turn');
    ASSERT.ok(Q.isResolved(rejection), 'should be resolved in current turn');
    Q.when(function () {
        ASSERT.ok(false, 'should not be resolved in a future turn');
        done();
    }, function () {
        ASSERT.ok(future, 'should be rejected in a future turn');
        done();
    });
    future = true;
};

exports['test isRejected: reject()'] = function (ASSERT) {
    ASSERT.ok(Q.isRejected(Q.reject()), 'rejection');
};

exports['test isRejected: resolve(reject())'] = function (ASSERT) {
    var deferred = Q.defer();
    deferred.resolve(Q.reject());
    ASSERT.ok(Q.isRejected(deferred.promise), 'rejection');
};

exports['test isRejected: null, undefined'] = function (ASSERT) {
    ASSERT.ok(!Q.isRejected(undefined), 'undefined not rejection');
    ASSERT.ok(!Q.isRejected(null), 'null not rejection');
};

exports['test isRejected: promise'] = function (ASSERT) {
    var deferred = Q.defer();
    ASSERT.ok(!Q.isRejected(deferred.promise), 'unresolved promise not rejected');
    deferred.resolve();
    ASSERT.ok(!Q.isRejected(deferred.promise), 'resolved promise not rejected');
};

exports['test reject: valueOf, toString'] = function (ASSERT) {
    ASSERT.strictEqual(Q.reject().toString(), '[object Promise]', 'toString()');
    ASSERT.strictEqual(Q.reject().valueOf().toString(), '[object Promise]', 'valueOf().toString()');
};

if (module == require.main)
    require('test').run(exports)

