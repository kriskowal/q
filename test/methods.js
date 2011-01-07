// vim:ts=4:sts=4:sw=4:
'use stirct';

var Q = require('q');

exports['test get resolved'] = function (ASSERT, done) {
    var d = Q.defer();
    Q.when(Q.get(d.promise, 'a'), function (value) {
        ASSERT.equal(value, 1, 'get resolved correctly')
        done();
    }, function (reason) {
        ASSERT.fail(reason);
        done();
    });
    d.resolve({ a: 1 });
};

exports['test get rejected'] = function (ASSERT, done) {
    var d = Q.defer();
    Q.when(Q.get(d.promise, 'a'), function (value) {
        ASSERT.fail('Unxpeced to get a property `a` of `undefined`:' + value);
        done();
    }, function (reason) {
        ASSERT.pass(reason);
        done();
    });
    d.resolve();
};

exports['test put resolved'] = function (ASSERT, done) {
    var d = Q.defer();
    var value = {};
    Q.when(Q.put(d.promise, 'a', 1), function () {
        ASSERT.equal(value.a, 1, 'value was set');
        done();
    }, function (reason) {
        ASSERT.fail(reason);
        done();
    });
    d.resolve(value);
};

exports['test put rejected'] = function (ASSERT, done) {
    var d = Q.defer();
    Q.when(Q.put(d.promise, 'a', 1), function (value) {
        ASSERT.fail('Unxpeced to set a property `a` on `undefined`:' + value);
        done();
    }, function (reason) {
        ASSERT.pass(reason);
        done();
    });
    d.resolve();
};

exports['test post resolved'] = function (ASSERT, done) {
    var d = Q.defer();
    var value = {
        _a: null,
        a: function a(value) {
            this._a = value;
            return 1 + value;
        }
    };

    Q.when(Q.post(d.promise, 'a', [1]), function (result) {
        ASSERT.equal(result, 2, 'correct value is returned by post');
        ASSERT.equal(value._a, 1, 'post invoked function as expected');
        done();
    }, function (reason) {
        ASSERT.fail(reason);
        done();
    });
    d.resolve(value);
};

exports['test post on undefined method'] = function (ASSERT, done) {
    var d = Q.defer();
    var value = {};

    Q.when(Q.post(d.promise, 'a', [1]), function (result) {
        ASSERT.fail('Unxpeced to call non-existing method:' + result);
        done();
    }, function (reason) {
        ASSERT.pass(reason);
        done();
    });
    d.resolve(value);
};

exports['test post on method of undefined'] = function (ASSERT, done) {
    var d = Q.defer();

    Q.when(Q.post(d.promise, 'a', [1]), function (result) {
        ASSERT.fail('Unxpeced to call non-existing method:' + result);
        done();
    }, function (reason) {
        ASSERT.pass(reason);
        done();
    });
    d.resolve();
};

exports['test delete resolved'] = function (ASSERT, done) {
    var d = Q.defer();
    var value = { a: {} }

    Q.when(Q.del(d.promise, 'a'), function (result) {
        ASSERT.ok(result, 'delete returned `true`');
        ASSERT.ok(!('a' in value), 'property was deleted');
        done();
    }, function (reason) {
        ASSERT.fail(reason);
        done();
    });

    d.resolve(value);
};

exports['test delete rejected'] = function (ASSERT, done) {
    var d = Q.defer();
    Q.when(Q.del(d.promise, 'a'), function (result) {
        ASSERT.fail('Unxpeced to success deleting property on `undefined`');
        done();
    }, function (reason) {
        ASSERT.pass(reason);
        done();
    });

    d.resolve();
};

if (module == require.main)
    require('test').run(exports)
