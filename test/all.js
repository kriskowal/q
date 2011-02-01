'use strict'

exports['test valueOf, isPromise, isResolved'] = require('./value-of');
exports['test reject'] = require('./reject');
exports['test asap'] = require('./asap');
exports['test rosolve & reject'] = require('./resolve-reject')
exports['test chains of promises'] = require('./promised-chains')
exports['test multiple listeners'] = require('./multiple-listeners')
exports['test methods'] = require('./methods')
exports['test thenable'] = require('./thenable')
exports['test util'] = require('./util/all');

if (module == require.main)
    require('test').run(exports)

