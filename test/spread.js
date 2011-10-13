"use strict";

var Q = require("../q");

exports['test spread'] = function (ASSERT, done) {
    Q.ref([1,2,3])
    .spread(function (a, b, c) {
        ASSERT.equal(a, 1, 'spread 1');
        ASSERT.equal(b, 2, 'spread 2');
        ASSERT.equal(c, 3, 'spread 3');
        ASSERT.equal(arguments.length, 3, 'spread arguments length');
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done)
};

exports['test spread all'] = function (ASSERT, done) {
    Q.ref([1,2,3].map(Q.ref))
    .all()
    .spread(function (a, b, c) {
        ASSERT.equal(a, 1, 'spread 1');
        ASSERT.equal(b, 2, 'spread 2');
        ASSERT.equal(c, 3, 'spread 3');
        ASSERT.equal(arguments.length, 3, 'spread arguments length');
    })
    .fail(function (reason) {
        ASSERT.ok(false, reason);
    })
    .fin(done)
};

if (module == require.main) {
    require('test').run(exports);
}

