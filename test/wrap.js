"use strict";

var Q = require("../q");

exports['test wrap'] = function (ASSERT, done) {
    var subject = Q.wrap(function (deferred) {
        deferred.resolve(10);
    });
    subject()
    .then(function (value) {
        ASSERT.equal(value, 10, "wrap result");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done)
};

exports['test wrap rejected error'] = function (ASSERT, done) {
    var subject = Q.wrap(function (deferred) {
        deferred.reject("bad");
    });
    subject()
    .then(function (value) {
        ASSERT.ok(false, "wrap error forwarded");
    })
    .fail(function (reason) {
        ASSERT.equal(reason, "bad", "wrap error forwarded");
    })
    .fin(done)
};

exports['test wrap thrown error'] = function (ASSERT, done) {
    var subject = Q.wrap(function (deferred) {
        throw new Error("bad");
    });
    subject()
    .then(function (value) {
        ASSERT.ok(false, "wrap error forwarded");
    })
    .fail(function (reason) {
        ASSERT.equal(reason.message, "bad", "wrap error forwarded");
    })
    .fin(done)
};

exports['test wcall'] = function (ASSERT, done) {
    Q.wcall(function (deferred) {
        deferred.resolve(10);
    })
    .then(function (value) {
        ASSERT.equal(value, 10, "wcall result");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done)
};

if (module == require.main) {
    require('test').run(exports);
}

