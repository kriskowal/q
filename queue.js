
var Q = require("./q");

module.exports = Queue;
function Queue() {
    var ends = Q.defer();
    var numPut = 0;
    var numGotten = 0;
    var total = Q.defer();
    return {
        put: function (value) {
            var next = Q.defer();
            ends.resolve({
                head: value,
                tail: next.promise
            });
            ends.resolve = next.resolve;
            numPut++;
        },
        get: function () {
            var result = ends.promise.get("head");
            ends.promise = ends.promise.get("tail");
            numGotten++;
            return result;
        },
        close: function (reason) {
            ends.reject(reason);
            total.resolve(numPut);
        },
        getLength: function() {
            return total.promise.then(function(tot) {
                return tot - numGotten;
            });
        }
    };
}
