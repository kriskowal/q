
var Q = require("../q");
var REASON = "this is not an error, but it might show up in the console";

describe("gh-9", function () {
    it("treats falsy values as resolved values without error", function () {
        expect(Q(null).isPending()).toBe(false);
        expect(Q(void 0).isPending()).toBe(false);
        expect(Q(false).isPending()).toBe(false);
        expect(Q().isPending()).toBe(false);
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

describe("gh-73", function () {
    it("does not choke on non-error rejection reasons", function (done) {
        Q.onerror = function (error) {
            expect(error).toBe(REASON);
            deferred.resolve();
        };

        Q.reject(REASON).done();

        var deferred = Q.defer();

        Q.delay(10).then(deferred.reject);

        deferred.promise.done(done, done);
    });
});

describe("gh-90", function () {
    it("does not choke on rejection reasons with an undefined `stack`", function (done) {
        Q.onerror = function (theError) {
            expect(theError).toBe(error);
            deferred.resolve();
        };

        var error = new RangeError(REASON);
        error.stack = undefined;
        Q.reject(error).done();

        var deferred = Q.defer();

        Q.delay(10).then(deferred.reject);

        deferred.promise.done(done, done);
    });
});

describe("gh-75", function () {
    it("does not double-resolve misbehaved promises", function (done) {
        var badPromise = new Q.Promise({
            dispatch: function (resolve) {
                if (resolve) {
                    resolve();
                }
            },
            inspect: function () {
                return null;
            }
        });

        var resolutions = 0;
        function onResolution() {
            ++resolutions;
        }

        badPromise.then(onResolution, onResolution).then(function () {
            expect(resolutions).toBe(1);
        })
        .done(done, done);
    });
});

