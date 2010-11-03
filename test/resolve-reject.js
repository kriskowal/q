'use strict'

var Q = require('q')

exports['test `when` with non-promise'] = function(assert, done) {
  var nextTurn = false
  Q.when
  ( 'test'
  , function(value) {
      assert.equal(value, 'test', 'value resoved as expected')
      assert.ok(nextTurn, 'callback is called in next turn of event loop')
      done()
    }
  , function(reason) {
      assert.fail('promise got rejected with reason: ' + reason)
      done()
    }
  )
  nextTurn = true
}

exports['test promise resolution'] = function(assert, done) {
  var nextTurn = false
  ,   deferred = Q.defer()
  Q.when
  ( deferred.promise
  , function(value) {
      assert.equal(value, 3, 'promise fullfilled correctly: `3`')
      assert.ok(nextTurn, 'callback is called in next turn of event loop')
      done()
    }
  , function(reason) {
      assert.fail('promise got rejected with reason: ' + reason)
      done()
    }
  )
  deferred.resolve(3)
  nextTurn = true
}

exports['test promise rejection'] = function(assert, done) {
  var nextTurn = false
  ,   deferred = Q.defer()
  ,   error = new Error('Boom !!')

  Q.when
  ( deferred.promise
  , function(value) {
      assert.fail('resolve callback was called on rejected promise')
      done()
    }
  , function(reason) {
      assert.ok(nextTurn, 'callback is called in next turn of event loop')
      assert.equal(reason, error, 'rejection reason is correct')
      done()
    }
  )
  deferred.reject(error)
  nextTurn = true
}

exports['test resolve/reject resoved promise'] = function(assert, done) {
  var nextTurn = false
  , deferred = Q.defer()
  , resolution = {}

  Q.when
  ( deferred.promise
  , function(value) {
      assert.ok(nextTurn, 'callback is called in next turn of event loop')
      assert.equal(value, resolution, 'resolved as expected')
      done()
    }
  , function(reason) {
      assert.ok(nextTurn, 'callback is called in next turn of event loop')
      assert.equal(reason, error, 'rejection reason is correct')
      done()
    }
  )

  deferred.resolve(resolution)
  // all the following resolve / rejects are ignored
  deferred.resolve(3)
  deferred.reject('die!')

  nextTurn = true
}

exports['test resolve/reject rejected promise'] = function(assert, done) {
  var nextTurn = false
  , deferred = Q.defer()
  , error = new Error('Boom !!')

  Q.when
  ( deferred.promise
  , function(value) {
      assert.fail('resolve callback was called on rejected promise')
      done()
    }
  , function(reason) {
      assert.ok(nextTurn, 'callback is called in next turn of event loop')
      assert.equal(reason, error, 'rejection reason is correct')
      done()
    }
  )
  deferred.reject(error)
  // all the following resolve / rejects are ignored
  deferred.resolve('taram!')
  deferred.reject('die!')

  nextTurn = true
}

if (module == require.main) require('test').run(exports)
