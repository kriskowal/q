"use strict";

var Q = require("../q");
var FS = require("fs"); // node

exports['test nbind (no arguments)'] = function (ASSERT, done) {
    var readFile = Q.nbind(FS.readFile);
    readFile(module.path || __filename, 'utf-8')
    .then(function (content) {
        ASSERT.equal(typeof content, "string", "readFile content");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done)
};

exports['test nbind (thisp only)'] = function (ASSERT, done) {
    var that = {};
    var artificial = Q.nbind(function (callback) {
        callback(void 0, this);
    }, that);
    artificial()
    .then(function (result) {
        ASSERT.strictEqual(that, result, "this bound properly");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done)
};

exports['test nbind (thisp plus arguments)'] = function (ASSERT, done) {
    var artificial = Q.nbind(function (value, callback) {
        callback(void 0, value);
    }, void 0, 10);
    artificial()
    .then(function (result) {
        ASSERT.strictEqual(result, 10, "value partially applied");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done)
};

exports['test nbind error'] = function (ASSERT, done) {
    var artificial = Q.nbind(function (callback) {
        callback(new Error("bad"));
    });
    artificial()
    .then(function (result) {
        ASSERT.ok(false, "error forwarded");
    })
    .fail(function (reason) {
        ASSERT.strictEqual(reason.message, "bad", "error forwarded");
    })
    .fin(done)
};

exports['test ncall'] = function (ASSERT, done) {
    Q.ncall(FS.readFile, FS, module.path || __filename, 'utf-8')
    .then(function (content) {
        ASSERT.equal(typeof content, "string", "readFile content");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done)
};

exports['test napply'] = function (ASSERT, done) {
    Q.napply(FS.readFile, FS, [module.path || __filename, 'utf-8'])
    .then(function (content) {
        ASSERT.equal(typeof content, "string", "readFile content");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done)
};

if (module == require.main) {
    require('test').run(exports);
}

