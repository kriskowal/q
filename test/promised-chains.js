'use strict'

var Q = require('q')

function Callback(expect, assert, done, asserts) {
  return function generatedCallback(reason) {
    if (asserts) asserts()
    assert[expect ? 'pass' : 'fail']('promise rejected: ' + reason)
    if (done) done()
  }
}

exports['test resolution propagates through chain'] = function(assert, done) {
  var nextTurn = false
  ,   resolved = false
  ,   resolution = 'Taram pam param!'
  ,   reject = Callback(false, assert, done)
  ,   deferred = Q.defer()
  
  Q.when
  ( Q.when
    ( deferred.promise
    , function(value) {
        resolved = true
        return value
      }
    , reject
    )
  , function(value) {
      assert.equal(value, resolution, 'value resolved as expected')
      assert.ok(nextTurn, 'callback is called in next turn of event loop')
      done()
    }
  , reject
  )

  deferred.resolve(resolution)
  nextTurn = true
}

exports['test rejection propagates through chain'] = function(assert, done) {
  var nextTurn = false
  ,   rejected = false
  ,   rejection = 'Oops!'
  ,   deferred = Q.defer()

  Q.when
  ( Q.when
    ( deferred.promise
    , function(value) {
         assert.fail('promise must not be resolved: `' + value + '`')
         return value
      }
    , function(reason) {
        assert.equal(reason, rejection, 'promise rejected as expected')
        rejected = true
        return Q.reject(reason)
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

exports['test resolution is delegated through chain'] = function(assert, done) {
  var d1 = Q.defer()
  ,   d2 = Q.defer()
  ,   r1 = false
  ,   v1 = 1
  ,   v2 = 2
  ,   reject = Callback(true, assert, done)

  var p3 = Q.when
  ( d1.promise
  , function resolved(v) {
      assert.equal(r1, false, 'promises#1 was not resolved yet')
      assert.equal(v, v1, 'promise#1 resolved as expected')
      r1 = true
      d2.resolve(v2)
      return d2.promise
    }
  , reject
  )

  Q.when
  ( p3
  , function resolved(v) {
      assert.ok(r1, 'promise#1 is resolved')
      assert.equal(v, v2, 'promise#2 delegates resolution to promise#3')
      done()
    }
  , reject
  )

  d1.resolve(v1)
}

exports['test rejection is delegated through chain'] = function(assert, done) {
  var d1 = Q.defer()
  ,   v1 = 1
  ,   resolve = Callback(true, assert)

  var p2 = Q.when
  ( d1.promise
  , resolve
  )

  Q.when
  ( p2
  , resolve
  , function rejected(v) {
      assert.equal(v, v1, 'promise#1 delegates rejection')
      done()
    }
  )

  d1.reject(v1)
}

if (module == require.main) require('test').run(exports)
