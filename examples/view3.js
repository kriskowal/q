
// constructing a view from a promise for a function
// view information provided explicitly before fulfillment

var Q = require("q");

var callableD = Q.defer();
setTimeout(function () {
    callableD.resolve(function () {
        return "called";
    });
}, 1000);

callableD.promise
.viewInfo({
    "type": "function"
})
.view()
.when(function (view) {
    console.log("calling view");
    Q(view())
    .when(console.log)
})
.end()

