
var Q = require("../q");

describe("pass", function () {

    getCurrentSuite().Expectation.prototype.toBePromise = function () {
        this.assert(Q.isPromise(this.value), ["expected", "to be a promise"], [this.value]);
    };

    it("invokes a method with a promised argument", function () {
        return Q({foo: function (x) {
            expect(x).toBePromise();
        }}).invoke("foo", Q(10));
    });

    it("calls a function with the resolution of a passed promise", function () {
        return Q(function (x) {
            expect(x).not.toBePromise();
            expect(x).toBe(10);
        }).call(null, Q(10).pass());
    });

    it("invokes a method with the resolution of a passed promise", function () {
        return Q({foo: function (x) {
            expect(this.foo).toBeDefined();
            expect(x).not.toBePromise();
            expect(x).toBe(10);
        }}).invoke("foo", Q(10).pass());
    });

});

