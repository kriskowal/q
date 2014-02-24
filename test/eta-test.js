"use strict";

var Q = require("../q");
var asap = require("asap");

describe("estimate", function () {

    it("a deferred assumes never fulfilled", function (done) {
        var deferred = Q.defer();
        expect(deferred.promise.getEstimate()).toBe(Infinity);
        deferred.promise.observeEstimate(function (estimate) {
            expect(estimate).toBe(Infinity);
            done();
        });
    });

    it("a deferred's estimate can be updated", function (done) {
        var deferred = Q.defer();
        var now = Date.now();
        deferred.promise.observeEstimate(function (estimate) {
            expect(estimate).toBe(now + 2000)
            done();
        });
        expect(deferred.promise.getEstimate()).toBe(Infinity);
        deferred.setEstimate(now + 1000);
        expect(deferred.promise.getEstimate()).toBe(now + 1000);
        deferred.setEstimate(now + 2000);
        expect(deferred.promise.getEstimate()).toBe(now + 2000);
    });

    it("a deferred's estimate becomes the estimate of the resolution", function () {
        var d1 = Q.defer();
        var d2 = Q.defer();
        var now = Date.now();

        expect(d1.promise.getEstimate()).toBe(Infinity);
        d1.setEstimate(now + 1000);
        expect(d1.promise.getEstimate()).toBe(now + 1000);

        expect(d2.promise.getEstimate()).toBe(Infinity);
        d2.resolve(d1.promise);
        expect(d2.promise.getEstimate()).toBe(now + 1000);
    });

    it("a deferred's new estimate is observable upon resolution", function (done) {
        var d1 = Q.defer();
        var d2 = Q.defer();
        var now = Date.now();

        d2.promise.observeEstimate(function (estimate) {
            expect(estimate).toBe(now + 1000);
            done();
        });

        d1.setEstimate(now + 1000);
        d2.resolve(d1.promise);
    });

    it("interprets invalid estimates as forever", function () {
        var deferred = Q.defer();
        deferred.setEstimate({});
        expect(deferred.promise.getEstimate()).toBe(Infinity);
        deferred.setEstimate(NaN);
        expect(deferred.promise.getEstimate()).toBe(Infinity);
    });

    describe("then", function () {

        it("gives the returned promise an estimate equivalent to this promise" +
           " plus the estimated duration of the fulfillment handler",
        function () {
            var thisDeferred = Q.defer();
            var now = Date.now();
            // thisDeferred should be done immediately
            thisDeferred.setEstimate(now);
            // And the fulfillment handler (although nonsensically missing) is
            // expected to take one more second.
            var thenPromise = thisDeferred.promise.then(null, null, 1000);
            // So the composite time to completion should be one second from
            // now.
            expect(thenPromise.getEstimate()).toBe(now + 1000);
            // But we don't go through the exercise of resolving thisPromise as
            // it is beyond the scope of this test. If we did, the time to
            // completion would be almost instantaneous since neither
            // thisPromise or thenPromise take any time at all.
        });

        it("forwards the estimate of the promise returned by the fulfillment " +
           "handler once it governs the returned promise",
        function (done) {
            var now = Date.now();

            // The ETA of thisPromise is now + 100ms, resolved by a timeout.
            var thisDeferred = Q.defer();
            thisDeferred.setEstimate(now + 100);
            var thisPromise = thisDeferred.promise;
            // But the actual time of completion will be now + 200ms. It's a
            // lie!
            setTimeout(thisDeferred.resolve, 200);

            var thenPromise = thisPromise.then(function () {
                var fulfillmentDeferred = Q.defer();
                setTimeout(fulfillmentDeferred.resolve, 300);
                return fulfillmentDeferred.promise;
            }, null, 200);

            // The composite ETA of thenPromise should be now + 100ms (this) +
            // 200ms (then).
            setTimeout(function () {
                expect(thenPromise.getEstimate()).toBeNear(now + 300, 10);
            }, 0);

            // But the actual time of completion will be now + 200ms (this
            // actual) + 300ms (fulfilled actual)
            setTimeout(function () {
                expect(thenPromise.getEstimate()).toBeNear(now + 500, 10);
                done();
            }, 600);
        });

    });

    describe("all", function () {

        it("composes initial estimate for all fulfilled values", function () {
            var now = Date.now();
            var allPromise = Q.all([Q(), Q(), Q()]);
            expect(allPromise.getEstimate()).toBeNear(now, 10);
        });

        it("composes initial estimate for forever pending values", function () {
            var now = Date.now();
            var allPromise = Q.all([Q(), Q.defer().promise, Q()]);
            expect(allPromise.getEstimate()).toBe(Infinity);
        });

        it("composes estimate for forever pending value update", function (done) {
            var now = Date.now();
            var oneDeferred = Q.defer();
            var allPromise = Q.all([Q(), oneDeferred.promise, Q()]);
            expect(allPromise.getEstimate()).toBe(Infinity);
            var expected = [Infinity, now + 10];
            var updates = 0;
            allPromise.observeEstimate(function (estimate) {
                expect(estimate).toBeNear(expected.shift(), 10);
                if (++updates === 2) {
                    done();
                }
            });
            setTimeout(function () {
                oneDeferred.resolve();
            }, 10);
        });

        it("composes estimates", function (done) {
            var d1 = Q.defer();
            var d2 = Q.defer();
            var d3 = Q.defer();
            var now = Date.now();
            var allPromise = Q.all([
                d1.promise,
                d2.promise,
                d3.promise
            ]);
            d1.setEstimate(now);
            d2.setEstimate(now);
            d3.setEstimate(now);
            expect(allPromise.getEstimate()).toBe(Infinity);
            var updates = 0;
            allPromise.observeEstimate(function (estimate) {
                expect(estimate).toBe(now);
                // TODO ascertain why this observer is getting called redundantly,
                // albeit idempotently
                // Both updates provide the initial value.
                if (++updates === 2) {
                    done();
                }
            })
            .then(function () {
                // The input promises are forever-pending. We should never get
                // here.
                expect(false).toBe(true);
            });
        });

        it("should update an estimate if one of the composite estimates " +
           "exceeds the previous maximum", function (done) {
            var d1 = Q.defer();
            var d2 = Q.defer();
            var d3 = Q.defer();
            var now = Date.now();
            var allPromise = Q.all([
                d1.promise,
                d2.promise,
                d3.promise
            ]);
            d1.setEstimate(now);
            d2.setEstimate(now);
            d3.setEstimate(now);
            expect(allPromise.getEstimate()).toBe(Infinity);
            // TODO again, ascertain the reason for the duplicate dispatch
            var expected = [
                now,
                now,
                now + 1000
            ];
            allPromise.observeEstimate(function (estimate) {
                expect(estimate).toBe(expected.shift());
                if (expected.length === 0) {
                    done();
                }
            });
            setTimeout(function () {
                // The initial estimate is max(+0, +0, +0). This effects a
                // change to max(+0, +1000, +0).
                d2.setEstimate(now + 1000);
            }, 100);
        });

        it("should update an estimate if the longest estimate becomes " +
           "equal to the runner-up", function (done) {
            var d1 = Q.defer();
            var d2 = Q.defer();
            var d3 = Q.defer();
            var now = Date.now();
            var allPromise = Q.all([
                d1.promise,
                d2.promise,
                d3.promise
            ]);
            d1.setEstimate(now + 1000);
            d2.setEstimate(now + 2000);
            d3.setEstimate(now + 500);
            expect(allPromise.getEstimate()).toBe(Infinity);

            // These are the estimates we expect to observe
            var expected = [
                now + 2000, // Redundant initial estimate
                now + 2000,
                now + 500 // When d2 drops from +2000 to +500
            ];
            allPromise.observeEstimate(function (estimate) {
                expect(estimate).toBe(expected.shift());
                if (expected.length === 0) {
                    done();
                }
            });

            // Update the estimated time to completion after 100ms
            setTimeout(function () {
                // [+2000, +2000, +500]
                d1.setEstimate(now);  // [+0, +2000, +500] no change
                d2.setEstimate(now + 500); // [+0, +500, +500] becomes +500
                d3.setEstimate(now); // [+=, +500, +0] no change
            }, 100);

        });

        it("should update an estimate if the longest estimate becomes " +
           "smaller than the runner-up", function (done) {
            var d1 = Q.defer();
            var d2 = Q.defer();
            var d3 = Q.defer();
            var now = Date.now();
            var allPromise = Q.all([
                d1.promise,
                d2.promise,
                d3.promise
            ]);
            d1.setEstimate(now + 1000);
            d2.setEstimate(now + 2000);
            d3.setEstimate(now + 500);
            expect(allPromise.getEstimate()).toBe(Infinity);

            // These are the estimates we expect to observe
            var expected = [
                now + 2000, // Redundant initial estimate
                now + 2000,
                now + 500, // When d2 drops from +2000 to +500
                now + 400, // When d3 drops from +500 to +0
            ];
            allPromise.observeEstimate(function (estimate) {
                expect(estimate).toBe(expected.shift());
                if (expected.length === 0) {
                    done();
                }
            });

            // Update the estimated time to completion after 100ms
            setTimeout(function () {
                // [+2000, +2000, +500]
                d1.setEstimate(now);  // [+0, +2000, +500] no change
                d2.setEstimate(now + 400); // [+0, +400, +500] becomes +500
                d3.setEstimate(now); // [+=, +400, +0] no change
            }, 100);

        });

    });

    describe("delay", function () {

        it("observes a delay after fulfillment accurately", function (done) {
            var now = Date.now();
            var delayedPromise = Q().delay(100);
            var updates = 0;
            delayedPromise.observeEstimate(function (estimate) {
                expect(estimate).toBeNear(now + 100, 10);
                if (++updates === 2) {
                    done();
                }
            });
        });

        it("composes estimate from initial promise then delay", function (done) {
            var deferred = Q.defer();
            var now = Date.now();
            deferred.setEstimate(now + 1000);
            var delayedPromise = deferred.promise.delay(1000);
            var expected = [now + 2000, now + 2000];
            delayedPromise.observeEstimate(function (estimate) {
                expect(estimate).toBe(expected.shift());
                if (expected.length === 0) {
                    done();
                }
            });
        });

    });

    describe("thenResolve", function () {

        it("composes max of left and right estimates", function (done) {
            var now = Date.now();
            var thenResolvedPromise = Q().delay(200).thenResolve(Q().delay(200));
            var updates = 0;
            thenResolvedPromise.observeEstimate(function (estimate) {
                expect(estimate).toBeNear(now + 200, 10);
                if (++updates === 4) {
                    done();
                }
            });
        });

    });

});

