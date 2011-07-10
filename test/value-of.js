
var Q = require('../q');

exports['test defer'] = function (ASSERT) {
    var d = Q.defer();
    ASSERT.ok(!Q.isResolved(d.promise), 'not resolved');
    d.resolve();
    ASSERT.ok(Q.isResolved(d.promise), 'resolved');
};

exports['test defer defer'] = function (ASSERT) {
    var d = Q.defer();
    ASSERT.ok(!Q.isResolved(d.promise), 'not resolved');
    var d2 = Q.defer();
    d.resolve(d2.promise);
    ASSERT.ok(!Q.isResolved(d.promise), 'not resolved');
    d2.resolve();
    ASSERT.ok(Q.isResolved(d.promise), 'resolved');
};

exports['test ref undefined'] = function (ASSERT) {
    var r = Q.ref();
    ASSERT.ok(Q.isResolved(r), 'isResolved');
    ASSERT.equal(r.valueOf(), undefined, 'valueOf');
};

exports['test ref defined'] = function (ASSERT) {
    var o = {};
    var r = Q.ref(o);
    ASSERT.ok(Q.isResolved(r), 'isResolved');
    ASSERT.ok(r.valueOf() === o, 'valueOf');
};

if (module == require.main)
    require('test').run(exports)

