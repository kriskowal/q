"use strict";

var Q = require("../q");

exports['test transforms return into fulfill'] = function (ASSERT, done) {
    var returnVal = {};

    var bound = Q.fbind(function () {
        return returnVal;
    });

    var result = bound();

    result
    .then(function (val) {
        ASSERT.strictEqual(val, returnVal, "fulfilled with correct value");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done);
};

exports['test transforms throw into reject'] = function (ASSERT, done) {
    var throwMe = new Error("boo!");

    var bound = Q.fbind(function () {
        throw throwMe;
    });

    var result = bound();

    result
    .then(function (val) {
        ASSERT.ok(false, val);
    })
    .fail(function (reason) {
        ASSERT.strictEqual(reason, throwMe, "rejected with correct reason");
    })
    .fin(done);
};

exports['test passes through arguments'] = function (ASSERT, done) {
    var x = {};
    var y = {};

    var bound = Q.fbind(function (a, b) {
        ASSERT.strictEqual(a, x, "first argument correct");
        ASSERT.strictEqual(b, y, "second argument correct");
    });

    bound(x, y)
    .then(function () {
        ASSERT.ok(true, "fulfilled");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done);
};

exports['test combining bound and free arguments'] = function (ASSERT, done) {
    var x = {};
    var y = {};

    var bound = Q.fbind(function (a, b) {
        ASSERT.strictEqual(a, x, "first argument correct");
        ASSERT.strictEqual(b, y, "second argument correct");
    }, x);

    bound(y)
    .then(function () {
        ASSERT.ok(true, "fulfilled");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done);
};

exports['test uses existing context'] = function (ASSERT, done) {
    var bound = Q.fbind(function () {
        return this;
    });

    var expectedContext = (function () { return this; }).call();

    bound()
    .then(function (context) {
        ASSERT.strictEqual(context, expectedContext, "correct context");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done);
};

if (module == require.main) {
    require('test').run(exports);
}
