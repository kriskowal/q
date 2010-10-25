'use strict'

var Q = require('q')

exports['test all listenners are called'] = function(assert, done) {
  var nextTurn = false
  ,   resolution = 'Taram pam param!'
  ,   deferred = Q.defer()
  ,   n = 10
  ,   i = 0
  
  function resolved(value) {
    i ++
    assert.equal(value, resolution, 'value resoved as expected: #' + i)
    assert.ok(nextTurn, 'callback is called in next turn of event loop: #' + i)
    if (n == i) done()
  }

  while (++i <= n) Q.when(deferred.promise, resolved)

  deferred.resolve(resolution)
  i = 0
  nextTurn = true
}

exports['test listeners called event after throw'] = function(assert, done) {
  var threw = false
  ,   deferred = Q.defer()

  Q.when(deferred.promise, function() {
    throw new Error(threw = true)
  })
  Q.when(deferred.promise, function() {
    assert.ok(threw, 'listener is called even if previos threw exception')
    done()
  })
  
  deferred.resolve(1)
}
exports['test listeners are called in same turn'] = function(assert, done) {
  var deferred = Q.defer()
  ,   n = 1000
  ,   i = 0

  function resolved() { i++ }

  Q.when(deferred.promise, function() {
    setTimeout(function() {
      assert.equal(i, n, 'all the listeners must be called in the same turn')
      done()
    }, 0)
  })

  while (++i <= n) Q.when(deferred.promise, resolved)

  deferred.resolve(i = 0)
}


if (module == require.main) require('test').run(exports)
