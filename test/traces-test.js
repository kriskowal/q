
var Queue = require("../queue");
var Q = require("../q");

describe("stack trace formatting", function () {

    it("doesn't mangle a stack trace that gets handled twice", function (done) {
        if (!new Error("").stack) {
            return done();
        }

        Q.onerror = function (err) {
            captured.put(err.stack);
        };

        var d1 = Q.defer();
        var d2 = Q.defer();
        var captured = new Queue();
        d1.promise.done();
        d2.promise.done();

        var error = new Error("boom!");
        d1.reject(error);
        d2.reject(error);

        var a = captured.get();
        var b = captured.get();

        Q.spread([a, b], function (a, b) {
            expect(a).not.toBe(undefined);
            expect(a).toBe(b);
        })
        .done(done, done);
    });

});

