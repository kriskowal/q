
describe("defer and when", function () {

    it("resolve before when", function () {
        var turn = 0;
        var deferred = Q.defer();
        deferred.resolve(10);
        var promise = Q.when(deferred.promise, function (value) {
            expect(turn).toEqual(1);
            expect(value).toEqual(10);
        });
        turn++;
        return promise;
    });

    it("when before resolve", function () {
        var turn = 0;
        var deferred = Q.defer();
        var promise = deferred.promise.then(function (value) {
            expect(turn).toEqual(2);
            expect(value).toEqual(10);
            turn++;
        });
        Q.nextTick(function () {
            expect(turn).toEqual(1);
            deferred.resolve(10);
            turn++;
        });
        turn++;
        return promise;
    });

    it("resolves multiple observers", function (done) {
        var nextTurn = false;

        var resolution = 'Taram pam param!';
        var deferred = Q.defer();
        var count = 10;
        var i = 0;

        function resolve(value) {
            i++;
            expect(value).toBe(resolution);
            expect(nextTurn).toBe(true);
            if (i == count) {
                done();
            }
        }

        while (++i <= count) {
            Q.when(deferred.promise, resolve);
        }

        deferred.resolve(resolution);
        i = 0;
        nextTurn = true;
    });

    it("observers called even after throw", function () {
        var thew = false;
        var deferred = Q.defer();
        Q.when(deferred.promise, function () {
            threw = true;
            throw new Error("Wah-wah");
        });
        var promise = Q.when(deferred.promise, function (value) {
            expect(value).toEqual(10);
        }, function () {
            expect("not").toEqual("here");
        });
        deferred.resolve(10);
        return promise;
    });

});

describe("promises for objects", function () {

    describe("get", function () {

        it("fulfills a promise", function () {
            var deferred = Q.defer();
            deferred.resolve({a: 1});
            return deferred.promise.get("a")
            .then(function (a) {
                expect(a).toBe(1);
            });
        });

        it("propagates a rejection", function () {
            var exception = new Error("boo!");
            return Q.fcall(function () {
                throw exception;
            })
            .get("a")
            .then(function () {
                expect("be").toBe("not to be");
            }, function (_exception) {
                expect(_exception).toBe(exception);
            });
        });

    });

    describe("put", function () {

        it("fulfills a promise", function () {
            var object = {};
            return Q.resolve(object)
            .put('a', 1)
            .then(function (result) {
                expect(result).toBe(1); // not supported. may change in future version.
                expect(object.a).toBe(1);
            });
        });

        it("propagates a rejection", function () {
            var exception = new Error("Gah!");
            return Q.reject(exception)
            .put("a", 1)
            .then(function (result) {
                expect("frozen over").toBe("quite warm");
            }, function (_exception) {
                expect(_exception).toBe(exception);
            });
        });

    });

    describe("del", function () {

        it("fulfills a promise", function () {
            var object = {a: 10};
            return Q.fcall(function () {
                return object;
            })
            .del('a')
            .then(function (result) {
                expect('a' in object).toBe(false);
                expect(result).toBe(true); // not supported, may change
            }, function (exception) {
                expect("up").toBe("down");
            });
        });

        it("propagates a rejection", function () {
            var exception = new Error("hah-hah");
            return Q.fcall(function () {
                throw exception;
            })
            .del('a')
            .then(function () {
                expect(true).toBe(false);
            }, function (_exception) {
                expect(_exception).toBe(exception);
            });
        });

    });

    describe("post", function () {

        it("fulfills a promise", function () {
            var subject = {
                a: function a(value) {
                    this._a = value;
                    return 1 + value;
                }
            };
            return Q.when(Q.post(subject, 'a', [1]), function (two) {
                expect(subject._a).toBe(1);
                expect(two).toBe(2);
            });
        });

    });

    describe("invoke", function () {

        it("fulfills a promise", function () {
            var foo;
            var subject = {
                foo: function (_bar) {
                    return _bar;
                },
                bar: function (_foo, _bar) {
                    foo = _foo;
                    return this.foo(_bar);
                }
            };
            return Q.invoke(subject, 'bar', 1, 2)
            .then(function (two) {
                expect(foo).toEqual(1);
                expect(two).toEqual(2);
            });
        });

        it("is rejected for undefined method", function () {
            var subject = {};
            return Q.resolve(subject)
            .invoke('foo')
            .then(function () {
                expect("here").toEqual("not here");
            }, function (exception) {
            });
        });

        it("is rejected for undefined object", function () {
            return Q.resolve()
            .invoke('foo')
            .then(function () {
                expect("here").toEqual("not here");
            }, function (exception) {
            });
        });

    });

    describe("keys", function () {

        it("fulfills a promise", function () {
            return Q.keys({a: 10, b: 20})
            .then(function (keys) {
                expect(keys).toEqual(['a', 'b']);
            });
        });

    });

});

