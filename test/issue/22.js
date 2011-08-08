
var Q = require('../../q');

exports['test'] = function (ASSERT) {

    // make sure Array.prototype is intact
    var keys = [];
    for (item in []) {
        keys.push(item);
    }
    ASSERT.deepEqual(keys, [], 'no unexpected items in Array.prototype');
};

if (module == require.main) {
    require('test').run(exports);
}
