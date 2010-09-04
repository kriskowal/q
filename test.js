
var SYS = require("sys");
var Q = require("q/util");

var delay = function (delay) {
    var deferred = Q.defer();
    setTimeout(deferred.resolve, delay);
    return deferred.promise;
}

var hi = Q.when(delay(1000), function () {
    return "Hello, World!";
});

Q.when(hi, SYS.puts);

