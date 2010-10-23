'use strict'

var Q = require('q')

function Rejector(expect, assert, done, asserts) {
  return function rejectionCallback(reason) {
    if (asserts) asserts()
    assert[expected ? 'pass' : 'fail']('promise rejected: ' + reason)
    if (done) done()
  }
}

exports['test chained resolution'] = function(assert, done) {
  var nextTurn = false
  ,   resolved = false
  ,   resolution = 'Taram pam param!'
  ,   reject = Rejector(false, assert, done)
  ,   deferred = Q.defer()
  
  Q.when
  ( Q.when(deferred.promise, function() { resoved = true }, reject)
  , function(value) {
      assert.equal(value, resolution, 'value resoved as expected')
      assert.ok(nextTurn, 'callback is called in next turn of event loop')
      done()
    }
  , reject
  )

  deferred.resolve(resolution)
  nextTurn = true
}

exports['test chained rejection'] = function(assert, done) {
  var nextTurn = false
  ,   rejected = false
  ,   rejection = 'Oops!'
  ,   deferred = Q.defer()

  Q.when
  ( Q.when
    ( deferred.promise
    , function(value) {
         assert.fail('promise must not be resolved: `' + value + '`')
      }
    , function(reason) {
        assert.equal(reason, rejection, 'promise rejected as expected')
        rejected = true
      }
    )
  , function(value) {
      assert.fail('chained promise must not be resolved: `' + value + '`')
      done()
    }
  , function(reason) {
      assert.ok(nextTurn, 'callback is called in next turn of event loop')
      assert.ok(rejected, 'previous promise in chain was rejected')
      assert.equal(reason, rejection, 'chaind promise rejectd with same reason')
      done()
    }
  )

  deferred.reject(rejection)
  nextTurn = true
}

if (module == require.main) require('test').run(exports)
