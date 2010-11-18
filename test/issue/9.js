
var Q = require('q');

exports['test'] = function (ASSERT) {
    ASSERT.ok(Q.isResolved(null), 'null is a fully resolved value');
    ASSERT.ok(Q.isResolved(undefined), 'undefiend is a fully resolved value');
    ASSERT.ok(Q.isResolved(false), 'false is a fully resolved value');
    ASSERT.ok(Q.isResolved(), 'omitted argument is a fully resolved value');
};

if (module == require.main)
    require('test').run(exports)

