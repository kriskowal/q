
var Q = require('q');

exports['test synchronous'] = function (ASSERT) {
    ASSERT.equal(Q.asap(1), 1, 'without callback');
    ASSERT.equal(Q.asap(1, function (i) {
        return i + 1;
    }), 2, 'with callback');

};

exports['test defer input'] = function (ASSERT, done) {
    var turn = 0;
    var r;
    var d = Q.defer();
    var p = Q.asap(d.promise, function (i) {

        Q.enqueue(function () {
            ASSERT.equal(++turn, 3, 'third turn');
            ASSERT.ok(r, 'third turn must occur after second turn');
            ASSERT.ok(Q.isResolved(d.promise), 'input resolved');
            ASSERT.ok(Q.isResolved(p), 'output resolved');
            ASSERT.equal(p.valueOf(), 2, 'output value');
        });

        ASSERT.equal(++turn, 2, 'second turn');
        ASSERT.equal(i, 1, 'input resolved and near value provided');
        r = true;
        return i + 1;
    });

    ASSERT.equal(++turn, 1, 'first turn');
    ASSERT.ok(!Q.isResolved(d.promise), 'input not yet resolved');
    ASSERT.ok(!Q.isResolved(p), 'output not yet resolved');
    ASSERT.ok(!r, 'second turn should not begin before input resolution');
    d.resolve(1);
    ASSERT.ok(!r, 'second turn should not begin before completion of first turn');

    Q.when(p, function (p) {
        ASSERT.equal(++turn, 4, 'fourth turn');
        ASSERT.ok(Q.isResolved(d.promise), 'input resolved');
        ASSERT.ok(Q.isResolved(p), 'output resolved');
        ASSERT.equal(p, 2, 'output provided');
        done();
    });
};

exports['test defer output'] = function (ASSERT, done) {

    var step = 0;
    var r;
    var p = Q.asap(1, function (i) {
        r = true;

        // first turn
        ASSERT.equal(++step, 1, 'first step');
        var d = Q.defer();
        ASSERT.ok(p === undefined, 'output not yet assigned');
        Q.enqueue(function () {
            ASSERT.equal(++step, 3, 'third step');
            ASSERT.ok(p.valueOf() !== undefined, 'output assigned');
            d.resolve(i + 1);
            ASSERT.ok(Q.isResolved(d.promise), 'output resolved');
        });

        return d.promise;
    });

    // first turn
    ASSERT.equal(++step, 2, 'second step');
    ASSERT.ok(!Q.isResolved(p), 'output not resolved');
    ASSERT.equal(r, true, 'asap ran immediatley');

    Q.when(p, function (p) {
        // third turn
        ASSERT.equal(++step, 4, 'fourth step');
        ASSERT.equal(p, 2, 'output resolved and provided');
        done();
    });
};

if (module == require.main)
    require('test').run(exports)

