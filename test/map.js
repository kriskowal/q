
var Q = require("../q");

Q.resolve([1, 2, 3])
.map(function (n) {
    console.log('A', n);
    return Q.delay(n + 1, 100 * Math.random());
})
.map(function (n) {
    console.log('B', n);
    return n + 1;
})
.map(function (n) {
    console.log('C', n);
    return n + 1;
})
.map(function (n) {
    console.log('D', n);
    return n + 1;
})
.all()
.then(function (all) {
    console.log('final', all);
})
.end()

