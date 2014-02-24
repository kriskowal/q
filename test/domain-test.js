
var Q = require("../q");

var domain;
// using (require) instead of require tricks the browser-side dependency
// analysis heuristic into not recognizing the dependency.
try {
    domain = (require)("domain");
} catch (e) {
    return;
}

var EventEmitter = (require)("events").EventEmitter;

// TODO for some reason, these specs, although they pass, cause all subsequent
// specs to fail.
describe("node domain support", function () {
    var d;

    beforeEach(function () {
        d = domain.create();
    });
    afterEach(function() {
        d.exit();
        d.dispose();
    });

    it("works for non-promise async inside a promise handler", function (done) {
        var error = new Error("should be caught by the domain");

        d.run(function () {
            Q().then(function () {
                setTimeout(function () {
                    throw error;
                }, 10);
            });
        });

        var errorTimeout = setTimeout(function () {
            done(new Error("Wasn't caught"));
        }, 100);

        d.on("error", function (theError) {
            expect(theError).toBe(error);
            clearTimeout(errorTimeout);
            done();
        });
    });

    it("transfers errors from `done` into the domain", function (done) {
        var error = new Error("should be caught by the domain");

        d.run(function () {
            Q.reject(error).done();
        });

        var errorTimeout = setTimeout(function () {
            done(new Error("Wasn't caught"));
        }, 100);

        d.on("error", function (theError) {
            expect(theError).toBe(error);
            clearTimeout(errorTimeout);
            done();
        });
    });

    it("should take care of re-used event emitters", function (done) {
        // See discussion in https://github.com/kriskowal/q/issues/120
        var error = new Error("should be caught by the domain");

        var e = new EventEmitter();

        d.run(function () {
            callAsync().done();
        });
        setTimeout(function () {
            e.emit("beep");
        }, 100);

        var errorTimeout = setTimeout(function () {
            done(new Error("Wasn't caught"));
        }, 500);

        d.on("error", function (theError) {
            expect(theError).toBe(error);
            clearTimeout(errorTimeout);
            done();
        });

        function callAsync() {
            var def = Q.defer();
            e.once("beep", function () {
                def.reject(error);
            });
            return def.promise;
        }
    });

});

