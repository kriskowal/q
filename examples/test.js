
var Q = require("q");

var delay = function (delay) {
    var deferred = Q.defer();
    setTimeout(deferred.resolve, delay);
    return deferred.promise;
}

var hi = Q.when(delay(1000), function () {
    return "Hello, World!";
});

Q.when(hi, console.log);

