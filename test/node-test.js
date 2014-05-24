
var Q = require("../q");

describe("node support", function () {

    var exception = new Error("That is not your favorite color.");

    var obj = {
        method: function (a, b, c, callback) {
            callback(null, a + b + c);
        },
        thispChecker: function (callback) {
            callback(null, this === obj);
        },
        errorCallbacker: function (a, b, c, callback) {
            callback(exception);
        },
        errorThrower: function () {
            throw exception;
        }
    };

    describe("nfapply", function () {

        it("fulfills with callback result", function (done) {
            Q.nfapply(function (a, b, c, callback) {
                callback(null, a + b + c);
            }, [1, 2, 3])
            .then(function (sum) {
                expect(sum).toBe(6);
            })
            .done(done, done);
        });

        it("rejects with callback error", function (done) {
            var exception = new Error("That is not your favorite color.");
            Q.nfapply(function (a, b, c, callback) {
                callback(exception);
            }, [1, 2, 3])
            .then(function () {
                expect(true).toBe(false);
            }, function (_exception) {
                expect(_exception).toBe(exception);
            })
            .done(done, done);
        });

    });

    describe("nfcall", function () {

        it("fulfills with callback result", function (done) {
            Q.nfcall(function (a, b, c, callback) {
                callback(null, a + b + c);
            }, 1, 2, 3)
            .then(function (sum) {
                expect(sum).toBe(6);
            })
            .done(done, done);
        });

        it("rejects with callback error", function (done) {
            var exception = new Error("That is not your favorite color.");
            Q.nfcall(function (a, b, c, callback) {
                callback(exception);
            }, 1, 2, 3)
            .then(function () {
                expect(true).toBe(false);
            }, function (_exception) {
                expect(_exception).toBe(exception);
            })
            .done(done, done);
        });

    });

    describe("nfbind", function () {

        it("mixes partial application with complete application", function (done) {
            Q.nfbind(function (a, b, c, d, callback) {
                callback(null, a + b + c + d);
            }, 1, 2).call({}, 3, 4)
            .then(function (ten) {
                expect(ten).toBe(10);
            })
            .done(done, done);
        });

    });

    describe("nbind", function () {

        it("binds this, and mixes partial application with complete application", function (done) {
            return Q.nbind(function (a, b, c, callback) {
                callback(null, this + a + b + c);
            }, 1, 2).call(3 /* effectively ignored as fn bound to 1 */, 4, 5)
            .then(function (twelve) {
                expect(twelve).toBe(12);
            })
            .done(done, done);
        });

        it("second arg binds this", function (done) {
            var expectedThis = { test: null };
            Q.nbind(function(callback) {
                callback(null, this);
            }, expectedThis).call()
            .then(function(actualThis) {
                expect(actualThis).toBe(expectedThis);
            })
            .done(done, done);
        });

    });

    describe("npost", function () {

        it("fulfills with callback result", function (done) {
            Q.npost(obj, "method", [1, 2, 3])
            .then(function (sum) {
                expect(sum).toBe(6);
            })
            .done(done, done);
        });

        it("gets the correct thisp", function (done) {
            return Q.npost(obj, "thispChecker", [])
            .then(function (result) {
                expect(result).toBe(true);
            })
            .done(done, done);
        });

        it("rejects with callback error", function (done) {
            return Q.npost(obj, "errorCallbacker", [1, 2, 3])
            .then(function () {
                expect("blue").toBe("no, yellow!");
            }, function (_exception) {
                expect(_exception).toBe(exception);
            })
            .done(done, done);
        });

        it("rejects with thrown error", function (done) {
            return Q.npost(obj, "errorThrower", [1, 2, 3])
            .then(function () {
                expect(true).toBe(false);
            }, function (_exception) {
                expect(_exception).toBe(exception);
            })
            .done(done, done);
        });

        it("works on promises for objects with Node methods", function (done) {
            return Q.npost(obj, "method", [1, 2, 3])
            .then(function (sum) {
                expect(sum).toBe(6);
            })
            .done(done, done);
        });

    });

    describe("ninvoke", function () {

        it("fulfills with callback result", function (done) {
            Q.ninvoke(obj, "method", 1, 2, 3)
            .then(function (sum) {
                expect(sum).toBe(6);
            })
            .done(done, done);
        });

        it("gets the correct thisp", function (done) {
            Q.ninvoke(obj, "thispChecker")
            .then(function (result) {
                expect(result).toBe(true);
            })
            .done(done, done);
        });

        it("rejects with callback error", function (done) {
            Q.ninvoke(obj, "errorCallbacker", 1, 2, 3)
            .then(function () {
                expect("blue").toBe("no, yellow!");
            }, function (_exception) {
                expect(_exception).toBe(exception);
            })
            .done(done, done);
        });

        it("rejects with thrown error", function (done) {
            Q.ninvoke(obj, "errorThrower", 1, 2, 3)
            .then(function () {
                expect(true).toBe(false);
            }, function (_exception) {
                expect(_exception).toBe(exception);
            })
            .done(done, done);
        });

        it("works on promises for objects with Node methods", function (done) {
            Q.ninvoke(obj, "method", 1, 2, 3)
            .then(function (sum) {
                expect(sum).toBe(6);
            })
            .done(done, done);
        });

    });

    describe("deferred.makeNodeResolver", function () {

        it("fulfills a promise with a single callback argument", function (done) {
            var deferred = Q.defer();
            var callback = deferred.makeNodeResolver();
            callback(null, 10);
            deferred.promise.then(function (value) {
                expect(value).toBe(10);
            })
            .done(done, done);
        });

        it("rejects a promise", function (done) {
            var deferred = Q.defer();
            var callback = deferred.makeNodeResolver();
            var exception = new Error("Holy Exception of Anitoch");
            callback(exception);
            deferred.promise.then(function () {
                expect(5).toBe(3);
            }, function (_exception) {
                expect(_exception).toBe(exception);
            })
            .done(done, done);
        });

    });

    describe("nodeify", function () {

        it("calls back with a resolution", function (done) {
            Q(10).nodeify(function (error, value) {
                expect(error).toBe(null);
                expect(value).toBe(10);
                done();
            });
        });

        it("calls back with an error", function (done) {
            Q.reject(10).nodeify(function (error, value) {
                expect(error).toBe(10);
                done();
            });
        });

        it("forwards a promise", function (done) {
            Q(10).nodeify().then(function (ten) {
                expect(ten).toBe(10);
            }).done(done, done);
        });

    });

});


