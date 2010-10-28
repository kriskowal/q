'use strict'

exports['test rosolve & reject'] = require('./resolve-reject')
exports['test chains of promises'] = require('./promised-chains')
exports['test multiple listeners'] = require('./multiple-listeners')

if (module == require.main) require('test').run(exports)
