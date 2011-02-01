
exports['test deep'] = require('./deep');

if (module == require.main)
    require('test').run(exports)

