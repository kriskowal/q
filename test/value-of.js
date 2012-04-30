
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

exports['test resolve undefined'] = function (ASSERT) {
    var r = Q.resolve();
    ASSERT.ok(Q.isResolved(r), 'isResolved');
    ASSERT.equal(r.valueOf(), undefined, 'valueOf');
};

exports['test resolve defined'] = function (ASSERT) {
    var o = {};
    var r = Q.resolve(o);
    ASSERT.ok(Q.isResolved(r), 'isResolved');
    ASSERT.ok(r.valueOf() === o, 'valueOf');
};

if (module == require.main)
    require('test').run(exports)

