// vim:ts=4:sts=4:sw=4:
'use strict';

var Q = require("../q");

exports['test allResolved'] = function (assert, done) {
    Q.allResolved([1, Q.resolve(2), Q.reject(3)])
    .then(function (promises) {
        assert.equal(promises.length, 3, 'three promises')
        assert.ok(promises.every(Q.isPromise), 'all promises');
        assert.ok(promises.every(Q.isResolved), 'all resolved');
        assert.equal(promises.filter(Q.isFulfilled).length, 2, 'two fulfilled');
        assert.equal(promises.filter(Q.isRejected).length, 1, 'one rejected');
        assert.equal(promises[0].valueOf(), 1, 'promise 1');
        assert.equal(promises[1].valueOf(), 2, 'promise 2');
    })
    .catch(function (error) {
        assert.ok(false, error);
    })
    .finally(done);
};

exports['test allResolved order'] = function (assert, done) {
    var toResolve = Q.defer();
    var toReject = Q.defer();
    var promises = [toResolve.promise, toReject.promise];
    var resolved;
    var rejected;

    Q.try(function () {
        toReject.reject();
        rejected = true;
    })
    .then(function () {
        toResolve.resolve();
        resolved = true;
    })

    Q.allResolved(promises)
    .then(function (promises) {
        assert.ok(resolved, 'resolved');
        assert.ok(rejected, 'rejected');
    })
    .catch(function (error) {
        assert.ok(false, error);
    })
    .finally(done);
};

exports['test all order'] = function (assert, done) {
    var toResolve = Q.defer(); // never resolve
    var toReject = Q.defer();
    var promises = [toResolve.promise, toReject.promise];
    var promise = Q.all(promises)

    toReject.reject();

    Q.delay(10).then(function () {
        assert.ok(promise.isRejected(), 'composite rejected');
    })
    .catch(function (error) {
        assert.ok(false, 'no error');
    })
    .finally(done);
};

if (module == require.main)
    require('test').run(exports)

