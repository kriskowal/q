"use strict";

var Q = require("../q");
var FS = require("fs"); // node

exports['test node'] = function (ASSERT, done) {
    var readFile = Q.node(FS.readFile);
    readFile(module.path || __filename, 'utf-8')
    .then(function (content) {
        ASSERT.equal(typeof content, "string", "readFile content");
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
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

exports['test node bind'] = function (ASSERT, done) {
    var that = {};
    var artificial = Q.node(function (callback) {
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

exports['test node bind partial apply'] = function (ASSERT, done) {
    var artificial = Q.node(function (value, callback) {
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

exports['test node error'] = function (ASSERT, done) {
    var artificial = Q.node(function (callback) {
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

if (module == require.main) {
    require('test').run(exports);
}

