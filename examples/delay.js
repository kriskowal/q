
var Q = require("q");

var delay = function (delay) {
    var d = Q.defer();
    setTimeout(d.resolve, delay);
    return d.promise;
};

Q.when(delay(1000), function () {
    console.log('Hello, World!');
});

