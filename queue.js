
var Q = require("./q");

module.exports = Queue;
function Queue() {
    var ends = Q.defer();
    var nextIndex = 0;
    var length = Q.defer();
    return {
        put: function (value) {
            var next = Q.defer();
            ends.resolve({
                head: value,
                tail: next.promise
            });
            ends.resolve = next.resolve;
            nextIndex++;
        },
        get: function () {
            var result = ends.promise.get("head");
            ends.promise = ends.promise.get("tail");
            return result;
        },
        close: function (reason) {
            ends.reject(reason);
            length.resolve(nextIndex);
        },
        length: length.promise
    };
}
