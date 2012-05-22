"use strict";

var Q = require('../../q');

exports['test only resolve or reject once'] = function (ASSERT, done) {
    function makePromiseCore() {
        function when(rejected) {
            return Q.reject(new Error("permanently unresolved"));
        }

        return {
            when: when
        };
    }

    function onResolved(value) {
        ASSERT.fail(new Error("Should not resolve when already rejected"));
    }

    function onRejected(value) {
        //wait for a few spins of the event loop to ensure not later resolved.
        var wait = Q.defer();
        setTimeout(function(){wait.resolve(true);}, 100);
        return wait.promise; 
    }

    var promise = Q.makePromise(makePromiseCore());
    promise.then(onResolved, onRejected).then(function(success){
        ASSERT.ok(success, 'Reject without then resolving, then handle the rejection');
        done();
    });
};

if (module == require.main) {
    require('test').run(exports);
}
