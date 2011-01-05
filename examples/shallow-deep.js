
var Q = require("./util");

var eventually = function (eventually) {
    return Q.delay(1000, eventually);
};

var x = Q.shallow([1, 2, 3].map(eventually));
Q.when(x, function (x) {
    console.log(x);
});

var x = Q.shallow({
    "a": eventually(10),
    "b": eventually(20)
});
Q.when(x, function (x) {
    console.log(x);
});

var x = Q.shallow({
    "a": [1, 2, 3].map(eventually)
});
Q.when(x, function (x) {
    console.log(x);
});

var x = Q.deep({
    "a": [1, 2, 3].map(eventually)
});
Q.when(x, function (x) {
    console.log(x);
});

var x = Q.deep([
    {
        "a": [1, 2, 3].map(eventually)
    }
]);
Q.when(x, function (x) {
    console.log(x);
});

