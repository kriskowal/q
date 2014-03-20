
var Q = require("../q");
var Queue = require("../queue");

describe("queue", function () {

    it("should enqueue then dequeue", function () {
        var queue = Queue();
        queue.put(1);
        return queue.get().then(function (value) {
            expect(value).toBe(1);
        });
    });

    it("should dequeue then enqueue", function () {
        var queue = Queue();
        var promise = queue.get().then(function (value) {
            expect(value).toBe(1);
        });
        queue.put(1);
        return promise;
    });

    it("should stream", function () {
        var queue = Queue();

        Q.try(function () {
            return Q.delay(20).then(function () {
                queue.put(1);
            })
        })
        .then(function () {
            return Q.delay(20).then(function () {
                queue.put(2);
            })
        })
        .then(function () {
            return Q.delay(20).then(function () {
                queue.put(3);
            })
        })
        .done();

        return Q.try(function () {
            return queue.get()
            .then(function (value) {
                expect(value).toBe(1);
            });
        })
        .then(function () {
            return queue.get()
            .then(function (value) {
                expect(value).toBe(2);
            });
        })
        .then(function () {
            return queue.get()
            .then(function (value) {
                expect(value).toBe(3);
            });
        })

    });

    it("should be order agnostic", function () {
        var queue = Queue();

        Q.try(function () {
            return Q.delay(20).then(function () {
                queue.put(1);
            })
        })
        .then(function () {
            return Q.delay(20).then(function () {
                queue.put(2);
            })
        })
        .then(function () {
            return Q.delay(20).then(function () {
                queue.put(3);
            })
        })
        .done();

        return Q.all([
            queue.get()
            .then(function (value) {
                expect(value).toBe(1);
            }),
            queue.get()
            .then(function (value) {
                expect(value).toBe(2);
            }),
            queue.get()
            .then(function (value) {
                expect(value).toBe(3);
            })
        ]).thenResolve();
    });

});