describe("promises for functions", function () {

    describe("fapply", function () {
        it("fulfills a promise using arguments", function () {
            return Q.resolve(function (a, b, c) {
                return a + b + c;
            })
            .fapply([1, 2, 3])
            .then(function (sum) {
                expect(sum).toEqual(6);
            });
        });
    });

    describe("fcall", function () {
        it("fulfills a promise using arguments", function () {
            return Q.resolve(function (a, b, c) {
                return a + b + c;
            })
            .fcall(1, 2, 3)
            .then(function (sum) {
                expect(sum).toEqual(6);
            });
        });
    });

    describe("fbind", function () {

        it("accepts a promise for a function", function () {
            return Q.fbind(Q.resolve(function (high, low) {
                return high - low;
            }))
            (2, 1)
            .then(function (difference) {
                expect(difference).toEqual(1);
            });
        });

        it("chains partial application on a promise for a function", function () {
            return Q.resolve(function (a, b) {
                return a * b;
            })
            .fbind(2)(3)
            .then(function (product) {
                expect(product).toEqual(6);
            });
        });

        it("returns a fulfilled promise", function () {
            var result = {};
            var bound = Q.fbind(function () {
                return result;
            });
            return bound()
            .then(function (_result) {
                expect(_result).toBe(result);
            });
        });

        it("returns a rejected promise from a thrown error", function () {
            var exception = new Error("Boo!");
            var bound = Q.fbind(function () {
                throw exception;
            });
            return bound()
            .then(function () {
                expect("flying pigs").toBe("swillin' pigs");
            }, function (_exception) {
                expect(_exception).toBe(exception);
            });
        });

        it("passes arguments through", function () {
            var x = {}, y = {};
            var bound = Q.fbind(function (a, b) {
                expect(a).toBe(x);
                expect(b).toBe(y);
            });
            return bound(x, y);
        });

        it("passes and also partially applies arguments", function () {
            var x = {}, y = {};
            var bound = Q.fbind(function (a, b) {
                expect(a).toBe(x);
                expect(b).toBe(y);
            }, x);
            return bound(y);
        });

    });

});

describe("valueOf", function () {

    it("of fulfillment", function () {
        expect(Q.resolve(10).valueOf()).toEqual(10);
    });

    it("of rejection", function () {
        var error = new Error("In your face.");
        var rejection = Q.reject(error);
        expect(rejection.valueOf()).toBe(rejection);
        expect(rejection.valueOf().exception).toBe(error);
    });

    it("of deferred", function () {
        var deferred = Q.defer();
        expect(deferred.promise.valueOf()).toBe(deferred.promise);
    });

    it("of deferred rejection", function () {
        var deferred = Q.defer();
        var error = new Error("Rejected!");
        var rejection = Q.reject(error);
        deferred.resolve(rejection);
        expect(deferred.promise.valueOf()).toBe(rejection);
        expect(deferred.promise.valueOf().exception).toBe(error);
    });

    it("of deferred fulfillment", function () {
        var deferred = Q.defer();
        deferred.resolve(10);
        expect(deferred.promise.valueOf()).toBe(10);
    });

    it("of deferred deferred", function () {
        var a = Q.defer();
        var b = Q.defer();
        a.resolve(b.promise);
        expect(a.promise.valueOf()).toBe(b.promise);
    });

});

describe("promise states", function () {

    it("of fulfilled value", function () {
        expect(Q.isFulfilled(void 0)).toBe(true);
        expect(Q.isRejected(false)).toBe(false);
        expect(Q.isResolved(true)).toBe(true);
    });

    it("of fulfillment", function () {
        var promise = Q.resolve(10);
        expect(Q.isFulfilled(promise)).toBe(true);
        expect(promise.isFulfilled()).toBe(true);
        expect(Q.isRejected(promise)).toBe(false);
        expect(promise.isRejected()).toBe(false);
        expect(Q.isResolved(promise)).toBe(true);
        expect(promise.isResolved()).toBe(true);
    });

    it("of rejection", function () {
        var error = new Error("Oh, snap.");
        var promise = Q.reject(error);
        expect(promise.isFulfilled()).toBe(false);
        expect(promise.isRejected()).toBe(true);
        expect(promise.isResolved()).toBe(true);
    });

    it("of deferred", function () {
        var deferred = Q.defer();
        var promise = deferred.promise;
        expect(promise.isFulfilled()).toBe(false);
        expect(promise.isRejected()).toBe(false);
        expect(promise.isResolved()).toBe(false);
    });

    it("of deferred rejection", function () {
        var deferred = Q.defer();
        var rejection = Q.reject(new Error("Rejected!"));
        deferred.resolve(rejection);
        var promise = deferred.promise;
        expect(promise.isFulfilled()).toBe(false);
        expect(promise.isRejected()).toBe(true);
        expect(promise.isResolved()).toBe(true);
    });

    it("of deferred fulfillment", function () {
        var deferred = Q.defer();
        deferred.resolve(10);
        var promise = deferred.promise;
        expect(promise.isFulfilled()).toBe(true);
        expect(promise.isRejected()).toBe(false);
        expect(promise.isResolved()).toBe(true);
    });

    it("of deferred deferred", function () {
        var a = Q.defer();
        var b = Q.defer();
        a.resolve(b.promise);
        var promise = a.promise;
        expect(promise.isFulfilled()).toBe(false);
        expect(promise.isRejected()).toBe(false);
        expect(promise.isResolved()).toBe(false);
    });
});

