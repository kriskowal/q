
var Q = require("../q");

var eventually = function (eventually) {
    return Q.delay(eventually, 1000);
};

var x = Q.all([1, 2, 3].map(eventually));
Q.when(x, function (x) {
    console.log(x);
});

Q.all([
    eventually(10),
    eventually(20)
])
.spread(function (x, y) {
    console.log(x, y);
});

