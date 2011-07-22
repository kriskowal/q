
// constructing a view of a function
// view information implicitly provided by fulfillment

var Q = require("q");
Q.ref(function () {
    return "called";
})
.view()
.then(function (view) {
    return Q(view())
    .when(console.log);
})
.end()