describe("propagation", function () {

    it("propagate through then with no callback", function () {
        return Q.resolve(10)
        .then()
        .then(function (ten) {
            expect(ten).toBe(10);
        });
    });

    it("propagate through then with modifying callback", function () {
        return Q.resolve(10)
        .then(function (ten) {
            return ten + 10;
        })
        .then(function (twen) {
            expect(twen).toBe(20);
        });
    });

    it("errback recovers from exception", function () {
        var error = new Error("Bah!");
        return Q.reject(error)
        .then(null, function (_error) {
            expect(_error).toBe(error);
            return 10;
        })
        .then(function (value) {
            expect(value).toBe(10);
        });
    });

    it("rejection propagates through then with no errback", function () {
        var error = new Error("Foolish mortals!");
        return Q.reject(error)
        .then()
        .then(null, function (_error) {
            expect(_error).toBe(error);
        });
    });

    it("rejection intercepted and rethrown", function () {
        var error = new Error("Foolish mortals!");
        var nextError = new Error("Silly humans!");
        return Q.reject(error)
        .fail(function () {
            throw nextError;
        })
        .then(null, function (_error) {
            expect(_error).toBe(nextError);
        });
    });

    it("resolution is forwarded through deferred promise", function () {
        var a = Q.defer();
        var b = Q.defer();
        a.resolve(b.promise);
        b.resolve(10);
        return a.promise.then(function (eh) {
            expect(eh).toEqual(10);
        });
    });

});

describe("all", function () {

    it("resolves after any constituent promise is rejected", function () {
        var toResolve = Q.defer(); // never resolve
        var toReject = Q.defer();
        var promises = [toResolve.promise, toReject.promise];
        var promise = Q.all(promises);

        toReject.reject(new Error("Rejected"));

        return Q.delay(250)
        .then(function () {
            expect(promise.isRejected()).toBe(true);
        })
        .timeout(1000);
    });

});

describe("allResolved", function () {

    it("normalizes all given values to promises", function () {
        return Q.allResolved([1, Q.resolve(2), Q.reject(3)])
        .then(function (promises) {
            expect(Q.isPromise(promises[0])).toBe(true);
            expect(Q.isPromise(promises[1])).toBe(true);
            expect(Q.isPromise(promises[2])).toBe(true);
        });
    });

    it("fulfillment even when one given promise is rejected", function () {
        return Q.allResolved([1, Q.resolve(2), Q.reject(3)])
        .then(null, function () {
            expect("flying pigs").toBe("flightless pigs");
        });
    });

    it("the state and quantity of promises to be correct", function () {
        return Q.allResolved([1, Q.resolve(2), Q.reject(3)])
        .then(function (promises) {
            expect(promises.length).toEqual(3);

            expect(Q.isPromise(promises[0])).toBe(true);
            expect(Q.isPromise(promises[1])).toBe(true);
            expect(Q.isPromise(promises[2])).toBe(true);

            expect(Q.isResolved(promises[0])).toBe(true);
            expect(Q.isResolved(promises[1])).toBe(true);
            expect(Q.isResolved(promises[2])).toBe(true);

            expect(Q.isFulfilled(promises[0])).toBe(true);
            expect(Q.isFulfilled(promises[1])).toBe(true);
            expect(Q.isRejected(promises[2])).toBe(true);

            expect(promises[0].valueOf()).toEqual(1);
            expect(promises[1].valueOf()).toEqual(2);
        });
    });

    it("is resolved after every constituent promise is resolved", function () {
        var toResolve = Q.defer();
        var toReject = Q.defer();
        var promises = [toResolve.promise, toReject.promise];
        var resolved;
        var rejected;

        Q.fcall(function () {
            toReject.reject();
            rejected = true;
        })
        .then(function () {
            toResolve.resolve();
            resolved = true;
        });

        return Q.allResolved(promises)
        .then(function (promises) {
            expect(resolved).toBe(true);
            expect(rejected).toBe(true);
        });
    });

});

