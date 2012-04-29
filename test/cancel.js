'use strict';

var Q = require('../q');

function fixture(canceled) {
    var deferred = Q.defer();
    var handle = setTimeout(deferred.resolve, 500);
    return deferred.promise
    .cancelable(function () {
        canceled();
        clearTimeout(handle);
    });
}

function fixture2(canceled) {
    var deferred = Q.defer(function () {
        canceled();
        clearTimeout(handle);
    });
    var handle = setTimeout(deferred.resolve, 500);
    return deferred.promise;
}

exports['test non-cancelable canceled'] = function (assert, done) {
    var deferred = Q.defer();
    deferred.promise.cancel();
    deferred.resolve();
    deferred.promise
    .timeout(100)
    .then(function () {
        assert.ok(true, 'should be fulfilled despite cancelation');
    }, function () {
        assert.ok(false, 'should not time out');
    })
    .finally(done)
};

exports['test cancelable not canceled'] = function (assert, done) {
    fixture(function onCancel() {
        assert.ok(false, 'should not be canceled');
    })
    .then(function fulfilled() {
        assert.ok(true, 'should be fulfilled');
    }, function rejected() {
        assert.ok(false, 'should not be rejected');
    })
    .timeout(1000)
    .fail(function (exception) {
        assert.ok(false, exception.message);
    })
    .finally(done)
    .end()
};

exports['test cancelable canceled'] = function (assert, done) {
    var canceled;
    var promise = fixture(function onCancel() {
        canceled = true;
    })
    promise.cancel();
    promise.then(function () {
        assert.ok(false, 'should not be fulfilled');
    }, function () {
        assert.ok(false, 'should not be rejected');
        // the reasoning here is that the cancel method should not be
        // useful as a way for one recipient of a promise to send a
        // message to another recipient of the same promise.
        // information only flows from the resolver to the promise.
    })
    .timeout(500)
    .fail(function (exception) {
        assert.ok(true, 'should time out');
        assert.ok(canceled, 'cancelback should be called');
    })
    .finally(done)
    .end()
};

exports['test downstream promise'] = function (assert, done) {
    var parent = fixture(function () {
        assert.ok(false, 'should not be canceled');
    })
    var child = parent.then(function () {
        assert.ok(true, 'child should be fulfilled');
    }, function () {
        assert.ok(false, 'child should not be rejected');
    });

    var grandChild = child.then(function () {
        assert.ok(true, 'grandchild should be fulfilled');
    }, function () {
        assert.ok(false, 'grandchild should not be rejected');
    });

    grandChild.cancel();

    grandChild
    .timeout(1000)
    .then(function () {
        assert.ok(true, 'grandchild should be fulfilled (cancel ignored)');
    }, function () {
        assert.ok(false, 'grandchild should not time out');
    })
    .finally(done)
    .end()
};

if (module === require.main) {
    require('test').run(exports);
}

