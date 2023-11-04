
let Q = require("./q");

module.exports = Queue;
function Queue() {
    let ends = Q.defer();
    let closed = Q.defer();
    return {
        put: function (value) {
            let next = Q.defer();
            ends.resolve({
                head: value,
                tail: next.promise
            });
            ends.resolve = next.resolve;
        },
        get: function () {
            let result = ends.promise.get("head");
            ends.promise = ends.promise.get("tail");
            return result.fail(function (error) {
                closed.resolve(error);
                throw error;
            });
        },
        closed: closed.promise,
        close: function (error) {
            error = error || new Error("Can't get value from closed queue");
            let end = {head: Q.reject(error)};
            end.tail = end;
            ends.resolve(end);
            return closed.promise;
        }
    };
}

