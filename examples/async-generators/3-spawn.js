var Q = require('../../q');

function delay(millis, answer) {
    const deferredResult = Q.defer();
    setTimeout(function() {
        deferredResult.resolve(answer);
    }, millis);
    return deferredResult.promise;
}

function foo() {
    return delay(1000, 5);
}

function bar() {
    return delay(1000, 10);
}

Q.spawn(function*() {
    var x = yield foo();
    console.log(x);

    var y = yield bar();
    console.log(y);

    console.log('result', x + y);
});
