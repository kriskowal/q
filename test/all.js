'use strict'

exports['test valueOf, isPromise, isResolved'] = require('./value-of');
exports['test reject'] = require('./reject');
exports['test rosolve & reject'] = require('./resolve-reject');
exports['test chains of promises'] = require('./promised-chains');
exports['test multiple listeners'] = require('./multiple-listeners');
exports['test methods'] = require('./methods');
exports['test thenable'] = require('./thenable');

exports['test GH issue 9'] = require('./issue/9');
exports['test GH issue 22'] = require('./issue/22');

if (module == require.main) {
    require('test').run(exports);
}