describe("spread", function () {

    it("spreads values across arguments", function () {
        return Q.spread([1, 2, 3], function (a, b, c) {
            expect(b).toBe(2);
        });
    });

    it("spreads promises across arguments", function () {
        return Q.resolve([Q.resolve(10)])
        .spread(function (promise) {
            expect(Q.isPromise(promise)).toBe(true);
            expect(promise.valueOf()).toEqual(10);
        });
    });

});

describe("thenables", function () {

    it("assimilates a thenable with fulfillment with resolve", function () {
        return Q.resolve({
            then: function (resolved) {
                resolved(10);
            }
        })
        .then(function (ten) {
            expect(ten).toEqual(10);
        })
        .then(function (undefined) {
            expect(undefined).toEqual(void 0);
        });
    });

    it("flows fulfillment into a promise pipeline", function () {
        return Q.resolve({
            then: function (resolved) {
                resolved([10]);
            }
        })
        .get(0)
        .then(function (ten) {
            expect(ten).toEqual(10);
        });
    });

});

describe("node support", function () {

    describe("napply", function (done) {

        it("fulfills with callback result", function () {
            return Q.napply(function (a, b, c, callback) {
                callback(null, a + b + c);
            }, null, [1, 2, 3])
            .then(function (sum) {
                expect(sum).toEqual(6);
            });
        });

        it("gets the correct thisp", function () {
            var subject = {
                foo: function (callback) {
                    callback(null, subject === this);
                }
            };
            return Q.napply(subject.foo, subject, [])
            .then(function (result) {
                expect(result).toBe(true);
            });
        });

        it("rejects with callback error", function () {
            var exception = new Error("That is not your favorite color.");
            return Q.napply(function (a, b, c, callback) {
                callback(exception);
            }, null, [1, 2, 3])
            .then(function (sum) {
                expect("blue").toBe("no, yellow!");
            }, function (_exception) {
                expect(_exception).toBe(exception);
            });
        });

    });

    describe("ncall", function () {
        it("fulfills with callback result", function () {
            return Q.ncall(function (a, b, c, callback) {
                callback(null, a + b + c);
            }, null, 1, 2, 3)
            .then(function (sum) {
                expect(sum).toEqual(6);
            });
        });

        it("gets the correct thisp", function () {
            var subject = {
                foo: function (callback) {
                    callback(null, subject === this);
                }
            };
            return Q.ncall(subject.foo, subject)
            .then(function (result) {
                expect(result).toBe(true);
            });
        });

        it("rejects with callback error", function () {
            var exception = new Error("That is not your favorite color.");
            return Q.ncall(function (a, b, c, callback) {
                callback(exception);
            }, null, 1, 2, 3)
            .then(function (sum) {
                expect("blue").toBe("no, yellow!");
            }, function (_exception) {
                expect(_exception).toBe(exception);
            });
        });

    });

    describe("nbind", function () {

        it("gets the correct thisp", function () {
            var subject = {};
            return Q.nbind(function (callback) {
                callback(null, this);
            }, subject).call({})
            .then(function (_subject) {
                expect(_subject).toBe(subject);
            });
        });

        it("mixes partial application with complete application", function () {
            var subject = {};
            return Q.nbind(function (a, b, c, d, callback) {
                callback(null, a + b + c + d);
            }, subject, 1, 2).call({}, 3, 4)
            .then(function (ten) {
                expect(ten).toBe(10);
            });
        });

    });

    describe("deferred.makeNodeResolver", function () {

        it("fulfills a promise", function () {
            var deferred = Q.defer();
            var callback = deferred.makeNodeResolver();
            callback(null, 10);
            return deferred.promise.then(function (value) {
                expect(value).toBe(10);
            });
        });

        it("rejects a promise", function () {
            var deferred = Q.defer();
            var callback = deferred.makeNodeResolver();
            var exception = new Error("Holy Exception of Anitoch");
            callback(exception);
            return deferred.promise.then(function (value) {
                expect(5).toBe(3);
            }, function (_exception) {
                expect(_exception).toBe(exception);
            });
        });

    });

});

describe("possible regressions", function () {

    describe("gh-9", function () {
        it("treats falsy values as resolved values without error", function () {
            expect(Q.isResolved(null)).toEqual(true);
            expect(Q.isResolved(void 0)).toEqual(true);
            expect(Q.isResolved(false)).toEqual(true);
            expect(Q.isResolved()).toEqual(true);
        });
    });

    describe("gh-22", function () {
        it("ensures that the array prototype is intact", function () {
            var keys = [];
            for (var key in []) {
                keys.push(key);
            }
            expect(keys.length).toBe(0);
        });
    });

});

