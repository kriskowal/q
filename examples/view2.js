
// constructing a view from an object
// view information implicitly provided by fulfillment

var Q = require("q");
Q.ref({
    "property": function () {
        return "called";
    }
})
.view()
.then(function (view) {
    return Q(view.property())
    .when(console.log);
})
.end()

